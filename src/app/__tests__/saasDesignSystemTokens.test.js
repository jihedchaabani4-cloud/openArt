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
    "../../components/layout/LeftNavigationRail.jsx"
  );

  describe("1. Background & Surface Tokens Hierarchy", () => {
    it("enforces --omni-bg (#1A1A1A) and root canvas background in globals.css", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--omni-bg:\s*#1[aA]1[aAbB]1[aAbB];/);
      expect(globals).toMatch(/--body-bg:\s*#1[aA]1[aAbB]1[aAbB];/);
      expect(globals).toMatch(/body\s*\{[^}]*background-color:\s*var\(--(omni|body)-bg\);/);
    });

    it("enforces pure white primary CTA & secondary surface #27272A", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--primary-foreground:\s*240\s*5\.9%\s*10%;/);
      expect(globals).toMatch(/--secondary:\s*240\s*3\.7%\s*15\.9%;/);
    });

    it("enforces .surface-glass class definition", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toContain(".surface-glass");
      expect(globals).toMatch(/backdrop-filter:\s*var\(--blur-glass\);/);
    });
  });

  describe("2. Layout & Shell Geometry", () => {
    it("configures PromptBar container with rounded-3xl and frosted surface", () => {
      const promptLayout = fs.readFileSync(promptBarLayoutPath, "utf-8");
      expect(promptLayout).toMatch(/rounded-(3xl|\[20px\])/);
      expect(promptLayout).toContain("bg-white/5");
      expect(promptLayout).toMatch(/border-0|border-white\/10/);
    });

    it("configures LeftNavigationRail sidebar with rounded-2xl", () => {
      const rail = fs.readFileSync(leftRailPath, "utf-8");
      expect(rail).toContain("rounded-2xl");
      expect(rail).toContain("bg-transparent");
    });
  });
});
