import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("SaaS Design System Tokens & Hierarchy (Higgsfield / Supercomputer Alignment)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");
  const flowTokensPath = path.resolve(__dirname, "../google-flow-tokens.css");
  const promptBarLayoutPath = path.resolve(
    __dirname,
    "../../features/prompt-bar/model/core/promptBarLayout.js"
  );
  const leftRailPath = path.resolve(
    __dirname,
    "../../widgets/StudioLayout/LeftNavigationRail.jsx"
  );

  describe("1. Background & Surface Ladder Hierarchy", () => {
    it("enforces #0f1113 as root canvas background across html, body and tertiary tokens", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--surface-tertiary:\s*#0f1113;/);
      expect(globals).toMatch(/--color-surface-tertiary:\s*(var\(--surface-tertiary,\s*#0f1113\)|#0f1113);/);
      expect(globals).toMatch(/html\s*\{[^}]*background-color:\s*var\(--color-surface-tertiary,\s*#0f1113\);/);
    });

    it("enforces #131416 as studio canvas / panel background and #1c1e20 as card / composer background", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      const tokens = fs.readFileSync(flowTokensPath, "utf-8");

      expect(globals).toMatch(/--surface-panel:\s*#131416;/);
      expect(globals).toMatch(/--surface-card:\s*#1c1e20;/);
      expect(globals).toMatch(/--surface-elevated:\s*#1c1e20;/);
      expect(globals).toMatch(/--card:\s*var\(--surface-card,\s*#1c1e20\);/);
      expect(globals).toMatch(/--sidebar:\s*var\(--surface-panel,\s*#131416\);/);

      expect(tokens).toMatch(/--mat-sys-surface:\s*#131416;/);
      expect(tokens).toMatch(/--mat-sys-surface-container:\s*#1c1e20;/);
    });

    it("enforces lime accent #d1fe17 for brand surfaces, generate button and focus rings", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--color-lime:\s*(var\(--color-lime,\s*#d1fe17\)|#d1fe17);/);
      expect(globals).toMatch(/--primary:\s*#d1fe17;/);
      expect(globals).toMatch(/--ring:\s*#d1fe17;/);
      expect(globals).toMatch(/--sidebar-primary:\s*#d1fe17;/);
    });
  });

  describe("2. Border & Subtle Separator Hierarchy", () => {
    it("enforces rgba(255, 255, 255, 0.05) as subtle border and outline variant across app", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--border:\s*rgba\(255,\s*255,\s*255,\s*0\.05\);/);
      expect(globals).toMatch(/--outline-variant:\s*rgba\(255,\s*255,\s*255,\s*0\.05\);/);
      expect(globals).toMatch(/--line-subtle:\s*var\(--outline-variant\);/);
    });
  });

  describe("3. Radius Scale Hierarchy", () => {
    it("enforces rounded-lg (12px), rounded-xl (16px), rounded-2xl (20px), and rounded-3xl (24px) scale", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--radius-lg:\s*12px;/);
      expect(globals).toMatch(/--radius-xl:\s*16px;/);
      expect(globals).toMatch(/--radius-2xl:\s*20px;/);
      expect(globals).toMatch(/--radius-3xl:\s*24px;/);
      expect(globals).toMatch(/--card-border-radius:\s*var\(--radius-lg,\s*12px\);/);
      expect(globals).toMatch(/--panel-border-radius:\s*var\(--radius-xl,\s*16px\);/);
      expect(globals).toMatch(/--dialog-border-radius:\s*var\(--radius-xl,\s*16px\);/);
    });

    it("configures PromptBar container with rounded-[20px] and #1c1e20 surface", () => {
      const promptLayout = fs.readFileSync(promptBarLayoutPath, "utf-8");
      expect(promptLayout).toContain("rounded-[20px]");
      expect(promptLayout).toContain("bg-[#1c1e20]");
      expect(promptLayout).toContain("border-white/5");
    });

    it("configures LeftNavigationRail sidebar with rounded-2xl", () => {
      const rail = fs.readFileSync(leftRailPath, "utf-8");
      expect(rail).toContain("rounded-2xl");
      expect(rail).toContain("bg-transparent");
    });
  });
});
