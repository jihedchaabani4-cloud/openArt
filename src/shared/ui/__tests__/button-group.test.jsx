import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonGroup } from "@/shared/ui/button-group";

describe("ButtonGroup component", () => {
  it("renders default variant with rounded-sm and background", () => {
    render(
      <ButtonGroup data-testid="group-default">
        <button>1</button>
        <button>2</button>
      </ButtonGroup>
    );

    const group = screen.getByTestId("group-default");
    expect(group.className).toContain("rounded-sm");
    expect(group.className).toContain("bg-(--foreground-state-05)");
    expect(group.className).toContain("border-0");
  });

  it("renders pill variant with rounded-full and glassmorphism styling", () => {
    render(
      <ButtonGroup variant="pill" data-testid="group-pill">
        <button>Action</button>
      </ButtonGroup>
    );

    const group = screen.getByTestId("group-pill");
    expect(group.className).toContain("rounded-full");
    expect(group.className).toContain("bg-white/60");
    expect(group.className).toContain("backdrop-blur-md");
    expect(group.className).toContain("border-0");
  });
});
