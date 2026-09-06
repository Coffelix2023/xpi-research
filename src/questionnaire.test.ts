import { describe, expect, it } from "vitest";
import {
  cancelledResult,
  getEffectivePresentation,
  normalizeAnswers,
  serializeQuestionnaireResult,
  validateQuestionnaire,
} from "./questionnaire.ts";
import type {
  InfoQuestion,
  MultiQuestion,
  Questionnaire,
  QuestionnaireOption,
  SingleQuestion,
  TextQuestion,
} from "./types.ts";

const option = (label = "Option"): QuestionnaireOption => ({
  label,
});
const singleQuestion = (id = "choice"): SingleQuestion => ({
  id,
  prompt: "Choose one",
  required: true,
  type: "single",
  options: [
    option(),
  ],
});
const textQuestion = (id = "notes"): TextQuestion => ({
  id,
  prompt: "Add notes",
  required: false,
  type: "text",
});
const validQuestionnaire = (): Questionnaire => ({
  presentation: "quick",
  questions: [
    singleQuestion(),
    textQuestion(),
  ],
});

function expectInvalid(input: unknown, message: string): void {
  expect(() => validateQuestionnaire(input)).toThrow(message);
}

describe("validateQuestionnaire", () => {
  it("accepts bounded input and preserves question order", () => {
    const input = validQuestionnaire();

    expect(validateQuestionnaire(input)).toEqual(input);
  });

  it("rejects missing required fields", () => {
    expectInvalid(
      {
        presentation: "quick",
      },
      "questionnaire.questions",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            prompt: "Choose",
          },
        ],
      },
      "question.id",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            id: "choice",
            required: true,
          },
        ],
      },
      "question.prompt",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            id: "choice",
            prompt: "Choose",
            type: "single",
          },
        ],
      },
      "question.required",
    );
  });

  it("rejects duplicate question ids and option labels", () => {
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          singleQuestion("same"),
          textQuestion("same"),
        ],
      },
      "duplicate question id",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            ...singleQuestion(),
            options: [
              option("same"),
              option("same"),
            ],
          },
        ],
      },
      "duplicate option label",
    );
  });

  it("rejects unsupported types and invalid option declarations", () => {
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            id: "unknown",
            prompt: "Unknown",
            required: true,
            type: "date",
          },
        ],
      },
      "question.type",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            ...textQuestion(),
            options: [
              option(),
            ],
          },
        ],
      },
      "must not declare options",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            id: "info",
            options: [],
            prompt: "Read",
            required: false,
            type: "info",
          },
        ],
      },
      "must not declare options",
    );
  });

  it("enforces question and option count bounds", () => {
    expectInvalid(
      {
        presentation: "quick",
        questions: Array.from(
          {
            length: 5,
          },
          (_, index) => textQuestion(`q${index}`),
        ),
      },
      "between 1 and 4 questions",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            ...singleQuestion(),
            options: Array.from(
              {
                length: 9,
              },
              (_, index) => option(`o${index}`),
            ),
          },
        ],
      },
      "between 1 and 8 options",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            ...singleQuestion(),
            options: [],
          },
        ],
      },
      "between 1 and 8 options",
    );
  });

  it("enforces text and preview limits", () => {
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          textQuestion("x".repeat(65)),
        ],
      },
      "question.id",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            ...textQuestion(),
            prompt: "x".repeat(1001),
          },
        ],
      },
      "question.prompt",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            ...singleQuestion(),
            options: [
              {
                label: "x".repeat(161),
              },
            ],
          },
        ],
      },
      "option.label",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            ...singleQuestion(),
            options: [
              {
                description: "x".repeat(501),
                label: "ok",
              },
            ],
          },
        ],
      },
      "option.description",
    );
    expectInvalid(
      {
        presentation: "quick",
        questions: [
          {
            ...singleQuestion(),
            options: [
              {
                label: "ok",
                preview: "x".repeat(4001),
              },
            ],
          },
        ],
      },
      "option.preview",
    );
  });
  it("upgrades rich questionnaires to visual and keeps simple ones quick", () => {
    const multi: MultiQuestion = {
      ...singleQuestion(),
      type: "multi",
    };
    const preview: SingleQuestion = {
      ...singleQuestion(),
      options: [
        {
          label: "ok",
          preview: "details",
        },
      ],
    };
    const info: InfoQuestion = {
      id: "info",
      prompt: "Read",
      required: false,
      type: "info",
    };

    expect(getEffectivePresentation(validQuestionnaire())).toBe("quick");
    expect(
      getEffectivePresentation({
        presentation: "quick",
        questions: [
          multi,
        ],
      }),
    ).toBe("visual");
    expect(
      getEffectivePresentation({
        presentation: "quick",
        questions: [
          preview,
        ],
      }),
    ).toBe("visual");
    expect(
      getEffectivePresentation({
        presentation: "quick",
        questions: [
          info,
        ],
      }),
    ).toBe("visual");
    expect(
      getEffectivePresentation({
        presentation: "visual",
        questions: [
          textQuestion(),
        ],
      }),
    ).toBe("visual");
  });
  it("normalizes single and trimmed text answers with the current round", () => {
    const input = validateQuestionnaire({
      presentation: "quick",
      questions: [
        singleQuestion("choice"),
        textQuestion("notes"),
      ],
    });

    expect(
      normalizeAnswers(
        input,
        {
          choice: "Option",
          notes: "  keep this  ",
        },
        7,
      ),
    ).toEqual({
      cancelled: false,
      round: 7,
      answers: {
        choice: "Option",
        notes: "keep this",
      },
    });
  });

  it("orders and deduplicates multi-select labels by question definition", () => {
    const input = validateQuestionnaire({
      presentation: "visual",
      questions: [
        {
          id: "tools",
          prompt: "Choose tools",
          required: true,
          type: "multi",
          options: [
            option("first"),
            option("second"),
            option("third"),
          ],
        },
      ],
    });

    expect(
      normalizeAnswers(
        input,
        {
          tools: [
            "third",
            "first",
            "third",
          ],
        },
        2,
      ).answers,
    ).toEqual({
      tools: [
        "first",
        "third",
      ],
    });
  });

  it("rejects missing required answers and omits unanswered optional questions", () => {
    const input = validateQuestionnaire({
      presentation: "quick",
      questions: [
        singleQuestion("required"),
        textQuestion("optional"),
      ],
    });

    expect(() => normalizeAnswers(input, {}, 1)).toThrow("required question");
    expect(
      normalizeAnswers(
        input,
        {
          optional: "   ",
          required: "Option",
        },
        1,
      ).answers,
    ).toEqual({
      required: "Option",
    });
  });

  it("returns explicit cancellation without partial answers", () => {
    expect(cancelledResult(9)).toEqual({
      answers: {},
      cancelled: true,
      round: 9,
    });
    expect(serializeQuestionnaireResult(cancelledResult(9))).toBe(
      '{"cancelled":true,"round":9,"answers":{}}',
    );
  });

  it("enforces the text answer and serialized result limits", () => {
    const input = validateQuestionnaire({
      presentation: "quick",
      questions: [
        textQuestion("notes"),
      ],
    });

    expect(() =>
      normalizeAnswers(
        input,
        {
          notes: "x".repeat(2001),
        },
        1,
      ),
    ).toThrow("answer exceeds 2000");
    expect(() =>
      serializeQuestionnaireResult({
        cancelled: false,
        round: 1,
        answers: {
          notes: "x".repeat(8_200),
        },
      }),
    ).toThrow("8 KiB");
  });
  it("rejects invalid supplied answers instead of treating them as optional omissions", () => {
    const optional = validateQuestionnaire({
      presentation: "quick",
      questions: [
        textQuestion("optional"),
      ],
    });
    const multi = validateQuestionnaire({
      presentation: "visual",
      questions: [
        {
          id: "tools",
          prompt: "Choose tools",
          required: false,
          type: "multi",
          options: [
            option("first"),
            option("second"),
          ],
        },
      ],
    });

    expect(() =>
      normalizeAnswers(
        optional,
        {
          optional: 42,
        },
        1,
      ),
    ).toThrow("invalid answer");
    expect(() =>
      normalizeAnswers(
        multi,
        {
          tools: [
            "unknown",
          ],
        },
        1,
      ),
    ).toThrow("invalid answer");
  });
});
