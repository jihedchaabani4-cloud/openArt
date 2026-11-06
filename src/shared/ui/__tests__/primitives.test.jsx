import { describe, it, expect, beforeAll } from "vitest";
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
import { Slider } from "@/shared/ui/slider";
import { Switch } from "@/shared/ui/switch";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/shared/ui/select";

beforeAll(() => {
  if (typeof global.ResizeObserver === "undefined") {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

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
      expect(content.className).toContain("backdrop-blur-80");
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

  describe("9. Slider Primitive", () => {
    it("renders slider root with rounded-full track and thumb", () => {
      const { container } = render(<Slider defaultValue={[50]} />);
      const thumb = container.querySelector('[data-slot="slider-thumb"]');
      expect(thumb).not.toBeNull();
      expect(thumb?.className).toContain("rounded-full");
    });

    it("supports variant='bar' and size='sm'", () => {
      const { container } = render(<Slider variant="bar" size="sm" defaultValue={[20]} />);
      const root = container.querySelector('[data-slot="slider"]');
      expect(root).not.toBeNull();
      expect(root?.getAttribute("data-variant")).toBe("bar");
      expect(root?.getAttribute("data-size")).toBe("sm");
    });
  });

  describe("10. Switch Primitive", () => {
    it("renders switch with role='switch' and rounded-full track", () => {
      render(<Switch aria-label="Airplane Mode" />);
      const toggle = screen.getByRole("switch", { name: "Airplane Mode" });
      expect(toggle).toBeDefined();
      expect(toggle.className).toContain("rounded-full");
      expect(toggle.getAttribute("data-slot")).toBe("switch");
    });

    it("supports size='sm' and variant='neon'", () => {
      render(<Switch aria-label="Neon Toggle" variant="neon" size="sm" defaultChecked />);
      const toggle = screen.getByRole("switch", { name: "Neon Toggle" });
      expect(toggle.className).toContain("h-5");
      expect(toggle.getAttribute("data-variant")).toBe("neon");
      expect(toggle.getAttribute("data-state")).toBe("checked");
    });
  });

  describe("11. Dialog Primitive", () => {
    it("renders dialog content with canonical rounded-2xl token", () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Modal Heading</DialogTitle>
            <DialogDescription>Modal body description</DialogDescription>
            <p>Modal body copy</p>
          </DialogContent>
        </Dialog>
      );
      const title = screen.getByText("Modal Heading");
      expect(title).toBeDefined();
      const content = screen.getByText("Modal Heading").closest('[data-slot="dialog-content"]');
      expect(content).not.toBeNull();
      expect(content?.className).toContain("rounded-2xl");
      expect(content?.className).toContain("shadow-none");
    });
  });

  describe("12. Input Primitive", () => {
    it("renders standard input with sharp 4px radius", () => {
      render(<Input placeholder="Enter prompt..." />);
      const input = screen.getByPlaceholderText("Enter prompt...");
      expect(input).toBeDefined();
      expect(input.className).toContain("rounded-sm");
    });

    it("renders search variant container with icon support", () => {
      const { container } = render(
        <Input variant="search" placeholder="Search prompts..." googleIcon="search" />
      );
      const wrapper = container.querySelector('.rounded-sm');
      expect(wrapper).not.toBeNull();
      expect(screen.getByPlaceholderText("Search prompts...")).toBeDefined();
    });
  });

  describe("13. Select Primitive", () => {
    it("renders select trigger with sharp 4px radius", () => {
      render(
        <Select defaultValue="opt1">
          <SelectTrigger aria-label="Options">
            <SelectValue placeholder="Choose option" />
          </SelectTrigger>
        </Select>
      );
      const trigger = screen.getByRole("combobox", { name: "Options" });
      expect(trigger).toBeDefined();
      expect(trigger.className).toContain("rounded-sm");
      expect(trigger.getAttribute("data-slot")).toBe("select-trigger");
    });
  });
});
