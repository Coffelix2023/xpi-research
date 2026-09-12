# xpi-research

[English](./README.md) · **简体中文**

**一个围绕明确目标跑完单轮有界研究、只向你索取它无法独自决定的选择的 Pi Coding Agent 扩展。**

**A Pi Coding Agent extension that runs one bounded research round around an explicit target, and asks you only for the decisions it cannot make alone.**

<!-- TODO: 补一个 LICENSE 文件(MIT),下面的徽章指向它 -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

```text
> /xpi-research 把内存里的 session 存储换成可持久化的方案
```

## 为什么

Agent 会话里的研究轮次会以两种可预见的方式烂掉:提问散成一段段白话,答案凑不成可以
执行的结构;或者它干脆自己替你把这些问题决定了,你在结论里才发现。`xpi-research`
把这两个坑一起填掉。这一轮是显式的(一次只跑一轮,且只在 Agent 空闲时启动)、有界的
(最多四个问题,每题都写明类型与是否必答)、可逆的(本轮开始前的完整 active tool 列表
会在轮次结束或 session 关闭时原样恢复,状态一并清除)。只有答案会改变结论的问题才值得
问;其余的决定由技能自己做完,并把理由摆出来。

本仓库里的每个扩展都从同样四条规则出发:

- **没有构建步骤。** Pi 直接加载 `./src/index.ts`,没有 `dist/`、没有打包器、不提交编译产物。
- **Pi 原生 UI。** 渲染走 `ctx.ui.*` 与 `@earendil-works/pi-tui`,绝不劫持终端,也不引入竞争性的终端框架。
- **没有重度运行时依赖。** 只用宿主提供的 API 加严格类型;工具 Schema 用 `typebox`,其余依赖都要先证明自己值得。`glimpseui` 属可选能力,运行时探测。
- **门禁严格,没有例外。** TypeScript strict、Biome、Vitest 三条全绿才能提交。

它也不越界:扩展是被 Pi 主进程加载的插件,不是独立服务。确实需要进程边界时,先写一份
ADR 说明理由,再动手。

## 技术栈

- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/),版本锁定在 [`mise.toml`](./mise.toml)
- [Pi Coding Agent](https://github.com/earendil-works/pi) —— 宿主本体、扩展 API(`@earendil-works/pi-coding-agent`、`@earendil-works/pi-tui`)与 `typebox`
- TypeScript strict(`target: ES2024`,`module: NodeNext`)
- [Biome](https://biomejs.dev/) 负责 lint 与格式化
- [Vitest](https://vitest.dev/) 作为测试运行器

peerDependencies 刻意声明为 optional:在 Pi 内部这些依赖由宿主提供,扩展不能再装一份。

## 安装

前置条件:一个可用的 Pi 安装。本包直接从源码加载,安装前不需要任何构建。

```bash
pi install git:github.com/Coffelix2023/xpi-research@main
```

| 安装位置 | 命令 |
| --- | --- |
| 全局(用户设置) | `pi install git:github.com/Coffelix2023/xpi-research@main` |
| 仅当前项目(`.pi/settings.json`) | `pi install -l git:github.com/Coffelix2023/xpi-research@main` |

```bash
pi list                              # 已安装的包
pi update --extensions               # 更新包并校对固定的 ref
pi remove git:github.com/Coffelix2023/xpi-research
```

本仓库是私有仓库(`"private": true`,不发布到 npm),因此 git 安装需要一份本来就能读它
的凭据。固定的 git ref 不会被 `pi update` 移动。

包级调试刻意只走 git 远程源:本地路径安装只是在 settings 里留一条指向工作目录的引用,
一旦忘记 `pi remove`,残留的脏路径就会和正式安装双份并存。

## 用法

| 命令 | 说明 |
| --- | --- |
| `/xpi-research <目标>` | 为去除首尾空白后的目标启动一轮有界研究 |

没有目标时,扩展打开一个原生输入对话框。取消输入或提交空白内容会给出警告,且不修改
session 状态。扩展不会拦截普通用户 prompt。

| 接口 | 读什么 | 改什么 | 拒绝什么 |
| --- | --- | --- | --- |
| `/xpi-research` | 命令参数,或一次输入对话框 | 本轮需要的 active tool 列表、一条状态项,以及发给 `/skill:xpi-research` 的消息 | 在 Agent 忙碌、已有轮次进行中,或没有 UI 时启动 |
| `xpi_research_ask` | 不读磁盘 —— 问题来自当前轮次 | 不改任何东西 | 在没有活动轮次时作答(返回取消结果);接收不合法的问卷 |
| `/skill:xpi-research` | 目标与随包发布的 [`skills/xpi-research/SKILL.md`](./skills/xpi-research/SKILL.md) | 自身不改任何东西 | 充当模型、数据库或 GitHub 客户端 |

`xpi_research_ask` 只在轮次存续期间存在:轮次开始时它被加进 active tool 列表,轮次结束
后恢复上一份列表。取消有明确状态(`cancelled: true`,答案为空),绝不夹带部分答案。汇总页
的整体反馈走独立的 `feedback` 字段,不出现在 `answers` 里。

Glimpse 面板按能力启用:宿主能解析到 `glimpseui` 时,整轮 visual 问卷用一次 Glimpse
`prompt()` 面板承载;解析不到时,TUI 改用 Pi 原生 custom component,RPC 退回基础对话框,
print 与 JSON 模式明确返回取消而不是阻塞或伪造答案。加载与 prompt 失败都会通知并回落 ——
能力探测是 fail-closed 的。

## 开发

```bash
mise install                         # 安装锁定版本的 Node.js 与 pnpm
pnpm install
```

| 门禁 | 命令 |
| --- | --- |
| 类型 | `pnpm typecheck` —— `tsc --noEmit` |
| Lint 与格式 | `pnpm -w run lint` —— Biome 全仓检查 |
| 测试 | `pnpm test` —— Vitest(`vitest run --passWithNoTests`) |

提交前三条必须全绿。Lint 请在 workspace root 显式运行 `pnpm -w run lint`;包装层偶发会把
裸写的 `pnpm run lint` 误判为未知递归命令。

开发期运行扩展有两种方式:

```bash
pi -e ./src/index.ts                 # 冒烟:只加载一次,仅本次运行,不写配置
```

```bash
ln -s "$(pwd)" ~/.pi/agent/extensions/xpi-research   # 日常回路:在 Pi 内用 /reload 热载
```

`pi -e` 不写任何设置;软链由扩展目录自动发现,`rm` 掉软链即干净。

## 目录结构

```text
.
├── mise.toml / package.json / biome.jsonc / tsconfig.json / pnpm-workspace.yaml
├── AGENTS.md / CONTEXT.md / DESIGN.md / PLAN.md
├── docs/                      # Git 工作流、决策记录与仓库约束
├── skills/xpi-research/       # 随包发布的研究编排技能
└── src/
    ├── index.ts               # 扩展入口(register 函数)
    ├── questionnaire.ts       # Schema 校验与答案归一化
    ├── types.ts               # 问卷与 session 的共享类型
    ├── ui.ts                  # 呈现路由(quick / visual)
    ├── glimpse-panel.ts       # 分步式 Glimpse HTML 面板
    └── glimpse.ts             # fail-closed 的 glimpseui 探测与结果解析
```

## 设计规范

本项目遵循 [Google Labs DESIGN.md 规范](https://github.com/google-labs-code/design.md),并专门为终端 TUI 场景定制。详见 [`DESIGN.md`](./DESIGN.md) 查看设计 Token(颜色、等宽字阶、间距网格与组件定义)。

## 约定与约束

- **术语表**:[`CONTEXT.md`](./CONTEXT.md) 定义了本仓库的统一语言,代码、文档与提交中禁止术语漂移。
- **Git 纪律**:提交或推送前先读 [`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md) 与 [`docs/GITHUB-GUARD.md`](./docs/GITHUB-GUARD.md)。本仓库处于阶段一,直接在 `main` 上提交是常规做法;小粒度 Conventional Commits 依旧适用。
- **Token 安全**:密钥与 Token 绝不写入代码、日志、示例或文档。
- **Agent 契约**:[`AGENTS.md`](./AGENTS.md) 是本仓库的唯一事实来源。口头约定、历史代码或本 README 与它冲突时,以 `AGENTS.md` 为准。

## 致谢

- [Pi Coding Agent](https://github.com/earendil-works/pi) —— 由 [earendil-works](https://github.com/earendil-works) 开发。本扩展寄宿其中:扩展 API、`ctx.ui` 契约和包清单规范都来自该项目。
- [glimpseui](https://github.com/hazat/glimpse) —— 由 [hazat](https://github.com/hazat) 开发。可选的本地面板路径,只从宿主安装中加载,不随包打包。
- 设计基线沿用 [Google Labs DESIGN.md 规范](https://github.com/google-labs-code/design.md)。

## 许可

MIT
