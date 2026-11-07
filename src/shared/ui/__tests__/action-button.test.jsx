import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import * as React from "react";
import { ActionBtn } from "@/shared/ui/action-button";

describe("ActionBtn Primitive", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with default round button styling and forwards ref", () => {
    const ref = React.createRef();
    render(
      <ActionBtn ref={ref} aria-label="Action Button">
        <span>Icon</span>
      </ActionBtn>
    );

    const button = screen.getByRole("button", { name: "Action Button" });
    expect(button).toBeDefined();
    expect(ref.current).toBe(button);
    expect(button.className).toContain("rounded-full");
    expect(button.className).toContain("size-7");
  });

  it("triggers onClick when clicked", () => {
    const handleClick = vi.fn();
    render(
      <ActionBtn onClick={handleClick} aria-label="Click Action">
        <span>Click me</span>
      </ActionBtn>
    );

    const button = screen.getByRole("button", { name: "Click Action" });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("merges custom className without overriding fundamental button structure", () => {
    render(
      <ActionBtn className="custom-class" aria-label="Custom Action">
        <span>Icon</span>
      </ActionBtn>
    );

    const button = screen.getByRole("button", { name: "Custom Action" });
    expect(button.className).toContain("custom-class");
  });
});
