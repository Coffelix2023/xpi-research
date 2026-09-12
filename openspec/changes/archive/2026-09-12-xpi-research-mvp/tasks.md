## 1. Questionnaire Contract

- [x] 1.1 Create `src/types.ts` with the questionnaire, question, option, answer, result and research-session data contracts defined by `specs/questionnaire-contract/spec.md`; verify `pnpm typecheck` passes with the new type-only module.
- [x] 1.2 Add failing boundary tests in `src/questionnaire.test.ts` for valid input, missing fields, duplicate ids/labels, unsupported types, maximum question/option counts and text/preview limits; run `pnpm test -- src/questionnaire.test.ts` and confirm the new cases fail before implementation.
- [x] 1.3 Implement questionnaire validation and monotonic quick/visual routing in `src/questionnaire.ts` without importing Pi or Glimpse; verify `pnpm test -- src/questionnaire.test.ts` passes for the validation and routing cases.
- [x] 1.4 Add tests and implementation for deterministic answer normalization, required/optional questions, multi-select ordering, explicit cancellation and the 2,000-character answer / 8 KiB JSON limits; verify the targeted questionnaire test file passes.

## 2. Presentation Adapters

- [x] 2.1 Add fake UI tests for sequential quick presentation using native `select` and `input`, including cancellation and required-question behavior; verify `pnpm test -- src/ui.test.ts` fails before the quick adapter is implemented.
- [x] 2.2 Implement the quick adapter in `src/ui.ts` using the repository's `ExtensionContext` and `ctx.ui.*` contracts; verify the quick fake UI tests pass and `pnpm typecheck` reports no API mismatches.
- [x] 2.3 Add TUI and RPC fallback tests covering multi-select, info/preview text, Esc cancellation, narrow-width rendering and the absence of `ctx.ui.custom()` calls in RPC mode; verify `pnpm test -- src/ui.test.ts` fails before the fallback implementation is complete.
- [x] 2.4 Implement the TUI custom component and RPC primitive-dialog fallback in `src/ui.ts`, using `@earendil-works/pi-tui` visible-width utilities and the DESIGN.md modal constraints; verify the targeted UI tests pass in TUI and RPC fakes.
- [x] 2.5 Add Glimpse loader/prompt fakes and security tests for load failure, prompt cancellation, markup-like dynamic text, cleanup and fallback notification; verify `pnpm test -- src/ui.test.ts` fails before the Glimpse adapter is implemented.
- [x] 2.6 Implement `src/glimpse.ts` with absolute-path dynamic loading, one-shot `prompt()` integration, JSON data transfer and fail-closed cleanup; wire it into `src/ui.ts` and verify all targeted UI tests pass without requiring an installed `glimpseui` package.

## 3. Research Session Lifecycle

- [x] 3.1 Add an `xpi_research_ask` TypeBox schema and tool execution path in `src/index.ts` that validates the questionnaire, delegates to the UI adapter and returns bounded structured text; verify an isolated fake-tool test covers submitted and cancelled results.
- [x] 3.2 Add command tests for trimmed explicit targets, missing-target input, whitespace cancellation, busy-agent rejection, duplicate-round rejection and no ordinary-input interception; verify `pnpm test -- src/index.test.ts` fails before command orchestration is implemented.
- [x] 3.3 Implement `/xpi-research` start orchestration in `src/index.ts`: check idle state, capture active tools, activate `xpi_research_ask` once, set status and call `/skill:xpi-research` through `sendUserMessage` with prompt template expansion; verify the command tests assert exact tool, status and message behavior.
- [x] 3.4 Add lifecycle tests for `agent_settled`, `session_shutdown`, repeated cleanup, tool restoration and send/execute error paths; verify the new cases fail before cleanup wiring is complete.
- [x] 3.5 Implement one idempotent cleanup path in `src/index.ts` for normal settlement, reload, session replacement and quit; verify `pnpm test -- src/index.test.ts` passes and the original active tool list is restored exactly in the fake API.

## 4. Skill and Package Surface

- [x] 4.1 Create `skills/xpi-research/SKILL.md` describing target clarification, success criteria, boundaries, technical comparison, similar-project research, MVP handoff and required `xpi_research_ask` usage without copying existing methodology skills; verify the file contains no secrets and is discoverable by its stable skill name.
- [x] 4.2 Update `package.json` to expose `./skills` through the existing Pi manifest while preserving Pi core peer dependencies and excluding `glimpseui` as a runtime dependency; verify `pnpm pack --dry-run` lists the skill and does not add build artifacts.
- [x] 4.3 Update `README.md` and `README.zh-CN.md` with the command flow, quick/visual/fallback behavior, optional Glimpse capability, cancellation semantics and current no-database/no-cross-session limits; verify both documents describe the same public behavior and `pnpm -w run lint` passes.
- [x] 4.4 Create `docs/decisions/0001-research-orchestrator-boundary.md` recording that the extension orchestrates UI and lifecycle only, while skills, models and research clients remain separate; verify the decision record matches `design.md` and contains rollback implications.

## 5. Integrated Verification

- [x] 5.1 Run `pnpm typecheck`, `pnpm -w run lint` and `pnpm test` after all implementation tasks; verify all three commands exit successfully with no new diagnostics.
- [ ] 5.2 Run `pi -e ./src/index.ts` in interactive mode and verify explicit-target start, missing-target input, quick answers, visual TUI fallback, Esc cancellation and post-settlement tool restoration.
- [x] 5.3 Exercise RPC and non-interactive modes with a fake or supported host and verify primitive-dialog fallback, explicit no-UI cancellation, no unhandled exceptions and no fabricated answers.
- [x] 5.4 Run the package/resource smoke checks and inspect the final diff to verify no `dist/`, project configuration, global settings, dependency downloads, credentials or unrelated user changes were added.
