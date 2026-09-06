---
name: xpi-research
description: Leads a bounded research exploration from an explicit target through clarified success criteria, technical comparisons, similar-project evidence, and an honest MVP handoff. Use when `/xpi-research` starts a research round or when a user asks to investigate a technical or product direction.
---

# xpi-research

Run a focused research round for the target supplied after `/xpi-research`.
The extension provides lifecycle and user-question orchestration. This skill
provides the research sequence and the handoff; it does not provide a model,
database, GitHub client, or cross-session memory.

## Workflow

1. **Clarify the target.** Restate the target in one sentence. Establish the
   desired decision or deliverable, intended user, constraints, and expected
   depth. Keep facts supplied by the user separate from assumptions.
2. **Define success and boundaries.** Write the observable success criteria,
   in-scope questions, out-of-scope work, and evidence needed to support the
   result. Do not imply that external research, code changes, or model calls
   happened unless they actually happened.
3. **Compare technical options.** Use the stated criteria to compare relevant
   approaches, including integration cost, operational burden, performance,
   maintainability, and failure modes when they matter. Prefer authoritative
   documentation and record the basis for each material claim.
4. **Research similar projects when useful.** Inspect comparable projects or
   implementations through the available research tools. Extract practices,
   constraints, and concrete differences. Label observed facts, inferences,
   and missing evidence instead of presenting a similarity as proof.
5. **Resolve decisions with the ask tool.** Call `xpi_research_ask` only for
   unresolved choices that change the result. Send one bounded questionnaire
   with 1-4 questions, stable question ids, explicit `required` values, and
   concise option labels. Use `presentation: "quick"` for only single-choice
   and text questions without previews. Use `presentation: "visual"` for
   multi-select, information, previews, or comparisons that benefit from
   richer presentation. A recommendation is useful, but the user's answer
   remains authoritative.
6. **Produce the MVP handoff.** End with four labeled sections: confirmed
   facts, agent inferences, unresolved questions, and recommended next steps.
   State the smallest useful MVP, its acceptance checks, and what is deferred.

## Question protocol

`xpi_research_ask` is available only during the active research round. Treat
`cancelled: true` as an unresolved decision. Continue with an explicit
assumption only when it does not invalidate the result; otherwise end with the
blocker clearly stated. Never convert cancellation into a preference or an
empty answer.

Keep questionnaires bounded: no more than four questions, no more than eight
options per choice, and no oversized prompts, previews, or answer text. Use
option descriptions for short trade-offs and previews only when the added
context changes the choice.

## Existing methods

Reuse an existing methodology skill by name when its purpose matches the
current phase, such as `grilling`, `brainstorming`, `idea-refine`, or
`interview-me`. Do not copy those skills' instructions into this workflow.
This skill coordinates the phases and the handoff; the other skills remain the
owners of their methods.

## Boundaries

- Ask only through `xpi_research_ask`; do not intercept ordinary user input.
- Do not invent research findings, execute work that was only proposed, or
  claim a source was checked when it was not checked.
- Keep the handoff useful after cancellation by naming the missing decision
  and the assumption or stopping condition.
- Treat the round as current-session state. No database or cross-session
  recovery is implied.
