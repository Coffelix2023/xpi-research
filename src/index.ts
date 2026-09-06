import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
  cancelledResult,
  serializeQuestionnaireResult,
  validateQuestionnaire,
} from "./questionnaire.ts";
import type { Questionnaire, QuestionnaireResult, ResearchSession } from "./types.ts";
import { askQuestionnaire } from "./ui.ts";

const ASK_TOOL_NAME = "xpi_research_ask";
const STATUS_KEY = "xpi-research";

const optionSchema = Type.Object({
  description: Type.Optional(
    Type.String({
      maxLength: 500,
    }),
  ),
  label: Type.String({
    maxLength: 160,
    minLength: 1,
  }),
  preview: Type.Optional(
    Type.String({
      maxLength: 4_000,
    }),
  ),
  recommended: Type.Optional(Type.Boolean()),
});

const questionFields = {
  id: Type.String({
    maxLength: 64,
    minLength: 1,
  }),
  prompt: Type.String({
    maxLength: 1_000,
    minLength: 1,
  }),
  required: Type.Boolean(),
};

const questionSchema = Type.Union([
  Type.Object({
    ...questionFields,
    options: Type.Array(optionSchema, {
      maxItems: 8,
      minItems: 1,
    }),
    type: Type.Literal("single"),
  }),
  Type.Object({
    ...questionFields,
    options: Type.Array(optionSchema, {
      maxItems: 8,
      minItems: 1,
    }),
    type: Type.Literal("multi"),
  }),
  Type.Object({
    ...questionFields,
    type: Type.Literal("text"),
  }),
  Type.Object({
    ...questionFields,
    type: Type.Literal("info"),
  }),
]);

const questionnaireSchema = Type.Object({
  presentation: Type.Union([
    Type.Literal("quick"),
    Type.Literal("visual"),
  ]),
  questions: Type.Array(questionSchema, {
    maxItems: 4,
    minItems: 1,
  }),
});

function resultToolResponse(result: QuestionnaireResult) {
  return {
    details: result,
    content: [
      {
        text: serializeQuestionnaireResult(result),
        type: "text" as const,
      },
    ],
  };
}

export default function xpiResearch(pi: ExtensionAPI): void {
  let activeSession: ResearchSession | undefined;
  let nextRound = 1;

  function cleanup(ctx: ExtensionContext): void {
    const session = activeSession;
    if (!session || session.cleaned) return;

    session.cleaned = true;
    session.status = "settled";
    activeSession = undefined;

    try {
      pi.setActiveTools(session.activeToolNames);
    } catch {
      ctx.ui.notify("Unable to restore the previous active tools.", "error");
    }
    try {
      ctx.ui.setStatus(STATUS_KEY, undefined);
    } catch {
      ctx.ui.notify("Unable to clear the research status.", "error");
    }
  }

  async function executeAskTool(params: Questionnaire, ctx: ExtensionContext) {
    const session = activeSession;
    if (!session || session.cleaned) {
      return resultToolResponse(cancelledResult(0));
    }

    let questionnaire: Questionnaire;
    try {
      questionnaire = validateQuestionnaire(params);
    } catch {
      throw new Error("Invalid research questionnaire.");
    }

    try {
      const result = await askQuestionnaire(ctx, questionnaire, {
        round: session.round,
      });
      return resultToolResponse(result);
    } catch {
      throw new Error("Research questionnaire interaction failed.");
    }
  }

  pi.registerTool({
    description: "Ask bounded research questions and return structured user decisions.",
    executionMode: "sequential",
    label: "Research Questions",
    name: ASK_TOOL_NAME,
    parameters: questionnaireSchema,
    promptSnippet: "Ask the user for unresolved research decisions.",
    execute: async (_toolCallId, params, _signal, _onUpdate, ctx) =>
      executeAskTool(params, ctx),
  });

  async function resolveTarget(
    args: string,
    ctx: ExtensionCommandContext,
  ): Promise<string | undefined> {
    const explicitTarget = args.trim();
    if (explicitTarget) return explicitTarget;
    if (!ctx.hasUI) {
      ctx.ui.notify("Research UI is unavailable.", "warning");
      return undefined;
    }

    const enteredTarget = await ctx.ui.input("Research target", "Required");
    const target = enteredTarget?.trim() ?? "";
    if (!target) {
      ctx.ui.notify("A research target is required.", "warning");
      return undefined;
    }
    return target;
  }

  pi.registerCommand("xpi-research", {
    description: "Start a focused research round",
    handler: async (args, ctx) => {
      if (!ctx.isIdle()) {
        ctx.ui.notify("Agent is busy.", "warning");
        return;
      }
      if (activeSession) {
        ctx.ui.notify("A research round is already active.", "warning");
        return;
      }
      if (!ctx.hasUI) {
        ctx.ui.notify("Research UI is unavailable.", "warning");
        return;
      }

      const target = await resolveTarget(args, ctx);
      if (!target) return;

      const session: ResearchSession = {
        cleaned: false,
        round: nextRound++,
        status: "active",
        activeToolNames: [
          ...pi.getActiveTools(),
        ],
        target,
      };
      activeSession = session;

      try {
        const activeToolNames = session.activeToolNames.includes(ASK_TOOL_NAME)
          ? session.activeToolNames
          : [
              ...session.activeToolNames,
              ASK_TOOL_NAME,
            ];
        pi.setActiveTools(activeToolNames);
        ctx.ui.setStatus(STATUS_KEY, "researching");
        pi.sendUserMessage(`/skill:xpi-research\n\nTarget: ${target}`, {
          expandPromptTemplates: true,
        });
      } catch {
        cleanup(ctx);
        ctx.ui.notify("Unable to start the research round.", "error");
      }
    },
  });

  pi.on("agent_settled", (_event, ctx) => {
    cleanup(ctx);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    cleanup(ctx);
  });
}

export { ASK_TOOL_NAME, questionnaireSchema };
