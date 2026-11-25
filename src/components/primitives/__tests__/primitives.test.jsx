import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { Select, SelectTrigger, SelectValue } from "@/components/base/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/base/dropdown-menu";
import { PillTabs, PillTabsList, PillTabsTrigger, PillTabsContent } from "@/components/base/pill-tabs";
import { SectionCard } from "@/components/base/section-card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/base/accordion";
import { DashedUploadSlot } from "@/components/base/dashed-upload-slot";
import { InteractiveListRow } from "@/components/base/interactive-list-row";
import { Switch } from "@/components/base/switch";
import { Input } from "@/components/base/input";
import { Checkbox } from "@/components/base/checkbox";
import { Badge, StatusBanner } from "@/components/base/badge";

beforeAll(() => {
  if (typeof global.ResizeObserver === "undefined") {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

describe("12 Base UI Primitives & Official Variants Contract Suite", () => {
  describe("1. Button Solid & Variants", () => {
    it("maps every official button variant to its canonical .ds-* class", () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      const btn = screen.getByRole("button", { name: "Primary" });
      expect(btn.className).toContain("ds-btn-primary");
      expect(btn.className).toContain("focus-workspace");

      rerender(<Button variant="cta-lg">CTA Large</Button>);
      expect(screen.getByRole("button", { name: "CTA Large" }).className).toContain("ds-btn-cta-lg");

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole("button", { name: "Secondary" }).className).toContain("ds-btn-secondary");

      rerender(<Button variant="tonal">Tonal</Button>);
      expect(screen.getByRole("button", { name: "Tonal" }).className).toContain("ds-btn-tonal");

      rerender(<Button variant="pill">Pill</Button>);
      expect(screen.getByRole("button", { name: "Pill" }).className).toContain("ds-btn-pill");

      rerender(<Button variant="filter-chip">Filter</Button>);
      expect(screen.getByRole("button", { name: "Filter" }).className).toContain("ds-filter-chip");

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole("button", { name: "Ghost" }).className).toContain("ds-btn-ghost");

      rerender(<Button variant="link">Link</Button>);
      expect(screen.getByRole("button", { name: "Link" }).className).toContain("ds-btn-link");

      rerender(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole("button", { name: "Outline" }).className).toContain("ds-btn-outline");
    });
  });

  describe("2. IconButton Toolbar & Chrome Variants", () => {
    it("maps every official icon button variant to its canonical .ds-icon-btn-* class", () => {
      const { rerender } = render(<IconButton aria-label="Default Ghost" variant="ghost" />);
      const btn = screen.getByRole("button", { name: "Default Ghost" });
      expect(btn.className).toContain("ds-icon-btn");
      expect(btn.className).toContain("focus-chrome");

      rerender(<IconButton aria-label="Tonal Square" variant="tonal" />);
      expect(screen.getByRole("button", { name: "Tonal Square" }).className).toContain("ds-icon-btn-tonal");

      rerender(<IconButton aria-label="Outline Square" variant="outline" />);
      expect(screen.getByRole("button", { name: "Outline Square" }).className).toContain("ds-icon-btn-outline");

      rerender(<IconButton aria-label="Carousel Arrow" variant="carousel" />);
      expect(screen.getByRole("button", { name: "Carousel Arrow" }).className).toContain("ds-icon-btn-carousel");
    });
  });

  describe("3. Select & DropdownMenu Variants", () => {
    it("renders SelectTrigger with pill and default outline variants", () => {
      const { rerender } = render(
        <Select defaultValue="val1">
          <SelectTrigger variant="pill" aria-label="Pill Select">
            <SelectValue placeholder="Pill" />
          </SelectTrigger>
        </Select>
      );
      const pillTrigger = screen.getByRole("combobox", { name: "Pill Select" });
      expect(pillTrigger.className).toContain("ds-select-trigger");

      rerender(
        <Select defaultValue="val1">
          <SelectTrigger variant="outline" aria-label="Outline Select">
            <SelectValue placeholder="Outline" />
          </SelectTrigger>
        </Select>
      );
      const outlineTrigger = screen.getByRole("combobox", { name: "Outline Select" });
      expect(outlineTrigger.className).toContain("ds-btn-outline");
    });

    it("renders DropdownMenuContent with surface-glass and surface-listbox variants", () => {
      const { rerender } = render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent variant="glass">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const glassContent = screen.getByText("Item 1").closest('[data-slot="dropdown-menu-content"]');
      expect(glassContent?.className).toContain("surface-glass");

      rerender(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent variant="listbox">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      const listboxContent = screen.getByText("Item 1").closest('[data-slot="dropdown-menu-content"]');
      expect(listboxContent?.className).toContain("surface-listbox");
    });
  });

  describe("4. PillTabs Variants", () => {
    it("renders pill and composer tab triggers", () => {
      render(
        <PillTabs defaultValue="tab1">
          <PillTabsList variant="segmented">
            <PillTabsTrigger value="tab1" variant="pill">Pill Tab</PillTabsTrigger>
            <PillTabsTrigger value="tab2" variant="composer">Composer Tab</PillTabsTrigger>
          </PillTabsList>
          <PillTabsContent value="tab1">Pill Panel</PillTabsContent>
          <PillTabsContent value="tab2">Composer Panel</PillTabsContent>
        </PillTabs>
      );
      const list = screen.getByRole("tablist");
      expect(list.className).toContain("rounded-subtle");
      const pillTab = screen.getByRole("tab", { name: "Pill Tab" });
      expect(pillTab.className).toContain("ds-tab-pill");
      const compTab = screen.getByRole("tab", { name: "Composer Tab" });
      expect(compTab.className).toContain("ds-composer-tab");
    });
  });

  describe("5. SectionCard & Accordion Variants", () => {
    it("renders SectionCard frosted, composer, and media variants", () => {
      const { rerender } = render(<SectionCard variant="frosted" data-testid="card">Frosted</SectionCard>);
      expect(screen.getByTestId("card").className).toContain("ds-section-card");

      rerender(<SectionCard variant="composer" data-testid="card">Composer</SectionCard>);
      expect(screen.getByTestId("card").className).toContain("ds-composer-card");

      rerender(<SectionCard variant="media" data-testid="card">Media</SectionCard>);
      expect(screen.getByTestId("card").className).toContain("ds-media-card");
    });

    it("renders AccordionTrigger with .ds-accordion-trigger contract", () => {
      render(
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Section Accordion</AccordionTrigger>
            <AccordionContent>Accordion Body</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
      const trigger = screen.getByRole("button", { name: "Section Accordion" });
      expect(trigger.className).toContain("ds-accordion-trigger");
    });
  });

  describe("6. DashedUploadSlot Sizes & States", () => {
    it("renders square and aspect slots, handling disabled state", () => {
      const { rerender } = render(<DashedUploadSlot size="square" aria-label="Upload Square" />);
      const slot = screen.getByRole("button", { name: "Upload Square" });
      expect(slot.className).toContain("ds-upload-slot");
      expect(slot.className).toContain("size-16");

      rerender(<DashedUploadSlot size="aspect" aria-label="Upload Aspect" disabled />);
      const disabledSlot = screen.getByRole("button", { name: "Upload Aspect" });
      expect(disabledSlot.className).toContain("w-24");
      expect(disabledSlot.hasAttribute("disabled")).toBe(true);
    });
  });

  describe("7. InteractiveListRow Variants", () => {
    it("renders compact and thumbnail row variants", () => {
      const { rerender } = render(<InteractiveListRow variant="compact" data-testid="row">Compact Row</InteractiveListRow>);
      expect(screen.getByTestId("row").className).toContain("ds-list-row");

      rerender(<InteractiveListRow variant="thumbnail" data-testid="row">Thumbnail Row</InteractiveListRow>);
      expect(screen.getByTestId("row").className).toContain("ds-list-row");
      expect(screen.getByTestId("row").className).toContain("h-auto");
    });
  });

  describe("8. Switch, Input & Checkbox Controls", () => {
    it("renders Switch with .ds-switch class", () => {
      render(<Switch aria-label="Switch Test" />);
      const sw = screen.getByRole("switch", { name: "Switch Test" });
      expect(sw.className).toContain("ds-switch");
    });

    it("renders Input with default, search/accent, and ghost/composer variants", () => {
      const { rerender } = render(<Input placeholder="Default Input" />);
      expect(screen.getByPlaceholderText("Default Input").className).toContain("ds-input");

      rerender(<Input variant="search" placeholder="Search Input" />);
      expect(screen.getByPlaceholderText("Search Input")).toBeDefined();

      rerender(<Input variant="accent" placeholder="Accent Input" />);
      expect(screen.getByPlaceholderText("Accent Input")).toBeDefined();

      rerender(<Input variant="ghost" placeholder="Ghost Input" />);
      expect(screen.getByPlaceholderText("Ghost Input").className).toContain("bg-transparent");

      rerender(<Input variant="composer" placeholder="Composer Input" />);
      expect(screen.getByPlaceholderText("Composer Input").className).toContain("bg-transparent");
    });

    it("renders Checkbox with .ds-checkbox and circle variant", () => {
      const { rerender } = render(<Checkbox aria-label="Default Checkbox" />);
      const cb = screen.getByRole("checkbox", { name: "Default Checkbox" });
      expect(cb.className).toContain("ds-checkbox");

      rerender(<Checkbox aria-label="Circle Checkbox" variant="circle" />);
      const circleCb = screen.getByRole("checkbox", { name: "Circle Checkbox" });
      expect(circleCb.className).toContain("ds-checkbox-circle");
    });
  });

  describe("9. Badge & StatusBanner Variants", () => {
    it("renders Badge default, glass, and count variants", () => {
      const { rerender } = render(<Badge variant="default">Default Badge</Badge>);
      expect(screen.getByText("Default Badge").className).toContain("ds-badge");

      rerender(<Badge variant="glass">Glass Badge</Badge>);
      expect(screen.getByText("Glass Badge").className).toContain("ds-badge-glass");

      rerender(<Badge variant="count">3</Badge>);
      expect(screen.getByText("3").className).toContain("ds-badge-count");
    });

    it("renders StatusBanner with .ds-banner-accent class", () => {
      render(<StatusBanner data-testid="banner">Banner Info</StatusBanner>);
      expect(screen.getByTestId("banner").className).toContain("ds-banner-accent");
    });
  });
});
