import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Theme Canvas Tokens - Cinema Dark (#0F1113 / #131416)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");
  const tokensPath = path.resolve(__dirname, "../tokens.css");
  const leftRailPath = path.resolve(__dirname, "../../widgets/StudioLayout/LeftNavigationRail.jsx");

  it("enforces cinema dark (#0F1113 / #131416) for primary root canvas tokens in tokens.css and globals.css", () => {
    const tokensContent = fs.readFileSync(tokensPath, "utf-8");
    const globalsContent = fs.readFileSync(globalsCssPath, "utf-8");

    // Canvas background tokens from design-system.md §1
    expect(tokensContent).toMatch(/--bg-root:\s*#0F1113;/i);
    expect(tokensContent).toMatch(/--bg-page:\s*#131416;/i);
    expect(globalsContent).toMatch(/background-color:\s*var\(--bg-root\);/);
    expect(globalsContent).toMatch(/background-color:\s*var\(--bg-page\);/);
  });

  it("enforces transparent background on LeftNavigationRail for seamless canvas layout", () => {
    const railContent = fs.readFileSync(leftRailPath, "utf-8");

    expect(railContent).toMatch(/bg-transparent/);
  });

  it("enforces canonical 8px radius for standard button shape in tokens.css", () => {
    const tokensContent = fs.readFileSync(tokensPath, "utf-8");

    expect(tokensContent).toMatch(/--r-sm:\s*8px;/);
  });
});
