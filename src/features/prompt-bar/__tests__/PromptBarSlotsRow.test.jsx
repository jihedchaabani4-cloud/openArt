import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PromptBarSlotsRow } from "@/components/cinema-studio/prompt-bar/parts/PromptBarSlotsRow";
import { Button } from "@/components/base/button";

vi.mock("@/components/cinema-studio/prompt-bar/MediaInput.jsx", () => ({
  MediaInput: ({ label, role, onClick, onRemove }) => (
    <div data-testid={`media-input-${role}`}>
      <span>{label}</span>
      <Button onClick={onClick}>Upload</Button>
      <Button onClick={onRemove}>Remove</Button>
    </div>
  ),
}));

vi.mock("@/components/cinema-studio/prompt-bar/ReferenceButton.jsx", () => ({
  ViewReference: ({ media, label, onRemove }) => (
    <div data-testid={`view-reference-${media.id || media.workflow_id}`}>
      <span>{label}</span>
      <Button onClick={onRemove}>Remove Ref</Button>
    </div>
  ),
  ReferenceButton: ({ word, onClick }) => (
    <Button data-testid="reference-add-btn" onClick={onClick}>
      {word}
    </Button>
  ),
  SwapIcon: () => <span data-testid="swap-icon">Swap</span>,
}));

describe("PromptBarSlotsRow", () => {
  it("renders null when activeSlots is empty", () => {
    const { container } = render(
      <PromptBarSlotsRow activeSlots={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders reference slot with thumbnails and add button", () => {
    const handleRemoveRef = vi.fn();
    const handleOpenDialog = vi.fn();

    const activeSlots = [{ role: "reference", label: "References" }];
    const refItems = [{ id: "ref-1", displayName: "My Ref" }];

    render(
      <PromptBarSlotsRow
        activeSlots={activeSlots}
        paramValues={{}}
        getReferenceItems={() => refItems}
        getSlotMaxRefs={() => 4}
        calculateUsedImages={() => 1}
        handleRemoveReferenceItem={handleRemoveRef}
        handleOpenDialog={handleOpenDialog}
      />
    );

    expect(screen.getByTestId("view-reference-ref-1")).toBeTruthy();
    expect(screen.getByText("My Ref")).toBeTruthy();

    fireEvent.click(screen.getByText("Remove Ref"));
    expect(handleRemoveRef).toHaveBeenCalledWith(refItems[0], "reference");

    const addBtn = screen.getByTestId("reference-add-btn");
    expect(addBtn.textContent).toBe("Add");
    fireEvent.click(addBtn);
    expect(handleOpenDialog).toHaveBeenCalledWith(activeSlots[0]);
  });

  it("renders keyframe slots and swap button when showSwap is true", () => {
    const handleSwapFrames = vi.fn();
    const activeSlots = [
      { role: "start", label: "Start Frame", accepts: "image/*" },
      { role: "end", label: "End Frame", accepts: "image/*" },
    ];

    render(
      <PromptBarSlotsRow
        activeSlots={activeSlots}
        paramValues={{ start: "img1.png", end: "img2.png" }}
        showSwap={true}
        swapEnabled={true}
        handleSwapFrames={handleSwapFrames}
      />
    );

    expect(screen.getByTestId("media-input-start")).toBeTruthy();
    expect(screen.getByTestId("media-input-end")).toBeTruthy();
    expect(screen.getByTestId("swap-icon")).toBeTruthy();

    fireEvent.click(screen.getByTitle("Swap start and end frames"));
    expect(handleSwapFrames).toHaveBeenCalledTimes(1);
  });
});
