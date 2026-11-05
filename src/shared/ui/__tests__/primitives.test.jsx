import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { Checkbox } from "@/shared/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";

describe("Canonical Design System Primitives Suite", () => {
  describe("1. Checkbox Primitive", () => {
    it("renders with role='checkbox' and canonical token rounded-sm", () => {
      render(<Checkbox aria-label="Accept Terms" />);
      const checkbox = screen.getByRole("checkbox", { name: "Accept Terms" });
      expect(checkbox).toBeDefined();
      expect(checkbox.className).toContain("rounded-sm");
      expect(checkbox.getAttribute("data-slot")).toBe("checkbox");
    });

    it("supports size='lg' and variant='neon'", () => {
      render(<Checkbox aria-label="Neon Checkbox" variant="neon" size="lg" defaultChecked />);
      const checkbox = screen.getByRole("checkbox", { name: "Neon Checkbox" });
      expect(checkbox.className).toContain("size-5");
      expect(checkbox.getAttribute("data-variant")).toBe("neon");
      expect(checkbox.getAttribute("data-size")).toBe("lg");
    });
  });

  describe("2. RadioGroup Primitive", () => {
    it("renders radiogroup with accessible radio items", () => {
      render(
        <RadioGroup defaultValue="opt1">
          <RadioGroupItem value="opt1" aria-label="Option 1" />
          <RadioGroupItem value="opt2" aria-label="Option 2" />
        </RadioGroup>
      );
      const group = screen.getByRole("radiogroup");
      expect(group).toBeDefined();
      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(2);
      expect(radios[0].getAttribute("data-state")).toBe("checked");
      expect(radios[1].getAttribute("data-state")).toBe("unchecked");
    });

    it("supports variant='neon' and size='lg'", () => {
      render(
        <RadioGroup defaultValue="neon1">
          <RadioGroupItem value="neon1" aria-label="Neon 1" variant="neon" size="lg" />
        </RadioGroup>
      );
      const radio = screen.getByRole("radio", { name: "Neon 1" });
      expect(radio.className).toContain("size-5");
      expect(radio.getAttribute("data-variant")).toBe("neon");
    });
  });

  describe("3. Tooltip Primitive", () => {
    it("renders trigger and tooltip content container", () => {
      render(
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button">Hover Me</button>
          </TooltipTrigger>
          <TooltipContent>Helpful info</TooltipContent>
        </Tooltip>
      );
      const button = screen.getByRole("button", { name: "Hover Me" });
      expect(button).toBeDefined();
    });
  });

  describe("4. Popover Primitive", () => {
    it("renders trigger and accessible popover root", () => {
      render(
        <Popover open={true}>
          <PopoverTrigger asChild>
            <button type="button">Filter</button>
          </PopoverTrigger>
          <PopoverContent>Filter Settings</PopoverContent>
        </Popover>
      );
      expect(screen.getByText("Filter Settings")).toBeDefined();
      const content = screen.getByText("Filter Settings").closest('[data-slot="popover-content"]');
      expect(content).not.toBeNull();
      expect(content.className).toContain("rounded-lg");
      expect(content.className).toContain("backdrop-blur-md");
    });
  });

  describe("5. Tabs Primitive", () => {
    it("renders tabs with pills variant as default", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Overview</TabsTrigger>
            <TabsTrigger value="tab2">Media</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Overview Panel</TabsContent>
          <TabsContent value="tab2">Media Panel</TabsContent>
        </Tabs>
      );
      expect(screen.getByRole("tablist")).toBeDefined();
      const tab1 = screen.getByRole("tab", { name: "Overview" });
      expect(tab1.getAttribute("data-state")).toBe("active");
      expect(screen.getByText("Overview Panel")).toBeDefined();
    });

    it("supports variant='studio' with uppercase tracking", () => {
      render(
        <Tabs defaultValue="gen">
          <TabsList variant="studio">
            <TabsTrigger value="gen">Generations</TabsTrigger>
          </TabsList>
          <TabsContent value="gen">Studio Content</TabsContent>
        </Tabs>
      );
      const tab = screen.getByRole("tab", { name: "Generations" });
      expect(tab.className).toContain("tracking-wider");
      expect(tab.className).toContain("uppercase");
    });
  });

  describe("6. Card Primitive", () => {
    it("renders card with header, title, description, content, and footer", () => {
      render(
        <Card variant="interactive">
          <CardHeader>
            <CardTitle>Asset Title</CardTitle>
            <CardDescription>Created yesterday</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Body Content</p>
          </CardContent>
          <CardFooter>
            <button type="button">Action</button>
          </CardFooter>
        </Card>
      );
      const card = screen.getByText("Asset Title").closest('[data-slot="card"]');
      expect(card).not.toBeNull();
      expect(card.className).toContain("rounded-lg");
      expect(card.className).toContain("hover:bg-white/10");
      expect(screen.getByText("Created yesterday")).toBeDefined();
      expect(screen.getByText("Body Content")).toBeDefined();
    });
  });

  describe("7. Badge Primitive", () => {
    it("renders badge with rounded-sm and canonical variants", () => {
      const { rerender } = render(<Badge variant="default">New</Badge>);
      const badge = screen.getByText("New");
      expect(badge.className).toContain("rounded-sm");
      expect(badge.className).toContain("h-5");

      rerender(<Badge variant="neon">Pro</Badge>);
      expect(screen.getByText("Pro").className).toContain("bg-lime-400");

      rerender(<Badge variant="success" size="sm">Active</Badge>);
      const successBadge = screen.getByText("Active");
      expect(successBadge.className).toContain("text-emerald-300");
      expect(successBadge.className).toContain("h-4");
    });
  });

  describe("8. Skeleton Primitive", () => {
    it("renders skeleton with shimmer and canonical shape", () => {
      render(<Skeleton variant="shimmer" shape="card" data-testid="test-skeleton" />);
      const skeleton = screen.getByTestId("test-skeleton");
      expect(skeleton.className).toContain("animate-shimmer");
      expect(skeleton.className).toContain("rounded-lg");
    });
  });
});
