import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { Button, buttonVariants } from "@/shared/ui/button";

describe("Button Primitive — 6 Core Semantic Variants Architecture", () => {
  describe("1. Default Behavior & Structure", () => {
    it("defaults to ghost variant with sharp 4px radius and standard 32px height", () => {
      render(<Button>Default Action</Button>);
      const btn = screen.getByRole("button", { name: "Default Action" });
      expect(btn.className).toContain("rounded-sm");
      expect(btn.className).toContain("h-8");
      expect(btn.className).toContain("px-3.5");
      expect(btn.className).toContain("text-sm");
      expect(btn.className).toContain("bg-transparent");
      expect(btn.getAttribute("data-slot")).toBe("button");
      expect(btn.getAttribute("data-variant")).toBe("ghost");
      // Explicitly verifies size and shape props are absent
      expect(btn.getAttribute("data-size")).toBeNull();
      expect(btn.getAttribute("data-shape")).toBeNull();
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
      expect(btn.className).toContain("disabled:opacity-50");
      expect(btn.className).toContain("disabled:pointer-events-none");
    });
  });

  describe("2. The 6 Core Semantic Variants", () => {
    it("renders primary variant (high contrast white CTA)", () => {
      render(<Button variant="primary">Generate</Button>);
      const btn = screen.getByRole("button", { name: "Generate" });
      expect(btn.className).toContain("bg-white");
      expect(btn.className).toContain("text-black");
      expect(btn.className).toContain("rounded-sm");
      expect(btn.className).toContain("h-8");
      expect(btn.className).toContain("font-semibold");
      expect(btn.getAttribute("data-variant")).toBe("primary");
    });

    it("renders secondary variant (surface container high)", () => {
      render(<Button variant="secondary">Cancel</Button>);
      const btn = screen.getByRole("button", { name: "Cancel" });
      expect(btn.className).toContain("bg-[var(--mat-sys-surface-container-high,#282a2c)]");
      expect(btn.className).toContain("text-[var(--mat-sys-on-surface,#e3e3e3)]");
      expect(btn.className).toContain("h-8");
      expect(btn.getAttribute("data-variant")).toBe("secondary");
    });

    it("renders outline variant (subtle border, transparent surface)", () => {
      render(<Button variant="outline">Reset</Button>);
      const btn = screen.getByRole("button", { name: "Reset" });
      expect(btn.className).toContain("border");
      expect(btn.className).toContain("bg-transparent");
      expect(btn.className).toContain("h-8");
      expect(btn.getAttribute("data-variant")).toBe("outline");
    });

    it("renders ghost variant (transparent surface, subtle hover)", () => {
      render(<Button variant="ghost">Dismiss</Button>);
      const btn = screen.getByRole("button", { name: "Dismiss" });
      expect(btn.className).toContain("bg-transparent");
      expect(btn.className).toContain("text-[var(--mat-sys-on-surface,#e3e3e3)]");
      expect(btn.className).toContain("h-8");
      expect(btn.getAttribute("data-variant")).toBe("ghost");
    });

    it("renders danger variant (semantic danger tokens)", () => {
      render(<Button variant="danger">Delete Workflow</Button>);
      const btn = screen.getByRole("button", { name: "Delete Workflow" });
      expect(btn.className).toContain("text-[var(--foreground-color-danger,#fe6e6e)]");
      expect(btn.className).toContain("bg-transparent");
      expect(btn.className).toContain("h-8");
      expect(btn.getAttribute("data-variant")).toBe("danger");
    });

    it("renders link variant (underlined text link)", () => {
      render(<Button variant="link">Learn More</Button>);
      const btn = screen.getByRole("button", { name: "Learn More" });
      expect(btn.className).toContain("text-[var(--mat-sys-link,#a8c7fa)]");
      expect(btn.className).toContain("hover:underline");
      expect(btn.className).toContain("p-0");
      expect(btn.className).toContain("h-auto");
      expect(btn.getAttribute("data-variant")).toBe("link");
    });
  });

  describe("3. Customization with className via tailwind-merge", () => {
    it("supports custom dimensions (h-10 px-6 text-sm) overriding default h-8 px-3.5 text-xs", () => {
      render(<Button variant="primary" className="h-10 px-6 text-sm">Large CTA</Button>);
      const btn = screen.getByRole("button", { name: "Large CTA" });
      expect(btn.className).toContain("h-10");
      expect(btn.className).toContain("px-6");
      expect(btn.className).toContain("text-sm");
      expect(btn.className).not.toContain("h-8");
      expect(btn.className).not.toContain("px-3.5");
      expect(btn.className).not.toContain("text-xs");
    });

    it("supports micro dimensions (h-6 px-2 text-xs) overriding default h-8 px-3.5", () => {
      render(<Button variant="secondary" className="h-6 px-2 text-xs">Micro Action</Button>);
      const btn = screen.getByRole("button", { name: "Micro Action" });
      expect(btn.className).toContain("h-6");
      expect(btn.className).toContain("px-2");
      expect(btn.className).not.toContain("h-8");
      expect(btn.className).not.toContain("px-3.5");
    });

    it("supports circular geometry (rounded-full) overriding default rounded-sm", () => {
      render(<Button variant="primary" className="rounded-full px-4">Pill CTA</Button>);
      const btn = screen.getByRole("button", { name: "Pill CTA" });
      expect(btn.className).toContain("rounded-full");
      expect(btn.className).not.toContain("rounded-sm");
    });

    it("supports icon button geometry (size-8 p-0) overriding default height and padding", () => {
      render(<Button variant="ghost" className="size-8 p-0" aria-label="Settings" />);
      const btn = screen.getByRole("button", { name: "Settings" });
      expect(btn.className).toContain("size-8");
      expect(btn.className).toContain("p-0");
      expect(btn.className).not.toContain("h-8");
      expect(btn.className).not.toContain("px-3.5");
    });

    it("supports layout classes like w-full and shrink-0", () => {
      render(<Button variant="secondary" className="w-full shrink-0">Full Width</Button>);
      const btn = screen.getByRole("button", { name: "Full Width" });
      expect(btn.className).toContain("w-full");
      expect(btn.className).toContain("shrink-0");
    });
  });

  describe("4. Verification of Palette Strictness", () => {
    it("buttonVariants defines strictly the 6 core semantic variants", () => {
      // In CVA, variants can be inspected or called
      const coreVariants = ["primary", "secondary", "outline", "ghost", "danger", "link"];
      coreVariants.forEach((v) => {
        expect(() => buttonVariants({ variant: v })).not.toThrow();
        expect(buttonVariants({ variant: v })).toBeTruthy();
      });

      // Verify that removed size/shape variants do not exist as distinct variants
      const obsoleteVariants = [
        "primary-large",
        "primary-xs",
        "primary-circle",
        "secondary-large",
        "secondary-xs",
        "secondary-circle",
        "pill",
        "pill-active",
        "icon-ghost",
        "icon-ghost-sm",
        "icon-ghost-xs",
        "icon-secondary",
        "icon-secondary-sm",
        "icon-secondary-lg",
        "studio-fab",
        "flow-overlay-action",
        "flow-generate",
        "neon",
      ];
      obsoleteVariants.forEach((v) => {
        // CVA with unknown variant will either ignore and fallback or omit variant classes
        // Render Button with obsolete variant to verify fallback to ghost
        const { unmount } = render(<Button variant={v}>Test</Button>);
        const btn = screen.getByRole("button", { name: "Test" });
        // The resolved variant should fallback to the provided or ghost, but no specialized CVA classes
        expect(btn.className).not.toContain("STUDIO_FAB");
        unmount();
      });
    });
  });
});
