## 1. 分支与设计基线

- [x] 1.1 从 `main` 创建 `feat/improve-glimpse-questionnaire-panel` 工作分支；用 `git branch --show-current` 确认当前分支名
- [x] 1.2 提交设计基线：`docs/prototypes/glimpse-questionnaire-panel.html` 与 `biome.jsonc` 中新增的 `!docs/prototypes` 忽略项；用 `git status --short` 确认只暂存了这两个文件，且 `pnpm -w run lint` 仍然全绿

## 2. 面板模块拆分（纯重构，不改行为）

- [x] 2.1 新建 `src/glimpse-panel.ts`，把 `src/glimpse.ts` 中现有的面板模板原样平移，按三段导出：`GLIMPSE_PANEL_CSS`、`GLIMPSE_PANEL_SCRIPT` 与 `renderGlimpseQuestionnaire(questionnaire, round)`；导出 `renderGlimpseQuestionnaire` 后 `pnpm typecheck` 通过
- [x] 2.2 修改 `src/glimpse.ts` 改为从新模块导入 `renderGlimpseQuestionnaire`，删除本地模板与不再使用的 `escapeHtml`；确认 `pnpm typecheck` 与 `pnpm test` 在未改动测试的情况下通过，证明行为未变
- [x] 2.3 新增 `src/glimpse-panel.test.ts`，为重构后的实现建立行为基线：断言数据以 `<script type="application/json">` 嵌入、渲染结果包含问卷 JSON、且不含可执行的答案数据；运行 `pnpm test` 确认新用例通过

## 3. 面板模板移植

- [x] 3.1 在 `GLIMPSE_PANEL_CSS` 中落地令牌层：`:root` 亮色（B 套）与 `[data-theme="dark"]` 暗色（A 套）两套语义变量，以及 `--font-sans` / `--font-mono` 回退栈与 `--radius` 派生；为现有测试补充令牌断言（两套主题变量都存在、组件样式只引用变量），`pnpm test` 通过
- [x] 3.2 在 `GLIMPSE_PANEL_SCRIPT` 中加入 `UI_TEXT` 字典与 `t(key, vars)`，覆盖全部界面文案（步骤计数、类型徽标、必答/可留空、自定义入口、按钮、键盘提示、错误、汇总页、空答案标记）；补充断言"中英键集合完全一致"，`pnpm test` 通过
- [x] 3.3 实现步骤条：步骤计数、每步一个可点击圆点（未作答/已作答/当前三态）、已作答数量与进度轨；圆点点击跳转步骤或汇总页且不丢弃已作答内容；用浏览器打开原型对照，并在真实运行中确认默认进入分步布局
- [x] 3.4 实现固定底栏与操作按钮：上一步、取消、下一步/提交，按钮使用加大命中面积；确认内容滚动时底栏不离开视野，且 `Esc` 取消、`Enter` 下一步、`Cmd/Ctrl+Enter` 提交可用
- [x] 3.5 实现选项卡化渲染：每题分节（题号、类型徽标、必答标记）、选项卡片按 label / description / preview 三层展示、`recommended` 徽标、选中态高亮；输入含 HTML 或脚本文本的题目时以文本原样显示，不改变面板结构
- [x] 3.6 实现自定义入口：选项列表末尾追加自定义项，选中后展开并聚焦输入框，单选互斥、多选叠加、自定义草稿在步骤间来回切换时不丢失；空文本时该题仍视为未作答
- [x] 3.7 实现汇总步骤：位于全部问题之后，列出所有步骤（含信息类问题）、显示答案或未作答标记、点击条目跳回对应步骤，并提供独立的整体补充反馈输入
- [x] 3.8 把页面回传路径从 `window.parent.postMessage(...)` 改为 `window.glimpse.send(...)`；桥不可用时不得抛错，需保持面板可用并提示结果未能回传；补充断言"渲染结果调用 `window.glimpse.send` 且不再出现 `postMessage(`"，`pnpm test` 通过
- [x] 3.9 实现语言与主题切换控件：语言切换即时全量重绘界面文案而题目原文不变，明暗默认跟随系统且可覆盖；补充断言"模板标记中的界面文案来自字典而非硬编码字面量"

- [x] 3.10 补齐任务清单遗漏、但规格已有的呈现要求：单页堆叠布局切换（`questionnaire-presentation` 要求「保留单页堆叠形态作为可选布局」）、缩放控件（0.8–1.5）、减少动效与对比度偏好（该能力既有要求）。验证：浏览器实测单页布局渲染全部问题与汇总段、缩放 1.0→1.2→1.0、`prefers-reduced-motion` 与 `prefers-contrast` 分别写入 `data-reduce-motion` / `data-contrast`

## 4. 契约扩展

- [x] 4.1 在 `src/types.ts` 的 `QuestionnaireResult` 增加可选 `feedback` 字段；`pnpm typecheck` 通过
- [x] 4.2 修改 `src/questionnaire.ts` 的 `normalizedAnswer()`，使单选接受"选项 label 或非空自定义文本"、多选接受"选项 label 子集加最多一个额外文本"，两者共用 2,000 字符上限；在 `src/questionnaire.test.ts` 补充自定义答案用例（单选自定义、多选附加、空文本视为未作答、超长被拒），`pnpm test` 通过
- [x] 4.3 在 `normalizeAnswers()` 中接入汇总反馈：非空时写入去空白的 `feedback`，为空时省略该字段，取消结果不包含该字段；在 `src/questionnaire.test.ts` 补充对应用例，`pnpm test` 通过
- [x] 4.4 确认契约扩展未影响既有路径：`src/ui.test.ts` 与 `src/index.test.ts` 无需修改即可通过，且 RPC 与 quick 路径的既有断言保持有效

## 5. 文档同步

- [x] 5.1 更新 `DESIGN.md`：记录两套语义令牌的来源与映射关系、面板默认分步的交互契约、以及"不加载 webfont、字体走回退"这一事实；用 `pnpm -w run lint` 确认文档改动不引入格式问题
- [x] 5.2 更新 `skills/xpi-research/SKILL.md`：说明面板提供自定义答案与汇总确认步骤，`feedback` 与 `answers` 的读法差异，以及因自定义答案存在、单选/多选答案可能不是任何选项 label；确认技能文档中不再存在与之冲突的表述
- [x] 5.3 同步双语 README 的呈现说明：分步面板、选项卡片、自定义入口、汇总页与 `feedback` 字段的读法。验证：`README.md` 与 `README.zh-CN.md` 的「研究流程」章节均已更新，且不再与 `questionnaire-contract` 的答案形状冲突

## 6. 端到端验收与交付

- [x] 6.1 运行 `pnpm typecheck`、`pnpm -w run lint`、`pnpm test` 三条命令并确认全部通过；把实际输出作为交付证据
- [x] 6.2 **(已人工验收)** 见 `manual-acceptance-6.2.md` 的勾选清单。在真实 Glimpse 窗口中手工验收：展开面板、切换到汇总页、提交并确认宿主收到 `cancelled: false` 与规范化答案；再次打开后按 `Esc`，确认宿主收到 `cancelled: true` 与空答案；记录两次载荷（实测载荷见该文件的「实测载荷」一节）
- [x] 6.3 按 Conventional Commits 小粒度提交（至少拆为：面板重构、模板移植与桥修复、契约扩展与测试、文档同步），`git add <具体文件>` 暂存，确认 `git diff --cached --check` 无空白错误
- [x] 6.4 推送分支并开 PR，PR 描述包含目的、改动范围与验证方式；停在合并前，由人工确认合并

## 7. 合并后修正（真机验收反馈）

- [x] 7.1 按 `docs/GITHUB-GUARD.md` 的当前阶段规则在 `main` 上工作（阶段一为 main-only，不开工作分支）；用 `git status --short` 确认工作区除本次变更外干净，并确认 `pnpm typecheck`、`pnpm -w run lint`、`pnpm test` 三条在基线上全绿
- [x] 7.2 修正分步流程的终点：`syncFooter()` 去掉「末题直接提交」的分支（非汇总步骤的主按钮一律显示「下一步」），`goNext()` 改为在 `REVIEW_INDEX` 提交、否则前进一页，汇总步骤的 `⏎` 与主按钮仍触发提交；在 `src/glimpse-panel.test.ts` 断言脚本不再以 `QUESTIONS.length - 1` 作为提交判据，`pnpm test` 通过
- [x] 7.3 修正信息类问题：`goNext()` 的必答校验排除 `info` 类型；文案字典新增 `noAnswerNeeded`（中/英）并补进 `GlimpsePanelText` 接口；`questionNode()` 的 info 分支追加 `.q-hint` 提示；`GLIMPSE_PANEL_CSS` 增加只引用令牌的 `.q-hint` 规则；补断言「中英键集合一致」「模板不硬编码该文案」
- [x] 7.4 汇总条目对信息类问题改用同一个 `noAnswerNeeded` 键，不再渲染问题类型名；补断言
- [x] 7.5 从 `src/glimpse.ts` 的 `GlimpsePromptOptions` 与 `promptWithGlimpse` 调用中删除 `theme`、`reduceMotion`、`zoom`（`glimpseui` 的 `open()` 不识别这三个键）；确认 `src/ui.test.ts` 与 `src/index.test.ts` 无需修改即可通过
- [x] 7.6 同步文档：`manual-acceptance-6.2.md` 补 A/B/C 段检查项、`skills/xpi-research/SKILL.md` 说明面板恒以汇总步骤收尾因而 `feedback` 总是可达、`DESIGN.md` 记录 `.q-hint`
- [x] 7.7 运行 `pnpm typecheck`、`pnpm -w run lint`、`pnpm test` 并留下实际输出作为交付证据
- [x] 7.8 浏览器回归验证：末题主操作落到汇总步骤且不发出载荷；汇总页填写反馈后提交的载荷含独立 `feedback`；声明为必答的信息类问题不再阻塞；汇总页信息行显示「无需作答」
- [x] 7.9 真实 Glimpse 窗口复跑：A 段（走到汇总页、填写反馈、提交）与 B 段的 `Esc` 已在真实窗口通过并记录载荷；关窗与取消按钮两条路径用同一份渲染产物在浏览器中验证（`prompt()` 关窗返回 `null` 的分支见 `glimpseui/src/glimpse.mjs:306-311`）
- [ ] 7.10 按 Conventional Commits 小粒度提交并推送 `main`；若需要并行隔离再改开 `fix/*` 分支并用 PR，届时由人工确认合并
- [x] 7.11 宿主侧同样修正：`normalizeAnswers()` 跳过 `info` 类型，不再把「信息类问题没有答案」判成「必答问题缺少有效答案」；在 `src/questionnaire.test.ts` 补一条用例，覆盖「信息类问题被标成必答但用户已作答全部可答题」的场景
