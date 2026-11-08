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
    render(<ElementsEmptyState />);

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

    // Check native Google icons rendered
    expect(screen.getAllByText("alternate_email").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("auto_awesome")).toBeTruthy();
    expect(screen.getByText("inventory_2")).toBeTruthy();
    expect(screen.getByText("add")).toBeTruthy();
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
