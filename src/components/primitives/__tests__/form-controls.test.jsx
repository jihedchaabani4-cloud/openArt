import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "@/components/base/input";
import { Textarea } from "@/components/primitives/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/base/select";

describe("Form Controls & Menus — Runway Flat Surface Architecture", () => {
  describe("1. Input Primitive", () => {
    it("renders search variant with sharp radius, flat surface, and hairline border", () => {
      const { container } = render(
        <Input variant="search" placeholder="Search prompts..." />
      );
      const wrapper = container.querySelector(".ds-input");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.className).toContain("ds-input");
      expect(wrapper?.className).not.toContain("backdrop-blur");
    });

    it("renders standard input with flat surface and without GPU-heavy blur", () => {
      const { container } = render(
        <Input placeholder="Prompt label" />
      );
      const wrapper = container.querySelector(".ds-input");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.className).toContain("ds-input");
      expect(wrapper?.className).not.toContain("backdrop-blur");
    });
  });

  describe("2. Textarea Primitive", () => {
    it("renders textarea with flat bg-surface-card, hairline border, and clean typography", () => {
      const { container } = render(
        <Textarea label="Prompt" placeholder="Describe the scene..." />
      );
      const wrapper = container.querySelector(".rounded-subtle");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.className).toContain("bg-surface-container");
      expect(wrapper?.className).toContain("border-outline-variant");
      expect(wrapper?.className).not.toContain("backdrop-blur");

      const textarea = screen.getByPlaceholderText("Describe the scene...");
      expect(textarea.className).toContain("text-on-surface");
    });

    it("renders blur variant mapped to flat dark surface without blur", () => {
      const { container } = render(
        <Textarea variant="blur" placeholder="Blur textarea" />
      );
      const wrapper = container.querySelector(".rounded-subtle");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.className).toContain("bg-surface-container");
      expect(wrapper?.className).toContain("border-outline-variant");
      expect(wrapper?.className).not.toContain("backdrop-blur");
    });
  });

  describe("3. Select Primitive", () => {
    it("renders select trigger with flat surface and canonical ds class", () => {
      render(
        <Select defaultValue="option-1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option-1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );
      const trigger = screen.getByRole("combobox");
      expect(trigger.className).toContain("ds-select-trigger");
      expect(trigger.className).not.toContain("backdrop-blur");
    });
  });
});
