import type {
  ExtensionAPI,
  ExtensionCommandContext,
  ExtensionContext,
  ExtensionToolContext,
  ExtensionUIContext,
  ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { describe, expect, it } from "vitest";
import xpiResearch from "./index.ts";
import type { Questionnaire } from "./types.ts";

interface FakeRuntime {
  activeToolHistory: string[][];
  activeTools: string[];
  api: ExtensionAPI;
  commands: Map<string, (args: string, ctx: ExtensionCommandContext) => Promise<void>>;
  context: ExtensionContext;
  events: Map<string, (event: unknown, ctx: ExtensionContext) => Promise<void> | void>;
  idle: boolean;
  inputAnswer: string | undefined;
  notifications: string[];
  selectAnswer: string | undefined;
  sendError: Error | undefined;
  sentMessages: Array<{
    content: string;
    expandPromptTemplates?: boolean;
  }>;
  statuses: Array<{
    key: string;
    text: string | undefined;
  }>;
  toolContext: ExtensionToolContext;
  tools: Map<string, ToolDefinition>;
  uiError: Error | undefined;
}

const questionnaire: Questionnaire = {
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
  ],
};

function createRuntime(): FakeRuntime {
  const runtime = {} as FakeRuntime;
  runtime.commands = new Map();
  runtime.events = new Map();
  runtime.tools = new Map();
  runtime.activeTools = [
    "read",
    "bash",
  ];
  runtime.activeToolHistory = [];
  runtime.sentMessages = [];
  runtime.notifications = [];
  runtime.statuses = [];
  runtime.inputAnswer = "  architecture review  ";
  runtime.selectAnswer = "Beta";
  runtime.idle = true;
  runtime.sendError = undefined;
  runtime.uiError = undefined;

  const ui = {
    theme: {},
    input: async () => runtime.inputAnswer,
    notify: (message: string) => runtime.notifications.push(message),
    select: async () => {
      if (runtime.uiError) throw runtime.uiError;
      return runtime.selectAnswer;
    },
    setStatus: (key: string, text: string | undefined) => {
      runtime.statuses.push({
        key,
        text,
      });
    },
  } as unknown as ExtensionUIContext;

  runtime.context = {
    hasUI: true,
    mode: "tui",
    isIdle: () => runtime.idle,
    ui,
  } as ExtensionContext;
  // 只补 execute 真正读到的字段即可；这里的双强转是让 ExtensionContext 的测试替身满足 ExtensionToolContext。
  runtime.toolContext = runtime.context as unknown as ExtensionToolContext;

  runtime.api = {
    getActiveTools: () => runtime.activeTools,
    on: (
      event: string,
      handler: (event: unknown, ctx: ExtensionContext) => Promise<void> | void,
    ) => {
      runtime.events.set(event, handler);
    },
    registerCommand: (
      name: string,
      options: {
        handler: (args: string, ctx: ExtensionCommandContext) => Promise<void>;
      },
    ) => {
      runtime.commands.set(name, options.handler);
    },
    registerTool: (tool: ToolDefinition) => {
      runtime.tools.set(tool.name, tool);
    },
    sendUserMessage: (
      content:
        | string
        | Array<{
            type: "text";
            text: string;
          }>,
      options:
        | {
            expandPromptTemplates?: boolean;
          }
        | undefined,
    ) => {
      if (runtime.sendError) throw runtime.sendError;
      runtime.sentMessages.push({
        content: typeof content === "string" ? content : "",
        expandPromptTemplates: options?.expandPromptTemplates,
      });
    },
    setActiveTools: (toolNames: string[]) => {
      runtime.activeTools = [
        ...toolNames,
      ];
      runtime.activeToolHistory.push([
        ...toolNames,
      ]);
    },
  } as unknown as ExtensionAPI;

  xpiResearch(runtime.api);
  return runtime;
}

async function runCommand(runtime: FakeRuntime, args: string): Promise<void> {
  await runtime.commands.get("xpi-research")?.(
    args,
    runtime.context as ExtensionCommandContext,
  );
}

describe("xpi_research_ask", () => {
  it("returns bounded submitted answers for the active research round", async () => {
    const runtime = createRuntime();
    await runCommand(runtime, "target");

    const tool = runtime.tools.get("xpi_research_ask");
    const result = await tool?.execute(
      "call-1",
      questionnaire,
      undefined,
      undefined,
      runtime.toolContext,
    );

    expect(result?.details).toEqual({
      cancelled: false,
      round: 1,
      answers: {
        choice: "Beta",
      },
    });
    expect(result?.content).toEqual([
      {
        text: JSON.stringify({
          cancelled: false,
          round: 1,
          answers: {
            choice: "Beta",
          },
        }),
        type: "text",
      },
    ]);
  });

  it("returns explicit cancellation when the user cancels", async () => {
    const runtime = createRuntime();
    runtime.selectAnswer = undefined;
    await runCommand(runtime, "target");

    const tool = runtime.tools.get("xpi_research_ask");
    const result = await tool?.execute(
      "call-2",
      questionnaire,
      undefined,
      undefined,
      runtime.toolContext,
    );

    expect(result?.details).toEqual({
      answers: {},
      cancelled: true,
      round: 1,
    });
  });

  it("reports a missing round instead of a false cancellation", async () => {
    const runtime = createRuntime();
    const tool = runtime.tools.get("xpi_research_ask");
    if (!tool) throw new Error("ask tool was not registered");

    await expect(
      tool.execute("call-4", questionnaire, undefined, undefined, runtime.toolContext),
    ).rejects.toThrow("No active research round");
  });
  it("returns a bounded error result when UI execution fails", async () => {
    const runtime = createRuntime();
    runtime.uiError = new Error("UI failed");
    await runCommand(runtime, "target");

    const tool = runtime.tools.get("xpi_research_ask");
    if (!tool) throw new Error("ask tool was not registered");
    await expect(
      tool.execute("call-3", questionnaire, undefined, undefined, runtime.toolContext),
    ).rejects.toThrow("Research questionnaire interaction failed.");

    // 面板失败也必须交还工具集，否则它会一直留在活跃集里。
    expect(runtime.activeTools).toEqual([
      "read",
      "bash",
    ]);
  });
});

describe("/xpi-research lifecycle", () => {
  it("trims the target, activates the ask tool, and expands the skill message", async () => {
    const runtime = createRuntime();

    await runCommand(runtime, "  architecture review  ");

    expect(runtime.activeTools).toEqual([
      "read",
      "bash",
      "xpi_research_ask",
    ]);
    expect(runtime.sentMessages).toEqual([
      {
        content: "/skill:xpi-research\n\nTarget: architecture review",
        expandPromptTemplates: true,
      },
    ]);
    expect(runtime.statuses).toEqual([
      {
        key: "xpi-research",
        text: "researching",
      },
    ]);
  });

  it("asks for a missing target and stops on whitespace cancellation", async () => {
    const runtime = createRuntime();
    runtime.inputAnswer = "   ";

    await runCommand(runtime, "");

    expect(runtime.activeTools).toEqual([
      "read",
      "bash",
    ]);
    expect(runtime.sentMessages).toHaveLength(0);
    expect(runtime.notifications).toContain("A research target is required.");
  });

  it("rejects explicit targets when no usable UI is available", async () => {
    const runtime = createRuntime();
    runtime.context.hasUI = false;
    await runCommand(runtime, "target");

    expect(runtime.activeTools).toEqual([
      "read",
      "bash",
    ]);
    expect(runtime.sentMessages).toHaveLength(0);
    expect(runtime.notifications).toContain("Research UI is unavailable.");
  });

  it("keeps a busy agent out and lets a repeated start reuse the same tool set", async () => {
    const runtime = createRuntime();
    runtime.idle = false;

    await runCommand(runtime, "target");
    expect(runtime.notifications).toContain("Agent is busy.");
    expect(runtime.activeToolHistory).toHaveLength(0);

    runtime.idle = true;
    await runCommand(runtime, "first");
    await runCommand(runtime, "second");

    // 重复命令不再被拒：面板没被取消时工具仍在活跃集里，拒绝会把用户锁死。
    expect(runtime.sentMessages).toHaveLength(2);
    expect(runtime.activeTools).toEqual([
      "read",
      "bash",
      "xpi_research_ask",
    ]);
    expect(runtime.activeToolHistory).toEqual([
      [
        "read",
        "bash",
        "xpi_research_ask",
      ],
      [
        "read",
        "bash",
        "xpi_research_ask",
      ],
    ]);
  });

  it("restores the exact tool snapshot and clears status idempotently", async () => {
    const runtime = createRuntime();
    await runCommand(runtime, "target");

    // 收尾不再挂在 agent_settled 上：那是 run 级事件，会在命令刚激活工具、第一次提问之前撤销它。
    expect(runtime.events.has("agent_settled")).toBe(false);
    await runtime.events.get("session_shutdown")?.({}, runtime.context);
    await runtime.events.get("session_shutdown")?.({}, runtime.context);

    expect(runtime.activeTools).toEqual([
      "read",
      "bash",
    ]);
    expect(runtime.activeToolHistory).toEqual([
      [
        "read",
        "bash",
        "xpi_research_ask",
      ],
      [
        "read",
        "bash",
      ],
    ]);
    expect(runtime.statuses.at(-1)).toEqual({
      key: "xpi-research",
      text: undefined,
    });
  });

  it("cleans up when dispatching the skill message fails", async () => {
    const runtime = createRuntime();
    runtime.sendError = new Error("send failed");

    await runCommand(runtime, "target");

    expect(runtime.activeTools).toEqual([
      "read",
      "bash",
    ]);
    expect(runtime.statuses.at(-1)).toEqual({
      key: "xpi-research",
      text: undefined,
    });
    expect(runtime.notifications).toContain("Unable to start the research round.");
  });

  it("does not intercept ordinary input", () => {
    const runtime = createRuntime();

    expect(runtime.events.has("input")).toBe(false);
  });

  it("hands the ask tool back when the panel is cancelled, even if it was active before the round", async () => {
    const runtime = createRuntime();
    runtime.activeTools = [
      "read",
      "bash",
      "xpi_research_ask",
    ];
    runtime.selectAnswer = undefined;

    await runCommand(runtime, "target");
    const tool = runtime.tools.get("xpi_research_ask");
    await tool?.execute(
      "call-cancel",
      questionnaire,
      undefined,
      undefined,
      runtime.toolContext,
    );

    expect(runtime.activeTools).toEqual([
      "read",
      "bash",
    ]);
    // 交还之后再启动：外层工具集重新取自 getActiveTools()，而不是复用已清空的记录。
    runtime.selectAnswer = "Beta";
    await runCommand(runtime, "again");
    expect(runtime.activeTools).toEqual([
      "read",
      "bash",
      "xpi_research_ask",
    ]);
  });
});
