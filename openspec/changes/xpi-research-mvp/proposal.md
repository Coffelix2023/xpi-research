## Why

`xpi-research` 当前只有状态通知命令，无法把用户发起的研究目标交给 Agent，也无法在研究过程中安全地向用户收集结构化决策。`PLAN.md` 已定义了 MVP（最小可行产品）的行为边界；现在需要把它固化为可验证的契约、呈现策略、生命周期清理规则和后续可执行任务，避免实现阶段依赖隐含假设。

## What Changes

- 将 `/xpi-research <目标>` 从状态通知命令升级为主动启动研究流程的入口。
- 增加仅在活动研究轮次中启用的 `xpi_research_ask` 工具，使用 TypeBox（类型模式库）校验结构化问卷输入，并返回有界 JSON（JavaScript Object Notation，结构化数据格式）答案。
- 根据问题形状自动选择 quick、visual 或降级呈现：简单单选/文本使用 Pi 原生对话框；富预览或多选优先使用 Glimpse；Glimpse 不可用时使用 TUI（终端用户界面）或 RPC（远程过程调用）可用的 Pi 原生能力。
- 在 Agent 完成稳定运行、session（会话）关闭、reload（重载）或会话替换时恢复原 active tools（活动工具列表）并清理状态栏。
- 增加 `xpi-research` 技能资源，使 Agent 知道何时提问、如何复用已有方法论技能，以及如何继续研究总结。
- 更新包清单、双语 README 和架构决策记录。
- 不引入独立模型调用、GitHub 客户端、数据库、跨 session 恢复、项目级配置或新的运行时依赖。

## Capabilities

### New Capabilities

- `questionnaire-contract`: 定义问卷输入联合类型、验证边界、问题路由、答案规范化、取消语义和有界 JSON 输出。
- `questionnaire-presentation`: 定义 quick、visual、TUI fallback（降级）和 RPC fallback 的用户交互行为，以及动态内容安全与可访问性约束。
- `research-session`: 定义命令入口、Agent 消息派发、活动研究会话互斥、工具快照/恢复和生命周期清理。
- `research-skill`: 定义 `skills/xpi-research/SKILL.md` 的资源职责、调用 `xpi_research_ask` 的时机、研究阶段和与既有技能的边界。

### Modified Capabilities

无。当前 `openspec/specs/` 没有既有能力规格。

## Impact

- **Source**: `src/index.ts`；新增 `src/types.ts`、`src/questionnaire.ts`、`src/ui.ts`、`src/glimpse.ts`。
- **Tests**: 新增问卷、呈现和生命周期单元测试，覆盖 fake UI、取消、Glimpse 加载失败和工具恢复。
- **Package**: 修改 `package.json` 的 Pi skills manifest（技能资源清单），保持 Pi 核心包与 TypeBox 的 peer dependency（对等依赖）策略。
- **Docs**: 修改 `README.md`、`README.zh-CN.md`；新增 `docs/decisions/0001-research-orchestrator-boundary.md`。
- **Runtime**: 只使用 Pi 扩展 API 和可选的动态 Glimpse 探测；当前没有 Glimpse 安装时必须稳定降级。
- **Verification**: 所有实现切片必须通过 `pnpm typecheck`、`pnpm -w run lint` 和 `pnpm test`，并完成 TUI、RPC、无 UI 和 session 清理的手工验收。
