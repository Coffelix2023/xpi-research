import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const VERSION = "0.1.0";

export default function xpiResearch(pi: ExtensionAPI): void {
  pi.registerCommand("xpi-research", {
    description: "Show xpi-research status",
    handler: async (_args, ctx) => {
      ctx.ui.notify(`xpi-research ${VERSION} loaded`);
    },
  });
}
