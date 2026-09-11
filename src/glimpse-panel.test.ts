import { describe, expect, it } from "vitest";
import { GLIMPSE_PANEL_SCRIPT, renderGlimpseQuestionnaire } from "./glimpse-panel.ts";
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
