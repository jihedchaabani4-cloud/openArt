import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Theme Background Tokens - Pure Black (#000000)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");
  const leftRailPath = path.resolve(__dirname, "../../widgets/StudioLayout/LeftNavigationRail.jsx");

  it("enforces pure black (#000000) for primary and material background tokens in globals.css", () => {
    const cssContent = fs.readFileSync(globalsCssPath, "utf-8");

    // Primary background tokens must be pure black #000000
    expect(cssContent).toMatch(/--background-primary:\s*#000000;/);
    expect(cssContent).toMatch(/--background-base-primary:\s*#000000;/);
    expect(cssContent).toMatch(/--mat-sys-background:\s*#000000;/);

    // Must not have non-black rgb(12, 16, 20) background override
    expect(cssContent).not.toMatch(/--background-primary:\s*rgb\(12,\s*16,\s*20\);/);
    expect(cssContent).not.toMatch(/--ig-primary-background:\s*12,\s*16,\s*20;/);
  });

  it("enforces bg-black on LeftNavigationRail for consistent dark canvas layout", () => {
    const railContent = fs.readFileSync(leftRailPath, "utf-8");

    expect(railContent).toMatch(/bg-black/);
  });
});
