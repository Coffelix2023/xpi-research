## Context

`src/index.ts` 当前只注册状态通知命令，仓库没有可复用的问卷、UI 适配或研究会话状态。Pi 扩展 API 已提供 `registerCommand`、`registerTool`、`getActiveTools`、`setActiveTools`、`sendUserMessage`、`ctx.ui.*` 以及 `agent_settled` / `session_shutdown` 生命周期事件。Pi 的 RPC UI 支持基础 `select`、`input` 和通知，但不支持 `ctx.ui.custom()`；当前开发依赖中也没有 `glimpseui`。

本设计遵循 proposal.md 与四份能力规格：纯逻辑不依赖 Pi 运行时，交互能力按运行模式降级，活动工具配置只在内存中临时改变，Glimpse 作为可选能力而非安装前提。

## Goals / Non-Goals

**Goals:**

- 形成从显式命令到 Agent、问卷工具、用户回答和 Agent 继续运行的完整单轮闭环。
- 将问卷验证、路由、答案规范化和取消语义做成确定性行为，便于单元测试。
- 在 TUI、RPC、print 和 JSON 模式中诚实反映可用 UI 能力，不阻塞或伪造答案。
- 在正常完成、reload、session replacement 和退出路径中可靠恢复 active tools 与状态栏。
- 通过一次性 Glimpse `prompt()` 支持富问卷，并在加载或运行失败时稳定降级。
- 保持现有 Pi 核心 peer dependencies，不引入数据库、项目配置或全局状态。

**Non-Goals:**

- 不实现独立模型调用、GitHub 搜索客户端、研究结果数据库或跨 session 恢复。
- 不监听普通用户 input，不自动把普通 prompt 转成研究流程。
- 不实现 Glimpse 常驻 `open()` 窗口、live apply、多窗口同步或配置编辑器。
- 不删除或重写全局 `~/.agents/skills/` 中已有的方法论技能。
- 不保证多个扩展同时修改 active tools 时的全局协调；本 MVP 只保证自身快照和幂等清理。

## Decisions

### 1. Keep domain contracts independent from Pi UI

`src/types.ts` 定义研究状态、问卷、问题、选项、答案和结果的公开结构；`src/questionnaire.ts` 只负责校验、有效呈现路由和答案规范化。它们不导入 Pi UI 或 Glimpse 模块，因此可以用纯数据测试所有边界。

Pi 的 `ExtensionContext` 只在 UI 适配层使用。`src/ui.ts` 负责把同一份问卷交给 quick、TUI fallback 或 RPC fallback；`src/glimpse.ts` 负责动态加载和一次性 prompt 的协议转换。这样 Glimpse 不会污染核心问卷逻辑。

### 2. Use one-shot Glimpse prompt for the MVP

visual 问卷是一次提交或取消的交互，使用 `prompt(html, options)` 足够覆盖问题展示、选择和文本输入。实现不使用常驻 `open()`，因此不需要维护窗口实例、跨步骤消息状态或额外的关闭竞态。未来只有出现 live apply 或多步骤长生命周期交互时，才新增 open-based adapter。

Glimpse loader 按顺序尝试当前包的绝对路径和 Pi 全局安装路径；动态 import 失败返回 `null`。调用方把 `null`、无图形环境和 prompt 异常都视为能力缺失，转入模式相关 fallback。

### 3. Make presentation routing monotonic

路由只允许从简单能力升级到更强能力，不允许把 rich questionnaire 强行压进 quick：

```text
input questionnaire
        |
        v
+-------------------------------+
| explicit visual?              |-- yes --> visual
| multi/info/preview present?   |-- yes --> visual
+---------------+---------------+
                |
                no
                v
              quick
```

quick 逐题调用 Pi 原生 `select` / `input`。visual 在 TUI 中优先使用一个 centered custom component；在 Glimpse 可用时优先使用 Glimpse prompt；在 RPC 中使用顺序式 primitive dialogs，因为 RPC 不支持 custom component；在 print/json 中明确取消。

### 4. Keep research state closure-local and cleanup idempotent

扩展注册函数内保存唯一的活动研究状态：目标、轮次、启动前的 active tool names 和是否已清理。启动时先检查 `ctx.isIdle()` 和活动状态，再保存快照并调用 `setActiveTools([...snapshot, "xpi_research_ask"])`。这保持现有工具顺序，同时避免重复加入提问工具。

命令通过 `sendUserMessage("/skill:xpi-research ...", { expandPromptTemplates: true })` 启动 Agent。工具本身只返回结构化结果，不额外发送用户消息。

清理绑定两个生命周期：

```text
agent_settled -----------+
                          v
session_shutdown ------> cleanupOnce()
                          |
                          +--> restore exact tool snapshot
                          +--> clear status
                          +--> release active state
```

使用 `agent_settled` 而不是 `agent_end` 作为正常完成节点，因为 settled 表示没有自动重试、压缩或排队续接。`session_shutdown` 覆盖 reload、session 替换和退出。两者都调用同一个幂等清理路径；第二次调用不得覆盖清理后的新状态。

### 5. Treat labels as the MVP answer identity

为避免在 MVP 中引入未要求的 option value 层，答案使用 option `label`，问题使用唯一 `id`。验证阶段拒绝重复标签和重复问题 id；多选规范化为按定义顺序排列的唯一标签。后续如果需要本地化标签而保持答案稳定，再单独引入 `value` 字段和规格变更。

### 6. Bound and text-render all untrusted content

验证层固定问题、选项、预览、文本答案和 JSON 结果的上限。UI 层不记录用户完整答案，不把动态文本拼进可执行脚本或未转义 HTML。Glimpse 页面使用 JSON 序列化传输数据，并在页面端以 DOM text content 写入文本；TUI 使用 `visibleWidth` / `truncateToWidth` 等 Pi TUI 工具处理宽度，不使用原始 `string.length` 对齐。

### 7. Test with fake boundaries, then verify the real package contract

纯问卷测试覆盖验证、升级路由、必答、取消、规范化和输出上限。UI 测试注入 fake `ExtensionContext` 和 fake Glimpse loader，覆盖 quick、TUI、RPC、print/json、Glimpse 成功/失败和恶意文本。入口测试使用 fake `ExtensionAPI` 记录命令、工具、消息、active tool 变更和生命周期回调。

实现前先以当前安装版本的 `.d.ts` 为类型真相；实现后运行三条仓库质量门禁，并用 `pi -e ./src/index.ts` 进行交互式烟测。真实 Glimpse 不作为 CI 前提，成功路径由 loader/prompt contract fake 覆盖。

## Risks / Trade-offs

- **[Glimpse 不在安装环境中]** --> loader fail-closed；TUI、RPC 或无 UI fallback 必须拥有独立可测试路径。
- **[RPC 不支持 custom component]** --> 明确使用 RPC 原生 `select` / `input`；不把 RPC 当作 TUI 处理。
- **[多个扩展同时修改 active tools]** --> 只恢复本轮保存的快照，并在 MVP 文档中声明没有跨扩展协调；未来若需要共享工具事务再引入协调机制。
- **[Agent 在清理前出现压缩、重试或排队续接]** --> 使用 `agent_settled` 而不是 `agent_end` 做正常清理。
- **[动态 HTML 内容改变面板结构]** --> 不使用内联事件和未转义插值，所有动态值通过数据桥和文本节点写入。
- **[问卷输出过大进入 Agent 上下文]** --> 输入、答案和最终 JSON 都有硬上限，超限在提交前拒绝。
- **[新 UI 代码与终端宽度不兼容]** --> 以 Pi TUI 可见宽度工具、最小宽度和窄终端测试作为验收条件。
- **[包发布后缺少运行时核心模块]** --> 保留 Pi 官方要求的 core peer dependencies，并在实现阶段执行 package manifest 与 packed package 的静态检查；不把 Glimpse 声明为运行时依赖。

## Migration Plan

1. 先新增纯问卷契约和测试，不改变当前状态命令的对外行为。
2. 增加 UI/Glimpse 适配和测试，再把活动问卷工具接入扩展入口。
3. 更新技能资源、包清单、README 和决策记录。
4. 运行 `pnpm typecheck`、`pnpm -w run lint`、`pnpm test`，再执行 TUI/RPC 手工烟测。
5. 回滚时删除新增模块和技能资源，并恢复 `src/index.ts`、`package.json` 与 README 的原有内容；由于 MVP 不写持久化状态，不需要数据迁移或清理脚本。
