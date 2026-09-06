import type {
  Answers,
  InfoQuestion,
  MultiQuestion,
  PresentationMode,
  Questionnaire,
  QuestionnaireOption,
  QuestionnaireQuestion,
  QuestionnaireResult,
  RawAnswers,
  SingleQuestion,
  TextQuestion,
} from "./types.ts";

const MAX_QUESTIONS = 4;
const MAX_OPTIONS = 8;
const MAX_ID_LENGTH = 64;
const MAX_PROMPT_LENGTH = 1_000;
const MAX_LABEL_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_PREVIEW_LENGTH = 4_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

function requiredString(value: unknown, field: string, maximum: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  if (characterLength(value) > maximum) {
    throw new Error(`${field} exceeds ${maximum} characters`);
  }
  return value;
}

function optionalString(
  record: Record<string, unknown>,
  key: string,
  field: string,
  maximum: number,
): string | undefined {
  if (!Object.hasOwn(record, key)) return undefined;
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string`);
  }
  if (characterLength(value) > maximum) {
    throw new Error(`${field} exceeds ${maximum} characters`);
  }
  return value;
}

function validateOption(value: unknown): QuestionnaireOption {
  if (!isRecord(value)) throw new Error("option must be an object");

  const label = requiredString(value.label, "option.label", MAX_LABEL_LENGTH);
  const description = optionalString(
    value,
    "description",
    "option.description",
    MAX_DESCRIPTION_LENGTH,
  );
  const preview = optionalString(
    value,
    "preview",
    "option.preview",
    MAX_PREVIEW_LENGTH,
  );
  let recommended: boolean | undefined;
  if (Object.hasOwn(value, "recommended")) {
    if (typeof value.recommended !== "boolean") {
      throw new Error("option.recommended must be a boolean");
    }
    recommended = value.recommended;
  }

  const option: QuestionnaireOption = {
    label,
  };
  if (description !== undefined) option.description = description;
  if (preview !== undefined) option.preview = preview;
  if (recommended !== undefined) option.recommended = recommended;
  return option;
}

function validateOptions(value: unknown): QuestionnaireOption[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_OPTIONS) {
    throw new Error("question.options must contain between 1 and 8 options");
  }

  const labels = new Set<string>();
  return value.map((option) => {
    const validated = validateOption(option);
    if (labels.has(validated.label)) throw new Error("duplicate option label");
    labels.add(validated.label);
    return validated;
  });
}

function validateQuestion(value: unknown): QuestionnaireQuestion {
  if (!isRecord(value)) throw new Error("question must be an object");

  const id = requiredString(value.id, "question.id", MAX_ID_LENGTH);
  const prompt = requiredString(value.prompt, "question.prompt", MAX_PROMPT_LENGTH);
  const required = value.required;
  if (typeof required !== "boolean") {
    throw new Error("question.required must be a boolean");
  }

  if (
    value.type !== "single" &&
    value.type !== "multi" &&
    value.type !== "text" &&
    value.type !== "info"
  ) {
    throw new Error("question.type is unsupported");
  }

  if (value.type === "single") {
    const options = validateOptions(value.options);
    const question: SingleQuestion = {
      id,
      prompt,
      required,
      type: "single",
      options,
    };
    return question;
  }
  if (value.type === "multi") {
    const options = validateOptions(value.options);
    const question: MultiQuestion = {
      id,
      prompt,
      required,
      type: "multi",
      options,
    };
    return question;
  }

  if (Object.hasOwn(value, "options")) {
    throw new Error("text and info questions must not declare options");
  }
  if (value.type === "text") {
    const question: TextQuestion = {
      id,
      prompt,
      required,
      type: "text",
    };
    return question;
  }
  const question: InfoQuestion = {
    id,
    prompt,
    required,
    type: "info",
  };
  return question;
}

export function validateQuestionnaire(input: unknown): Questionnaire {
  if (!isRecord(input)) throw new Error("questionnaire must be an object");
  if (input.presentation !== "quick" && input.presentation !== "visual") {
    throw new Error("questionnaire.presentation is unsupported");
  }
  if (
    !Array.isArray(input.questions) ||
    input.questions.length < 1 ||
    input.questions.length > MAX_QUESTIONS
  ) {
    throw new Error("questionnaire.questions must contain between 1 and 4 questions");
  }

  const ids = new Set<string>();
  const questions = input.questions.map((question) => {
    const validated = validateQuestion(question);
    if (ids.has(validated.id)) throw new Error("duplicate question id");
    ids.add(validated.id);
    return validated;
  });

  return {
    presentation: input.presentation,
    questions,
  };
}

export function getEffectivePresentation(
  questionnaire: Questionnaire,
): PresentationMode {
  if (questionnaire.presentation === "visual") return "visual";
  if (
    questionnaire.questions.some(
      (question) =>
        question.type === "multi" ||
        question.type === "info" ||
        (question.type !== "text" &&
          question.options.some(
            (option) => option.preview !== undefined && option.preview.length > 0,
          )),
    )
  ) {
    return "visual";
  }
  return "quick";
}

function answerLabels(question: SingleQuestion | MultiQuestion): Set<string> {
  return new Set(question.options.map((option) => option.label));
}

function invalidAnswer(question: QuestionnaireQuestion): never {
  throw new Error(`invalid answer for question: ${question.id}`);
}

function normalizedAnswer(
  question: QuestionnaireQuestion,
  value: unknown,
): string | string[] | undefined {
  if (question.type === "info") return undefined;

  if (question.type === "single") {
    if (typeof value !== "string" || !answerLabels(question).has(value)) {
      return invalidAnswer(question);
    }
    return value;
  }

  if (question.type === "multi") {
    if (!Array.isArray(value)) return invalidAnswer(question);
    const labels = answerLabels(question);
    if (value.some((item) => typeof item !== "string" || !labels.has(item))) {
      return invalidAnswer(question);
    }
    const selected = new Set(value);
    const ordered = question.options
      .map((option) => option.label)
      .filter((label) => selected.has(label));
    return ordered.length > 0 ? ordered : undefined;
  }

  if (typeof value !== "string") return invalidAnswer(question);
  const text = value.trim();
  if (text.length === 0) return undefined;
  if (characterLength(text) > 2_000) throw new Error("answer exceeds 2000 characters");
  return text;
}

function ensureResultSize(result: QuestionnaireResult): QuestionnaireResult {
  const bytes = Buffer.byteLength(JSON.stringify(result), "utf8");
  if (bytes > 8 * 1024) throw new Error("questionnaire result exceeds 8 KiB");
  return result;
}

export function normalizeAnswers(
  questionnaire: Questionnaire,
  rawAnswers: RawAnswers,
  round: number,
): QuestionnaireResult {
  const answers: Answers = {};
  for (const question of questionnaire.questions) {
    if (!Object.hasOwn(rawAnswers, question.id)) {
      if (question.required) {
        throw new Error(`required question has no valid answer: ${question.id}`);
      }
      continue;
    }

    const answer = normalizedAnswer(question, rawAnswers[question.id]);
    if (answer === undefined) {
      if (question.required) {
        throw new Error(`required question has no valid answer: ${question.id}`);
      }
      continue;
    }
    answers[question.id] = answer;
  }
  return ensureResultSize({
    cancelled: false,
    round,
    answers,
  });
}

export function cancelledResult(round: number): QuestionnaireResult {
  return {
    cancelled: true,
    round,
    answers: {},
  };
}

export function serializeQuestionnaireResult(result: QuestionnaireResult): string {
  return JSON.stringify(ensureResultSize(result));
}
