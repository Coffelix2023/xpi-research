## Context

动机见 `proposal.md`；行为契约见 `specs/questionnaire-presentation/spec.md` 与 `specs/questionnaire-contract/spec.md`。本文件只记录把它们落地所需的约束与技术选择。

当前实现状态：

- `src/glimpse.ts`（268 行）一个文件同时承担三件事：动态加载 `glimpseui`、拼接面板 HTML 模板、解析回传结果。面板模板是页面 CSS 与页面脚本的裸字符串。
- 面板模板共 40 行，使用浏览器默认排版，且提交路径调用 `window.parent.postMessage(...)`。
- `src/questionnaire.ts` 的 `normalizedAnswer()` 用 `answerLabels(question).has(value)` 逐字校验单选与多选答案，任何非选项 label 的输入都会抛错。
- `src/types.ts` 的 `QuestionnaireResult` 只有 `answers`、`cancelled`、`round`。
- `openspec/specs/` 基线为空：`xpi-research-mvp` 变更尚未归档，两个被修改的能力目前只存在于该变更的 delta 中。**这决定了归档顺序约束，见"迁移计划"。**
- `glimpse.prompt(html, options)` 只返回首条 `window.glimpse.send(data)` 载荷或 `null`（关窗），且**不向调用方暴露 window 句柄**。因此页面拿不到 `appearance.accentColor`，只能靠 `matchMedia` 兜底；主题注入方案不可用。
- 面板运行在宿主 webview 中，**不联网**：任何 webfont、CDN 或外部资源都会带来白屏或闪烁风险。

设计原型已归档在 `docs/prototypes/glimpse-questionnaire-panel.html`，并在浏览器中按暗/亮两套主题、两种布局、自定义输入、汇总跳转、校验与回传载荷逐项验收过。实现应移植该原型，而不是重新设计。

PR #1 合并后的真机验收在分步布局上发现两处偏差：末题的主操作直接提交，汇总步骤在默认路径下不可达；声明为必答的信息类问题会静默卡住流程。两者由决策 8 修正，`specs/questionnaire-presentation/spec.md` 的场景已同步补充。

## Goals / Non-Goals

**Goals:**

- 把面板模板从 `glimpse.ts` 拆出，使模板体积增长不再污染加载与解析逻辑。
- 让面板的健康度可被单元测试覆盖：令牌、文案字典、自定义入口、桥调用，都不需要启动真实窗口即可断言。
- 让契约扩展向后兼容：既有的 quick 路径、TUI fallback、RPC fallback 行为不变。
- 修正提交桥后，`prompt()` 的三种结局（提交、取消、关窗）在语义上可区分。

**Non-Goals:**

- 不给 quick 路径与 TUI fallback 组件增加自定义入口或汇总页（两套交互形态不同，混改会让改动无法解释）。
- 不引入前端构建步骤、CSS 预处理器或模板引擎：模板仍是原生字符串常量，由 Pi 直接加载 TS 源码。
- 不引入任何运行时依赖，也不加载外部 webfont。
- 不做跨 session 的状态持久化（面板是一次性的，语言与主题选择不落盘）。

## Decisions

### 1. 拆分为 `glimpse-panel.ts` + `glimpse.ts`

把面板拆成三个可独立断言的导出：`GLIMPSE_PANEL_CSS`、`GLIMPSE_PANEL_SCRIPT`、以及 `renderGlimpseQuestionnaire(questionnaire, round)`（组装数据 + HTML 壳）。`glimpse.ts` 保留 `loadGlimpse`、`promptWithGlimpse`、`parseGlimpseResult`。

**为什么**：原型移植后面板模板会达到 500 行以上；AGENTS.md 要求复杂结构必须模块化拆分。拆开后 `glimpse.ts` 的解析与加载逻辑保持可读，测试也能分别针对"模板内容"和"回传解析"断言。

**备选**：把 CSS/JS 放进 `.css`/`.js` 静态资源文件。否决——Pi 直接加载 TS 源码、无构建步骤，读取外部资源会引入路径解析与打包假设（此前的 `fix-glimpse-loader-paths` 已经踩过一次路径坑）。

### 2. 页面脚本用 ES5 风格的原生 DOM 构造，不用模板字符串拼 DOM

页面侧只做 `document.createElement` + `textContent`，数据经 `JSON.parse` 从 `<script type="application/json">` 读取。

**为什么**：这是双保险的 XSS 边界——数据侧 JSON 转义，渲染侧 `textContent`。同时避免 `innerHTML` 触发仓库的静态检查（slop 规则会拦截 `innerHTML` 赋值）。

**备选**：服务端拼 HTML 字符串。否决——Option 的 `label`/`description`/`preview` 完全由 Agent 生成，拼字符串需要逐字段转义，漏一个就是注入。

### 3. 自定义答案用哨兵值 `__custom`，答案字段仍然是字符串

页面把自定义入口的 input `value` 设为 `__custom`，在 `recompute()` 中把"被勾选的选项"与"自定义草稿"合并成最终答案：单选取其一，多选按问卷顺序拼接后再追加自定义文本。草稿单独放在页面状态里，因此来回切换步骤不会丢字。

**为什么**：规格要求单选互斥、多选叠加、草稿不丢。用一个重算函数收口这三种关系，比在多个事件处理器里分别维护状态更难写错。

**备选**：让自定义答案继承 `QuestionnaireOption` 形状（`{label, custom: true}`）。否决——会连带修改 `Answers` 类型、TUI 路径与结果序列化，收益不足以抵消外溢。

### 4. 契约侧放行自定义文本，不区分答案来源

`normalizedAnswer()` 对 single 改为"是选项 label 或非空文本"，对 multi 改为"选项 label 子集 + 最多一个额外文本"。长度上限复用文本答案的 2,000 字符。

**为什么**：Agent 拿到的答案最终要作为文本阅读；区分来源会让 `Answers` 变成联合类型，而 TUI 路径并不产生自定义答案，等于为一侧的复杂度付两边的代价。

**备选**：新增 `Answer = {value, source}` 结构。否决——见上，且会触及 8 KiB 结果体积预算。

### 5. 汇总反馈走独立的 `feedback` 字段，不占 `answers` 保留键

`QuestionnaireResult` 增加可选 `feedback?: string`；空字符串时省略字段。

**为什么**：`answers` 是"question id → answer"的映射，Agent 遍历它来读决策；塞一个 `_review` 伪键会让遍历方必须知道保留字。独立字段是自解释的。

**备选**：`answers._review`。否决——隐式保留键是典型的会在半年后咬人的设计。

### 6. 主题与语言在页面侧处理，不依赖宿主注入

主题用 `:root` / `[data-theme="dark"]` 两套令牌 + `matchMedia` 初始值；语言用页面内 `UI_TEXT` 字典 + 全量重绘。

**为什么**：`prompt()` 不暴露 window 句柄，宿主注入路径不存在；`glimpse-design` 的模板本身也把 `prompt()` 场景归为 `matchMedia` 兜底。语言放在页面侧是因为切换必须即时重绘，来回走宿主只会更慢。

**备选**：用 `open()` 常驻面板以换取 window 句柄与主题注入。否决——问卷是一次性交互，`prompt()` 的"提交/关窗即结束"语义正好匹配，换成常驻窗口要自己管生命周期。

### 7. 测试策略：模板断言 + 契约单测，不启动真实窗口

- `src/glimpse-panel.test.ts`：断言渲染结果包含两套主题令牌与语义变量、自定义入口标记、汇总页结构、i18n 字典键齐备（中英键集合一致）、桥调用为 `window.glimpse.send`、以及数据以 JSON 而非可执行脚本嵌入。
- `src/questionnaire.test.ts`：新增自定义答案（single/multi、空文本、超长）与 `feedback`（有值/空值/取消）用例。
- 真实窗口的手工验收（提交与取消确实回传）作为发布前检查，不进入自动化。

**为什么**：`vitest` 环境没有 webview；把渲染结果当字符串断言，能覆盖"模板是否接对了契约"这一层风险，剩下的一层（webview 行为）用浏览器与真实窗口验收。

### 8. 分步布局的终点是汇总步骤，信息类问题不参与作答校验

分步向导的主操作在最后一个问题上必须前进到汇总步骤（`REVIEW_INDEX`），提交载荷只在汇总步骤由 `⏎` 或主按钮产生；`⌘⏎` 保留从任意步骤直接提交的既有语义。`goNext()` 的必答校验跳过 `info` 类型，信息类问题在分步页面与汇总条目上都显示「无需作答」，两处共用同一个文案键。同一个陷阱在宿主侧同样存在：`normalizeAnswers()` 曾对信息类问题执行必答校验，用户正常提交后工具只会报一次笼统的交互失败。

**为什么**：首版把「最后一个问题」直接接到 `submit()`，汇总步骤只能靠步骤条末位的 ✓ 圆点进入，默认路径下用户永远看不到汇总页与反馈框，`feedback` 因此恒为空，而 `skills/xpi-research/SKILL.md` 已经教 Agent 去读它。同一处必答校验还会被声明为必答的信息类问题卡死：校验认为必答未满足，而 `questionNode()` 的 info 分支提前 `return`，连内联错误都不渲染，表现为主操作按钮静默失效。

**备选**：把信息类问题移出分步序列，只在汇总页展示。否决——汇总必须列出所有步骤，且分步序列与步骤条圆点数量必须一致，剔除会让两套序号错位。

## Risks / Trade-offs

- [归档顺序] 本变更对 `questionnaire-contract` 使用 MODIFIED，而目标 spec 尚不存在 → `openspec validate` 已给出 INFO：归档会拒绝该 delta。**缓解**：先归档 `xpi-research-mvp`，再归档本变更；design 与提案中已写明该前置条件。若必须先归档本变更，则需先把 MVP 的 delta 同步进 `openspec/specs/`。
- [模板字符串体积] 面板模板成为仓库里最大的单个字符串常量，diff 噪声大 → 缓解：模板按 CSS / 脚本 / 壳三段导出，review 时按段对照原型文件；原型保留在 `docs/prototypes/` 作为基线快照。
- [双份实现漂移] 原型文件与 `glimpse-panel.ts` 会成为两份实现，后续改动可能只改一边 → 缓解：原型定位为"设计基线快照"，实现落地后不再随代码演进；文档中明确这一点，避免下一次改动把它当作真源。
- [无 webfont 的字体回退] 指定的 `Montserrat` / `Source Code Pro` 在大多数机器上不存在，实际渲染落到系统字体 → 缓解：字体栈保留原字体名并附完整回退；在 `DESIGN.md` 中记录"未加载 webfont、走 fallback"这一事实，避免后续误判为 bug。
- [契约放宽的副作用] 单选/多选现在接受任意非空文本，Agent 可能拿到不符合预期形状的答案 → 缓解：文本上限与结果体积上限不变；`skills/xpi-research/SKILL.md` 中说明自定义答案的来源与读法。
- [页面脚本无法被类型系统覆盖] 模板里的脚本是字符串，`tsc` 不会检查 → 缓解：把页面脚本写成带 `// @ts-check` 语义的纯 ES5 函数集合，保持无类型依赖；靠浏览器手工验收与模板断言兜底。
- [修复改变了默认路径的提交时机] 末题的「下一步」不再直接提交，比首版多一次显式确认 → 这是规格要求的修正，但会改变既有使用节奏；缓解：汇总步骤的 `⏎` 与主按钮一次即提交，`⌘⏎` 仍可从任意步骤直接提交；回滚只需 revert 该单次提交，面板回到「汇总页不可达但仍可提交」的状态。

## Migration Plan

1. 先建分支，提交设计原型与 `biome.jsonc` 的 `!docs/prototypes` 忽略规则（可独立回滚）。
2. 拆出 `src/glimpse-panel.ts`，把现有 40 行模板平移过去，**不改行为**，跑三条命令确认全绿——这一步是纯重构，回滚只需删文件还原调用。
3. 移植新面板模板，同时把页面提交路径改为 `window.glimpse.send`。这是本变更唯一"改了看不懂"的提交，因此单独成一次提交。
4. 扩展 `src/types.ts` 与 `src/questionnaire.ts`（自定义答案 + `feedback`），配套单测。
5. 同步 `DESIGN.md` 与 `skills/xpi-research/SKILL.md`。
6. 回滚策略：第 2 步之前的面板行为由 `glimpse.ts` 现版本保底；第 3 步若在真实窗口出现回传异常，直接 revert 该单次提交即可回到"面板难看但可用"的状态，不需要动契约层。
7. 合并后修正：末题主操作改为进入汇总步骤、信息类问题退出必答校验并显示「无需作答」、删除 `glimpseui` 不支持的 prompt 选项。三项都落在 `src/glimpse-panel.ts` 与 `src/glimpse.ts` 内，按缺陷粒度分别提交，可各自 revert。

## Open Questions

- 面板窗口尺寸是否随内容调整（当前 `prompt()` 固定 800×600，长问卷靠内部滚动）。可在实现后按真实问卷长度再定，不影响规格与任务分解。
- 语义令牌是否需要跟随 `DESIGN.md` 的 `colors:` frontmatter 自动派生。当前做法是把两套令牌手工写进模板；若 `DESIGN.md` 后续调整，需要同步两处。这是维护成本问题，不改变行为契约。
