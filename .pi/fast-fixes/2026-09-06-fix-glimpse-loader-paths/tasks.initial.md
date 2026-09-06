<!-- 只读基线，禁止修改；用于与 tasks.md 对比检测任务遗漏 -->

# 任务清单: Fix Glimpse Loader 探测路径

- 工作流标识: xpi-fast-fix / 2026-09-06-fix-glimpse-loader-paths
- 创建时间: 2026-09-06
- planStatus: archived
- executionStatus: deferred
- 计划: `plan.md` / README: `README.md` / 只读基线: `tasks.initial.md`

## 1. 修复 glimpse loader 探测路径
- [ ] 1.1 修正 src/glimpse.ts candidatePaths() 为真实入口 src/glimpse.mjs(验收: 本机路径下 import 成功且导出 prompt;验证: `pnpm test`)
- [ ] 1.2 loadGlimpse 的 catch 增加一次性 console.warn 失败原因(验收: warn 输出含失败原因且不刷屏;验证: `pnpm test`)
- [ ] 1.3 全量回归(验收: 三条命令全绿;验证: `pnpm typecheck && pnpm -w run lint && pnpm test`)
