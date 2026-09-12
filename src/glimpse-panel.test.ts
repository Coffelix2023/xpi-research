import { describe, expect, it } from "vitest";
import { parseGlimpseResult } from "./glimpse.ts";
import {
  GLIMPSE_PANEL_CSS,
  GLIMPSE_PANEL_SCRIPT,
  GLIMPSE_PANEL_TEXT,
  renderGlimpseQuestionnaire,
} from "./glimpse-panel.ts";
import type { Questionnaire } from "./types.ts";

const questionnaire: Questionnaire = {
  presentation: "visual",
  questions: [
    {
      id: "pick",
      prompt: "Pick one option",
      required: true,
      type: "single",
      options: [
        {
          description: "the first one",
          label: "A",
          recommended: true,
        },
        {
          label: "B",
          preview: "line1\nline2",
        },
      ],
    },
    {
      id: "note",
      prompt: "Read this note",
      required: false,
      type: "info",
    },
    {
      id: "free",
      prompt: "Free text",
      required: false,
      type: "text",
    },
    {
      id: "many",
      prompt: "Pick many options",
      required: true,
      type: "multi",
      options: [
        {
          label: "X",
        },
        {
          label: "Y",
        },
      ],
    },
  ],
};

const DATA_BLOCK =
  /<script type="application\/json" id="xpi-research-data">([\s\S]*?)<\/script>/;

function dataBlock(html: string): unknown {
  const match = DATA_BLOCK.exec(html);
  if (!match) throw new Error("questionnaire data block is missing");
  return JSON.parse(match[1]);
}

function executableScript(html: string): string {
  const index = html.indexOf("<script>");
  if (index < 0) throw new Error("panel script block is missing");
  return html.slice(index);
}

const SANS_FALLBACK = /sans-serif$/;
const MONO_FALLBACK = /monospace$/;

function declarations(css: string, selector: string): Record<string, string> {
  const match = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(css);
  if (!match) throw new Error(`missing token block: ${selector}`);
  const tokens: Record<string, string> = {};
  for (const entry of match[1].split(";")) {
    const separator = entry.indexOf(":");
    if (separator < 0) continue;
    const name = entry.slice(0, separator).trim();
    if (name.startsWith("--")) tokens[name] = entry.slice(separator + 1).trim();
  }
  return tokens;
}
describe("renderGlimpseQuestionnaire", () => {
  it("embeds the questionnaire as parseable non-executable json", () => {
    const html = renderGlimpseQuestionnaire(questionnaire, 5);

    expect(dataBlock(html)).toEqual({
      questionnaire,
      round: 5,
    });
  });

  it("keeps agent content out of the executable panel script", () => {
    const html = renderGlimpseQuestionnaire(questionnaire, 5);

    expect(GLIMPSE_PANEL_SCRIPT).toContain("xpi-research-data");
    expect(executableScript(html)).not.toContain("Pick many options");
    expect(executableScript(html)).not.toContain("Read this note");
  });

  it("renders agent content as literal text instead of markup", () => {
    const hostile: Questionnaire = {
      presentation: "visual",
      questions: [
        {
          id: "q",
          prompt: "</script><script>alert(1)</script>",
          required: false,
          type: "info",
        },
      ],
    };

    const html = renderGlimpseQuestionnaire(hostile, 6);

    expect(html).not.toContain("</script><script>alert(1)</script>");
    expect(html).toContain("\\u003c/script\\u003e");
  });
});

describe("panel tokens", () => {
  const light = declarations(GLIMPSE_PANEL_CSS, ":root");
  const dark = declarations(GLIMPSE_PANEL_CSS, '\\[data-theme="dark"\\]');

  it("ships a light and a dark token set", () => {
    expect(Object.keys(light).length).toBeGreaterThan(10);
    expect(dark["--primary"]).toBeTruthy();
    expect(dark["--primary"]).not.toBe(light["--primary"]);
  });

  it("only overrides known tokens in the dark set", () => {
    for (const name of Object.keys(dark)) {
      expect(light, `dark token ${name} has no light counterpart`).toHaveProperty(name);
    }
  });

  it("keeps font stacks falling back to a generic family", () => {
    expect(light["--font-sans"]).toMatch(SANS_FALLBACK);
    expect(light["--font-mono"]).toMatch(MONO_FALLBACK);
    expect(light["--radius-md"]).toContain("var(--radius)");
  });

  it("uses tokens instead of color literals", () => {
    expect(GLIMPSE_PANEL_CSS).not.toContain("#");
    expect(GLIMPSE_PANEL_CSS).not.toContain("rgb(");
    const dotRule = GLIMPSE_PANEL_CSS.slice(GLIMPSE_PANEL_CSS.indexOf(".gd-dot {"));
    expect(dotRule).toContain("background: var(--muted)");
    expect(dotRule).toContain("border: 1px solid var(--border)");
  });
});

describe("panel text dictionary", () => {
  it("declares the same keys in both locales", () => {
    const zh = Object.keys(GLIMPSE_PANEL_TEXT.zh).sort();
    const en = Object.keys(GLIMPSE_PANEL_TEXT.en).sort();
    expect(en).toEqual(zh);
    expect(zh.length).toBeGreaterThan(20);
  });

  it("is the only source of interface copy in the panel script", () => {
    const script = GLIMPSE_PANEL_SCRIPT.replace(JSON.stringify(GLIMPSE_PANEL_TEXT), "");
    expect(script).toContain("function t(key, vars)");
    for (const copy of [
      GLIMPSE_PANEL_TEXT.en.cancel,
      GLIMPSE_PANEL_TEXT.en.submit,
      GLIMPSE_PANEL_TEXT.zh.next,
      GLIMPSE_PANEL_TEXT.zh.prev,
    ]) {
      expect(script).not.toContain(`"${copy}"`);
    }
  });
});

describe("panel navigation shell", () => {
  it("renders the step bar and footer controls", () => {
    const html = renderGlimpseQuestionnaire(questionnaire, 5);

    for (const id of [
      "step-count",
      "dots",
      "step-meta",
      "track-fill",
      "hints",
      "b-prev",
      "b-cancel",
      "b-submit",
      "t-lang",
      "t-variant",
      "t-theme",
      "t-zoom-in",
      "t-zoom-out",
      "t-zoom-reset",
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
  });

  it("wires the documented keyboard shortcuts", () => {
    expect(GLIMPSE_PANEL_SCRIPT).toContain('event.key === "Escape"');
    expect(GLIMPSE_PANEL_SCRIPT).toContain('event.key === "Enter"');
    expect(GLIMPSE_PANEL_SCRIPT).toContain("event.metaKey || event.ctrlKey");
    expect(GLIMPSE_PANEL_SCRIPT).toContain('getElementById("b-submit")');
    expect(GLIMPSE_PANEL_SCRIPT).toContain('getElementById("dots")');
  });

  it("submits through the glimpse bridge instead of page messaging", () => {
    expect(GLIMPSE_PANEL_SCRIPT).toContain("window.glimpse");
    expect(GLIMPSE_PANEL_SCRIPT).toContain("bridge.send(payload)");
    expect(GLIMPSE_PANEL_SCRIPT).not.toContain("postMessage(");
    expect(GLIMPSE_PANEL_SCRIPT).toContain("bridgeMissing");
  });

  it("keeps zoom on the content pane so the chrome stays fixed", () => {
    expect(GLIMPSE_PANEL_SCRIPT).toContain('setProperty("--zoom"');
    expect(GLIMPSE_PANEL_SCRIPT).not.toContain("document.body.style.zoom");
    expect(GLIMPSE_PANEL_CSS).toContain("zoom: var(--zoom, 1)");
  });

  it("renders a custom entry and a review step", () => {
    expect(GLIMPSE_PANEL_SCRIPT).toContain('"opt is-custom"');
    expect(GLIMPSE_PANEL_SCRIPT).toContain('"custom-wrap"');
    expect(GLIMPSE_PANEL_SCRIPT).toContain('"q q-review"');
    expect(GLIMPSE_PANEL_SCRIPT).toContain('"review-feedback"');
    expect(GLIMPSE_PANEL_CSS).toContain(
      ".opt.is-custom:has(input:checked) + .custom-wrap",
    );
  });

  it("ends the stepped flow on the review step instead of submitting", () => {
    expect(GLIMPSE_PANEL_SCRIPT).toContain("if (state.page >= REVIEW_INDEX) {");
    expect(GLIMPSE_PANEL_SCRIPT).not.toContain("const last =");
    expect(GLIMPSE_PANEL_SCRIPT).not.toContain("state.page >= QUESTIONS.length - 1");
  });

  it("prefers system appearance and honours motion and contrast preferences", () => {
    expect(GLIMPSE_PANEL_SCRIPT).toContain("prefers-color-scheme: dark");
    expect(GLIMPSE_PANEL_SCRIPT).toContain("prefers-reduced-motion: reduce");
    expect(GLIMPSE_PANEL_SCRIPT).toContain("prefers-contrast: more");
    expect(GLIMPSE_PANEL_CSS).toContain('[data-reduce-motion="true"]');
    expect(GLIMPSE_PANEL_CSS).toContain('[data-contrast="true"]');
  });

  it("accepts the payload shape the panel emits", () => {
    const payload = {
      cancelled: false,
      feedback: "please shorten the option labels",
      round: 5,
      answers: {
        pick: "written by hand",
        many: [
          "X",
          "extra request",
        ],
      },
    };

    expect(parseGlimpseResult(payload, questionnaire, 5)).toEqual(payload);
  });

  it("accepts a payload without review feedback", () => {
    const result = parseGlimpseResult(
      {
        cancelled: false,
        round: 8,
        answers: {
          pick: "A",
          many: [
            "Y",
          ],
        },
      },
      questionnaire,
      8,
    );

    expect(result?.answers).toEqual({
      pick: "A",
      many: [
        "Y",
      ],
    });
    expect(result).not.toHaveProperty("feedback");
  });

  it("reports cancellation as no payload", () => {
    expect(
      parseGlimpseResult(
        {
          answers: {},
          cancelled: true,
          round: 2,
        },
        questionnaire,
        2,
      ),
    ).toBeUndefined();
  });
});
