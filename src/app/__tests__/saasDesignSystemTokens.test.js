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
    it("enforces --omni-bg (#121212) and root canvas background in globals.css", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--omni-bg:\s*#121212;/);
      expect(globals).toMatch(/--body-bg:\s*#121212;/);
      expect(globals).toMatch(/--color-bg-main:\s*#121212;/);
      expect(globals).toMatch(/body\s*\{[^}]*background-color:\s*var\(--(omni|body)-bg\);/);
    });

    it("enforces pure white primary CTA & secondary surface #27272A", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--primary-foreground:\s*0\s*0\s*0;|--primary-foreground:\s*240\s*5\.9%\s*10%;/);
      expect(globals).toMatch(/--surface-secondary:\s*#27272A;|--secondary:\s*240\s*3\.7%\s*15\.9%;/);
    });

    it("enforces .surface-glass and --color-ui-menu-background with 40px blur", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toContain(".surface-glass");
      expect(globals).toMatch(/--color-ui-menu-background:\s*rgba\(68,\s*68,\s*68,\s*0\.50?\);/);
      expect(globals).toMatch(/backdrop-filter:\s*blur\(var\(--blur,\s*40px\)\);/);
    });
  });

  describe("2. Layout & Shell Geometry", () => {
    it("configures PromptBar container with rounded-3xl / rounded-[var(--radius-3xl)] and bg-ui-menu-background p-2 [--blur:40px]", () => {
      const promptLayout = fs.readFileSync(promptBarLayoutPath, "utf-8");
      expect(promptLayout).toMatch(/rounded-(3xl|\[var\(--radius-3xl\)\]|\[20px\])/);
      expect(promptLayout).toContain("ds-composer-card");
      expect(promptLayout).toContain("bg-ui-menu-background p-2 [--blur:40px]");
      expect(promptLayout).toMatch(/border-(border-weak|white\/\[0\.08\])/);
    });

    it("configures LeftNavigationRail sidebar with rounded-2xl", () => {
      const rail = fs.readFileSync(leftRailPath, "utf-8");
      expect(rail).toContain("rounded-2xl");
      expect(rail).toContain("bg-transparent");
    });
  });
});
