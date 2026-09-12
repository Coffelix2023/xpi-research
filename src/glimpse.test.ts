import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildGlimpseWrapper,
  type GlimpseModule,
  loadGlimpse,
  quietGlimpseBinary,
  wrapGlimpseBinary,
} from "./glimpse.ts";

describe("loadGlimpse", () => {
  it("skips a candidate that is not installed without warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const missing = path.join(tmpdir(), "glimpse-absent/glimpse.mjs");

      expect(
        await loadGlimpse([
          missing,
        ]),
      ).toBeNull();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it("records a broken candidate in the log instead of warning on stderr", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "glimpse-broken-"));
    const broken = path.join(dir, "glimpse.mjs");
    await writeFile(broken, "throw new Error('broken module');\n");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      expect(
        await loadGlimpse([
          broken,
        ]),
      ).toBeNull();

      expect(warn).not.toHaveBeenCalled();
      const logged = await readFile(
        path.join(tmpdir(), "xpi-research-glimpse", "glimpse-load-error.log"),
        "utf8",
      );
      expect(logged).toContain(broken);
      expect(logged).toContain("broken module");
    } finally {
      warn.mockRestore();
      await rm(dir, {
        force: true,
        recursive: true,
      });
    }
  });
});

describe("quietGlimpseBinary", () => {
  const createdDirs: string[] = [];

  function onDarwin(): void {
    vi.spyOn(process, "platform", "get").mockReturnValue("darwin");
  }

  async function fakeModulePath(): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), "glimpse-host-"));
    createdDirs.push(dir);
    const modulePath = path.join(dir, "glimpse.mjs");
    await writeFile(modulePath, "export {};\n");
    return modulePath;
  }

  async function shipHostBinary(modulePath: string): Promise<void> {
    await writeFile(
      path.join(path.dirname(modulePath), "glimpse"),
      "#!/bin/sh\nexit 0\n",
    );
  }

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    const dirs = createdDirs.splice(0);
    await Promise.all(
      dirs.map((dir) =>
        rm(dir, {
          force: true,
          recursive: true,
        }),
      ),
    );
  });

  it("builds a one-line shim that forwards args and redirects stderr", () => {
    expect(buildGlimpseWrapper("/bin/host", "/tmp/log")).toBe(
      '#!/bin/sh\nexec "/bin/host" "$@" 2>"/tmp/log"\n',
    );
  });

  it("points the host at a wrapper whose stderr lands in the log file", async () => {
    onDarwin();
    const modulePath = await fakeModulePath();
    await shipHostBinary(modulePath);

    const wrapper = quietGlimpseBinary(modulePath);
    expect(wrapper).not.toBeNull();
    if (wrapper === null) throw new Error("expected a wrapper path");

    const body = await readFile(wrapper, "utf8");
    expect(body).toContain('2>"');
    expect(body).toContain("glimpse-stderr.log");
    expect((await stat(wrapper)).mode & 0o777).toBe(0o755);
  });

  it("leaves the launch alone outside macOS", async () => {
    vi.spyOn(process, "platform", "get").mockReturnValue("linux");
    const modulePath = await fakeModulePath();
    await shipHostBinary(modulePath);

    expect(quietGlimpseBinary(modulePath)).toBeNull();
  });

  it("respects a host the caller already declared", async () => {
    onDarwin();
    const modulePath = await fakeModulePath();
    await shipHostBinary(modulePath);

    vi.stubEnv("GLIMPSE_BINARY_PATH", "/custom/host");
    expect(quietGlimpseBinary(modulePath)).toBeNull();

    vi.unstubAllEnvs();
    vi.stubEnv("GLIMPSE_HOST_PATH", "/custom/host");
    expect(quietGlimpseBinary(modulePath)).toBeNull();
  });

  it("does nothing when no native binary sits beside the module", async () => {
    onDarwin();
    const modulePath = await fakeModulePath();

    expect(quietGlimpseBinary(modulePath)).toBeNull();
  });

  it("ignores module paths that are not absolute", () => {
    onDarwin();

    expect(quietGlimpseBinary("relative/glimpse.mjs")).toBeNull();
    expect(quietGlimpseBinary(undefined)).toBeNull();
  });
});

describe("wrapGlimpseBinary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("overrides the host only while prompt runs, then restores it", async () => {
    const seen: Array<string | undefined> = [];
    const module: GlimpseModule = {
      prompt: async () => {
        seen.push(process.env.GLIMPSE_BINARY_PATH);
        return {
          answers: {},
        };
      },
    };

    await wrapGlimpseBinary(module, "/tmp/wrapper").prompt("<html></html>");

    expect(seen).toEqual([
      "/tmp/wrapper",
    ]);
    expect(process.env.GLIMPSE_BINARY_PATH).toBeUndefined();
  });

  it("restores a caller-declared host after a failed prompt", async () => {
    vi.stubEnv("GLIMPSE_BINARY_PATH", "/caller/host");
    const module: GlimpseModule = {
      prompt: async () => {
        throw new Error("no window");
      },
    };

    await expect(
      wrapGlimpseBinary(module, "/tmp/wrapper").prompt("<html></html>"),
    ).rejects.toThrow("no window");
    expect(process.env.GLIMPSE_BINARY_PATH).toBe("/caller/host");
  });

  it("keeps the module untouched when no wrapper applies", () => {
    const module: GlimpseModule = {
      prompt: async () => null,
    };

    expect(wrapGlimpseBinary(module, null)).toBe(module);
  });

  it("keeps close reachable on the wrapped module", async () => {
    const close = vi.fn();
    const module: GlimpseModule = {
      close,
      prompt: async () => null,
    };

    await wrapGlimpseBinary(module, "/tmp/wrapper").close?.();

    expect(close).toHaveBeenCalledTimes(1);
  });

  it("quietens the host of a module loaded from disk", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "glimpse-loaded-"));
    const modulePath = path.join(dir, "glimpse.mjs");
    const seenPath = path.join(dir, "seen.txt");
    await writeFile(
      modulePath,
      [
        'import { writeFileSync } from "node:fs";',
        "export async function prompt() {",
        `  writeFileSync(${JSON.stringify(seenPath)}, String(process.env.GLIMPSE_BINARY_PATH));`,
        "  return { answers: {} };",
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(path.join(dir, "glimpse"), "#!/bin/sh\nexit 0\n");
    const platform = vi.spyOn(process, "platform", "get").mockReturnValue("darwin");
    try {
      const loaded = await loadGlimpse([
        modulePath,
      ]);
      await loaded?.prompt("<html></html>", {
        height: 600,
        title: "xpi-research",
        width: 800,
      });

      expect(await readFile(seenPath, "utf8")).toBe(
        path.join(tmpdir(), "xpi-research-glimpse", "glimpse-quiet"),
      );
    } finally {
      platform.mockRestore();
      await rm(dir, {
        force: true,
        recursive: true,
      });
    }
  });
});

describe("native host stderr", () => {
  const NOISE =
    "glimpse[31330:126706] error messaging the mach port for IMKCFRunLoopWakeUpReliable";

  const HOST_MODULE = [
    'import { spawn } from "node:child_process";',
    'import { dirname, isAbsolute, join, resolve } from "node:path";',
    'import { fileURLToPath } from "node:url";',
    "",
    "const here = dirname(fileURLToPath(import.meta.url));",
    "",
    "function hostPath() {",
    "  const override = process.env.GLIMPSE_BINARY_PATH || process.env.GLIMPSE_HOST_PATH;",
    "  if (override) return isAbsolute(override) ? override : resolve(process.cwd(), override);",
    '  return join(here, "glimpse");',
    "}",
    "",
    "export async function prompt() {",
    '  const proc = spawn(hostPath(), [], { stdio: ["pipe", "pipe", "pipe"] });',
    "  const chunks = [];",
    '  proc.stderr.on("data", (chunk) => chunks.push(chunk));',
    '  await new Promise((done) => proc.on("close", done));',
    "  return { captured: Buffer.concat(chunks).toString() };",
    "}",
    "",
  ].join("\n");

  async function scaffoldHost(dir: string): Promise<string> {
    const modulePath = path.join(dir, "glimpse.mjs");
    await writeFile(modulePath, HOST_MODULE);
    const binary = path.join(dir, "glimpse");
    await writeFile(binary, `#!/bin/sh\necho "${NOISE}" >&2\n`);
    await chmod(binary, 0o755);
    return modulePath;
  }

  it("keeps the host's noise out of the parent stderr and in the log", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "glimpse-e2e-"));
    const platform = vi.spyOn(process, "platform", "get").mockReturnValue("darwin");
    try {
      const modulePath = await scaffoldHost(dir);

      // Baseline: the unwrapped module leaks its host's stderr to whoever owns fd 2.
      const raw = (await import(pathToFileURL(modulePath).href)) as {
        prompt: () => Promise<{
          captured: string;
        }>;
      };
      expect((await raw.prompt()).captured).toContain("IMKCFRunLoopWakeUpReliable");

      const loaded = await loadGlimpse([
        modulePath,
      ]);
      expect(loaded).not.toBeNull();
      if (!loaded) throw new Error("expected glimpse to load");

      const quiet = (await loaded.prompt("<html></html>")) as {
        captured: string;
      };

      expect(quiet.captured).toBe("");
      expect(
        await readFile(
          path.join(tmpdir(), "xpi-research-glimpse", "glimpse-stderr.log"),
          "utf8",
        ),
      ).toContain("IMKCFRunLoopWakeUpReliable");
    } finally {
      platform.mockRestore();
      await rm(dir, {
        force: true,
        recursive: true,
      });
    }
  });
});
