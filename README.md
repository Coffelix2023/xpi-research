# xpi-research

**简体中文**: [README.zh-CN.md](./README.zh-CN.md)

> A lightweight, non-intrusive extension for the Pi Coding Agent (`pi-extension` / `pi-package`).

> No build step. Direct TypeScript source execution. Strict quality gates.

[Quickstart](#quickstart) · [Research flow](#research-flow) · [Commands](#commands) · [Development](#development) · [Directory structure](#directory-structure) · [Design baseline](#design-baseline)

---

## What it is

**`@fx-pi/xpi-research`** is a Pi Coding Agent extension running inside the Pi main process.

Design principles:

- **No build step** — Pi loads `./src/index.ts` directly; no compilation artifacts (`dist/` or bundles) are committed.
- **Pi-native UI** — Uses `ctx.ui.*` and `@earendil-works/pi-tui` for rendering; never hijacks the terminal or installs conflicting terminal frameworks.
- **Zero heavy runtime dependencies** — Relies on host-provided APIs with strict type safety (`typebox`, TypeScript strict). `glimpseui` is optional and detected at runtime.
- **Strict quality gates** — TypeScript strict + Biome + Vitest; all three checks must pass before any commit.

## Tech stack

- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/), versions pinned in [`mise.toml`](./mise.toml)
- [Pi Coding Agent API](https://github.com/earendil-works/pi-coding-agent) (`@earendil-works/pi-coding-agent`, `@earendil-works/pi-tui`)
- TypeScript strict (`target: ES2024`, `module: NodeNext`)
- [Biome](https://biomejs.dev/) (lint + format)
- [Vitest](https://vitest.dev/) (test runner)

## Quickstart

### Environment

Install the pinned Node.js and pnpm versions with [mise](https://mise.jdx.dev/):

```bash
mise install
```

### Install dependencies

```bash
pnpm install
```

### Smoke test

Run a quick test loading the extension directly into Pi:

```bash
pi -e ./src/index.ts
```

### Local development

Symlink to your local Pi extensions directory for live testing:

```bash
ln -s "$(pwd)" ~/.pi/agent/extensions/xpi-research
```

Inside a running Pi session, use `/reload` to hot-reload the extension.

## Commands

| Command | Description |
| :--- | :--- |
| `/xpi-research <target>` | Start one bounded research round for the trimmed target |

## Research flow

`/xpi-research <target>` starts only when the Agent is idle. With no target,
the extension asks for one through a native input dialog. Cancelling or
submitting whitespace shows a warning and leaves the session unchanged. The
extension does not intercept ordinary user prompts.

During the round, the extension temporarily enables `xpi_research_ask` and
passes the target to `/skill:xpi-research`. The skill uses it only for
unresolved decisions that affect the result. The tool returns bounded,
structured answers to the current Agent turn; cancellation is explicit and
contains no partial answers. A single-choice answer may be an option label or
the user's own text; a multiple-choice answer lists the option labels in
declaration order and may append at most one free-text entry. The overall
comment from the review step travels in a separate `feedback` field and never
appears inside `answers`.

- **Quick**: simple single-choice and text questions use sequential Pi-native
  `select` and `input` dialogs.
- **Visual**: multi-select, information, previews, or an explicit visual hint
  use the richer presentation path. When `glimpseui` is available, a visual
  questionnaire uses one Glimpse `prompt()` panel. Without it, TUI uses a
  native custom component and RPC uses primitive Pi dialogs with plain-text
  details.
- **No UI**: print and JSON modes cancel explicitly instead of blocking or
  fabricating answers. Glimpse load or prompt failures notify and use the
  native fallback.

The Glimpse panel is stepped by default: one question per screen, with a step
counter, clickable step dots and an answered count above the question, and a
pinned footer below it. Every single and multiple-choice question offers a
custom entry, and each option renders as a card that separates its label, its
description, and its monospace preview. The last step reviews every answer,
marks the unanswered ones, and adds one optional overall comment. The interface
switches between Simplified Chinese and English, follows the system appearance,
and supports zooming.

Esc, closing a panel, or cancelling a native dialog returns `cancelled: true`
with an empty answer object. Required questions remain answerable until the
user submits a valid value. After settlement or session shutdown, the exact
pre-round active tool list is restored and the status is cleared.

The MVP keeps research state in memory for the current Pi session only. It has
no database, cross-session recovery, project configuration, independent model
calls, or built-in GitHub research client. Existing methodology skills remain
separate and are reused by name when appropriate.

## Development

| Command | Description |
| :--- | :--- |
| `pnpm typecheck` | `tsc --noEmit` — strict type check |
| `pnpm -w run lint` | Biome check across the repository |
| `pnpm test` | Vitest test runner (`vitest run --passWithNoTests`) |

All three gates (`typecheck`, `lint`, `test`) must pass before committing.

## Directory structure

```
.
├── mise.toml / package.json / biome.jsonc / tsconfig.json / pnpm-workspace.yaml
├── AGENTS.md / CONTEXT.md / DESIGN.md
├── docs/                      # Git workflow, decisions, and guardrails
├── skills/xpi-research/       # Packaged research orchestration skill
└── src/
    └── index.ts               # Extension entrypoint (register function)
```

## Design baseline

This project adopts the [Google Labs DESIGN.md format](https://github.com/google-labs-code/design.md) tailored for terminal TUI interfaces. See [`DESIGN.md`](./DESIGN.md) for terminal design tokens (colors, monospace typography, spacing, and component definitions).

## Conventions & constraints

- **Glossary** — [`CONTEXT.md`](./CONTEXT.md) defines the repository's unified terminology; terms must not drift in code, docs, or commits.
- **Git discipline** — Read [`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md) and [`docs/GITHUB-GUARD.md`](./docs/GITHUB-GUARD.md) before committing or pushing. Do not push to `main` by default; use small, granular Conventional Commits.
- **Token safety** — Credentials and secret tokens are never written into code, logs, examples, or documentation.
