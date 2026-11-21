import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HugeIcon, HUGE_ICON_SIZES } from "@/components/primitives/HugeIcon";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { Input } from "@/components/base/input";
import {
  renderMenuIcon,
  MenuRadioDotIcon,
  MenuSubChevronIcon,
  MenuItemContent,
} from "@/components/base/menu";
import { Select, SelectTrigger, SelectValue } from "@/components/base/select";
import { PillTabs, PillTabsList, PillTabsTrigger } from "@/components/base/pill-tabs";
import { Badge } from "@/components/base/badge";

describe("Canonical Icon Sizing & Base Component Text+Icon Defaults", () => {
  describe("1. HugeIcon token sizing & inheritance", () => {
    it("omits hardcoded text-xl and data-size by default so it inherits parent --ds-icon-size", () => {
      const { container } = render(<HugeIcon name="add-01" />);
      const icon = container.querySelector('[data-icon-provider="hugeicons"]');
      expect(icon).toBeTruthy();
      expect(icon.className).toContain("huge-icon");
      expect(icon.className).toContain("hgi");
      expect(icon.className).toContain("hgi-stroke");
      expect(icon.className).toContain("hgi-add-01");
      expect(icon.getAttribute("data-icon-name")).toBe("add-01");
      expect(icon.className).not.toContain("text-xl");
      expect(icon.className).not.toContain("ds-icon-");
      expect(icon.getAttribute("data-size")).toBeNull();
    });

    it("applies token utility class and data-size when size prop is explicitly provided", () => {
      for (const [size, expectedClass] of Object.entries(HUGE_ICON_SIZES)) {
        const { container, unmount } = render(<HugeIcon name="star" size={size} />);
        const icon = container.querySelector('[data-icon-provider="hugeicons"]');
        expect(icon.className).toContain(expectedClass);
        expect(icon.getAttribute("data-size")).toBe(size);
        unmount();
      }
    });

    it("preserves explicit className overrides for large empty-state icons", () => {
      const { container } = render(<HugeIcon name="image-01" className="text-3xl" />);
      const icon = container.querySelector('[data-icon-provider="hugeicons"]');
      expect(icon.className).toContain("text-3xl");
      expect(icon.className).not.toContain("ds-icon-");
    });
  });

  describe("2. Button text + icon size pairings", () => {
    it("maps size variants to matched typography and --ds-icon-size tokens", () => {
      const { rerender } = render(
        <Button size="xs">
          <HugeIcon name="add-01" />
          <span>Micro</span>
        </Button>
      );
      let btn = screen.getByRole("button", { name: /Micro/i });
      expect(btn.getAttribute("data-size")).toBe("xs");
      expect(btn.className).toContain("ds-text-caption-s");
      expect(btn.className).toContain("[--ds-icon-size:var(--icon-size-xs)]");

      rerender(
        <Button size="sm">
          <HugeIcon name="add-01" />
          <span>Compact</span>
        </Button>
      );
      btn = screen.getByRole("button", { name: /Compact/i });
      expect(btn.getAttribute("data-size")).toBe("sm");
      expect(btn.className).toContain("ds-text-caption-m");
      expect(btn.className).toContain("[--ds-icon-size:var(--icon-size-sm)]");

      rerender(
        <Button size="lg">
          <HugeIcon name="add-01" />
          <span>Large CTA</span>
        </Button>
      );
      btn = screen.getByRole("button", { name: /Large CTA/i });
      expect(btn.getAttribute("data-size")).toBe("lg");
      expect(btn.className).toContain("ds-text-caption-l");
      expect(btn.className).toContain("[--ds-icon-size:var(--icon-size-lg)]");

      rerender(
        <Button size="icon" aria-label="Icon only">
          <HugeIcon name="settings-02" />
        </Button>
      );
      btn = screen.getByRole("button", { name: "Icon only" });
      expect(btn.getAttribute("data-size")).toBe("icon");
      expect(btn.className).toContain("size-8");
      expect(btn.className).toContain("[--ds-icon-size:var(--icon-size-sm)]");

      rerender(
        <Button variant="nav">
          <span className="relative size-4 flex items-center justify-center shrink-0">
            <HugeIcon name="image-02" />
          </span>
          <span>Assets</span>
        </Button>
      );
      btn = screen.getByRole("button", { name: /Assets/i });
      expect(btn.getAttribute("data-variant")).toBe("nav");
      expect(btn.className).toContain("ds-nav-item");
      expect(btn.className).toContain("rounded-lg");
      expect(btn.className).not.toContain("rounded-2xl");
      expect(btn.className).not.toContain("h-8");
    });
  });

  describe("3. IconButton sizes & overlay guardrail", () => {
    it("defaults to md (32x32 toolbar / 32x32 overlay via .ds-icon-btn*) and supports xs/sm/lg", () => {
      const { rerender } = render(
        <IconButton variant="overlay" aria-label="Overlay Action">
          <HugeIcon name="favourite" />
        </IconButton>
      );
      let btn = screen.getByRole("button", { name: "Overlay Action" });
      expect(btn.className).toContain("ds-icon-btn-overlay");
      expect(btn.getAttribute("data-size")).toBe("md");
      expect(btn.className).not.toContain("size-6");
      expect(btn.className).not.toContain("size-8");

      rerender(
        <IconButton variant="ghost" size="xs" aria-label="XS Action">
          <HugeIcon name="cancel-01" />
        </IconButton>
      );
      btn = screen.getByRole("button", { name: "XS Action" });
      expect(btn.className).toContain("size-6");
      expect(btn.className).toContain("[--ds-icon-size:var(--icon-size-xs)]");

      rerender(
        <IconButton variant="ghost" size="sm" aria-label="SM Action">
          <HugeIcon name="cancel-01" />
        </IconButton>
      );
      btn = screen.getByRole("button", { name: "SM Action" });
      expect(btn.className).toContain("size-8");
      expect(btn.className).toContain("[--ds-icon-size:var(--icon-size-sm)]");

      rerender(
        <IconButton variant="ghost" size="lg" aria-label="LG Action">
          <HugeIcon name="cancel-01" />
        </IconButton>
      );
      btn = screen.getByRole("button", { name: "LG Action" });
      expect(btn.className).toContain("size-10");
      expect(btn.className).toContain("[--ds-icon-size:var(--icon-size-lg)]");
    });
  });

  describe("4. Input, Menu, Select, PillTabs & Badge icon contracts", () => {
    it("renders Input leading and clear/edit icons without hardcoded text-base overrides", () => {
      const { container } = render(
        <Input
          variant="search"
          value="query"
          onChange={() => {}}
          onClear={() => {}}
          showEditButton
        />
      );
      const icons = container.querySelectorAll('[data-icon-provider="hugeicons"]');
      expect(icons.length).toBe(3); // search-01, cancel-01, pencil-edit-02
      icons.forEach((icon) => {
        expect(icon.className).not.toContain("text-base");
        expect(icon.className).not.toContain("text-lg");
        expect(icon.className).not.toContain("text-xl");
      });
      const clearBtn = screen.getByRole("button", { name: "Clear input" });
      expect(clearBtn.className).toContain("[--ds-icon-size:var(--icon-size-sm)]");
      const editBtn = screen.getByRole("button", { name: "Edit" });
      expect(editBtn.className).toContain("[--ds-icon-size:var(--icon-size-sm)]");
    });

    it("renders Input custom SVG icon at 14px (size-3.5)", () => {
      const CustomSvg = (props) => <svg data-testid="custom-input-svg" {...props} />;
      render(<Input icon={CustomSvg} placeholder="With SVG" />);
      expect(screen.getByTestId("custom-input-svg").getAttribute("class")).toContain("size-3.5");
    });

    it("renders Menu leading icons inheriting 14px (.ds-menu-item --icon-size-sm), check/chevron at 14px, radio dot at 12px, all text-icon-primary", () => {
      const { container } = render(
        <div className="ds-menu-item">
          <MenuItemContent icon="pencil-edit-02" checked>
            Rename
          </MenuItemContent>
          <MenuRadioDotIcon />
          <MenuSubChevronIcon />
          {renderMenuIcon("delete-02")}
        </div>
      );
      const icons = Array.from(container.querySelectorAll('[data-icon-provider="hugeicons"]'));
      expect(icons.length).toBe(5); // pencil-edit-02, tick-02, circle, arrow-right-01, delete-02
      const [editIcon, checkIcon, radioIcon, chevronIcon, deleteIcon] = icons;
      for (const inherited of [editIcon, deleteIcon]) {
        expect(inherited.className).not.toContain("text-base");
        expect(inherited.className).not.toContain("text-lg");
        expect(inherited.className).not.toContain("text-xl");
        expect(inherited.className).not.toContain("text-sm");
        expect(inherited.getAttribute("data-size")).toBeNull();
        expect(inherited.className).toContain("hgi-stroke");
      }
      expect(checkIcon.className).toContain("ds-icon-sm");
      expect(checkIcon.className).toContain("text-icon-primary");
      expect(chevronIcon.className).toContain("ds-icon-sm");
      expect(chevronIcon.className).toContain("text-icon-primary");
      expect(radioIcon.className).toContain("ds-icon-xs");
      expect(radioIcon.className).toContain("text-icon-primary");
      expect(radioIcon.getAttribute("data-size")).toBe("xs");
    });

    it("renders SelectTrigger chevron inheriting .ds-select-trigger without hardcoded text-base", () => {
      const { container } = render(
        <Select defaultValue="a">
          <SelectTrigger variant="pill" aria-label="Choose">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );
      const chevron = container.querySelector('[data-icon-provider="hugeicons"]');
      expect(chevron).toBeTruthy();
      expect(chevron.className).not.toContain("text-base");
      expect(chevron.className).not.toContain("text-xl");
    });

    it("keeps PillTabs and Badge icons clean to inherit .ds-tab-pill and .ds-badge tokens", () => {
      const { container } = render(
        <div>
          <PillTabs defaultValue="t1">
            <PillTabsList>
              <PillTabsTrigger value="t1">
                <HugeIcon name="image-02" />
                <span>Images</span>
              </PillTabsTrigger>
            </PillTabsList>
          </PillTabs>
          <Badge>
            <HugeIcon name="sparkles" />
            <span>Pro</span>
          </Badge>
        </div>
      );
      const icons = container.querySelectorAll('[data-icon-provider="hugeicons"]');
      expect(icons.length).toBe(2);
      icons.forEach((icon) => {
        expect(icon.className).not.toContain("text-xl");
        expect(icon.getAttribute("data-size")).toBeNull();
      });
    });
  });

  describe("5. globals.css canonical icon scale & overlay guardrails", () => {
    const css = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/globals.css"),
      "utf8"
    );

    it("defines the 5 canonical --icon-size-* tokens (+25% scale) and .ds-icon-* utilities", () => {
      expect(css).toContain("--icon-size-xs: 0.92rem;");
      expect(css).toContain("--icon-size-sm: 1.0625rem;");
      expect(css).toContain("--icon-size-md: 1.1875rem;");
      expect(css).toContain("--icon-size-lg: 1.3125rem;");
      expect(css).toContain("--icon-size-xl: 1.5625rem;");
      expect(css).toContain(".ds-icon-xs");
      expect(css).toContain(".ds-icon-sm");
      expect(css).toContain(".ds-icon-md");
      expect(css).toContain(".ds-icon-lg");
      expect(css).toContain(".ds-icon-xl");
    });

    it("binds .huge-icon unlayered and sizes SVGs via --ds-icon-size", () => {
      expect(css).toMatch(/\.huge-icon\s*\{[\s\S]*font-size:\s*calc\(var\(--ds-icon-size,\s*var\(--icon-size-md\)\)\s*\*\s*1\.12\);/);
      expect(css).not.toContain(".google-symbols");
      expect(css).toContain('svg:not([class*="size-"]):not([class*="w-"])');
    });

    it("strictly preserves .ds-icon-btn-overlay surface and hover blur contract", () => {
      const overlayMatch = css.match(/\.ds-icon-btn-overlay\s*\{[\s\S]*?\}/);
      expect(overlayMatch).toBeTruthy();
      expect(overlayMatch[0]).toContain("width: 32px;");
      expect(overlayMatch[0]).toContain("height: 32px;");
      expect(overlayMatch[0]).toContain("border-radius: var(--radius-control);");
      expect(overlayMatch[0]).toContain("background-color: transparent;");
      expect(overlayMatch[0]).toContain("backdrop-filter: blur(16px) brightness(0.82) saturate(150%);");
      expect(overlayMatch[0]).toContain("--ds-icon-size: var(--icon-size-md);");
      expect(css).toContain("backdrop-filter: blur(80px) brightness(0.55) saturate(190%);");
    });

    it("declares .ds-text-* after .ds-btn-* inside @layer components so Button size modifiers override button defaults", () => {
      const btnPrimaryIdx = css.indexOf(".ds-btn-primary {");
      const btnCtaLgIdx = css.indexOf(".ds-btn-cta-lg {");
      const captionSIdx = css.indexOf(".ds-text-caption-s {");
      const captionMIdx = css.indexOf(".ds-text-caption-m {");
      const captionLIdx = css.indexOf(".ds-text-caption-l {");
      expect(btnPrimaryIdx).toBeGreaterThan(-1);
      expect(btnCtaLgIdx).toBeGreaterThan(-1);
      expect(captionSIdx).toBeGreaterThan(btnPrimaryIdx);
      expect(captionSIdx).toBeGreaterThan(btnCtaLgIdx);
      expect(captionMIdx).toBeGreaterThan(btnCtaLgIdx);
      expect(captionLIdx).toBeGreaterThan(btnPrimaryIdx);
    });

    it("does not load unlayered Google/Material Symbols stylesheets in root layout.js", () => {
      const layout = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/layout.js"),
        "utf8"
      );
      expect(layout).not.toMatch(/fonts\.googleapis\.com\/css2\?family=Material\+Symbols\+Outlined/);
      expect(layout).not.toMatch(/fonts\.googleapis\.com\/css2\?family=Google\+Symbols/);
    });
  });
});
