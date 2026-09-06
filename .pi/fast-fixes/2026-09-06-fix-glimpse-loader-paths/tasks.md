# 任务清单: Fix Glimpse Loader 探测路径

- 工作流标识: xpi-fast-fix / 2026-09-06-fix-glimpse-loader-paths
- 创建时间: 2026-09-06
- planStatus: archived
- executionStatus: deferred
- 计划: `plan.md` / README: `README.md` / 只读基线: `tasks.initial.md`

## 1. 修复 glimpse loader 探测路径
- [x] 1.1 修正 src/glimpse.ts candidatePaths() 为真实入口 src/glimpse.mjs(验收: 本机路径下 import 成功且导出 prompt;验证: `pnpm test`)
  - 验证: `pnpm test` → 34 passed (2026-09-06); 实测 loadGlimpse() 返回含 prompt 函数的模块
- [x] 1.2 loadGlimpse 的 catch 增加一次性 console.warn 失败原因(验收: warn 输出含失败原因且不刷屏;验证: `pnpm test`)
  - 验证: `pnpm test` → 34 passed (2026-09-06); 实测坏路径输出 `[glimpse] failed to load candidate …: Cannot find module …` 且加载成功时无多余输出
- [x] 1.3 全量回归(验收: 三条命令全绿;验证: `pnpm typecheck && pnpm -w run lint && pnpm test`)
  - 验证: 三条命令全绿, typecheck exit 0 / lint 无错误 / test 34 passed (2026-09-06)
