# questionnaire-contract Specification

## Purpose

定义研究提问工具可接受的结构化问卷、确定性路由和答案协议，使 Agent 与用户界面之间拥有稳定、可测试且有界的行为契约。

## Requirements

### Requirement: The system SHALL normalize answers into a stable bounded result

The system SHALL normalize answers into a stable bounded result. 单选答案必须是所选 option label，或该问题自定义入口提交的非空文本；多选答案必须是去重后的选项集合，按问卷选项定义顺序输出，最多再附加一个自定义文本项。自定义文本与文本答案必须去除首尾空白，并同样受 2,000 字符上限约束。必答问题没有有效答案时不能提交；可选问题未回答时必须从 `answers` 中省略。信息类问题永远不产生答案，因此不得参与必答校验。整个 JSON result（结果）文本最多 8 KiB。

#### Scenario: Answers are normalized deterministically

- **WHEN** the user submits valid selections and text answers
- **THEN** the result contains `cancelled: false`、当前 `round` 和按 question id 索引的规范化 answers，且多选顺序稳定

#### Scenario: Required answer is missing

- **WHEN** the user attempts to submit while a required question has no valid answer
- **THEN** submission is rejected and the questionnaire remains available for correction

#### Scenario: Information questions are never required

- **WHEN** a questionnaire marks an information question as required and the user submits every answerable question
- **THEN** the submission is accepted and the result omits that question from `answers` instead of failing

#### Scenario: Custom text answer is accepted

- **WHEN** the user selects the custom entry of a single or multi question and submits non-empty text that is not any option label
- **THEN** the result records that text as the answer for the question instead of rejecting the submission

#### Scenario: Empty custom answer does not count as an answer

- **WHEN** the user selects the custom entry but leaves the text empty and submits
- **THEN** the question is treated as unanswered, and a required question still blocks submission

#### Scenario: Oversized custom answer is rejected

- **WHEN** a custom answer exceeds 2,000 characters
- **THEN** the system rejects that answer rather than truncating it silently

### Requirement: The system SHALL carry optional review feedback outside the answer map

The system SHALL carry optional review feedback outside the answer map. 汇总确认页的整体补充反馈必须通过结果的可选 `feedback` 字段返回，而不是作为伪问题写入 `answers`。反馈必须去除首尾空白；为空时必须省略该字段，而不是返回空字符串。`feedback` 与文本答案共享 2,000 字符上限，并计入 8 KiB 结果体积上限。

#### Scenario: Review feedback is returned as a dedicated field

- **WHEN** the user writes review feedback on the confirmation page and submits
- **THEN** the result contains a trimmed `feedback` string and `answers` contains only real question ids

#### Scenario: Empty review feedback is omitted

- **WHEN** the user submits without writing any review feedback
- **THEN** the result omits `feedback` entirely instead of returning an empty value

#### Scenario: Cancellation never fabricates feedback

- **WHEN** the questionnaire is cancelled before submission
- **THEN** the cancelled result contains empty `answers` and no `feedback`

### Requirement: The system SHALL accept only bounded questionnaire input

The system SHALL accept only bounded questionnaire input. 问卷必须包含 1 至 4 个问题。每个问题必须有唯一的非空 `id`、非空 `prompt`、受支持的 `type` 和明确的 `required` 布尔值。`id` 最多 64 个字符，`prompt` 最多 1,000 个字符；单选和多选问题必须包含 1 至 8 个选项，选项标签必须非空且互不重复。选项 `label` 最多 160 个字符，`description` 最多 500 个字符，`preview` 最多 4,000 个字符。文本和信息问题不得声明选项。

#### Scenario: Valid bounded questionnaire is accepted

- **WHEN** a request contains 1 至 4 个合法问题，且所有文本、选项和预览均未超过上限
- **THEN** the system accepts the request and preserves question order

#### Scenario: Oversized or malformed questionnaire is rejected

- **WHEN** a request contains more than 4 questions、超过选项或文本上限、重复 question id、重复 option label、缺少必需字段或未知问题类型
- **THEN** the system rejects the request with a stable validation error and does not open a user interface

### Requirement: The system SHALL route questionnaires according to their effective presentation needs

The system SHALL route questionnaires according to their effective presentation needs. 当请求明确声明 `visual` 时必须使用 visual 路径。当请求声明 `quick` 但包含多选、信息问题、任意预览内容或其他富呈现内容时，系统必须自动升级到 visual。只有全部可回答问题均为单选或文本、没有预览内容、且请求未声明 `visual` 时，系统才可使用 quick 路径。

#### Scenario: Simple questionnaire uses quick routing

- **WHEN** a questionnaire contains only single and text questions without previews and is not marked visual
- **THEN** the effective presentation is quick

#### Scenario: Rich questionnaire is upgraded to visual routing

- **WHEN** a questionnaire contains a multi question, an info question, a preview, or explicit visual presentation
- **THEN** the effective presentation is visual regardless of a quick hint

### Requirement: The system SHALL represent cancellation explicitly

The system SHALL represent cancellation explicitly. 用户按 Esc、关闭面板、取消最后一个原生对话框或在无 UI 环境无法回答时，系统必须返回 `cancelled: true`、当前 `round` 和空的 `answers`。取消不得被转换成任意选项、空字符串或部分成功答案。

#### Scenario: User cancels the questionnaire

- **WHEN** the user presses Esc or closes the active questionnaire before submission
- **THEN** the result is a cancellation result with no answers

#### Scenario: UI capability is unavailable

- **WHEN** the request requires interaction but the current mode has no usable UI
- **THEN** the tool returns the same explicit cancellation shape and does not claim that the user answered
