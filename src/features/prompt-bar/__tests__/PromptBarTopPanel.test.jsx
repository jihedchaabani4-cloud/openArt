import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { PromptBarTopPanel } from "../platform/parts/PromptBarTopPanel";

// Mock child components to keep unit test isolated and fast
vi.mock("../ui/common/editor/AtMentionMenu.jsx", () => ({
  AtMentionMenu: ({ open, query, onClose }) => (
    <div data-testid="at-mention-menu" data-open={String(open)} data-query={query}>
      <button onClick={onClose}>Close Mention</button>
    </div>
  ),
}));

vi.mock("@/widgets/ImportMediaDialog/ImportMediaPopover", () => ({
  ImportMediaPopover: ({ open, onOpenChange, mode }) => (
    <div data-testid="import-media-popover" data-open={String(open)} data-mode={mode}>
      <button onClick={() => onOpenChange(false)}>Close Popover</button>
    </div>
  ),
}));

describe("PromptBarTopPanel", () => {
  it("renders null/empty when both quick mention and dialog are closed", () => {
    const { container } = render(
      <PromptBarTopPanel
        quickMentionOpen={false}
        dialogOpen={false}
      />
    );
    expect(screen.queryByTestId("at-mention-menu")).toBeNull();
    expect(screen.queryByTestId("import-media-popover")).toBeNull();
  });

  it("renders AtMentionMenu when quickMentionOpen is true", () => {
    const onClose = vi.fn();
    render(
      <PromptBarTopPanel
        quickMentionOpen={true}
        onCloseQuickMention={onClose}
        mentionQuery="test-query"
        activeReferences={[]}
        dialogOpen={false}
      />
    );
    const menu = screen.getByTestId("at-mention-menu");
    expect(menu).toBeTruthy();
    expect(menu.getAttribute("data-query")).toBe("test-query");

    screen.getByText("Close Mention").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders ImportMediaPopover when dialogOpen is true and quickMentionOpen is false", () => {
    const onOpenChange = vi.fn();
    render(
      <PromptBarTopPanel
        quickMentionOpen={false}
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
