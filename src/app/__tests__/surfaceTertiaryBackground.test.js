import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Root Canvas Token & Global Background (#0F1113 / design-system.md §1)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");
  const tokensPath = path.resolve(__dirname, "../tokens.css");

  it("defines --bg-root as #0F1113 in tokens.css", () => {
    const tokensContent = fs.readFileSync(tokensPath, "utf-8");
    expect(tokensContent).toMatch(/--bg-root:\s*#0F1113;/i);
  });

  it("registers --color-bg-root in @theme inline in globals.css", () => {
    const globalsContent = fs.readFileSync(globalsCssPath, "utf-8");
    expect(globalsContent).toMatch(/--color-bg-root:\s*var\(--bg-root\);/);
  });

  it("applies --bg-root as global root background on html", () => {
    const globalsContent = fs.readFileSync(globalsCssPath, "utf-8");
    expect(globalsContent).toMatch(/html\s*\{[^}]*background-color:\s*var\(--bg-root\);/);
  });
});
