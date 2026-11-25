import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HugeIcon, HUGE_ICON_SIZES, HUGE_ICON_WEIGHTS } from "@/components/primitives/HugeIcon";
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
      expect(Object.keys(HUGE_ICON_SIZES)).toEqual([
        "2xs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "2xl",
        "3xl",
      ]);
      for (const [size, expectedClass] of Object.entries(HUGE_ICON_SIZES)) {
        const { container, unmount } = render(<HugeIcon name="star" size={size} />);
        const icon = container.querySelector('[data-icon-provider="hugeicons"]');
        expect(icon.className).toContain(expectedClass);
        expect(icon.getAttribute("data-size")).toBe(size);
        unmount();
      }
    });

    it("applies token weight utility class and data-weight when weight prop is explicitly provided", () => {
      expect(Object.keys(HUGE_ICON_WEIGHTS)).toEqual([
        "light",
        "regular",
        "medium",
        "bold",
      ]);
      for (const [weight, expectedClass] of Object.entries(HUGE_ICON_WEIGHTS)) {
        const { container, unmount } = render(<HugeIcon name="tick-02" size="sm" weight={weight} />);
        const icon = container.querySelector('[data-icon-provider="hugeicons"]');
        expect(icon.className).toContain(expectedClass);
        expect(icon.getAttribute("data-weight")).toBe(weight);
        unmount();
      }
    });

    it("preserves explicit className overrides alongside token sizing", () => {
      const { container } = render(<HugeIcon name="image-01" size="2xl" className="text-text-secondary" />);
      const icon = container.querySelector('[data-icon-provider="hugeicons"]');
      expect(icon.className).toContain("ds-icon-2xl");
      expect(icon.className).toContain("text-text-secondary");
      expect(icon.getAttribute("data-size")).toBe("2xl");
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
      expect(btn.className).toContain("ds-type-micro-tag");
      expect(btn.className).toContain("[--ds-icon-size:var(--icon-size-xs)]");

      rerender(
        <Button size="sm">
          <HugeIcon name="add-01" />
          <span>Compact</span>
        </Button>
      );
      btn = screen.getByRole("button", { name: /Compact/i });
      expect(btn.getAttribute("data-size")).toBe("sm");
      expect(btn.className).toContain("ds-type-small");
      expect(btn.className).toContain("[--ds-icon-size:var(--icon-size-sm)]");

      rerender(
        <Button size="lg">
          <HugeIcon name="add-01" />
          <span>Large CTA</span>
        </Button>
      );
      btn = screen.getByRole("button", { name: /Large CTA/i });
      expect(btn.getAttribute("data-size")).toBe("lg");
      expect(btn.className).toContain("ds-type-button");
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
      expect(btn.className).toContain("rounded-subtle");
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

  describe("5. icons.css & globals.css canonical icon scale & overlay guardrails", () => {
    const css = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/globals.css"),
      "utf8"
    );
    const iconsCss = fs.readFileSync(
      path.resolve(process.cwd(), "src/styles/tokens/icons.css"),
      "utf8"
    );

    it("imports icons.css in globals.css and defines all 8 --icon-size-* and 4 --icon-weight-*/--icon-stroke-* tokens", () => {
      expect(css).toContain('@import "../styles/tokens/icons.css";');
      expect(css).not.toContain("--icon-size-xs:");
      expect(css).not.toContain(".ds-icon-xs");
      expect(iconsCss).toContain("--icon-optical-scale: 1.12;");
      expect(iconsCss).toContain("--icon-size-2xs: 0.625rem;");
      expect(iconsCss).toContain("--icon-size-xs: 0.75rem;");
      expect(iconsCss).toContain("--icon-size-sm: 0.875rem;");
      expect(iconsCss).toContain("--icon-size-md: 1rem;");
      expect(iconsCss).toContain("--icon-size-lg: 1.25rem;");
      expect(iconsCss).toContain("--icon-size-xl: 1.5rem;");
      expect(iconsCss).toContain("--icon-size-2xl: 2rem;");
      expect(iconsCss).toContain("--icon-size-3xl: 2.5rem;");
      expect(iconsCss).toContain("--icon-weight-light: 300;");
      expect(iconsCss).toContain("--icon-stroke-light: 1.25;");
      expect(iconsCss).toContain("--icon-weight-regular: 400;");
      expect(iconsCss).toContain("--icon-stroke-regular: 1.5;");
      expect(iconsCss).toContain("--icon-weight-medium: 500;");
      expect(iconsCss).toContain("--icon-stroke-medium: 1.75;");
      expect(iconsCss).toContain("--icon-weight-bold: 700;");
      expect(iconsCss).toContain("--icon-stroke-bold: 2.25;");
      for (const cls of Object.values(HUGE_ICON_SIZES)) {
        expect(iconsCss).toContain(`.${cls}`);
      }
      for (const cls of Object.values(HUGE_ICON_WEIGHTS)) {
        expect(iconsCss).toContain(`.${cls}`);
      }
    });

    it("binds .huge-icon unlayered in icons.css and sizes SVGs via --ds-icon-size in globals.css", () => {
      expect(iconsCss).toMatch(/\.huge-icon\s*\{[\s\S]*font-size:\s*calc\(var\(--ds-icon-size,\s*var\(--icon-size-md\)\)\s*\*\s*var\(--icon-optical-scale\)\);/);
      expect(iconsCss).toMatch(/\.huge-icon\s*\{[\s\S]*font-weight:\s*var\(--ds-icon-weight,\s*var\(--icon-weight-regular\)\);/);
      expect(css).not.toContain(".google-symbols");
      expect(css).toContain('svg:not([class*="size-"]):not([class*="w-"])');
    });

    it("strictly preserves .ds-icon-btn-overlay surface and hover blur contract", () => {
      const overlayMatch = css.match(/\.ds-icon-btn-overlay\s*\{[\s\S]*?\}/);
      expect(overlayMatch).toBeTruthy();
      expect(overlayMatch[0]).toContain("width: 32px;");
      expect(overlayMatch[0]).toContain("height: 32px;");
      expect(overlayMatch[0]).toContain("border-radius: var(--radius-subtle);");
      expect(overlayMatch[0]).toContain("background-color: transparent;");
      expect(overlayMatch[0]).toContain("backdrop-filter: blur(16px) brightness(0.82) saturate(150%);");
      expect(overlayMatch[0]).toContain("--ds-icon-size: var(--icon-size-md);");
      expect(css).toContain("backdrop-filter: blur(80px) brightness(0.55) saturate(190%);");
    });

    it("imports canonical typography.css with @layer utilities .ds-type-* classes so Button size modifiers override @layer components .ds-btn-* defaults", () => {
      const typographyCss = fs.readFileSync(
        path.resolve(process.cwd(), "src/styles/tokens/typography.css"),
        "utf8"
      );
      expect(css).toContain('@import "../styles/tokens/typography.css";');
      expect(css).toContain(".ds-btn-primary {");
      expect(css).toContain(".ds-btn-cta-lg {");
      expect(typographyCss).toContain("@layer utilities");
      expect(typographyCss).toContain(".ds-type-micro-tag {");
      expect(typographyCss).toContain(".ds-type-small {");
      expect(typographyCss).toContain(".ds-type-button {");
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
