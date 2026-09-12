## MODIFIED Requirements

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

## ADDED Requirements

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
