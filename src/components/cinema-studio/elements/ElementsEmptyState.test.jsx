import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ElementsEmptyState } from "./ElementsEmptyState";

describe("ElementsEmptyState", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the empty state title and subtitle", () => {
    render(<ElementsEmptyState />);

    expect(screen.getByText("No elements yet")).toBeTruthy();
    expect(
      screen.getByText("Create element to use it consistently across all projects")
    ).toBeTruthy();
  });

  it("renders all 3 showcase cards with appropriate labels, images, and native site icons", () => {
    const { container } = render(<ElementsEmptyState />);

    // Check headings/titles
    const createLabels = screen.getAllByText("Create element");
    expect(createLabels.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Add to prompt-box")).toBeTruthy();
    expect(screen.getByText("Use for consistency")).toBeTruthy();

    // Check images
    const img1 = screen.getByAltText("Create element");
    const img2 = screen.getByAltText("Add to prompt-box");
    const img3 = screen.getByAltText("Use for consistency");

    expect(img1.getAttribute("src")).toBe("/images/reference-elements/empty-1.webp");
    expect(img2.getAttribute("src")).toBe("/images/reference-elements/empty-2.webp");
    expect(img3.getAttribute("src")).toBe("/images/reference-elements/empty-3.webp");

    // Check Hugeicons rendered
    expect(container.querySelectorAll('[data-icon-name="at"]').length).toBeGreaterThanOrEqual(1);
    expect(container.querySelector('[data-icon-name="sparkles"]')).not.toBeNull();
    expect(container.querySelector('[data-icon-name="package"]')).not.toBeNull();
    expect(container.querySelector('[data-icon-name="add-01"]')).not.toBeNull();
  });

  it("triggers onCreateElement when clicking the Create element card", () => {
    const handleCreate = vi.fn();
    render(<ElementsEmptyState onCreateElement={handleCreate} />);

    const card = screen.getByTestId("create-element-card");
    fireEvent.click(card);

    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it("triggers onCreateElement when pressing Enter or Space on the Create element card", () => {
    const handleCreate = vi.fn();
    render(<ElementsEmptyState onCreateElement={handleCreate} />);

    const card = screen.getByTestId("create-element-card");
    fireEvent.keyDown(card, { key: "Enter" });
    fireEvent.keyDown(card, { key: " " });

    expect(handleCreate).toHaveBeenCalledTimes(2);
  });

  it("triggers onCreateElement when clicking the bottom CTA button", () => {
    const handleCreate = vi.fn();
    render(<ElementsEmptyState onCreateElement={handleCreate} />);

    const buttons = screen.getAllByRole("button", { name: /create element/i });
    const ctaButton = buttons[buttons.length - 1];
    fireEvent.click(ctaButton);

    expect(handleCreate).toHaveBeenCalledTimes(1);
  });
});
