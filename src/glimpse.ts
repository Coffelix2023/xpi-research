import path from "node:path";
import { pathToFileURL } from "node:url";
import { normalizeAnswers } from "./questionnaire.ts";
import type { Questionnaire, QuestionnaireResult, RawAnswers } from "./types.ts";

export interface GlimpsePromptOptions {
  height?: number;
  reduceMotion?: boolean;
  theme?: "system" | "light" | "dark";
  title?: string;
  width?: number;
  zoom?: boolean;
}

export interface GlimpseModule {
  close?: () => Promise<void> | void;
  prompt: (html: string, options?: GlimpsePromptOptions) => Promise<unknown>;
}

export type GlimpseLoader = () => Promise<GlimpseModule | null>;

export type GlimpsePromptOutcome =
  | {
      kind: "cancelled";
      result: QuestionnaireResult;
    }
  | {
      kind: "failed";
    }
  | {
      kind: "submitted";
      result: QuestionnaireResult;
    }
  | {
      kind: "unavailable";
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asGlimpseModule(value: unknown): GlimpseModule | null {
  if (!isRecord(value) || typeof value.prompt !== "function") return null;
  // SAFETY: isRecord plus the prompt function check establishes the runtime GlimpseModule shape; optional close is validated by invocation cleanup.
  return value as unknown as GlimpseModule;
}

function candidatePaths(): string[] {
  const home = process.env.HOME;
  return [
    path.resolve(process.cwd(), "node_modules/glimpseui/index.js"),
    path.resolve(process.cwd(), "node_modules/glimpseui/dist/index.js"),
    ...(home
      ? [
          path.resolve(home, ".pi/agent/npm/node_modules/glimpseui/index.js"),
          path.resolve(home, ".pi/agent/npm/node_modules/glimpseui/dist/index.js"),
        ]
      : []),
  ];
}

export async function loadGlimpse(
  paths = candidatePaths(),
): Promise<GlimpseModule | null> {
  for (const candidate of paths) {
    if (!path.isAbsolute(candidate)) continue;
    try {
      // biome-ignore lint/performance/noAwaitInLoops: Glimpse candidates must be tried in order.
      const moduleValue: unknown = await import(pathToFileURL(candidate).href);
      const moduleRecord = isRecord(moduleValue) ? moduleValue : undefined;
      const loaded =
        asGlimpseModule(moduleRecord?.default) ?? asGlimpseModule(moduleValue);
      if (loaded) return loaded;
    } catch {
      // Capability detection is intentionally fail-closed.
    }
  }
  return null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "\\u0026")
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e");
}

export function renderGlimpseQuestionnaire(
  questionnaire: Questionnaire,
  round: number,
): string {
  const data = escapeHtml(
    JSON.stringify({
      questionnaire,
      round,
    }),
  );
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light dark">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>xpi-research</title>
<style>
:root { color-scheme: light dark; font: 14px system-ui, sans-serif; }
body { margin: 0; padding: 24px; }
main { max-width: 760px; margin: 0 auto; }
fieldset { border: 0; padding: 0; margin: 0 0 20px; }
legend { font-size: 1.15rem; font-weight: 650; margin-bottom: 12px; }
label, p { display: block; margin: 8px 0; white-space: pre-wrap; }
textarea, input { box-sizing: border-box; width: 100%; padding: 8px; font: inherit; }
button { padding: 8px 14px; margin-right: 8px; }
.preview { opacity: .75; }
</style>
</head>
<body>
<main>
<form id="questionnaire" aria-label="Research questions"></form>
<script type="application/json" id="xpi-research-data">${data}</script>
<script>
(() => {
  const data = JSON.parse(document.getElementById("xpi-research-data").textContent);
  const form = document.getElementById("questionnaire");
  for (const question of data.questionnaire.questions) {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = question.prompt;
    fieldset.append(legend);
    if (question.type === "info") {
      fieldset.setAttribute("aria-label", question.prompt);
    } else if (question.type === "text") {
      const input = document.createElement("textarea");
      input.name = question.id;
      input.required = question.required;
      fieldset.append(input);
    } else {
      for (const option of question.options) {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = question.type === "multi" ? "checkbox" : "radio";
        input.name = question.id;
        input.value = option.label;
        input.required = question.required && question.type === "single";
        label.append(input, document.createTextNode(" " + option.label));
        if (option.description) {
          const description = document.createElement("span");
          description.className = "preview";
          description.textContent = option.description;
          label.append(description);
        }
        if (option.preview) {
          const preview = document.createElement("p");
          preview.className = "preview";
          preview.textContent = option.preview;
          label.append(preview);
        }
        fieldset.append(label);
      }
    }
    form.append(fieldset);
  }
  const actions = document.createElement("p");
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Submit";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => window.parent.postMessage({ round: data.round, cancelled: true, answers: {} }, "*"));
  actions.append(submit, cancel);
  form.append(actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = {};
    for (const question of data.questionnaire.questions) {
      if (question.type === "info") continue;
      const selected = [...form.elements].filter((element) => element.name === question.id && element.checked);
      if (question.type === "multi") answers[question.id] = selected.map((element) => element.value);
      else if (question.type === "single") answers[question.id] = selected[0]?.value;
      else answers[question.id] = form.elements[question.id].value;
    }
    window.parent.postMessage({ round: data.round, cancelled: false, answers }, "*");
  });
})();
</script>
</body>
</html>`;
}

function parsePayload(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return isRecord(raw) ? raw : null;
}

export function parseGlimpseResult(
  raw: unknown,
  questionnaire: Questionnaire,
  round: number,
): QuestionnaireResult | undefined {
  if (raw === undefined || raw === null) return undefined;
  const payload = parsePayload(raw);
  if (!payload || payload.cancelled === true) return undefined;
  if (!isRecord(payload.answers)) return undefined;
  return normalizeAnswers(questionnaire, payload.answers as RawAnswers, round);
}

export async function promptWithGlimpse(
  loader: GlimpseLoader,
  questionnaire: Questionnaire,
  round: number,
): Promise<GlimpsePromptOutcome> {
  let glimpse: GlimpseModule | null;
  try {
    glimpse = await loader();
  } catch {
    return {
      kind: "unavailable",
    };
  }
  if (!glimpse)
    return {
      kind: "unavailable",
    };

  try {
    const raw = await glimpse.prompt(renderGlimpseQuestionnaire(questionnaire, round), {
      height: 600,
      reduceMotion: true,
      theme: "system",
      title: "xpi-research",
      width: 800,
      zoom: true,
    });
    const result = parseGlimpseResult(raw, questionnaire, round);
    return result
      ? {
          kind: "submitted",
          result,
        }
      : {
          kind: "cancelled",
          result: {
            cancelled: true,
            round,
            answers: {},
          },
        };
  } catch {
    return {
      kind: "failed",
    };
  } finally {
    try {
      await glimpse.close?.();
    } catch {
      // Cleanup must not turn a completed prompt into an unhandled error.
    }
  }
}
