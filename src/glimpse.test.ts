import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { loadGlimpse } from "./glimpse.ts";

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

  it("warns when a candidate exists but cannot load", async () => {
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
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
      await rm(dir, {
        force: true,
        recursive: true,
      });
    }
  });
});
