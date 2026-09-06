import type { ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import {
  Input,
  Key,
  matchesKey,
  truncateToWidth,
  visibleWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";
import { type GlimpseLoader, loadGlimpse, promptWithGlimpse } from "./glimpse.ts";
import {
  cancelledResult,
  getEffectivePresentation,
  normalizeAnswers,
  validateQuestionnaire,
} from "./questionnaire.ts";
import type {
  MultiQuestion,
  Questionnaire,
  QuestionnaireQuestion,
  QuestionnaireResult,
  RawAnswers,
  SingleQuestion,
} from "./types.ts";

export interface AskQuestionnaireOptions {
  glimpseLoader?: GlimpseLoader;
  round?: number;
}

function optionLabels(question: SingleQuestion | MultiQuestion): string[] {
  return question.options.map((option) => option.label);
}

function notifyOptionDetails(
  ctx: ExtensionContext,
  question: SingleQuestion | MultiQuestion,
): void {
  const details = question.options.flatMap((option) => {
    const lines = [
      `- ${option.label}`,
    ];
    if (option.description) lines.push(`  ${option.description}`);
    if (option.preview) lines.push(`  ${option.preview}`);
    return lines;
  });
  if (details.length > 0)
    ctx.ui.notify(`${question.prompt}\n${details.join("\n")}`, "info");
}

async function askQuick(
  ctx: ExtensionContext,
  questionnaire: Questionnaire,
  round: number,
): Promise<QuestionnaireResult> {
  const rawAnswers: RawAnswers = {};
  for (const question of questionnaire.questions) {
    if (question.type === "info") continue;
    if (question.type === "single") {
      while (true) {
        // biome-ignore lint/performance/noAwaitInLoops: questionnaire dialogs must remain sequential.
        const answer = await ctx.ui.select(question.prompt, optionLabels(question));
        if (answer === undefined) return cancelledResult(round);
        if (question.options.some((option) => option.label === answer)) {
          rawAnswers[question.id] = answer;
          break;
        }
        ctx.ui.notify(
          "The selected option is not valid. Please choose again.",
          "warning",
        );
      }
      continue;
    }
    while (true) {
      // biome-ignore lint/performance/noAwaitInLoops: questionnaire dialogs must remain sequential.
      const answer = await ctx.ui.input(
        question.prompt,
        question.required ? "Required" : "Optional",
      );
      if (answer === undefined) return cancelledResult(round);
      if (question.required && answer.trim().length === 0) {
        ctx.ui.notify("A response is required. Please try again.", "warning");
        continue;
      }
      if (answer.trim().length > 0) rawAnswers[question.id] = answer;
      break;
    }
  }
  try {
    return normalizeAnswers(questionnaire, rawAnswers, round);
  } catch {
    ctx.ui.notify("A required response is missing. Please try again.", "warning");
    return cancelledResult(round);
  }
}

async function askRpc(
  ctx: ExtensionContext,
  questionnaire: Questionnaire,
  round: number,
): Promise<QuestionnaireResult> {
  const rawAnswers: RawAnswers = {};
  for (const question of questionnaire.questions) {
    if (question.type === "info") {
      ctx.ui.notify(question.prompt, "info");
      continue;
    }
    if (question.type === "text") {
      while (true) {
        // biome-ignore lint/performance/noAwaitInLoops: questionnaire dialogs must remain sequential.
        const answer = await ctx.ui.input(
          question.prompt,
          question.required ? "Required" : "Optional",
        );
        if (answer === undefined) return cancelledResult(round);
        if (question.required && answer.trim().length === 0) {
          ctx.ui.notify("A response is required. Please try again.", "warning");
          continue;
        }
        if (answer.trim().length > 0) rawAnswers[question.id] = answer;
        break;
      }
      continue;
    }
    notifyOptionDetails(ctx, question);
    if (question.type === "single") {
      while (true) {
        // biome-ignore lint/performance/noAwaitInLoops: questionnaire dialogs must remain sequential.
        const answer = await ctx.ui.select(question.prompt, optionLabels(question));
        if (answer === undefined) return cancelledResult(round);
        if (question.options.some((option) => option.label === answer)) {
          rawAnswers[question.id] = answer;
          break;
        }
        ctx.ui.notify(
          "The selected option is not valid. Please choose again.",
          "warning",
        );
      }
      continue;
    }
    const doneLabel = "Done selecting";
    const selected: string[] = [];
    while (true) {
      // biome-ignore lint/performance/noAwaitInLoops: multi-select dialogs must remain sequential.
      const answer = await ctx.ui.select(`${question.prompt} (choose again to add)`, [
        ...optionLabels(question),
        doneLabel,
      ]);
      if (answer === undefined) return cancelledResult(round);
      if (answer === doneLabel) {
        if (question.required && selected.length === 0) {
          ctx.ui.notify("Select at least one option before continuing.", "warning");
          continue;
        }
        if (selected.length > 0) rawAnswers[question.id] = selected;
        break;
      }
      if (
        question.options.some((option) => option.label === answer) &&
        !selected.includes(answer)
      ) {
        selected.push(answer);
      }
    }
  }
  try {
    return normalizeAnswers(questionnaire, rawAnswers, round);
  } catch {
    ctx.ui.notify("A required response is missing. Please try again.", "warning");
    return cancelledResult(round);
  }
}

class QuestionnaireComponent {
  private currentIndex = 0;
  private input: Input | undefined;
  private inputMode = false;
  private readonly rawAnswers: RawAnswers = {};
  private selectedIndex = 0;
  private readonly selectedMulti = new Set<string>();
  private error = "";
  private cachedWidth: number | undefined;
  private cachedLines: string[] | undefined;

  constructor(
    private readonly questionnaire: Questionnaire,
    private readonly round: number,
    private readonly theme: Theme,
    private readonly done: (result: QuestionnaireResult) => void,
  ) {}

  handleInput(data: string): void {
    const question = this.currentQuestion();
    if (!question) return;

    if (this.inputMode && this.input) {
      if (matchesKey(data, Key.escape)) {
        this.done(cancelledResult(this.round));
        return;
      }
      this.input.handleInput(data);
      this.invalidate();
      return;
    }

    if (matchesKey(data, Key.escape)) {
      this.done(cancelledResult(this.round));
      return;
    }
    if (question.type === "info") {
      if (matchesKey(data, Key.enter)) this.advance();
      return;
    }
    const options = question.type === "text" ? [] : question.options;
    if (matchesKey(data, Key.up)) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.invalidate();
      return;
    }
    if (matchesKey(data, Key.down)) {
      this.selectedIndex = Math.min(
        Math.max(0, options.length - 1),
        this.selectedIndex + 1,
      );
      this.invalidate();
      return;
    }
    if (question.type === "multi" && matchesKey(data, Key.space)) {
      const label = question.options[this.selectedIndex]?.label;
      if (label) {
        if (this.selectedMulti.has(label)) this.selectedMulti.delete(label);
        else this.selectedMulti.add(label);
      }
      this.invalidate();
      return;
    }
    if (matchesKey(data, Key.enter)) {
      if (question.type === "text") this.startTextInput(question);
      else if (question.type === "single")
        this.rawAnswers[question.id] = question.options[this.selectedIndex]?.label;
      else
        this.rawAnswers[question.id] = [
          ...this.selectedMulti,
        ];
      if (question.type !== "text") this.advance();
    }
  }

  invalidate(): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
  }

  render(width: number): string[] {
    if (this.cachedLines && this.cachedWidth === width) return this.cachedLines;
    const renderWidth = Math.max(1, width);
    const lines: string[] = [
      truncateToWidth("─".repeat(renderWidth), renderWidth),
    ];
    const question = this.currentQuestion();
    if (!question) return lines;

    const addWrapped = (text: string, prefix = ""): void => {
      const available = Math.max(1, renderWidth - visibleWidth(prefix));
      const wrapped = wrapTextWithAnsi(text, available);
      for (let index = 0; index < wrapped.length; index++) {
        lines.push(
          truncateToWidth(
            `${index === 0 ? prefix : " ".repeat(visibleWidth(prefix))}${wrapped[index]}`,
            renderWidth,
          ),
        );
      }
    };

    addWrapped(question.prompt, "  ");
    lines.push("");
    if (question.type === "info") {
      lines.push(this.theme.fg("muted", "Press Enter to continue"));
    } else if (question.type === "text") {
      if (this.inputMode && this.input) {
        lines.push(
          ...this.input
            .render(Math.max(1, renderWidth - 2))
            .map((line) => truncateToWidth(`  ${line}`, renderWidth)),
        );
      } else {
        lines.push(this.theme.fg("dim", "Press Enter to edit"));
      }
    } else {
      question.options.forEach((option, index) => {
        const focused = index === this.selectedIndex;
        const checked =
          question.type === "multi" && this.selectedMulti.has(option.label);
        const prefix = focused ? "> " : "  ";
        const mark = question.type === "multi" ? `[${checked ? "x" : " "}] ` : "";
        addWrapped(`${mark}${option.label}`, prefix);
        if (option.description) addWrapped(option.description, "     ");
        if (option.preview) addWrapped(option.preview, "     ");
      });
      lines.push(
        this.theme.fg(
          "dim",
          question.type === "multi"
            ? "↑↓ move · Space toggle · Enter continue · Esc cancel"
            : "↑↓ move · Enter select · Esc cancel",
        ),
      );
    }
    if (this.error) lines.push(this.theme.fg("warning", this.error));
    lines.push(truncateToWidth("─".repeat(renderWidth), renderWidth));
    this.cachedWidth = width;
    this.cachedLines = lines.map((line) => truncateToWidth(line, renderWidth));
    return this.cachedLines;
  }

  private currentQuestion(): QuestionnaireQuestion | undefined {
    return this.questionnaire.questions[this.currentIndex];
  }

  private startTextInput(
    question: Extract<
      QuestionnaireQuestion,
      {
        type: "text";
      }
    >,
  ): void {
    this.inputMode = true;
    this.error = "";
    this.input = new Input({
      placeholder: question.required ? "Required" : "Optional",
      prompt: "> ",
    });
    this.input.setValue(
      typeof this.rawAnswers[question.id] === "string"
        ? String(this.rawAnswers[question.id])
        : "",
    );
    this.input.onEscape = () => this.done(cancelledResult(this.round));
    this.input.onSubmit = (value) => {
      if (question.required && value.trim().length === 0) {
        this.error = "A response is required.";
        this.invalidate();
        return;
      }
      if (value.trim().length > 0) this.rawAnswers[question.id] = value;
      this.inputMode = false;
      this.input = undefined;
      this.advance();
    };
    this.invalidate();
  }

  private advance(): void {
    this.currentIndex++;
    this.selectedIndex = 0;
    this.selectedMulti.clear();
    this.inputMode = false;
    this.input = undefined;
    this.error = "";
    if (this.currentIndex < this.questionnaire.questions.length) {
      this.invalidate();
      return;
    }
    try {
      this.done(normalizeAnswers(this.questionnaire, this.rawAnswers, this.round));
    } catch {
      this.currentIndex = this.questionnaire.questions.length - 1;
      this.error = "A required response is missing.";
      this.invalidate();
    }
  }
}

async function askTui(
  ctx: ExtensionContext,
  questionnaire: Questionnaire,
  round: number,
): Promise<QuestionnaireResult> {
  return ctx.ui.custom<QuestionnaireResult>(
    (_tui, theme, _keybindings, done) =>
      new QuestionnaireComponent(questionnaire, round, theme, done),
    {
      overlay: true,
      overlayOptions: {
        anchor: "center",
        minWidth: 40,
        width: 78,
        margin: {
          bottom: 4,
        },
      },
    },
  );
}

export async function askQuestionnaire(
  ctx: ExtensionContext,
  input: unknown,
  options: AskQuestionnaireOptions = {},
): Promise<QuestionnaireResult> {
  const round = options.round ?? 0;
  let questionnaire: Questionnaire;
  try {
    questionnaire = validateQuestionnaire(input);
  } catch {
    return cancelledResult(round);
  }
  if (!ctx.hasUI || ctx.mode === "print" || ctx.mode === "json")
    return cancelledResult(round);

  const presentation = getEffectivePresentation(questionnaire);
  if (presentation === "quick") return askQuick(ctx, questionnaire, round);
  if (ctx.mode === "rpc") return askRpc(ctx, questionnaire, round);

  const glimpseResult = await promptWithGlimpse(
    options.glimpseLoader ?? loadGlimpse,
    questionnaire,
    round,
  );
  if (glimpseResult.kind === "submitted" || glimpseResult.kind === "cancelled")
    return glimpseResult.result;
  ctx.ui.notify("Glimpse is unavailable; using the native TUI fallback.", "warning");
  return askTui(ctx, questionnaire, round);
}
