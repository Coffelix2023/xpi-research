## Purpose

定义用户如何启动一次研究轮次、Agent 如何获得提问能力以及扩展如何在完成或异常退出时恢复运行状态，保证研究编排不会长期改变 Pi session 的工具配置。

## ADDED Requirements

### Requirement: The system SHALL start research only through the explicit command

The system SHALL start research only through the explicit command. `/xpi-research <target>` 必须去除目标首尾空白后启动研究。没有参数时，命令必须使用 Pi 原生输入对话框获取目标；用户取消或提交空目标时，命令必须显示错误通知并结束。扩展不得监听普通 `input` 或自动拦截普通用户 prompt。

#### Scenario: Command starts with an explicit target
- **WHEN** an idle Agent receives `/xpi-research architecture review`
- **THEN** the system starts one research round using the trimmed target

#### Scenario: Command requests a missing target
- **WHEN** an idle Agent receives `/xpi-research` without a non-empty target
- **THEN** the system opens a native input dialog and starts only if the submitted target is non-empty after trimming

#### Scenario: Target collection is cancelled
- **WHEN** the user cancels the target input or submits only whitespace
- **THEN** the system shows a warning or error notification and does not modify active tools or send an Agent message

### Requirement: The system SHALL enforce idle and single-round gates

The system SHALL enforce idle and single-round gates. 研究启动前必须确认 Agent idle（空闲）且扩展实例没有活动研究轮次。Agent 正在流式输出、已有活动研究轮次或当前上下文不具备可用 UI 时，系统必须拒绝启动并提供原因，不得覆盖已有会话状态。

#### Scenario: Agent is busy
- **WHEN** the command is invoked while the Agent is streaming
- **THEN** the system rejects the start and leaves active tools and status unchanged

#### Scenario: A research round is already active
- **WHEN** the command is invoked while another round is active
- **THEN** the system rejects the second start and preserves the first round

### Requirement: The system SHALL scope the ask tool to the active research round

The system SHALL scope the ask tool to the active research round. 启动成功后，系统必须保存启动前的 active tool names，并仅在本轮 Agent 运行期间加入 `xpi_research_ask`。系统必须发送带有目标的 `/skill:xpi-research` 用户消息，并启用 prompt template expansion（提示模板展开）。研究轮次结束后，提问工具不得继续保持 active。

#### Scenario: Research start activates the tool and skill
- **WHEN** the start gates pass
- **THEN** the system activates the ask tool, sets a concise status indicator and sends the research skill command with the target

#### Scenario: Agent receives an ask tool result
- **WHEN** the skill invokes the ask tool and the user submits or cancels
- **THEN** the tool result is returned to the current Agent turn as bounded structured text

### Requirement: The system SHALL restore state on every terminal lifecycle path

The system SHALL restore state on every terminal lifecycle path. 正常完成必须在 `agent_settled` 后恢复启动前的完整 active tool list、清除状态栏并释放内存状态。reload、session replacement（会话替换）和 quit（退出）触发的 `session_shutdown` 必须执行同样的清理。清理必须幂等，异常路径不得留下活动工具或状态栏。

#### Scenario: Agent settles normally
- **WHEN** an active research round emits `agent_settled`
- **THEN** the original active tool list is restored exactly, the status is cleared and the round is inactive

#### Scenario: Session shuts down during research
- **WHEN** `session_shutdown` occurs while a research round is active
- **THEN** the system restores tools, clears status and releases references without throwing

#### Scenario: Cleanup is invoked more than once
- **WHEN** settled and shutdown cleanup paths both observe the same round
- **THEN** the second cleanup is a no-op and does not alter unrelated state
