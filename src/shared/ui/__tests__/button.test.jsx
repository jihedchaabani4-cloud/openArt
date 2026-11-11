import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { Button, buttonVariants } from "@/shared/ui/button";

describe("Button Primitive — Higgsfield Cinema Studio Architecture", () => {
  describe("1. Default Behavior & Structure", () => {
    it("defaults to ghost variant with standard 8px radius and h-8 height", () => {
      render(<Button>Default Action</Button>);
      const btn = screen.getByRole("button", { name: "Default Action" });
      expect(btn.className).toContain("rounded-[var(--r-sm)]");
      expect(btn.className).toContain("h-8");
      expect(btn.className).toContain("px-3.5");
      expect(btn.className).toContain("text-sm");
      expect(btn.className).toContain("bg-transparent");
      expect(btn.getAttribute("data-slot")).toBe("button");
      expect(btn.getAttribute("data-variant")).toBe("ghost");
    });

    it("forwards ref and handles disabled state correctly", () => {
      const ref = React.createRef();
      render(
        <Button ref={ref} disabled>
          Disabled Button
        </Button>
      );
      const btn = screen.getByRole("button", { name: "Disabled Button" });
      expect(ref.current).toBe(btn);
      expect(btn.disabled).toBe(true);
      expect(btn.className).toContain("disabled:opacity-40");
      expect(btn.className).toContain("disabled:pointer-events-none");
    });
  });

  describe("2. Core Semantic Variants", () => {
    it("renders primary variant (lime CTA)", () => {
      render(<Button variant="primary">Generate</Button>);
      const btn = screen.getByRole("button", { name: "Generate" });
      expect(btn.className).toContain("bg-[var(--brand)]");
      expect(btn.className).toContain("text-[var(--text-on-brand)]");
      expect(btn.className).toContain("font-semibold");
      expect(btn.getAttribute("data-variant")).toBe("primary");
    });

    it("renders secondary variant (overlay-5)", () => {
      render(<Button variant="secondary">Cancel</Button>);
      const btn = screen.getByRole("button", { name: "Cancel" });
      expect(btn.className).toContain("bg-[var(--overlay-5)]");
      expect(btn.className).toContain("text-[var(--text-primary)]");
      expect(btn.getAttribute("data-variant")).toBe("secondary");
    });

    it("renders outline variant (border-default, transparent surface)", () => {
      render(<Button variant="outline">Reset</Button>);
      const btn = screen.getByRole("button", { name: "Reset" });
      expect(btn.className).toContain("border");
      expect(btn.className).toContain("border-[var(--border-default)]");
      expect(btn.className).toContain("bg-transparent");
      expect(btn.getAttribute("data-variant")).toBe("outline");
    });

    it("renders ghost variant (transparent surface, overlay-5 hover)", () => {
      render(<Button variant="ghost">Dismiss</Button>);
      const btn = screen.getByRole("button", { name: "Dismiss" });
      expect(btn.className).toContain("bg-transparent");
      expect(btn.className).toContain("text-[var(--text-primary)]");
      expect(btn.getAttribute("data-variant")).toBe("ghost");
    });

    it("renders danger variant (pink-400)", () => {
      render(<Button variant="danger">Delete Workflow</Button>);
      const btn = screen.getByRole("button", { name: "Delete Workflow" });
      expect(btn.className).toContain("text-[var(--pink-400)]");
      expect(btn.className).toContain("bg-transparent");
      expect(btn.getAttribute("data-variant")).toBe("danger");
    });

    it("renders link variant", () => {
      render(<Button variant="link">Learn More</Button>);
      const btn = screen.getByRole("button", { name: "Learn More" });
      expect(btn.className).toContain("text-[var(--text-primary)]");
      expect(btn.className).toContain("hover:underline");
      expect(btn.className).toContain("p-0");
      expect(btn.className).toContain("h-auto");
      expect(btn.getAttribute("data-variant")).toBe("link");
    });
  });

  describe("3. Customization with className via tailwind-merge", () => {
    it("supports custom dimensions overriding default", () => {
      render(<Button variant="primary" className="h-10 px-6 text-sm">Large CTA</Button>);
      const btn = screen.getByRole("button", { name: "Large CTA" });
      expect(btn.className).toContain("h-10");
      expect(btn.className).toContain("px-6");
      expect(btn.className).toContain("text-sm");
    });

    it("supports layout classes like w-full and shrink-0", () => {
      render(<Button variant="secondary" className="w-full shrink-0">Full Width</Button>);
      const btn = screen.getByRole("button", { name: "Full Width" });
      expect(btn.className).toContain("w-full");
      expect(btn.className).toContain("shrink-0");
    });
  });
});
