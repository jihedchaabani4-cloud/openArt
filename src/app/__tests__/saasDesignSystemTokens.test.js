import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("SaaS Design System Tokens & Hierarchy (Higgsfield Cinema Studio Alignment)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");
  const tokensPath = path.resolve(__dirname, "../tokens.css");
  const promptBarLayoutPath = path.resolve(
    __dirname,
    "../../features/prompt-bar/model/core/promptBarLayout.js"
  );
  const leftRailPath = path.resolve(
    __dirname,
    "../../widgets/StudioLayout/LeftNavigationRail.jsx"
  );

  describe("1. Background & Surface Ladder Hierarchy", () => {
    it("enforces #0F1113 as root canvas background across tokens and globals", () => {
      const tokens = fs.readFileSync(tokensPath, "utf-8");
      const globals = fs.readFileSync(globalsCssPath, "utf-8");

      expect(tokens).toMatch(/--bg-root:\s*#0F1113;/i);
      expect(tokens).toMatch(/--bg-page:\s*#131416;/i);
      expect(globals).toMatch(/background-color:\s*var\(--bg-root\);/);
      expect(globals).toMatch(/background-color:\s*var\(--bg-page\);/);
    });

    it("enforces #131416 as studio canvas / panel background and #1C1E20 as card / composer background", () => {
      const tokens = fs.readFileSync(tokensPath, "utf-8");

      expect(tokens).toMatch(/--bg-surface:\s*#1C1E20;/i);
      expect(tokens).toMatch(/--bg-surface-2:\s*#1C1E21;/i);
    });

    it("enforces lime accent #D1FE17 for brand surfaces and generate button", () => {
      const tokens = fs.readFileSync(tokensPath, "utf-8");
      expect(tokens).toMatch(/--brand:\s*#D1FE17;/i);
    });
  });

  describe("2. Border & Subtle Separator Hierarchy", () => {
    it("enforces rgba(255, 255, 255, 0.05) as subtle border across app", () => {
      const tokens = fs.readFileSync(tokensPath, "utf-8");
      expect(tokens).toMatch(/--border-subtle:\s*rgba\(255,\s*255,\s*255,\s*0\.05\);/);
    });
  });

  describe("3. Radius Scale Hierarchy", () => {
    it("enforces r-sm (8px), r-md (10px), r-lg (12px), r-xl (16px), r-2xl (20px), and r-3xl (24px) scale", () => {
      const tokens = fs.readFileSync(tokensPath, "utf-8");
      expect(tokens).toMatch(/--r-sm:\s*8px;/);
      expect(tokens).toMatch(/--r-md:\s*10px;/);
      expect(tokens).toMatch(/--r-lg:\s*12px;/);
      expect(tokens).toMatch(/--r-xl:\s*16px;/);
      expect(tokens).toMatch(/--r-2xl:\s*20px;/);
      expect(tokens).toMatch(/--r-3xl:\s*24px;/);
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
