import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/shared/ui/select";
import { DropdownSegmented } from "@/shared/ui/DropdownShell";

describe("Form Controls & Menus — Higgsfield Cinema Studio Architecture", () => {
  describe("1. Input Primitive", () => {
    it("renders search variant with input-search class", () => {
      const { container } = render(
        <Input variant="search" placeholder="Search prompts..." />
      );
      const wrapper = container.querySelector(".input-search");
      expect(wrapper).not.toBeNull();
    });

    it("renders blurinput variant with bg-surface-2 and border-default", () => {
      const { container } = render(
        <Input variant="blurinput" placeholder="Prompt label" />
      );
      const wrapper = container.querySelector(".rounded-\\[var\\(--r-sm\\)\\]");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.className).toContain("bg-[var(--bg-surface-2)]");
      expect(wrapper?.className).toContain("border-[var(--border-default)]");
    });
  });

  describe("2. Textarea Primitive", () => {
    it("renders textarea with bg-surface-2, border-default, and clean typography", () => {
      const { container } = render(
        <Textarea label="Prompt" placeholder="Describe the scene..." />
      );
      const wrapper = container.querySelector(".rounded-\\[var\\(--r-lg\\)\\]");
      expect(wrapper).not.toBeNull();
      expect(wrapper?.className).toContain("bg-[var(--bg-surface-2)]");
      expect(wrapper?.className).toContain("border-[var(--border-default)]");

      const textarea = screen.getByPlaceholderText("Describe the scene...");
      expect(textarea.className).toContain("text-[var(--text-primary)]");
    });
  });

  describe("3. Select Primitive", () => {
    it("renders select trigger with rounded-[var(--r-sm)] and bg-surface-2", () => {
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
      expect(trigger.className).toContain("rounded-[var(--r-sm)]");
      expect(trigger.className).toContain("bg-[var(--bg-surface-2)]");
      expect(trigger.className).toContain("border-[var(--border-default)]");
    });
  });

  describe("4. DropdownShell", () => {
    it("renders toggle group with clean container and border-subtle", () => {
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
      expect(group?.className).toContain("rounded-[var(--r-sm)]");
      expect(group?.className).toContain("bg-[var(--overlay-5)]");
      expect(group?.className).toContain("border-[var(--border-subtle)]");
    });
  });
});
