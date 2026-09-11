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

- [ ] 4.1 在 `src/types.ts` 的 `QuestionnaireResult` 增加可选 `feedback` 字段；`pnpm typecheck` 通过
- [ ] 4.2 修改 `src/questionnaire.ts` 的 `normalizedAnswer()`，使单选接受"选项 label 或非空自定义文本"、多选接受"选项 label 子集加最多一个额外文本"，两者共用 2,000 字符上限；在 `src/questionnaire.test.ts` 补充自定义答案用例（单选自定义、多选附加、空文本视为未作答、超长被拒），`pnpm test` 通过
- [ ] 4.3 在 `normalizeAnswers()` 中接入汇总反馈：非空时写入去空白的 `feedback`，为空时省略该字段，取消结果不包含该字段；在 `src/questionnaire.test.ts` 补充对应用例，`pnpm test` 通过
- [ ] 4.4 确认契约扩展未影响既有路径：`src/ui.test.ts` 与 `src/index.test.ts` 无需修改即可通过，且 RPC 与 quick 路径的既有断言保持有效

## 5. 文档同步

- [ ] 5.1 更新 `DESIGN.md`：记录两套语义令牌的来源与映射关系、面板默认分步的交互契约、以及"不加载 webfont、字体走回退"这一事实；用 `pnpm -w run lint` 确认文档改动不引入格式问题
- [ ] 5.2 更新 `skills/xpi-research/SKILL.md`：说明面板提供自定义答案与汇总确认步骤，`feedback` 与 `answers` 的读法差异，以及因自定义答案存在、单选/多选答案可能不是任何选项 label；确认技能文档中不再存在与之冲突的表述

## 6. 端到端验收与交付

- [ ] 6.1 运行 `pnpm typecheck`、`pnpm -w run lint`、`pnpm test` 三条命令并确认全部通过；把实际输出作为交付证据
- [ ] 6.2 在真实 Glimpse 窗口中手工验收：展开面板、切换到汇总页、提交并确认宿主收到 `cancelled: false` 与规范化答案；再次打开后按 `Esc`，确认宿主收到 `cancelled: true` 与空答案；记录两次载荷
- [ ] 6.3 按 Conventional Commits 小粒度提交（至少拆为：面板重构、模板移植与桥修复、契约扩展与测试、文档同步），`git add <具体文件>` 暂存，确认 `git diff --cached --check` 无空白错误
- [ ] 6.4 推送分支并开 PR，PR 描述包含目的、改动范围与验证方式；停在合并前，由人工确认合并
