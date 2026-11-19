import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PromptBarTopPanel } from "@/components/cinema-studio/prompt-bar/parts/PromptBarTopPanel";
import { Button } from "@/components/base/button";

vi.mock("@/features/media", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ImportMediaPopover: ({ open, onOpenChange, mode }) => (
      <div data-testid="import-media-popover" data-open={String(open)} data-mode={mode}>
        <Button onClick={() => onOpenChange(false)}>Close Popover</Button>
      </div>
    ),
  };
});

describe("PromptBarTopPanel", () => {
  it("renders null/empty when dialog is closed", () => {
    render(
      <PromptBarTopPanel
        dialogOpen={false}
      />
    );
    expect(screen.queryByTestId("import-media-popover")).toBeNull();
  });

  it("renders ImportMediaPopover when dialogOpen is true", () => {
    const onOpenChange = vi.fn();
    render(
      <PromptBarTopPanel
        dialogOpen={true}
        onOpenChangeDialog={onOpenChange}
        activeDialogMode="media"
      />
    );
    const popover = screen.getByTestId("import-media-popover");
    expect(popover).toBeTruthy();
    expect(popover.getAttribute("data-mode")).toBe("media");

    screen.getByText("Close Popover").click();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
