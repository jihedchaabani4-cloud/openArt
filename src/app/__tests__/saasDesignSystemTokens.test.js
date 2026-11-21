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

  describe("3. Compact Studio Typography & Control-Sizing Distribution", () => {
    it("defines calibrated control typography tokens and .ds-text-control (+25% scale)", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/--type-size-control:\s*0\.92rem;/);
      expect(globals).toMatch(/--type-leading-control:\s*1\.3125rem;/);
      expect(globals).toContain(".ds-text-control");
    });

    it("uses unified compact 12px / 14px sizing across buttons, selects, inputs, icon buttons, menus, and sidebar nav items", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/\.ds-btn-primary\s*\{[^}]*height:\s*32px;[^}]*border-radius:\s*var\(--radius-row\);[^}]*font-size:\s*var\(--type-size-xs\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/);
      expect(globals).toMatch(/\.ds-btn-cta-lg\s*\{[^}]*height:\s*40px;[^}]*font-size:\s*var\(--type-size-sm\);[^}]*--ds-icon-size:\s*var\(--icon-size-lg\);/);
      expect(globals).toMatch(/\.ds-select-trigger\s*\{[^}]*height:\s*28px;[^}]*font-size:\s*var\(--type-size-xs\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/);
      expect(globals).toMatch(/\.ds-menu-item\s*\{[^}]*gap:\s*8px;[^}]*min-height:\s*30px;[^}]*padding:\s*5px 8px;[^}]*border-radius:\s*var\(--radius-row\);[^}]*font-size:\s*var\(--type-size-xs\);[^}]*font-weight:\s*var\(--type-weight-regular\);[^}]*line-height:\s*var\(--type-leading-xs\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/);
      expect(globals).toMatch(
        /\.ds-nav-item\s*\{[^}]*gap:\s*8px;[^}]*width:\s*100%;[^}]*height:\s*34px;[^}]*padding:\s*6px 8px;[^}]*border-radius:\s*var\(--radius-row\);[^}]*border:\s*1px solid transparent;[^}]*font-size:\s*var\(--type-size-sm\);[^}]*font-weight:\s*var\(--type-weight-medium\);[^}]*line-height:\s*var\(--type-leading-sm\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/
      );
      expect(globals).toMatch(
        /\.ds-nav-item:hover,\s*\.ds-nav-item\[data-active="true"\][^\{]*\{[^}]*background-color:\s*var\(--surface-nav-active\);[^}]*border-color:\s*var\(--border-structural\);/
      );
      expect(globals).toMatch(/--color-surface-nav-active:\s*var\(--surface-nav-active\);/);
      expect(globals).toMatch(/\.ds-input\s*\{[^}]*height:\s*28px;[^}]*font-size:\s*var\(--type-size-xs\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/);
      expect(globals).toMatch(/\.ds-badge\s*\{[^}]*font-size:\s*var\(--type-size-xxs\);/);
      expect(globals).toMatch(/\.ds-icon-btn\s*\{[^}]*width:\s*32px;\s*height:\s*32px;[^}]*border-radius:\s*var\(--radius-row\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/);
    });

    it("preserves .ds-icon-btn-overlay 32x32 10px radius and 16px->80px blur untouched", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/\.ds-icon-btn-overlay\s*\{[^}]*width:\s*32px;\s*height:\s*32px;[^}]*border-radius:\s*var\(--radius-control\);[^}]*backdrop-filter:\s*blur\(16px\)/);
      expect(globals).toMatch(/\.ds-icon-btn-overlay:hover:not\(:disabled\)\s*\{[^}]*backdrop-filter:\s*blur\(80px\)/);
    });
  });

  describe("4. Unified Compact Higgsfield Density Contract", () => {
    const extractBlock = (css, selector) => {
      const normalized = css.replace(/\r\n/g, "\n");
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = normalized.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
      return match ? match[1] : "";
    };

    it("enforces unified 12px text (var(--type-size-xs) / var(--type-leading-xs)) and 14px icons (var(--icon-size-sm)) across all compact studio controls", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      const unifiedTextAndIconSelectors = [
        ".ds-btn-primary",
        ".ds-btn-secondary",
        ".ds-btn-tonal",
        ".ds-btn-pill",
        ".ds-filter-chip",
        ".ds-btn-ghost",
        ".ds-btn-link",
        ".ds-btn-outline",
        ".ds-select-trigger",
        ".ds-menu-item",
        ".ds-input",
        ".ds-input-ghost",
        ".ds-input-accent,\n  .ds-input-search",
      ];

      for (const selector of unifiedTextAndIconSelectors) {
        const block = extractBlock(globals, selector);
        expect(block, `Missing CSS block for ${selector}`).toBeTruthy();
        expect(block, `${selector} must use --type-size-xs`).toContain("font-size: var(--type-size-xs);");
        expect(block, `${selector} must use --type-leading-xs`).toContain("line-height: var(--type-leading-xs);");
        expect(block, `${selector} must use --icon-size-sm`).toContain("--ds-icon-size: var(--icon-size-sm);");
      }

      const navBlock = extractBlock(globals, ".ds-nav-item");
      expect(navBlock, "Missing CSS block for .ds-nav-item").toBeTruthy();
      expect(navBlock).toContain("font-size: var(--type-size-sm);");
      expect(navBlock).toContain("line-height: var(--type-leading-sm);");
      expect(navBlock).toContain("--ds-icon-size: var(--icon-size-sm);");
    });

    it("enforces compact 32px/30px/34px button heights and 8px (--radius-row) radii", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");

      const h32Buttons = [
        ".ds-btn-primary",
        ".ds-btn-secondary",
        ".ds-btn-tonal",
        ".ds-filter-chip",
        ".ds-btn-ghost",
        ".ds-btn-outline",
      ];
      for (const selector of h32Buttons) {
        const block = extractBlock(globals, selector);
        expect(block, `${selector} height`).toContain("height: 32px;");
        expect(block, `${selector} radius`).toContain("border-radius: var(--radius-row);");
        expect(block, `${selector} gap`).toContain("gap: 6px;");
      }

      const pillBlock = extractBlock(globals, ".ds-btn-pill");
      expect(pillBlock).toContain("height: 30px;");
      expect(pillBlock).toContain("padding: 0 10px;");
      expect(pillBlock).toContain("border-radius: var(--radius-row);");

      const iconButtons = [
        ".ds-icon-btn",
        ".ds-icon-btn-tonal",
        ".ds-icon-btn-outline",
        ".ds-icon-btn-carousel",
      ];
      for (const selector of iconButtons) {
        const block = extractBlock(globals, selector);
        expect(block, `${selector} width`).toContain("width: 32px;");
        expect(block, `${selector} height`).toContain("height: 32px;");
        expect(block, `${selector} radius`).toContain("border-radius: var(--radius-row);");
        expect(block, `${selector} icon size`).toContain("--ds-icon-size: var(--icon-size-sm);");
      }

      expect(extractBlock(globals, ".ds-select-trigger")).toContain("height: 28px;");
      expect(extractBlock(globals, ".ds-input")).toContain("height: 28px;");
      expect(extractBlock(globals, ".ds-input-accent,\n  .ds-input-search")).toContain("height: 28px;");

      const navBlock = extractBlock(globals, ".ds-nav-item");
      expect(navBlock).toContain("height: 34px;");
      expect(navBlock).toContain("padding: 6px 8px;");
      expect(navBlock).toContain("gap: 8px;");
      expect(navBlock).toContain("border-radius: var(--radius-row);");

      const menuBlock = extractBlock(globals, ".ds-menu-item");
      expect(menuBlock).toContain("min-height: 30px;");
      expect(menuBlock).toContain("padding: 5px 8px;");
      expect(menuBlock).toContain("gap: 8px;");
      expect(menuBlock).toContain("border-radius: var(--radius-row);");
    });

    it("keeps overlay icon button, prompt bar glass, menu glass, and cta-lg guardrails intact", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");

      const overlayBlock = extractBlock(globals, ".ds-icon-btn-overlay");
      expect(overlayBlock).toContain("width: 32px;");
      expect(overlayBlock).toContain("height: 32px;");
      expect(overlayBlock).toContain("border-radius: var(--radius-control);");
      expect(overlayBlock).toContain("background-color: transparent;");
      expect(overlayBlock).toContain("--ds-icon-size: var(--icon-size-md);");

      const ctaLgBlock = extractBlock(globals, ".ds-btn-cta-lg");
      expect(ctaLgBlock).toContain("height: 40px;");
      expect(ctaLgBlock).toContain("font-size: var(--type-size-sm);");
      expect(ctaLgBlock).toContain("--ds-icon-size: var(--icon-size-lg);");

      expect(globals).toMatch(/--color-ui-menu-background:\s*rgba\(68,\s*68,\s*68,\s*0\.50\);/);
      expect(globals).toMatch(/--surface-menu-glass:\s*rgba\(35,\s*38,\s*42,\s*0\.75\);/);
      expect(extractBlock(globals, ".ds-composer-card")).toContain("background-color: var(--ui-menu-background);");
    });
  });
});
