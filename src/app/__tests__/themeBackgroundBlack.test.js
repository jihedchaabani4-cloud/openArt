import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Theme Background Tokens - SaaS Dark UI (#1A1A1A)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");
  const leftRailPath = path.resolve(__dirname, "../../widgets/StudioLayout/LeftNavigationRail.jsx");

  it("enforces --omni-bg (#1A1A1A) for app background in globals.css", () => {
    const cssContent = fs.readFileSync(globalsCssPath, "utf-8");
    expect(cssContent).toMatch(/--omni-bg:\s*#1A1A1A;/);
  });

  it("enforces transparent background on LeftNavigationRail for seamless canvas layout", () => {
    const railContent = fs.readFileSync(leftRailPath, "utf-8");
    expect(railContent).toMatch(/bg-transparent/);
  });
});
