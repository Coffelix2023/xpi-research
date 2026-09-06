# Fix Glimpse Loader 探测路径

- 工作流标识: xpi-fast-fix / 2026-09-06-fix-glimpse-loader-paths
- 创建时间: 2026-09-06
- planStatus: archived
- executionStatus: deferred

## 原始需求摘要

修复:使用 `/xpi-research` 命令时, glimpse 调用总是报错。调用方的 `loadGlimpse()` 探测路径全部指向不存在的文件(`node_modules/glimpseui/index.js`、`dist/index.js`), 每次加载必然失败, 走 TUI fallback 并打印 "Glimpse is unavailable; using the native TUI fallback." warning。

## 相关文件

- 计划: `plan.md`
- 任务: `tasks.md`
- 只读基线: `tasks.initial.md`(禁止修改; 用于与 tasks.md 对比检测任务遗漏)

## 当前任务状态

- 全部任务 done (2026-09-06): 1.1 路径修正、1.2 warn 补齐、1.3 三条验证命令全绿(typecheck/lint/test 34 passed)。
- 剩余手动验收: `pi -e ./src/index.ts` 冒烟确认 Glimpse 窗口弹出且无 "Glimpse is unavailable" warning。
## 恢复说明

- 恢复命令: `/xpi-fast-fix execute .pi/fast-fixes/2026-09-06-fix-glimpse-loader-paths`
- 执行模式每次只推进一个任务; `tasks.initial.md` 为只读基线, 任何步骤禁止修改; 每次写 `tasks.md` 前后对照基线核对任务 id 集合, 发现漂移立即从基线恢复缺失条目并将当前任务标记 failed。

## 阻塞记录

- (无)
