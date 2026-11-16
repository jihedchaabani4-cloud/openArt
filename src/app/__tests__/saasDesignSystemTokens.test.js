import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("SaaS Dark UI Design System Tokens (DESIGN.md Alignment)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");
  const promptBarLayoutPath = path.resolve(
    __dirname,
    "../../features/prompt-bar/model/core/promptBarLayout.js"
  );
  const leftRailPath = path.resolve(
    __dirname,
    "../../widgets/StudioLayout/LeftNavigationRail.jsx"
  );

  describe("1. Background & Surface Tokens Hierarchy", () => {
    it("enforces --omni-bg (#1A1A1A) and --body-bg (#0E1015) in globals.css", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--omni-bg:\s*#1A1A1A;/);
      expect(globals).toMatch(/--body-bg:\s*#0E1015;/);
      expect(globals).toMatch(/body\s*\{[^}]*background-color:\s*var\(--omni-bg\);/);
      expect(globals).toMatch(/html\s*\{[^}]*background-color:\s*var\(--body-bg\);/);
    });

    it("enforces pure white primary CTA & secondary surface #27272A", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--primary-foreground:\s*240\s*5\.9%\s*10%;/);
      expect(globals).toMatch(/--secondary:\s*240\s*3\.7%\s*15\.9%;/);
    });

    it("enforces .surface-glass class definition", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toContain(".surface-glass");
      expect(globals).toMatch(/backdrop-filter:\s*blur\(40px\);/);
    });
  });

  describe("2. Layout & Shell Geometry", () => {
    it("configures PromptBar container with rounded-[20px] and frosted surface", () => {
      const promptLayout = fs.readFileSync(promptBarLayoutPath, "utf-8");
      expect(promptLayout).toContain("rounded-[20px]");
      expect(promptLayout).toContain("bg-white/5");
      expect(promptLayout).toContain("border-white/10");
    });

    it("configures LeftNavigationRail sidebar with rounded-2xl", () => {
      const rail = fs.readFileSync(leftRailPath, "utf-8");
      expect(rail).toContain("rounded-2xl");
      expect(rail).toContain("bg-transparent");
    });
  });
});
