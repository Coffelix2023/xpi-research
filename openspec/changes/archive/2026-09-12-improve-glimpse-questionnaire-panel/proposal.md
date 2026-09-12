## Why

Glimpse 面板是 visual 问卷的主要呈现面，但当前 `renderGlimpseQuestionnaire` 只有浏览器默认排版：问题标题与长选项挤成一段文字、选项 label 与 description 没有视觉层级、没有步骤与作答进度、没有回退到自定义答案的入口，也没有中英文切换。当 Agent 把整段解释写进 `label` 时，面板会退化成一面文字墙，用户无法判断"这道题在问什么、我选的是哪个"。

同时面板的提交路径调用了错误的桥：页面用 `window.parent.postMessage(...)` 发送结果，而 Glimpse 的 webview 是顶层窗口（`window.parent === window`），真正的桥是 `window.glimpse.send(...)`。结果是 Submit / Cancel 在真实窗口中不生效，`prompt()` 只在用户关窗时返回 `null`，提交永远无法区分"用户点了取消"和"用户选完提交"。

这两点叠加使本扩展最关键的交互面既不可读也不可用，需要在继续扩展研究流程之前修正。

合并后的真机验收又暴露出同一处交互的两个缺口：分步流程的最后一个问题直接提交，汇总步骤只能靠步骤条末位的 ✓ 圆点进入，默认路径下用户既看不到汇总页也看不到反馈框，`feedback` 因此恒为空，而技能文档已经教 Agent 去读它；同时，声明为必答的信息类问题会让主操作按钮静默失效——校验认为必答未满足，信息类问题的渲染分支却提前返回，连内联错误都不显示。

## What Changes

- 重构 Glimpse 面板呈现：问题分节（题号、类型徽标、必答标记）、选项卡化（label / description / preview 三层视觉分层）、步骤条（步骤计数、可点击步骤圆点、作答进度）、固定底栏与加大的操作按钮。
- 默认使用分步向导（一次一题），并保留单页堆叠布局作为可选形态。
- 每个单选与多选问题追加「自定义」入口：选中后展开输入框，与普通选项互斥（单选）或叠加（多选）。
- 新增末尾汇总页：全部页面（含信息问题）的缩略图合集，加上一个整体补充反馈输入；点击任意缩略图可跳回该题修改。
- 面板内置简体中文 / 英文文案切换，所有界面文案经过字典；题目正文保持 Agent 原文，不做翻译。
- 视觉令牌改为项目指定的两套 shadcn 语义令牌（暗色 A 套、亮色 B 套），明暗默认跟随系统，并提供缩放控件。
- 契约扩展（向后兼容，非破坏）：单选与多选接受自定义文本答案（仍受 2,000 字符限制），`QuestionnaireResult` 新增可选 `feedback` 字段承载汇总页反馈。
- 修复 Glimpse 提交桥：页面改为通过 `window.glimpse.send` 回传，使提交与取消真正到达宿主。
- 面板模板从 `src/glimpse.ts` 拆出为独立模块，使 `glimpse.ts` 只负责加载、调用与结果解析。
- 修正分步流程的终点：最后一个问题的主操作改为前进到汇总步骤，使汇总页与反馈输入在默认路径上可达。
- 信息类问题不参与作答校验，并在分步布局与汇总步骤中显示「无需作答」，不再依赖问题类型名。
- 删除 `GlimpsePromptOptions` 中三个 `glimpseui` 并不支持的选项（`theme`、`reduceMotion`、`zoom`），它们此前被静默忽略。
- 宿主侧的规范化不再对信息类问题执行必答校验，避免用户正常提交后工具报出笼统的交互失败。
- 明确不做：quick 路径与 TUI fallback 组件不增加自定义入口；不注入系统强调色（`prompt()` 拿不到 window 句柄）；不加载外部 webfont。

## Capabilities

### New Capabilities

无。本变更只修改既有能力的规格。

### Modified Capabilities

- `questionnaire-contract`: 答案规范化从"必须是所选项 label"放宽为"接受自定义文本答案"，并保持文本长度与结果体积上限；结果新增可选 `feedback` 字段。
- `questionnaire-presentation`: Glimpse 面板必须具备分步导航与作答进度、每题自定义入口、汇总确认页、中英文切换与明暗主题令牌，且提交与取消必须通过 Glimpse 的桥回传。

> 注：上述能力目前存在于尚未归档的 `xpi-research-mvp` 变更中，`openspec/specs/` 基线仍为空。本变更的 delta 使用与之相同的 capability path，待前者归档后即可直接对齐。

## Impact

- **Source**: `src/glimpse.ts`（拆分为 `src/glimpse.ts` 与 `src/glimpse-panel.ts`）、`src/questionnaire.ts`、`src/types.ts`。
- **Tests**: 新增 `src/glimpse-panel.test.ts`（面板模板、令牌、自定义标记、i18n 字典、无裸字符串）；扩展 `src/questionnaire.test.ts`（自定义答案与 `feedback` 用例）。
- **Docs**: `DESIGN.md` 记录两套令牌的来源与语义映射；`skills/xpi-research/SKILL.md` 说明自定义选项、汇总页与 `feedback` 字段。
- **Tooling**: `biome.jsonc` 增加 `!docs/prototypes`，让浏览器评审用的设计原型不进入 lint/交付面。
- **Runtime**: 不新增依赖；Glimpse 不可用时仍按既有规则降级到 Pi 原生 TUI。
- **Follow-up（合并后发现）**: `src/glimpse-panel.ts`（末题主操作、信息类问题校验与文案）、`src/glimpse.ts`（移除不受支持的 prompt 选项）、`src/glimpse-panel.test.ts`、`manual-acceptance-6.2.md`。
- **Verification**: `pnpm typecheck`、`pnpm -w run lint`、`pnpm test` 全部通过；并在真实 Glimpse 窗口中手工验收提交与取消回传。
