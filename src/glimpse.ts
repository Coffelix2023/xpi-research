import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { renderGlimpseQuestionnaire } from "./glimpse-panel.ts";
import { normalizeAnswers } from "./questionnaire.ts";
import type { Questionnaire, QuestionnaireResult, RawAnswers } from "./types.ts";

/**
 * Options the extension actually passes. `glimpseui`'s `open()` maps width,
 * height and title onto its host; theme, reduce-motion and zoom are not part of
 * that option surface, so the panel decides them itself.
 */
export interface GlimpsePromptOptions {
  height?: number;
  title?: string;
  width?: number;
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
    path.resolve(process.cwd(), "node_modules/glimpseui/src/glimpse.mjs"),
    ...(home
      ? [
          path.resolve(home, ".pi/agent/npm/node_modules/glimpseui/src/glimpse.mjs"),
        ]
      : []),
  ];
}

export async function loadGlimpse(
  paths = candidatePaths(),
): Promise<GlimpseModule | null> {
  for (const candidate of paths) {
    if (!path.isAbsolute(candidate)) continue;
    // Not installed at this location is not a broken path: skip it without noise.
    if (!existsSync(candidate)) continue;
    try {
      // biome-ignore lint/performance/noAwaitInLoops: Glimpse candidates must be tried in order.
      const moduleValue: unknown = await import(pathToFileURL(candidate).href);
      const moduleRecord = isRecord(moduleValue) ? moduleValue : undefined;
      const loaded =
        asGlimpseModule(moduleRecord?.default) ?? asGlimpseModule(moduleValue);
      if (loaded) return loaded;
    } catch (error) {
      // The candidate exists but cannot load, which is a real breakage worth surfacing.
      console.warn(
        `[glimpse] failed to load candidate ${candidate}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return null;
}

export { renderGlimpseQuestionnaire };

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
  return normalizeAnswers(
    questionnaire,
    payload.answers as RawAnswers,
    round,
    payload.feedback,
  );
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
      title: "xpi-research",
      width: 800,
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
