export type PresentationMode = "quick" | "visual";
export type QuestionType = "single" | "multi" | "text" | "info";

export interface QuestionnaireOption {
  description?: string;
  label: string;
  preview?: string;
  recommended?: boolean;
}

interface BaseQuestion {
  id: string;
  prompt: string;
  required: boolean;
}

export interface SingleQuestion extends BaseQuestion {
  options: QuestionnaireOption[];
  type: "single";
}

export interface MultiQuestion extends BaseQuestion {
  options: QuestionnaireOption[];
  type: "multi";
}

export interface TextQuestion extends BaseQuestion {
  type: "text";
}

export interface InfoQuestion extends BaseQuestion {
  type: "info";
}

export type QuestionnaireQuestion =
  | SingleQuestion
  | MultiQuestion
  | TextQuestion
  | InfoQuestion;

export interface Questionnaire {
  presentation: PresentationMode;
  questions: QuestionnaireQuestion[];
}

export type QuestionnaireInput = Questionnaire;
export type Answer = string | string[];
export type Answers = Record<string, Answer>;
export type RawAnswers = Record<string, unknown>;

export interface QuestionnaireResult {
  answers: Answers;
  cancelled: boolean;
  round: number;
}

export interface ResearchSession {
  activeToolNames: string[];
  cleaned: boolean;
  round: number;
  status: "active" | "settled";
  target: string;
}
