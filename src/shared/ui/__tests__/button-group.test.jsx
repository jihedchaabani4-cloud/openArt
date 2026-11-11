import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonGroup } from "@/shared/ui/button-group";

describe("ButtonGroup component", () => {
  it("renders default variant with rounded-[var(--r-sm)] and background overlay-5", () => {
    render(
      <ButtonGroup data-testid="group-default">
        <button>1</button>
        <button>2</button>
      </ButtonGroup>
    );

    const group = screen.getByTestId("group-default");
    expect(group.className).toContain("rounded-[var(--r-sm)]");
    expect(group.className).toContain("bg-[var(--overlay-5)]");
    expect(group.className).toContain("border-0");
  });

  it("renders pill variant with rounded-full and overlay-20 styling", () => {
    render(
      <ButtonGroup variant="pill" data-testid="group-pill">
        <button>Action</button>
      </ButtonGroup>
    );

    const group = screen.getByTestId("group-pill");
    expect(group.className).toContain("rounded-full");
    expect(group.className).toContain("bg-[var(--overlay-20)]");
    expect(group.className).toContain("backdrop-blur-md");
    expect(group.className).toContain("border-0");
  });
});
