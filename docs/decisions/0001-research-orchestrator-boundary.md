# ADR-001: Keep the Research Extension as an Orchestrator

## Status

Accepted

## Date

2026-09-06

## Context

`xpi-research` needs to turn an explicit target into a focused research
round. The round needs temporary user questions, bounded answers, and cleanup
when the Pi Agent settles or the session shuts down. Those concerns belong to
the Pi extension because it owns UI capability detection, active tools, and
lifecycle events.

The research method itself changes more often and is already represented by
skills such as `grilling`, `brainstorming`, `idea-refine`, and `interview-me`.
Technical evidence may also come from host-provided tools and research
clients. Placing those responsibilities in the extension would create a
second methodology system, require runtime integrations that Pi already
provides, and make package state harder to clean up.

## Decision

The extension is an orchestration layer only:

- `src/index.ts` owns the explicit command, the temporary
  `xpi_research_ask` tool, the active-tool snapshot, status, and lifecycle
  cleanup.
- `src/questionnaire.ts` owns validation, routing, normalization, cancellation,
  and output bounds as pure logic.
- `src/ui.ts` and `src/glimpse.ts` adapt the same questionnaire to available
  Pi or optional Glimpse capabilities. Glimpse remains an optional runtime
  capability, not a package dependency.
- `skills/xpi-research/SKILL.md` owns the research phases, decision criteria,
  evidence discipline, and MVP handoff.
- Models, web or GitHub research clients, databases, and cross-session
  persistence remain outside this extension.

The skill may reuse existing methodology skills by name and the extension may
ask the current Agent for user decisions, but neither layer replaces those
capabilities.

## Alternatives Considered

### Put research methodology in the extension

Rejected. It would duplicate skill behavior, couple research policy to Pi
runtime code, and force methodology changes through extension releases.

### Add a built-in model and research client

Rejected. The host Agent already provides model and tool execution. Adding
independent clients would introduce credentials, network failure handling, and
another source of research claims outside the MVP boundary.

### Persist research rounds in a database

Rejected. The first workflow is a single current-session round. Persistence
would add schema, migration, privacy, and cleanup obligations before a
cross-session requirement exists.

## Consequences

Positive consequences:

- The extension remains small, host-native, and testable with fake UI and API
  boundaries.
- Active tools are temporary and can be restored exactly on every terminal
  lifecycle path.
- Research methods and evidence tools can evolve independently of UI adapters.
- Missing Glimpse capability is a recoverable presentation concern, not an
  installation requirement.

Trade-offs:

- A research round cannot recover after the session ends.
- The skill depends on the host Agent's available research capabilities.
- Cross-extension coordination for simultaneous active-tool changes is outside
  this MVP.

## Rollback

Rollback removes the packaged `xpi-research` skill, removes `pi.skills` from
`package.json`, and restores the previous README and command documentation.
The runtime boundary can be reverted by removing the research command and
ask-tool wiring from `src/index.ts`; no database migration or state cleanup is
required because this decision introduces no persistent data.
