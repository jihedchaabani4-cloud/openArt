import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("SaaS Dark UI Design System Tokens (DESIGN.md Alignment)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");
  const typographyCssPath = path.resolve(__dirname, "../../styles/tokens/typography.css");
  const textRolesCssPath = path.resolve(__dirname, "../../styles/tokens/text-roles.css");
  const iconsCssPath = path.resolve(__dirname, "../../styles/tokens/icons.css");
  const radiusCssPath = path.resolve(__dirname, "../../styles/tokens/radius.css");
  const promptBarLayoutPath = path.resolve(
    __dirname,
    "../../features/prompt-bar/model/core/promptBarLayout.js"
  );
  const leftRailPath = path.resolve(
    __dirname,
    "../../components/layout/LeftNavigationRail.jsx"
  );

  describe("1. Background, Surface & Single-Source Token Imports", () => {
    it("enforces --omni-bg (#121212), Inter --font-sans, and single-source token imports in globals.css", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toContain('@import "../styles/tokens/typography.css";');
      expect(globals).toContain('@import "../styles/tokens/text-roles.css";');
      expect(globals).toContain('@import "../styles/tokens/icons.css";');
      expect(globals).toContain('@import "../styles/tokens/radius.css";');
      expect(globals).toMatch(/--omni-bg:\s*#121212;/);
      expect(globals).toMatch(/--body-bg:\s*#121212;/);
      expect(globals).toMatch(/--color-bg-main:\s*#121212;/);
      expect(globals).toMatch(/--font-sans:\s*var\(--font-inter\)/);
      expect(globals).toMatch(/body\s*\{[^}]*background-color:\s*var\(--(omni|body)-bg\);/);
      expect(globals).toMatch(/body\s*\{[^}]*line-height:\s*var\(--type-body-leading\);/);
      expect(globals).not.toContain("--mantine-");
      expect(globals).not.toContain(".ds-floating-launcher");
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

  describe("2. Layout & Shell Geometry (Strict 4-Token Radius System)", () => {
    it("defines the strict 4-token border-radius system in radius.css", () => {
      const radius = fs.readFileSync(radiusCssPath, "utf-8");
      expect(radius).toContain("--radius-none: 0px;");
      expect(radius).toContain("--radius-sharp: 4px;");
      expect(radius).toContain("--radius-subtle: 6px;");
      expect(radius).toContain("--radius-comfortable: 8px;");
    });

    it("configures PromptBar container with rounded-comfortable, ds-composer-card, and surface-glass", () => {
      const promptLayout = fs.readFileSync(promptBarLayoutPath, "utf-8");
      expect(promptLayout).toContain("ds-composer-card");
      expect(promptLayout).toContain("surface-glass");
      expect(promptLayout).toContain("bg-surface-menu-glass");
      expect(promptLayout).toContain("rounded-comfortable");
    });

    it("configures LeftNavigationRail sidebar with rounded-comfortable and rounded-subtle controls", () => {
      const rail = fs.readFileSync(leftRailPath, "utf-8");
      expect(rail).toContain("rounded-comfortable");
      expect(rail).toContain("rounded-subtle");
      expect(rail).toContain("bg-transparent");
    });
  });

  describe("3. Canonical 10-Token Typography, Roles & Icon Scale", () => {
    it("defines the 10 canonical Tier 1 typography tokens and Tier 2 semantic roles", () => {
      const typography = fs.readFileSync(typographyCssPath, "utf-8");
      const textRoles = fs.readFileSync(textRolesCssPath, "utf-8");
      const icons = fs.readFileSync(iconsCssPath, "utf-8");

      for (const cls of [
        ".ds-type-display-hero",
        ".ds-type-section-heading",
        ".ds-type-sub-heading",
        ".ds-type-card-title",
        ".ds-type-feature-title",
        ".ds-type-body",
        ".ds-type-button",
        ".ds-type-caption-label",
        ".ds-type-small",
        ".ds-type-micro-tag",
      ]) {
        expect(typography).toContain(cls);
      }

      expect(textRoles).toContain(".ds-label");
      expect(textRoles).toContain(".ds-label-caption");
      expect(textRoles).toContain(".ds-label-primary");
      expect(textRoles).toContain(".ds-text-button");
      expect(textRoles).toContain(".ds-text-tab");

      expect(icons).toContain("--icon-optical-scale: 1.12;");
      expect(icons).toContain("--icon-size-2xs: 0.625rem;");
      expect(icons).toContain("--icon-size-3xl: 2.5rem;");
      expect(icons).toContain("--icon-weight-bold: 700;");
    });

    it("uses canonical Tier 1 typography, radius, and icon tokens across studio controls", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/\.ds-btn-primary\s*\{[^}]*height:\s*32px;[^}]*border-radius:\s*var\(--radius-subtle\);[^}]*font-size:\s*var\(--type-button-size\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/);
      expect(globals).toMatch(/\.ds-btn-cta-lg\s*\{[^}]*height:\s*40px;[^}]*border-radius:\s*var\(--radius-subtle\);[^}]*font-size:\s*var\(--type-button-size\);[^}]*--ds-icon-size:\s*var\(--icon-size-lg\);/);
      expect(globals).toMatch(/\.ds-select-trigger\s*\{[^}]*height:\s*28px;[^}]*border-radius:\s*var\(--radius-subtle\);[^}]*font-size:\s*var\(--type-small-size\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/);
      expect(globals).toMatch(/\.ds-menu-item\s*\{[^}]*gap:\s*8px;[^}]*min-height:\s*30px;[^}]*padding:\s*5px 8px;[^}]*border-radius:\s*var\(--radius-subtle\);[^}]*font-size:\s*var\(--type-small-size\);[^}]*font-weight:\s*var\(--type-small-weight\);[^}]*line-height:\s*var\(--type-small-leading\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/);
      expect(globals).toMatch(
        /\.ds-nav-item\s*\{[^}]*gap:\s*8px;[^}]*width:\s*100%;[^}]*height:\s*34px;[^}]*padding:\s*6px 9px;[^}]*border-radius:\s*var\(--radius-subtle\);[^}]*border:\s*1px solid transparent;[^}]*font-size:\s*var\(--type-caption-label-size\);[^}]*font-weight:\s*var\(--type-caption-label-weight\);[^}]*line-height:\s*var\(--type-caption-label-leading\);[^}]*--ds-icon-size:\s*var\(--icon-size-md\);/
      );
      expect(globals).toMatch(/--color-surface-nav-active:\s*var\(--surface-nav-active\);/);
      expect(globals).toMatch(/\.ds-input\s*\{[^}]*height:\s*28px;[^}]*border-radius:\s*var\(--radius-subtle\);[^}]*font-size:\s*var\(--type-small-size\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/);
      expect(globals).toMatch(/\.ds-badge\s*\{[^}]*border-radius:\s*var\(--radius-sharp\);[^}]*font-size:\s*var\(--type-micro-tag-size\);/);
      expect(globals).toMatch(/\.ds-icon-btn\s*\{[^}]*width:\s*32px;\s*height:\s*32px;[^}]*border-radius:\s*var\(--radius-subtle\);[^}]*--ds-icon-size:\s*var\(--icon-size-sm\);/);
    });

    it("preserves .ds-icon-btn-overlay 32x32 var(--radius-subtle) and 16px->80px blur", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      expect(globals).toMatch(/\.ds-icon-btn-overlay\s*\{[^}]*width:\s*32px;\s*height:\s*32px;[^}]*border-radius:\s*var\(--radius-subtle\);[^}]*backdrop-filter:\s*blur\(16px\)/);
      expect(globals).toMatch(/\.ds-icon-btn-overlay:hover:not\(:disabled\)\s*\{[^}]*backdrop-filter:\s*blur\(80px\)/);
    });
  });

  describe("4. Component Contract Consistency", () => {
    const extractBlock = (css, selector) => {
      const normalized = css.replace(/\r\n/g, "\n");
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = normalized.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
      return match ? match[1] : "";
    };

    it("enforces button typography (--type-button-*) on buttons and small typography (--type-small-*) on inputs/menus", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");
      const buttonSelectors = [
        ".ds-btn-primary",
        ".ds-btn-secondary",
        ".ds-btn-tonal",
        ".ds-btn-pill",
        ".ds-filter-chip",
        ".ds-btn-ghost",
        ".ds-btn-link",
        ".ds-btn-outline",
      ];
      for (const selector of buttonSelectors) {
        const block = extractBlock(globals, selector);
        expect(block, `Missing CSS block for ${selector}`).toBeTruthy();
        expect(block, `${selector} must use --type-button-size`).toContain("font-size: var(--type-button-size);");
        expect(block, `${selector} must use --type-button-leading`).toContain("line-height: var(--type-button-leading);");
        expect(block, `${selector} must use --icon-size-sm`).toContain("--ds-icon-size: var(--icon-size-sm);");
      }

      const smallControlSelectors = [
        ".ds-select-trigger",
        ".ds-menu-item",
        ".ds-input",
        ".ds-input-ghost",
        ".ds-input-accent,\n  .ds-input-search",
      ];
      for (const selector of smallControlSelectors) {
        const block = extractBlock(globals, selector);
        expect(block, `Missing CSS block for ${selector}`).toBeTruthy();
        expect(block, `${selector} must use --type-small-size`).toContain("font-size: var(--type-small-size);");
        expect(block, `${selector} must use --type-small-leading`).toContain("line-height: var(--type-small-leading);");
        expect(block, `${selector} must use --icon-size-sm`).toContain("--ds-icon-size: var(--icon-size-sm);");
      }

      const navBlock = extractBlock(globals, ".ds-nav-item");
      expect(navBlock, "Missing CSS block for .ds-nav-item").toBeTruthy();
      expect(navBlock).toContain("font-size: var(--type-caption-label-size);");
      expect(navBlock).toContain("line-height: var(--type-caption-label-leading);");
      expect(navBlock).toContain("--ds-icon-size: var(--icon-size-md);");
    });

    it("enforces canonical heights and var(--radius-subtle) radii across interactive controls", () => {
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
        expect(block, `${selector} radius`).toContain("border-radius: var(--radius-subtle);");
        expect(block, `${selector} gap`).toContain("gap: 6px;");
      }

      const pillBlock = extractBlock(globals, ".ds-btn-pill");
      expect(pillBlock).toContain("height: 30px;");
      expect(pillBlock).toContain("padding: 0 10px;");
      expect(pillBlock).toContain("border-radius: var(--radius-subtle);");

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
        expect(block, `${selector} radius`).toContain("border-radius: var(--radius-subtle);");
        expect(block, `${selector} icon size`).toContain("--ds-icon-size: var(--icon-size-sm);");
      }

      expect(extractBlock(globals, ".ds-select-trigger")).toContain("height: 28px;");
      expect(extractBlock(globals, ".ds-input")).toContain("height: 28px;");
      expect(extractBlock(globals, ".ds-input-accent,\n  .ds-input-search")).toContain("height: 28px;");

      const navBlock = extractBlock(globals, ".ds-nav-item");
      expect(navBlock).toContain("height: 34px;");
      expect(navBlock).toContain("padding: 6px 9px;");
      expect(navBlock).toContain("gap: 8px;");
      expect(navBlock).toContain("border-radius: var(--radius-subtle);");

      const menuBlock = extractBlock(globals, ".ds-menu-item");
      expect(menuBlock).toContain("min-height: 30px;");
      expect(menuBlock).toContain("padding: 5px 8px;");
      expect(menuBlock).toContain("gap: 8px;");
      expect(menuBlock).toContain("border-radius: var(--radius-subtle);");
    });

    it("keeps overlay icon button, composer card glass, menu glass, and cta-lg guardrails intact", () => {
      const globals = fs.readFileSync(globalsCssPath, "utf-8");

      const overlayBlock = extractBlock(globals, ".ds-icon-btn-overlay");
      expect(overlayBlock).toContain("width: 32px;");
      expect(overlayBlock).toContain("height: 32px;");
      expect(overlayBlock).toContain("border-radius: var(--radius-subtle);");
      expect(overlayBlock).toContain("background-color: transparent;");
      expect(overlayBlock).toContain("--ds-icon-size: var(--icon-size-md);");

      const ctaLgBlock = extractBlock(globals, ".ds-btn-cta-lg");
      expect(ctaLgBlock).toContain("height: 40px;");
      expect(ctaLgBlock).toContain("font-size: var(--type-button-size);");
      expect(ctaLgBlock).toContain("--ds-icon-size: var(--icon-size-lg);");

      expect(globals).toMatch(/--color-ui-menu-background:\s*rgba\(68,\s*68,\s*68,\s*0\.50\);/);
      expect(globals).toMatch(/--surface-menu-glass:\s*rgba\(35,\s*38,\s*42,\s*0\.75\);/);
      const composerBlock = extractBlock(globals, ".ds-composer-card");
      expect(composerBlock).toContain("border-radius: var(--radius-comfortable);");
      expect(composerBlock).toContain("background-color: var(--surface-menu-glass);");
    });
  });
});
