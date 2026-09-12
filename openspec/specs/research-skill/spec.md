# research-skill Specification

## Purpose

定义随 Pi package（Pi 扩展包）发布的研究技能入口，让 Agent 能按阶段澄清目标、约束和决策，并把 UI 编排与既有研究方法论保持清晰分工。

## Requirements

### Requirement: The package SHALL expose the research skill as a package resource

The package SHALL expose the research skill as a package resource. 包清单必须声明 `skills/` 资源目录，且该目录必须包含名为 `xpi-research` 的技能入口。技能资源不得依赖项目级配置、用户全局配置或未声明的运行时文件。

#### Scenario: Pi discovers the packaged skill

- **WHEN** Pi loads the package through its package manifest
- **THEN** the `xpi-research` skill is discoverable by its stable name

#### Scenario: Skill is unavailable outside the extension package

- **WHEN** the extension runs without a project-local `.pi` configuration or global skill mutation
- **THEN** the skill still resolves from the package resource and the extension does not write configuration files

### Requirement: The skill SHALL orchestrate research without replacing existing capabilities

The skill SHALL orchestrate research without replacing existing capabilities. 技能必须要求 Agent 先明确目标、成功标准、用户/边界、技术方案和交付深度；在需要用户决策时调用 `xpi_research_ask`；在适合时复用已有 `grilling`、`brainstorming`、`idea-refine`、`interview-me` 等方法论技能。技能不得自行调用独立模型、实现 GitHub 客户端或复制既有技能正文。

#### Scenario: Agent begins an exploration

- **WHEN** an active research round starts with a target
- **THEN** the Agent follows the research phases and asks only for unresolved decisions that affect the result

#### Scenario: Agent needs a structured decision

- **WHEN** the next research step depends on a bounded user choice or comparison
- **THEN** the Agent invokes `xpi_research_ask` with a question set suited to quick or visual presentation

#### Scenario: Existing methodology is relevant

- **WHEN** a research phase matches an already available methodology skill
- **THEN** the Agent reuses that skill by name and does not duplicate its instructions

### Requirement: The skill SHALL produce a bounded and honest research handoff

The skill SHALL produce a bounded and honest research handoff. 研究总结必须区分用户已确认的事实、Agent 的推断、未解决的问题和建议的下一步；不得声称扩展已经执行未执行的外部调研、代码修改或模型调用。取消提问后，Agent 必须继续以取消状态处理，而不是把缺失答案当作用户偏好。

#### Scenario: User completes the research questions

- **WHEN** all required decisions have been answered
- **THEN** the Agent continues the exploration using those answers and records remaining assumptions explicitly

#### Scenario: User cancels a question round

- **WHEN** the ask tool returns `cancelled: true`
- **THEN** the Agent treats the decision as unresolved and either continues with a stated assumption or ends the exploration clearly
