# xpi-research

**English**: [README.md](./README.md)

> Pi Coding Agent 的轻量、低干扰扩展（`pi-extension` / `pi-package`）。

> 无构建步骤、直接加载 TypeScript 源码、严格质量门禁。

[快速开始](#快速开始) · [研究流程](#研究流程) · [命令列表](#命令列表) · [开发命令](#开发命令) · [目录结构](#目录结构) · [设计规范](#设计规范)
---

## 项目简介

**`@fx-pi/xpi-research`** 是一个运行在 Pi 主进程内的 Pi Coding Agent 扩展。

设计要点：

- **无构建步骤**：Pi 直接加载 `./src/index.ts` TS 源码，不提交编译产物（`dist/` 或 bundle）。
- **Pi 原生 UI**：使用 `ctx.ui.*` 与 `@earendil-works/pi-tui` 进行渲染，绝不劫持终端或引入竞争性终端库。
- **零重度运行时依赖**：依赖宿主提供的 API 与严格类型定义（`typebox`、TypeScript strict）。`glimpseui` 为可选能力，运行时探测。
- **严格质量门禁**：TypeScript strict + Biome + Vitest，任何修改必须三绿通过。

## 技术栈

- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/)，版本锁定在 [`mise.toml`](./mise.toml)
- [Pi Coding Agent API](https://github.com/earendil-works/pi-coding-agent) (`@earendil-works/pi-coding-agent`, `@earendil-works/pi-tui`)
- TypeScript strict（`target: ES2024`，`module: NodeNext`）
- [Biome](https://biomejs.dev/)（lint + format）
- [Vitest](https://vitest.dev/)（测试运行器）

## 快速开始

### 环境准备

使用 [mise](https://mise.jdx.dev/) 安装锁定版本的 Node.js 与 pnpm：

```bash
mise install
```

### 安装依赖

```bash
pnpm install
```

### 冒烟测试

直接将扩展加载到 Pi 中进行快速测试：

```bash
pi -e ./src/index.ts
```

### 本地日常开发

软链到本地 Pi 扩展目录以进行实时测试：

```bash
ln -s "$(pwd)" ~/.pi/agent/extensions/xpi-research
```

在运行中的 Pi 会话中，输入 `/reload` 即可热载本扩展。

## 命令列表

| 命令 | 说明 |
| :--- | :--- |
| `/xpi-research <目标>` | 为去除首尾空白后的目标启动一轮有界研究 |

## 研究流程

`/xpi-research <目标>` 只在 Agent 空闲时启动。没有目标时，扩展通过
Pi 原生输入对话框获取目标。取消输入或提交空白内容会显示警告，且不修改
session 状态。扩展不会拦截普通用户 prompt。

研究轮次中，扩展临时启用 `xpi_research_ask`，并向
`/skill:xpi-research` 传递目标。技能只针对影响结果的未决选择调用该工具。
工具把有界的结构化答案返回当前 Agent；取消具有明确状态，不包含部分答案。单选
答案可能是选项 label，也可能是用户自填的文本；多选答案按选项定义顺序排列，末尾
最多附带一项自填文本。汇总页的整体反馈通过独立的 `feedback` 字段返回，不出现在
`answers` 里。

- **Quick**：简单的单选和文本问题按顺序使用 Pi 原生 `select` 与 `input`。
- **Visual**：多选、信息、预览或显式 visual 提示使用富呈现路径。宿主提供
  `glimpseui` 时，visual 问卷使用一次 Glimpse `prompt()` 面板；不可用时，
  TUI 使用 Pi 原生 custom component，RPC 使用 Pi 原生基础对话框并以纯文本
  展示详情。
- **无 UI**：print 与 JSON 模式明确返回取消，不阻塞也不伪造答案。Glimpse
  加载或 prompt 失败时通知用户并使用原生 fallback。

Glimpse 面板默认按步骤呈现：一次一题，顶部显示步骤计数、可点击的步骤指示器与
已作答数量，底部操作栏固定不随内容滚动。每个单选与多选题都提供「自定义」入口，
选项卡片把标题、说明与等宽预览分层展示。最后一个步骤是汇总确认页，列出全部
答案（未作答的会被标出）并提供一个整体补充反馈输入。界面可在简体中文与英文
之间切换，明暗跟随系统并支持缩放。

Esc、关闭面板或取消原生对话框都会返回 `cancelled: true` 与空答案对象。必答
问题会保持可修正，直到用户提交有效答案。Agent 稳定完成或 session 关闭后，
扩展恢复本轮开始前的完整 active tool 列表并清除状态。

MVP 只在当前 Pi session 的内存中保存研究状态，不提供数据库、跨 session 恢复、
项目配置、独立模型调用或内置 GitHub 研究客户端。已有方法论技能保持独立，
需要时按名称复用。

## 开发命令

| 命令 | 说明 |
| :--- | :--- |
| `pnpm typecheck` | `tsc --noEmit`，严格类型检查 |
| `pnpm -w run lint` | Biome 全仓代码与格式检查 |
| `pnpm test` | Vitest 测试运行器 (`vitest run --passWithNoTests`) |

提交前三条门禁（`typecheck`、`lint`、`test`）必须全部通过。

## 目录结构

```
.
├── mise.toml / package.json / biome.jsonc / tsconfig.json / pnpm-workspace.yaml
├── AGENTS.md / CONTEXT.md / DESIGN.md
├── docs/                      # Git 工作流、决策记录与仓库约束
├── skills/xpi-research/       # 随包发布的研究编排技能
└── src/
    └── index.ts               # 扩展入口 (register 函数)
```

## 设计规范

本项目遵循 [Google Labs DESIGN.md 规范](https://github.com/google-labs-code/design.md)，并专门为终端 TUI 场景定制。详见 [`DESIGN.md`](./DESIGN.md) 查看终端设计 Token（颜色、等宽字阶、间距网格与组件定义）。

## 约定与约束

- **术语表**：[`CONTEXT.md`](./CONTEXT.md) 定义了本仓库的统一语言，代码、文档与提交中禁止术语漂移。
- **Git 纪律**：提交/推送/发布前先读 [`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md) 与 [`docs/GITHUB-GUARD.md`](./docs/GITHUB-GUARD.md)。默认不直推 `main`，使用小粒度 Conventional Commits。
- **Token 安全**：密钥与 Token 绝不写入代码、日志、示例或文档。
