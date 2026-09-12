# questionnaire-presentation Specification

## Purpose

定义研究问卷在 Pi 原生界面、Glimpse 面板和不同运行模式中的呈现优先级、降级行为与安全交互，使复杂问题在能力受限时仍能取消、回答或诚实失败。

## Requirements

### Requirement: The Glimpse panel SHALL present questions as a navigable stepped questionnaire

The Glimpse panel SHALL present questions as a navigable stepped questionnaire. 面板必须默认为分步向导：一次呈现一题，并在问题之上提供步骤计数、可点击的步骤指示器和已作答数量。步骤指示器必须区分未作答、已作答和当前步骤，且允许直接跳转到任意步骤或汇总页。面板必须保留单页堆叠形态作为可选布局，两种布局必须共享同一套校验与提交行为。底栏必须固定可见，不得随内容滚动离开视野，其操作按钮必须使用明显的命中面积。在分步布局下，最后一个问题的主操作必须前进到汇总步骤而不是直接提交；信息类问题不参与作答校验，任何情况下都不得阻塞前进。

#### Scenario: Stepped layout shows position and progress

- **WHEN** a questionnaire with three answerable questions opens in the default layout
- **THEN** the panel shows the current step number, one indicator per step plus the review step, the count of answered questions, and a progress track

#### Scenario: Step indicator navigates directly

- **WHEN** the user activates the indicator of another step
- **THEN** the panel shows that step without submitting or discarding answers already given

#### Scenario: Stacked layout keeps the same contract

- **WHEN** the user switches the panel to the stacked layout
- **THEN** all questions and the review section render in one scrollable column while keyboard hints, validation and submission behaviour stay identical

#### Scenario: Linear navigation ends at the review step

- **WHEN** the user answers the last question of the stepped layout and activates the primary action
- **THEN** the panel shows the review step instead of emitting the payload

#### Scenario: Information steps never block progress

- **WHEN** the stepped layout shows an information question, including one declared as required
- **THEN** the panel advances past it on the primary action and never reports a missing answer for it

### Requirement: The Glimpse panel SHALL offer a custom answer for every option-based question

The Glimpse panel SHALL offer a custom answer for every option-based question. 每个单选与多选问题必须在选项列表末尾提供自定义入口。选中该入口必须展开文本输入框并聚焦它。单选时自定义入口必须与普通选项互斥；多选时自定义文本必须作为附加项与已选选项并存。选项与自定义文本之间来回切换时，已输入的自定义文本不得丢失。自定义文本为空时该问题必须仍被视为未作答。

#### Scenario: Custom entry reveals a text input

- **WHEN** the user selects the custom entry of an option-based question
- **THEN** a text input appears for that question and receives focus

#### Scenario: Custom answer is exclusive for single questions

- **WHEN** the user selects the custom entry of a single question after choosing an option
- **THEN** the previously chosen option is deselected and only the custom answer is recorded

#### Scenario: Custom answer accompanies selections for multi questions

- **WHEN** the user selects options and also fills the custom entry of a multi question
- **THEN** the recorded answer contains the selected options in questionnaire order plus the custom text

#### Scenario: Draft text survives navigation

- **WHEN** the user types custom text, moves to another step, and returns
- **THEN** the typed text is still present and its selection state is preserved

### Requirement: The Glimpse panel SHALL summarise every step before submission

The Glimpse panel SHALL summarise every step before submission. 面板必须提供一个汇总确认步骤，位于全部问题之后。汇总必须列出所有步骤，包括信息类问题，并为每个可回答问题显示其当前答案或明确的未作答标记。激活任意汇总条目必须跳转到对应步骤以便修改。汇总步骤必须提供独立于问题答案的整体补充反馈输入。信息类问题没有答案，汇总必须为它显示明确的「无需作答」标记，而不是问题类型名称。

#### Scenario: Review lists every step

- **WHEN** the user reaches the final step
- **THEN** the panel lists every question in original order with its answer, and unanswered questions are explicitly marked as unanswered

#### Scenario: Review entry jumps back to its question

- **WHEN** the user activates a review entry
- **THEN** the panel navigates to the corresponding question so the answer can be changed

#### Scenario: Review feedback is separate from answers

- **WHEN** the user writes text into the review feedback input
- **THEN** that text is collected separately from question answers and does not appear as an answer to any question

#### Scenario: Information entries are not shown as answers

- **WHEN** the review step lists an information question
- **THEN** its entry states that no answer is required instead of naming the question type

### Requirement: The Glimpse panel SHALL submit and cancel through the Glimpse bridge

The Glimpse panel SHALL submit and cancel through the Glimpse bridge. 面板必须通过 `window.glimpse.send` 回传提交与取消载荷，不得使用不存在的页面间通信通道。提交必须回传 `round`、`cancelled: false` 与规范化答案；取消必须回传 `round`、`cancelled: true` 与空答案。当页面无法访问该桥时，面板必须保持可用并明确告知结果未能回传，而不是静默失败。

#### Scenario: Submit reaches the host

- **WHEN** the user fills the questionnaire and activates the submit action
- **THEN** the host receives one payload containing the round, `cancelled: false`, and the collected answers

#### Scenario: Cancel reaches the host

- **WHEN** the user activates cancel or presses Esc
- **THEN** the host receives one payload with `cancelled: true` and empty answers

#### Scenario: Bridge is unavailable

- **WHEN** the panel is rendered outside Glimpse and the bridge is missing
- **THEN** the panel does not throw, the interaction remains usable, and the missing channel is surfaced to the user

### Requirement: The Glimpse panel SHALL apply the project design tokens and bilingual interface text

The Glimpse panel SHALL apply the project design tokens and bilingual interface text. 面板必须使用项目指定的两套语义颜色令牌分别覆盖亮色与暗色，并默认跟随系统外观；亮暗主题必须由数据属性切换，不得在组件内写死颜色。面板必须提供简体中文与英文的界面文案切换，所有界面自有文案必须来自单一文案字典，切换后无需重载即可全量重绘。题目正文、选项与预览属于 Agent 内容，必须按原文渲染且不参与翻译。所有动态内容必须以文本方式渲染，不得作为 HTML 或脚本执行。

#### Scenario: Theme follows the system and can be overridden

- **WHEN** the host system appearance is dark and the panel opens
- **THEN** the panel renders with the dark token set, and changing the theme keeps all controls legible in both schemes

#### Scenario: Language toggle redraws the whole interface

- **WHEN** the user switches the interface language
- **THEN** every interface string, badge, placeholder, keyboard hint and accessible name is redrawn in the selected language while question content stays in its original wording

#### Scenario: Interface text is never hardcoded

- **WHEN** the panel template is inspected
- **THEN** interface strings are resolved through the translation dictionary rather than embedded literals in the markup

#### Scenario: Agent content containing markup is rendered literally

- **WHEN** a question, option label, description or preview contains HTML-like or script text
- **THEN** the panel displays it as literal text without altering structure or executing code

### Requirement: The system SHALL use the best available presentation capability

The system SHALL use the best available presentation capability. quick 问卷必须使用 Pi 原生 `select` 和 `input` 对话框，并按问题顺序收集答案。TUI（终端用户界面）模式下的 visual 问卷必须优先使用可交互的 Pi 原生 custom component（自定义组件）以支持多选、信息展示和预览。存在可用 Glimpse 时，visual 问卷必须优先使用一次性 Glimpse `prompt` 面板。

#### Scenario: Quick questionnaire runs through native dialogs

- **WHEN** the effective presentation is quick and the context has UI capability
- **THEN** each answerable question is presented with the matching native dialog and the final result preserves question ids

#### Scenario: TUI visual questionnaire uses a custom component

- **WHEN** the effective presentation is visual, the context mode is TUI, and Glimpse is unavailable
- **THEN** the system presents one centered custom questionnaire with visible focus, keyboard navigation, preview text and explicit cancel/submit actions

#### Scenario: Glimpse visual questionnaire uses a one-shot prompt

- **WHEN** the effective presentation is visual and Glimpse can be loaded
- **THEN** the system opens one prompt panel, accepts one submitted payload or cancellation, and closes the panel before returning

### Requirement: The system SHALL degrade by runtime mode without pretending to have unavailable capabilities

The system SHALL degrade by runtime mode without pretending to have unavailable capabilities. In RPC mode, where custom TUI components are unavailable, rich questionnaires must degrade to sequential native `select` and `input` dialogs; information text and previews must be represented as plain text in those dialogs or notifications. In print and JSON modes, an interactive questionnaire with no usable UI must return explicit cancellation. A Glimpse load failure, no graphical environment or prompt failure must be recoverable and must not escape as an unhandled exception.

#### Scenario: RPC mode handles a rich questionnaire

- **WHEN** a rich questionnaire runs in RPC mode and Glimpse is unavailable or unsupported
- **THEN** the system uses RPC-supported native dialogs, preserves multi-select and cancellation semantics, and never calls a TUI-only custom component

#### Scenario: Glimpse fails closed

- **WHEN** dynamic Glimpse loading or the one-shot prompt fails before a result is submitted
- **THEN** the system notifies the user that it is using the native fallback and continues through the mode-appropriate fallback path

#### Scenario: Non-interactive mode receives a questionnaire

- **WHEN** print or JSON mode receives an interactive questionnaire
- **THEN** the system returns explicit cancellation without blocking, throwing or fabricating an answer

### Requirement: The system SHALL provide safe and accessible interaction

The system SHALL provide safe and accessible interaction. 所有用户可见动态文本必须按文本内容渲染，不得作为未转义 HTML、脚本或内联事件处理器执行。TUI 输出必须遵守当前终端宽度并使用 Pi TUI 的可见宽度工具进行截断和换行。所有界面必须支持 Esc 取消、Enter 提交、列表上下移动和可见焦点；Glimpse 面板必须支持中英文文案、系统主题、缩放、减少动效和对比度偏好。

#### Scenario: Dynamic content contains markup-like text

- **WHEN** a question, option or preview contains HTML-like characters or script text
- **THEN** the displayed content is literal text and cannot alter the panel structure or execute code

#### Scenario: Narrow terminal renders a questionnaire

- **WHEN** the TUI width is below the preferred width but at least the supported minimum
- **THEN** labels and previews are wrapped or truncated within the available width without corrupting borders or overlapping controls

#### Scenario: User cancels from any presentation

- **WHEN** the user presses Esc or closes the Glimpse window
- **THEN** every presentation path returns the explicit cancellation result and performs UI cleanup
