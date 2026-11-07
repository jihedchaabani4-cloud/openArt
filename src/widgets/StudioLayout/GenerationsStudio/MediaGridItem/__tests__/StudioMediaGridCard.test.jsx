import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StudioMediaGridCard } from "../StudioMediaGridCard";

const mockHandleLike = vi.fn();
const mockHandleReuseSettings = vi.fn();
const mockHandleDelete = vi.fn();
let mockIsLiked = false;

vi.mock("@/features/workflows/model/useMediaActions", () => ({
  useWorkflowActions: (workflow) => ({
    handleLike: mockHandleLike,
    handleDelete: mockHandleDelete,
    handleDownload: vi.fn(),
    handleReuseSettings: mockHandleReuseSettings,
    handleAnimate: vi.fn(),
    handleAddToPrompt: vi.fn(),
    isVideo: false,
    url: "https://example.com/generation.jpg",
    isLiked: workflow?.is_liked ?? mockIsLiked,
    status: "completed",
    aspect: "1/1",
    prompt: "A beautiful cinematic shot",
    item: { id: "item-1", url: "https://example.com/generation.jpg" },
    canDelete: true,
    canReuseSettings: true,
    showReuseSettings: true,
    canAddToPrompt: true,
  }),
}));

vi.mock("@/features/workflows/api/workflowsApi", () => ({
  useUpdateWorkflow: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/features/workflows/model/useWorkflowsStore", () => ({
  useWorkflowsStore: (selector) =>
    selector({
      showTileDetails: true,
      setShowTileDetails: vi.fn(),
    }),
}));

vi.mock("@/features/studio", () => ({
  usePromptStore: Object.assign(
    (selector) => selector({ isDraggingGalleryItem: false }),
    {
      getState: () => ({
        isDraggingGalleryItem: false,
        setIsDraggingGalleryItem: vi.fn(),
        setDraggedItem: vi.fn(),
      }),
    }
  ),
  useStudioItemDrag: () => ({
    handlePointerDown: vi.fn(),
    isDragging: false,
    dragTarget: null,
    justDraggedRef: { current: false },
  }),
}));

describe("StudioMediaGridCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders active generation with action buttons and display name", () => {
    const mockWorkflow = {
      id: "wf-gen-1",
      display_name: "Cinematic Landscape",
      items: [{ id: "item-1" }],
    };

    render(
      <StudioMediaGridCard
        workflow={mockWorkflow}
        projectId="proj-1"
      />
    );

    expect(screen.getByText("Cinematic Landscape")).toBeDefined();
    // ActionBtn components are rendered
    const actionButtons = screen.getAllByRole("button");
    expect(actionButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("handles like action button click", () => {
    const mockWorkflow = {
      id: "wf-gen-2",
      display_name: "Hero Shot",
      items: [{ id: "item-1" }],
    };

    render(
      <StudioMediaGridCard
        workflow={mockWorkflow}
        projectId="proj-1"
      />
    );

    const actionButtons = screen.getAllByRole("button");
    // Click first action button (like)
    fireEvent.click(actionButtons[0]);
    expect(mockHandleLike).toHaveBeenCalled();
  });

  it("handles reuse history settings action click", () => {
    const mockWorkflow = {
      id: "wf-gen-3",
      display_name: "Character Portrait",
      items: [{ id: "item-1" }],
    };

    render(
      <StudioMediaGridCard
        workflow={mockWorkflow}
        projectId="proj-1"
      />
    );

    const actionButtons = screen.getAllByRole("button");
    // Click second action button (history/reuse)
    fireEvent.click(actionButtons[1]);
    expect(mockHandleReuseSettings).toHaveBeenCalled();
  });

  it("provides accessible aria-label and title on like and reuse action buttons", () => {
    const mockWorkflow = {
      id: "wf-gen-a11y",
      display_name: "Accessible Card",
      items: [{ id: "item-a11y" }],
      is_liked: false,
    };

    const { rerender } = render(
      <StudioMediaGridCard
        workflow={mockWorkflow}
        projectId="proj-1"
      />
    );

    const likeBtn = screen.getByRole("button", { name: "Like generation" });
    expect(likeBtn).toBeDefined();
    expect(likeBtn.getAttribute("title")).toBe("Like");

    const reuseBtn = screen.getByRole("button", { name: "Reuse generation prompt settings" });
    expect(reuseBtn).toBeDefined();
    expect(reuseBtn.getAttribute("title")).toBe("Reuse settings");

    // Rerender when liked
    rerender(
      <StudioMediaGridCard
        workflow={{ ...mockWorkflow, is_liked: true }}
        projectId="proj-1"
      />
    );

    const unlikeBtn = screen.getByRole("button", { name: "Unlike generation" });
    expect(unlikeBtn).toBeDefined();
    expect(unlikeBtn.getAttribute("title")).toBe("Unlike");
  });
});
