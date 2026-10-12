import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Global CSS Background Tokens & Configuration", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");
  const leftRailPath = path.resolve(__dirname, "../../widgets/StudioLayout/LeftNavigationRail.jsx");

  it("declares --ig-primary-background in globals.css and wires it into main background tokens", () => {
    const cssContent = fs.readFileSync(globalsCssPath, "utf-8");

    // Must define --ig-primary-background: 12, 16, 20;
    expect(cssContent).toMatch(/--ig-primary-background:\s*12,\s*16,\s*20;/);

    // Main background variables should wire into --ig-primary-background
    expect(cssContent).toMatch(/--background-primary:\s*rgb\(var\(--ig-primary-background\)\);/);
    expect(cssContent).toMatch(/--mat-sys-background:\s*rgb\(var\(--ig-primary-background\)\);/);
  });

  it("wires LeftNavigationRail to dynamic bg-background instead of hardcoded bg-black", () => {
    const railContent = fs.readFileSync(leftRailPath, "utf-8");

    expect(railContent).not.toMatch(/className="[^"]*\bbg-black\b[^"]*"/);
    expect(railContent).toMatch(/bg-background/);
  });
});
