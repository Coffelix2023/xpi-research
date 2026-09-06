# xpi-research MVP 实现计划

## 摘要
构建一个 Pi package（Pi 可安装扩展包）的最小可行产品（MVP）：用户通过 `/xpi-research <目标>` 主动启动项目探索；扩展启用一个仅在本轮 Agent（代理）运行期间可用的内部提问工具；简单问题使用 Pi 原生 UI（用户界面），复杂选型优先使用 Glimpse 面板，Glimpse 不可用时降级到 Pi 原生 TUI（终端用户界面）；最终把结构化答案交回当前 Agent，继续使用既有技能完成探索总结。

## 明确边界
- 首发只做“启动、提问路由、答案回传、生命周期清理”，不做独立模型调用、GitHub 客户端、项目数据库或跨 session（会话）恢复。
- GitHub 类似项目调研仍由 Agent 使用现有搜索能力完成；扩展只提供“是否需要调研/如何比较”的问题结构。
- 保留 `~/.agents/skills/` 中的 `grill-me`、`grill-with-docs`、`grilling`、`brainstorming`、`idea-refine`、`interview-me` 等技能。它们是方法论资源，不与本扩展的 UI 编排职责重复；删除会破坏非 `xpi-research` 场景。
- 不把 `rpiv-ask-user-question`、`pi-interview` 或 `glimpseui` 声明为运行时依赖；使用 Pi 原生 API，并通过可选动态加载探测 Glimpse。

## 行为与接口
1. `/xpi-research <目标>`：目标去除首尾空白后启动；无参数时使用 `ctx.ui.input` 获取目标；空目标取消并显示错误通知。
2. 启动前要求当前 Agent 空闲，且同一扩展实例不能存在第二个活动研究会话。
3. 保存启动前的 active tool 列表，通过 `pi.setActiveTools()` 临时加入 `xpi_research_ask`；`agent_settled`（代理稳定完成事件）后恢复原列表并清理状态栏。
4. 命令发送 `/skill:xpi-research` 与目标内容，使用 `expandPromptTemplates: true` 触发本地编排技能；不修改 system prompt（系统提示词）。
5. `xpi_research_ask` 使用 TypeBox（类型模式库）定义结构化输入：`presentation: "quick" | "visual"`、最多 4 个问题、问题类型 `single | multi | text | info`、选项的 `label/description/preview`、可选推荐项和必答标记。输出固定为有界 JSON 文本，包含答案、取消状态和当前轮次。
6. 路由规则：只有纯 `single/text` 且没有预览内容的问题走 quick；包含 `multi`、`info`、代码/表格/图示预览，或 Agent 明确标记为 `visual` 的问题走 visual。架构、技术栈、产品边界、类似项目比较、开发路线问题在本地 skill 中要求优先使用 visual。
7. quick 路径使用 `ctx.ui.select/input`；需要多选或更复杂键盘交互时使用 Pi 原生 `ctx.ui.custom` 的最小问卷组件。
8. visual 路径在交互式本地环境动态加载 `glimpseui` 的 `open/prompt`；使用 `glimpse-design` 的 shell、主题注入、缩放、双语文案、键盘和无障碍约束。用户关闭窗口返回取消，不把取消解释成任意选项。
9. Glimpse 加载失败、无图形环境或非本地 RPC（远程过程调用）模式时，降级到原生 TUI，并通过通知说明降级；降级路径仍支持取消、文本、多选和选项预览的纯文本表达。
10. 面板动态内容通过 JSON 序列化注入，页面端用 DOM `textContent` 构造内容，禁止未转义 HTML 和 Windows 不可靠的内联 `onclick`；所有 render 行遵守宽度限制。

## 文件与实现顺序
### 1. 定义领域类型与纯逻辑
- 新建 `src/types.ts`：研究状态、问题联合类型、答案、工具输入输出、路由结果。
- 新建 `src/questionnaire.ts`：输入校验、问题数量/选项边界、quick/visual 路由、答案规范化和有界摘要。
- 测试 `src/questionnaire.test.ts`：合法问卷、超限/缺字段拒绝、rich preview 强制 visual、多选路由、取消结果和稳定 JSON。

### 2. 实现原生 UI 与 Glimpse 适配
- 新建 `src/glimpse.ts`：按当前项目和 `~/.pi/agent/npm/node_modules/glimpseui` 候选路径动态加载；加载失败返回 `null`；实现安全 HTML 数据桥、`prompt` 结果解析和关闭清理。
- 新建 `src/ui.ts`：统一 `askQuestionnaire(ctx, input)`；quick 调用 Pi 原生 UI，visual 调用 Glimpse，失败后调用 TUI fallback；不让 UI 层持有全局 session 状态。
- 测试 `src/ui.test.ts`：fake UI 的 quick 结果、Esc/关闭取消、Glimpse loader 成功/失败、fallback 触发和动态字符串不进入未转义 HTML。

### 3. 接入扩展生命周期
- 修改 `src/index.ts`：注册 `/xpi-research`、注册 `xpi_research_ask`、管理活动会话、临时 active tools、`agent_settled` 清理、状态栏和通知。
- 新建 `src/index.test.ts`：无目标输入、Agent 忙碌、重复启动、启动消息内容、工具启停恢复、活动会话答案回传和异常清理。
- 只在命令中启动流程；不监听 `input`，不自动拦截普通 prompt。

### 4. 提供方法论入口与文档
- 新建 `skills/xpi-research/SKILL.md`：说明目标澄清、成功标准、用户/边界、技术方案、类似项目调研、MVP 与迭代策略；要求调用 `xpi_research_ask`，并在合适阶段复用现有技能，不复制其正文。
- 修改 `package.json`：在 `pi` manifest（包清单）增加 `"skills": ["./skills"]`，保持无构建步骤和现有 peerDependencies（对等依赖）。
- 更新 `README.md`、`README.zh-CN.md`：命令、两层 UI、Glimpse 可选安装、fallback、全局技能保留策略和限制。
- 新建 `docs/decisions/0001-research-orchestrator-boundary.md`：记录“扩展做编排、不替代技能/模型/研究客户端”的决策及备选方案。

## 验证与验收
- 每个逻辑切片先运行对应 Vitest（测试运行器）文件，再运行全套 `pnpm test`。
- 最终必须通过：`pnpm typecheck`、`pnpm -w run lint`、`pnpm test`。
- 手工运行 `pi -e ./src/index.ts`，验证：有参数启动、无参数补问、quick 选择、visual 面板、Esc 取消、Glimpse 缺失时 TUI fallback、Agent 完成后工具恢复。
- 额外检查窄终端、非交互模式不抛异常、中文/英文动态文本不破坏 HTML、敏感内容不写日志或项目文件。

## 默认假设
- 首发只服务当前 Pi session，内存状态在研究轮次结束或 session 切换后释放。
- `presentation` 由 Agent 根据 skill 规则声明，但扩展会依据问题结构自动升级到 visual，避免模型误标导致复杂内容进入 quick UI。
- `pi-interview` 和 `rpiv-ask-user-question` 继续独立运行；本扩展复用其设计理念和既有技能，不通过私有源码调用它们。
- 不创建项目级 `.pi` 配置、不写入用户全局设置、不下载或安装任何依赖。
