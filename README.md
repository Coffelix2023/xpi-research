# xpi-research

**English** · [简体中文](./README.zh-CN.md)

**A Pi Coding Agent extension that runs one bounded research round around an explicit target, and asks you only for the decisions it cannot make alone.**

**一个围绕明确目标跑完单轮有界研究、只向你索取它无法独自决定的选择的 Pi Coding Agent 扩展。**

<!-- TODO: add a LICENSE file (MIT) — the badge below links to it -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

```text
> /xpi-research replace the in-memory session store with something durable
```

## Why

A research round inside an agent session decays in two predictable ways: the
agent asks its questions as loose prose, so the answers never line up into a
structure it can act on — or it quietly decides those questions itself, and you
find out in the conclusion. `xpi-research` removes both. The round is explicit
(one at a time, only when the agent is idle), bounded (at most four questions,
each with a stated type and a required flag), and reversible (the exact active
tool list from before the round is restored, and the status is cleared, on
settlement or session shutdown). A question is only worth asking when the answer
changes the result; everything else the skill decides and shows its reasoning
for.

Every extension in this repository starts from the same four rules:

- **No build step.** Pi loads `./src/index.ts` directly. No `dist/`, no bundler, no committed artifacts.
- **Pi-native UI.** Rendering goes through `ctx.ui.*` and `@earendil-works/pi-tui`. It never hijacks the terminal or pulls in a competing terminal framework.
- **No heavy runtime dependencies.** Host-provided APIs plus strict types; `typebox` for tool schemas, and nothing else unless it earns its place. `glimpseui` is optional and detected at runtime.
- **Strict gates, no exceptions.** TypeScript strict, Biome, and Vitest must all pass before any commit.

It also stays inside its lane: an extension is a plugin loaded into the Pi main
process, not a separate service. If a task needs a process boundary, say so in an
ADR before adding one.

## Tech stack

- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/), versions pinned in [`mise.toml`](./mise.toml)
- [Pi Coding Agent](https://github.com/earendil-works/pi) — the host, its extension API (`@earendil-works/pi-coding-agent`, `@earendil-works/pi-tui`), and `typebox`
- TypeScript strict (`target: ES2024`, `module: NodeNext`)
- [Biome](https://biomejs.dev/) for lint and format
- [Vitest](https://vitest.dev/) as the test runner

Peer dependencies are declared optional on purpose: inside Pi the host already
provides them, so the extension must not install a second copy.

## Install

Requires a working Pi installation. The package is loaded straight from source,
so there is nothing to build first.

```bash
pi install git:github.com/Coffelix2023/xpi-research@main
```

| Where | Command |
| --- | --- |
| Global (user settings) | `pi install git:github.com/Coffelix2023/xpi-research@main` |
| This project only (`.pi/settings.json`) | `pi install -l git:github.com/Coffelix2023/xpi-research@main` |

```bash
pi list                              # installed packages
pi update --extensions               # update packages and reconcile pinned refs
pi remove git:github.com/Coffelix2023/xpi-research
```

The repository is private (`"private": true`, not published to npm), so a git
install needs credentials that can already read it. A pinned ref is not moved by
`pi update`.

Package-level debugging uses git remote sources on purpose: a local-path install
only records a reference to your working copy and leaves a stale entry in
settings the moment you forget to `pi remove` it.

## Usage

| Command | Description |
| --- | --- |
| `/xpi-research <target>` | Start one bounded research round for the trimmed target |

With no target the extension opens a native input dialog. Cancelling it, or
submitting whitespace, warns and leaves the session unchanged. The extension
never intercepts ordinary user prompts.

| Surface | What it reads | What it changes | What it refuses |
| --- | --- | --- | --- |
| `/xpi-research` | The command argument, or one input dialog | Active tool list for the round, one status entry, and the `/skill:xpi-research` message | Starting while the agent is busy, while a round is active, or without a UI |
| `xpi_research_ask` | Nothing from disk — questions come from the current turn | Nothing | Answering outside an active round (returns a cancelled result); accepting a malformed questionnaire |
| `/skill:xpi-research` | The target and the packaged [`skills/xpi-research/SKILL.md`](./skills/xpi-research/SKILL.md) | Nothing by itself | Being a model, a database, or a GitHub client |

`xpi_research_ask` exists only for the duration of a round: it is added to the
active tool list when the round starts and the previous list is restored when the
round settles. A cancellation is explicit (`cancelled: true`, empty answers) and
never carries partial answers. The overall comment from the review step travels
in a separate `feedback` field, never inside `answers`.

The Glimpse panel is opt-in by capability: when `glimpseui` resolves, a visual
questionnaire uses one Glimpse `prompt()` panel for the whole flow; when it does
not, the TUI uses a Pi-native custom component, RPC falls back to primitive
dialogs, and print or JSON mode cancels instead of blocking or fabricating
answers. Load and prompt failures are notified and fall back — detection is
fail-closed.

## Development

```bash
mise install                         # pinned Node.js and pnpm
pnpm install
```

| Gate | Command |
| --- | --- |
| Types | `pnpm typecheck` — `tsc --noEmit` |
| Lint and format | `pnpm -w run lint` — Biome across the repository |
| Tests | `pnpm test` — Vitest (`vitest run --passWithNoTests`) |

All three must pass before committing. Run `pnpm -w run lint` explicitly at the
workspace root; the wrapper occasionally misreads a bare `pnpm run lint` as an
unknown recursive command.

Two ways to run the extension while working on it:

```bash
pi -e ./src/index.ts                 # smoke test: load once, current run only
```

```bash
ln -s "$(pwd)" ~/.pi/agent/extensions/xpi-research   # live loop: /reload inside Pi
```

`pi -e` writes nothing to settings; the symlink is picked up from the extensions
directory and is removed with `rm`.

## Directory structure

```text
.
├── mise.toml / package.json / biome.jsonc / tsconfig.json / pnpm-workspace.yaml
├── AGENTS.md / CONTEXT.md / DESIGN.md / PLAN.md
├── docs/                      # Git workflow, decisions, and guardrails
├── skills/xpi-research/       # Packaged research orchestration skill
└── src/
    ├── index.ts               # Extension entrypoint (register function)
    ├── questionnaire.ts       # Schema validation and answer normalization
    ├── types.ts               # Shared questionnaire and session types
    ├── ui.ts                  # Presentation routing (quick / visual)
    ├── glimpse-panel.ts       # Stepped Glimpse HTML panel
    └── glimpse.ts             # Fail-closed glimpseui detection and result parsing
```

## Design baseline

This project adopts the [Google Labs DESIGN.md format](https://github.com/google-labs-code/design.md) tailored for terminal TUI interfaces. See [`DESIGN.md`](./DESIGN.md) for the design tokens (colors, monospace typography, spacing, and component definitions).

## Conventions & constraints

- **Glossary** — [`CONTEXT.md`](./CONTEXT.md) defines the repository's unified terminology; terms must not drift in code, docs, or commits.
- **Git discipline** — read [`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md) and [`docs/GITHUB-GUARD.md`](./docs/GITHUB-GUARD.md) before committing or pushing. This repository is in phase one, where committing on `main` is the normal path; small, granular Conventional Commits still apply.
- **Token safety** — credentials and secret tokens are never written into code, logs, examples, or documentation.
- **Agent contract** — [`AGENTS.md`](./AGENTS.md) is the single source of truth for this repository. When an oral agreement, older code, or this README disagrees with it, `AGENTS.md` wins.

## Credits

- [Pi Coding Agent](https://github.com/earendil-works/pi) by [earendil-works](https://github.com/earendil-works) — the host this extension plugs into. The extension API, the `ctx.ui` contract, and the package manifest format are theirs.
- [glimpseui](https://github.com/hazat/glimpse) by [hazat](https://github.com/hazat) — the optional native panel path. Loaded from the host installation, never bundled.
- The design baseline follows the [Google Labs DESIGN.md format](https://github.com/google-labs-code/design.md).

## License

MIT
