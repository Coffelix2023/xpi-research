import type {
  ExtensionContext,
  ExtensionUIContext,
} from "@earendil-works/pi-coding-agent";
import { visibleWidth } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";
import {
  loadGlimpse,
  promptWithGlimpse,
  renderGlimpseQuestionnaire,
} from "./glimpse.ts";
import type { Questionnaire } from "./types.ts";
import { askQuestionnaire } from "./ui.ts";

type CustomFactory = Parameters<ExtensionUIContext["custom"]>[0];
type FakeUI = Pick<ExtensionUIContext, "input" | "notify" | "select"> & {
  custom?: ExtensionUIContext["custom"];
};

function context(
  mode: ExtensionContext["mode"],
  ui: FakeUI,
  hasUI = true,
): ExtensionContext {
  return {
    hasUI,
    mode,
    ui,
  } as ExtensionContext;
}

const quickQuestionnaire: Questionnaire = {
  presentation: "quick",
  questions: [
    {
      id: "choice",
      prompt: "Choose one",
      required: true,
      type: "single",
      options: [
        {
          label: "Alpha",
        },
        {
          label: "Beta",
        },
      ],
    },
    {
      id: "notes",
      prompt: "Add notes",
      required: false,
      type: "text",
    },
  ],
};

const visualMultiQuestionnaire: Questionnaire = {
  presentation: "visual",
  questions: [
    {
      id: "tools",
      prompt: "Choose tools <safe>",
      required: true,
      type: "multi",
      options: [
        {
          description: "First option",
          label: "Alpha",
          preview: "<preview>",
        },
        {
          description: "Second option",
          label: "Beta",
        },
      ],
    },
  ],
};

describe("askQuestionnaire quick presentation", () => {
  it("collects native select and input answers in question order", async () => {
    const calls: Array<{
      kind: string;
      title: string;
      options?: string[];
    }> = [];
    const result = await askQuestionnaire(
      context("tui", {
        input: async (title) => {
          calls.push({
            kind: "input",
            title,
          });
          return "  notes  ";
        },
        notify: () => undefined,
        select: async (title, options) => {
          calls.push({
            kind: "select",
            title,
            options,
          });
          return "Beta";
        },
      }),
      quickQuestionnaire,
      {
        round: 3,
      },
    );

    expect(result).toEqual({
      cancelled: false,
      round: 3,
      answers: {
        choice: "Beta",
        notes: "notes",
      },
    });
    expect(calls).toEqual([
      {
        kind: "select",
        title: "Choose one",
        options: [
          "Alpha",
          "Beta",
        ],
      },
      {
        kind: "input",
        title: "Add notes",
      },
    ]);
  });

  it("returns explicit cancellation when a native dialog is cancelled", async () => {
    const result = await askQuestionnaire(
      context("tui", {
        input: async () => undefined,
        notify: () => undefined,
        select: async () => undefined,
      }),
      quickQuestionnaire,
      {
        round: 4,
      },
    );

    expect(result).toEqual({
      answers: {},
      cancelled: true,
      round: 4,
    });
  });

  it("keeps a required text question available after an empty submission", async () => {
    const inputs = [
      "   ",
      "accepted",
    ];
    let inputCalls = 0;
    const notifications: string[] = [];
    const requiredText: Questionnaire = {
      presentation: "quick",
      questions: [
        {
          id: "notes",
          prompt: "Required notes",
          required: true,
          type: "text",
        },
      ],
    };

    const result = await askQuestionnaire(
      context("tui", {
        input: async () => inputs[inputCalls++],
        notify: (message) => {
          notifications.push(message);
        },
        select: async () => undefined,
      }),
      requiredText,
      {
        round: 5,
      },
    );

    expect(result).toEqual({
      cancelled: false,
      round: 5,
      answers: {
        notes: "accepted",
      },
    });
    expect(inputCalls).toBe(2);
    expect(notifications).toHaveLength(1);
  });
  it("retries only the current required question", async () => {
    const selections = [
      "Beta",
    ];
    const inputs = [
      "   ",
      "accepted",
    ];
    const calls: string[] = [];
    const requiredAfterChoice: Questionnaire = {
      presentation: "quick",
      questions: [
        {
          id: "choice",
          prompt: "Choose one",
          required: true,
          type: "single",
          options: [
            {
              label: "Alpha",
            },
            {
              label: "Beta",
            },
          ],
        },
        {
          id: "notes",
          prompt: "Required notes",
          required: true,
          type: "text",
        },
      ],
    };

    const result = await askQuestionnaire(
      context("tui", {
        input: async (title) => {
          calls.push(title);
          return inputs.shift();
        },
        notify: () => undefined,
        select: async (title) => {
          calls.push(title);
          return selections.shift();
        },
      }),
      requiredAfterChoice,
      {
        round: 13,
      },
    );

    expect(result).toEqual({
      cancelled: false,
      round: 13,
      answers: {
        choice: "Beta",
        notes: "accepted",
      },
    });
    expect(calls).toEqual([
      "Choose one",
      "Required notes",
      "Required notes",
    ]);
  });
});

describe("visual questionnaire fallbacks", () => {
  it("uses one TUI custom component for multi-select and keeps narrow renders bounded", async () => {
    let customCalls = 0;
    const resultPromise = askQuestionnaire(
      context("tui", {
        custom: (async (factory: CustomFactory) => {
          customCalls++;
          let resolveResult: (result: unknown) => void = () => undefined;
          const result = new Promise<unknown>((resolve) => {
            resolveResult = resolve;
          });
          const component = await factory(
            {} as Parameters<CustomFactory>[0],
            {
              fg: (_color: string, text: string) => text,
            } as unknown as Parameters<CustomFactory>[1],
            {} as Parameters<CustomFactory>[2],
            resolveResult as Parameters<CustomFactory>[3],
          );
          for (const line of component.render(20))
            expect(visibleWidth(line)).toBeLessThanOrEqual(20);
          component.handleInput?.("\x1b[B");
          component.handleInput?.(" ");
          component.handleInput?.("\r");
          return result;
        }) as ExtensionUIContext["custom"],
        input: async () => undefined,
        notify: () => undefined,
        select: async () => undefined,
      }),
      visualMultiQuestionnaire,
      {
        round: 6,
        glimpseLoader: async () => null,
      },
    );

    await expect(resultPromise).resolves.toEqual({
      cancelled: false,
      round: 6,
      answers: {
        tools: [
          "Beta",
        ],
      },
    });
    expect(customCalls).toBe(1);
  });

  it("uses RPC primitive dialogs without calling a TUI custom component", async () => {
    const selections = [
      "Alpha",
      "Done selecting",
    ];
    let customCalls = 0;
    const notifications: string[] = [];
    const result = await askQuestionnaire(
      context("rpc", {
        custom: async () => {
          customCalls++;
          throw new Error("TUI custom component must not be used in RPC mode");
        },
        input: async () => undefined,
        notify: (message) => {
          notifications.push(message);
        },
        select: async () => selections.shift(),
      }),
      visualMultiQuestionnaire,
      {
        round: 7,
      },
    );

    expect(result).toEqual({
      cancelled: false,
      round: 7,
      answers: {
        tools: [
          "Alpha",
        ],
      },
    });
    expect(customCalls).toBe(0);
    expect(notifications.join("\n")).toContain("<preview>");
  });

  it("returns explicit cancellation in non-interactive modes", async () => {
    const result = await askQuestionnaire(
      context(
        "json",
        {
          input: async () => undefined,
          notify: () => undefined,
          select: async () => undefined,
        },
        false,
      ),
      visualMultiQuestionnaire,
      {
        round: 8,
      },
    );

    expect(result).toEqual({
      answers: {},
      cancelled: true,
      round: 8,
    });
  });
});

describe("Glimpse adapter", () => {
  it("passes a one-shot JSON-backed prompt, returns answers and always closes", async () => {
    let html = "";
    let closed = 0;
    const outcome = await promptWithGlimpse(
      async () => ({
        close: () => {
          closed++;
        },
        prompt: async (value) => {
          html = value;
          return {
            cancelled: false,
            answers: {
              tools: [
                "Beta",
              ],
            },
          };
        },
      }),
      visualMultiQuestionnaire,
      9,
    );

    expect(outcome).toEqual({
      kind: "submitted",
      result: {
        cancelled: false,
        round: 9,
        answers: {
          tools: [
            "Beta",
          ],
        },
      },
    });
    expect(html).toContain("xpi-research-data");
    expect(html).toContain("cancelled: true, answers: {}");
    expect(closed).toBe(1);
  });

  it("treats a closed prompt as cancellation and still cleans up", async () => {
    let closed = 0;
    const outcome = await promptWithGlimpse(
      async () => ({
        close: () => {
          closed++;
        },
        prompt: async () => undefined,
      }),
      visualMultiQuestionnaire,
      10,
    );

    expect(outcome).toEqual({
      kind: "cancelled",
      result: {
        answers: {},
        cancelled: true,
        round: 10,
      },
    });
    expect(closed).toBe(1);
  });

  it("fails closed when loading fails and keeps markup-like dynamic text literal", async () => {
    await expect(
      loadGlimpse([
        "relative/path.js",
      ]),
    ).resolves.toBeNull();
    const html = renderGlimpseQuestionnaire(
      {
        presentation: "visual",
        questions: [
          {
            id: "q",
            prompt: "</script><script>alert(1)</script>",
            required: false,
            type: "info",
          },
        ],
      },
      11,
    );

    expect(html).not.toContain("</script><script>alert(1)</script>");
    expect(html).toContain("\\u003c/script\\u003e");
  });

  it("reports prompt failure so the caller can use native fallback", async () => {
    const outcome = await promptWithGlimpse(
      async () => ({
        prompt: async () => Promise.reject(new Error("no window")),
      }),
      visualMultiQuestionnaire,
      12,
    );

    expect(outcome).toEqual({
      kind: "failed",
    });
  });
});
