import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/shared/ui/select";
import { DropdownShell, DropdownSegmented } from "@/shared/ui/DropdownShell";

describe("Form Controls & Menus — Runway Flat Surface Architecture", () => {
  describe("1. Input Primitive", () => {
    it("renders search variant with sharp 4px radius, flat surface, and hairline border", () => {
      const { container } = render(
        <Input variant="search" placeholder="Search prompts..." />
      );
      const wrapper = container.querySelector(".rounded-sm");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.className).toContain("bg-surface-card");
      expect(wrapper?.className).toContain("border-white/10");
      expect(wrapper?.className).not.toContain("backdrop-blur");
    });

    it("renders blurinput variant with flat surface and without GPU-heavy blur", () => {
      const { container } = render(
        <Input variant="blurinput" placeholder="Prompt label" />
      );
      const wrapper = container.querySelector(".rounded-sm");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.className).toContain("bg-surface-card");
      expect(wrapper?.className).toContain("border-white/10");
      expect(wrapper?.className).not.toContain("backdrop-blur");
    });
  });

  describe("2. Textarea Primitive", () => {
    it("renders textarea with flat bg-surface-card, hairline border, and clean typography", () => {
      const { container } = render(
        <Textarea label="Prompt" placeholder="Describe the scene..." />
      );
      const wrapper = container.querySelector(".rounded-lg");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.className).toContain("bg-surface-card");
      expect(wrapper?.className).toContain("border-white/10");
      expect(wrapper?.className).not.toContain("backdrop-blur");

      const textarea = screen.getByPlaceholderText("Describe the scene...");
      expect(textarea.className).toContain("text-white");
    });

    it("renders blur variant mapped to flat dark surface without blur", () => {
      const { container } = render(
        <Textarea variant="blur" placeholder="Blur textarea" />
      );
      const wrapper = container.querySelector(".rounded-sm");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.className).toContain("bg-surface-card");
      expect(wrapper?.className).toContain("border-white/10");
      expect(wrapper?.className).not.toContain("backdrop-blur");
    });
  });

  describe("3. Select Primitive", () => {
    it("renders select trigger with sharp 4px radius and flat surface", () => {
      render(
        <Select defaultValue="option-1">
          <SelectTrigger variant="blur">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option-1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger.className).toContain("rounded-sm");
      expect(trigger.className).toContain("bg-surface-elevated");
      expect(trigger.className).toContain("border-white/10");
      expect(trigger.className).not.toContain("backdrop-blur");
    });
  });

  describe("4. DropdownShell", () => {
    it("renders toggle group with clean flat container and hairline border", () => {
      const { container } = render(
        <DropdownSegmented
          value="1"
          options={[
            { value: "1", label: "Aspect 16:9" },
            { value: "2", label: "Aspect 9:16" },
          ]}
          onChange={() => {}}
        />
      );
      const group = container.querySelector(".toggle-group");
      expect(group).not.toBeNull();
      expect(group?.className).toContain("rounded-sm");
      expect(group?.className).toContain("bg-white/5");
      expect(group?.className).toContain("border-white/5");
    });
  });
});
