import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Surface Tertiary Token & Global Background (#0f1113)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");
  const flowTokensPath = path.resolve(__dirname, "../google-flow-tokens.css");

  it("defines --color-surface-tertiary and --surface-tertiary as #0f1113 in google-flow-tokens.css", () => {
    const tokensContent = fs.readFileSync(flowTokensPath, "utf-8");

    expect(tokensContent).toMatch(/--color-surface-tertiary:\s*#0f1113;/);
    expect(tokensContent).toMatch(/--surface-tertiary:\s*#0f1113;/);
  });

  it("registers --color-surface-tertiary in @theme inline and :root in globals.css", () => {
    const globalsContent = fs.readFileSync(globalsCssPath, "utf-8");

    expect(globalsContent).toMatch(/--color-surface-tertiary:\s*(var\(--surface-tertiary,\s*#0f1113\)|#0f1113);/);
    expect(globalsContent).toMatch(/--surface-tertiary:\s*#0f1113;/);
  });

  it("applies --color-surface-tertiary as global website background across html, body and --background tokens", () => {
    const globalsContent = fs.readFileSync(globalsCssPath, "utf-8");

    // html element background
    expect(globalsContent).toMatch(/html\s*\{[^}]*background-color:\s*var\(--color-surface-tertiary,\s*#0f1113\);/);

    // body element background
    expect(globalsContent).toMatch(/body\s*\{[^}]*background-color:\s*var\(--color-surface-tertiary,\s*#0f1113\);/);

    // root & dark mode background token
    expect(globalsContent).toMatch(/--background:\s*var\(--color-surface-tertiary,\s*#0f1113\);/);
  });
});
