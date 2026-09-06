# 修复计划: Glimpse Loader 探测路径错误

- 工作流标识: xpi-fast-fix / 2026-09-06-fix-glimpse-loader-paths
- 创建时间: 2026-09-06
- planStatus: archived
- executionStatus: deferred
- 原始需求: 使用 `/xpi-research` 时 glimpse 调用总报错, loader 探测路径指向不存在的文件。
- 任务清单: `tasks.md`(基线副本 `tasks.initial.md`)

## 目标

1. `loadGlimpse()` 能通过真实包入口 `glimpseui/src/glimpse.mjs` 加载成功, `/xpi-research` 问卷弹出 Glimpse 窗口, 不再打印 "Glimpse is unavailable" warning。
2. 加载失败时输出一次含原因的 `console.warn`, 不再静默吞错。

## 非目标

- 不引入裸 specifier `import("glimpseui")`(本项目无该依赖, Pi 直接加载 TS 源码, 解析路径不可控)。
- 不修改 `ui.ts` 调用方、`promptWithGlimpse`、`GlimpseLoader` 注入签名。
- 不移植修复到其他 extension(如 xpi-memo)。

## 证据

- `glimpseui@0.8.1` 的 `package.json`: `main`/`exports` 均指向 `src/glimpse.mjs`, 发布文件无 `index.js`、无 `dist/`。
- 本机实测 `import('/Users/felix/.pi/agent/npm/node_modules/glimpseui/src/glimpse.mjs')` 成功, 导出 `prompt`/`open` 函数, 无 `default` —— `asGlimpseModule` 现有校验兼容。
- `src/glimpse.ts` `candidatePaths()` 的 4 条候选路径全部不存在; `catch {}` 静默吞掉, 返回 null, `ui.ts:425` 走 TUI fallback。

## 根因

模板/移植代码的候选路径列表与 glimpseui 真实包结构脱节; 静默 catch 使失败不可见。

## 推荐方案(最小 diff)

- `candidatePaths()` 改为:
  - `path.resolve(process.cwd(), "node_modules/glimpseui/src/glimpse.mjs")`
  - `$HOME/.pi/agent/npm/node_modules/glimpseui/src/glimpse.mjs`(保留 home 判空分支)
- `loadGlimpse` 的 catch 增加 `console.warn` 输出失败原因(候选路径 + 错误消息), 保持 fail-closed 返回 null。

## 放弃方案及原因

- 裸 specifier `import("glimpseui")`: 需在 package.json 声明依赖, 且 Pi 加载 TS 源码的解析上下文不确定, 改动面大于收益。
- 重写 loader 为配置化路径列表: YAGNI, 无此需求。

## 涉及范围

- 仅 `src/glimpse.ts`。调用方 `src/ui.ts`、测试 `src/ui.test.ts` 不改。

## 决策

- 保持 `loadGlimpse(paths = candidatePaths())` 注入签名不变, 现有测试继续有效。
- console.warn 仅在加载失败时触发一次, 不刷屏。

## 风险与兼容性

- 低风险。签名与 fail-closed 语义不变; 现有 `loadGlimpse(["relative/path.js"])` 测试仍应返回 null。
- 兼容性: 未来 glimpseui 若改入口, 只需再改 `candidatePaths()` 一处; warn 已能暴露失败原因。

## 假设与默认值

- 假设 glimpseui 常装在两个位置之一: 项目本地 `node_modules` 或 `$HOME/.pi/agent/npm/node_modules`(与现有列表假设一致, 仅替换文件名)。

## 验证命令

```bash
pnpm typecheck
pnpm -w run lint
pnpm test
```

运行时验收(手动): `pi -e ./src/index.ts` 内触发 `/xpi-research` 问卷, Glimpse 窗口弹出且无 warning。

## 验收标准

1. 本机路径下 `loadGlimpse()` 返回含 `prompt` 函数的模块。
2. 三条验证命令全绿。
3. 运行时无 "Glimpse is unavailable" warning(手动冒烟)。
