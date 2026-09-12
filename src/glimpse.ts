import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
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

const GLIMPSE_QUIET_DIR = path.join(tmpdir(), "xpi-research-glimpse");

/**
 * `glimpseui` spawns its native window host with `stdio: ['pipe','pipe','inherit']`,
 * so the host's stderr lands on Pi's own stderr — the very channel the TUI owns. On
 * macOS InputMethodKit writes there ("error messaging the mach port for
 * IMKCFRunLoopWakeUpReliable") and that text paints over the user's editor.
 *
 * macOS only on purpose: the same override flips glimpseui's `supportsOpenLinks`
 * flag, which is only honest for the macOS host.
 */
export function buildGlimpseWrapper(realBinary: string, logPath: string): string {
  return `#!/bin/sh\nexec "${realBinary}" "$@" 2>"${logPath}"\n`;
}

/**
 * Returns the wrapper path, or null when the launch must be left alone: another
 * platform, a caller who declared its own host, or a module with no native binary
 * beside it (the Linux/Chromium backend spawns Node instead).
 *
 * A module beside `glimpse` is what this extension loads, so the sibling binary is
 * the one glimpseui itself would spawn.
 */
export function quietGlimpseBinary(modulePath: string | undefined): string | null {
  if (process.platform !== "darwin") return null;
  if (process.env.GLIMPSE_BINARY_PATH || process.env.GLIMPSE_HOST_PATH) return null;
  if (!modulePath || !path.isAbsolute(modulePath)) return null;
  const binary = path.join(path.dirname(modulePath), "glimpse");
  if (!existsSync(binary)) return null;
  try {
    mkdirSync(GLIMPSE_QUIET_DIR, {
      recursive: true,
    });
    const wrapper = path.join(GLIMPSE_QUIET_DIR, "glimpse-quiet");
    // One log per launch, overwritten: the diagnostic is worth keeping, an
    // unbounded log is not.
    writeFileSync(
      wrapper,
      buildGlimpseWrapper(binary, path.join(GLIMPSE_QUIET_DIR, "glimpse-stderr.log")),
    );
    chmodSync(wrapper, 0o755);
    return wrapper;
  } catch {
    // A wrapper that cannot be written must never block the panel: keep the raw host.
    return null;
  }
}

/**
 * The override lives only while the window is being started: every later launch and
 * every other extension keeps the environment it had. glimpseui's `ensureBinary()`
 * re-reads `GLIMPSE_BINARY_PATH` on each launch, so a call-scoped override suffices.
 *
 * Only `prompt` is wrapped because it is the sole entry this extension uses; wrap
 * `open` too if it ever becomes a caller.
 */
export function wrapGlimpseBinary(
  module: GlimpseModule,
  wrapper: string | null,
): GlimpseModule {
  if (!wrapper) return module;
  return {
    ...module,
    prompt(html: string, options?: GlimpsePromptOptions) {
      const previous = process.env.GLIMPSE_BINARY_PATH;
      process.env.GLIMPSE_BINARY_PATH = wrapper;
      try {
        return module.prompt(html, options);
      } finally {
        if (previous === undefined) delete process.env.GLIMPSE_BINARY_PATH;
        else process.env.GLIMPSE_BINARY_PATH = previous;
      }
    },
  };
}

/**
 * A candidate that exists but cannot load is real breakage worth keeping, but not on
 * stderr: this process's stderr belongs to the TUI, so warning there paints over the
 * user's editor. Diagnostics never break fail-closed, hence the swallowed write error.
 */
function recordLoadFailure(candidate: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  try {
    mkdirSync(GLIMPSE_QUIET_DIR, {
      recursive: true,
    });
    appendFileSync(
      path.join(GLIMPSE_QUIET_DIR, "glimpse-load-error.log"),
      `${new Date().toISOString()} ${candidate} ${message}\n`,
    );
  } catch {
    // Ignored on purpose: callers still fall back to the TUI.
  }
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
      if (loaded) return wrapGlimpseBinary(loaded, quietGlimpseBinary(candidate));
    } catch (error) {
      // A candidate that exists but cannot load is real breakage: record it, and never
      // on stderr — this process's stderr belongs to the TUI.
      recordLoadFailure(candidate, error);
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
