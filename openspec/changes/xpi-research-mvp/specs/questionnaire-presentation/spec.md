## Purpose

定义研究问卷在 Pi 原生界面、Glimpse 面板和不同运行模式中的呈现优先级、降级行为与安全交互，使复杂问题在能力受限时仍能取消、回答或诚实失败。

## ADDED Requirements

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
