import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudioMediaGridCard } from "../StudioMediaGridCard";
import { queryKeys } from "@/shared/api/queryKeys";
import { useStudioSelectionStore } from "@/features/workflows/model/useStudioSelectionStore";

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

const mockHandlePointerDown = vi.fn();
let mockDragReturn = {
  handlePointerDown: mockHandlePointerDown,
  isDragging: false,
  dragTarget: null,
  dragCount: 1,
  justDraggedRef: { current: false },
};
const mockUseStudioItemDrag = vi.fn(() => mockDragReturn);

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
  useStudioItemDrag: (...args) => mockUseStudioItemDrag(...args),
}));

describe("StudioMediaGridCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDragReturn = {
      handlePointerDown: mockHandlePointerDown,
      isDragging: false,
      dragTarget: null,
      dragCount: 1,
      justDraggedRef: { current: false },
    };
    useStudioSelectionStore.setState({
      scopeKey: null,
      selectedKeys: [],
      lastSelectedKey: null,
    });
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

  it("renders exactly 2 standalone overlay IconButtons (like and menu) with no ButtonGroup", () => {
    const mockWorkflow = {
      id: "wf-gen-3",
      display_name: "Character Portrait",
      items: [{ id: "item-1" }],
    };

    const { container } = render(
      <StudioMediaGridCard
        workflow={mockWorkflow}
        projectId="proj-1"
      />
    );

    expect(container.querySelector('[data-slot="button-group"]')).toBeNull();
    const actionButtons = screen.getAllByRole("button");
    expect(actionButtons).toHaveLength(2);
    actionButtons.forEach((btn) => {
      expect(btn.getAttribute("data-variant")).toBe("overlay");
      expect(btn.className).toContain("ds-icon-btn-overlay");
    });
  });

  it("provides accessible aria-label and title on standalone like and menu icon buttons", () => {
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

    const menuBtn = screen.getByRole("button", { name: "More options" });
    expect(menuBtn).toBeDefined();
    expect(menuBtn.getAttribute("title")).toBe("More options");

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

  it("wires canDrag/data-draggable-card across normal & selection modes and blocks native dragstart capture", () => {
    const mockWorkflow = {
      id: "wf-drag-1",
      display_name: "Draggable Shot",
      items: [{ id: "item-1" }],
    };

    // Normal mode (0 selected) -> draggable + native dragstart prevented
    const { container, rerender } = render(
      <StudioMediaGridCard
        workflow={mockWorkflow}
        projectId="proj-1"
      />
    );
    let card = container.firstChild;
    expect(card.getAttribute("data-draggable-card")).toBe("true");
    expect(mockUseStudioItemDrag.mock.calls.at(-1)?.[0]?.isDraggable).toBe(true);

    const img = container.querySelector("img");
    const dragEvent = new Event("dragstart", { bubbles: true, cancelable: true });
    img.dispatchEvent(dragEvent);
    expect(dragEvent.defaultPrevented).toBe(true);

    // Selection mode + selected -> draggable
    rerender(
      <StudioMediaGridCard
        workflow={mockWorkflow}
        projectId="proj-1"
        selectionEnabled={true}
        isSelectionMode={true}
        isSelected={true}
        onToggleSelect={vi.fn()}
      />
    );
    card = container.firstChild;
    expect(card.getAttribute("data-draggable-card")).toBe("true");
    expect(card.className).toContain("cursor-grab");
    expect(mockUseStudioItemDrag.mock.calls.at(-1)?.[0]?.isDraggable).toBe(true);

    // Selection mode + unselected -> non-draggable so marquee can start on it
    rerender(
      <StudioMediaGridCard
        workflow={mockWorkflow}
        projectId="proj-1"
        selectionEnabled={true}
        isSelectionMode={true}
        isSelected={false}
        onToggleSelect={vi.fn()}
      />
    );
    card = container.firstChild;
    expect(card.getAttribute("data-draggable-card")).toBeNull();
    expect(card.className).toContain("cursor-pointer");
    expect(mockUseStudioItemDrag.mock.calls.at(-1)?.[0]?.isDraggable).toBe(false);
  });

  it("provides multi-selected getDragItems and blocks selected folders + descendants in getInvalidDropFolderIds", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), [
      { id: "folder-parent", name: "Parent", parent_id: null },
      { id: "folder-child", name: "Child", parent_id: "folder-parent" },
      { id: "folder-grandchild", name: "Grandchild", parent_id: "folder-child" },
      { id: "folder-safe", name: "Safe", parent_id: null },
    ]);

    useStudioSelectionStore.setState({
      selectedKeys: ["workflow:workflows/wf-1", "collection:folder-parent"],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <StudioMediaGridCard
          workflow={{ id: "workflows/wf-1", display_name: "Hero", items: [{ id: "item-1" }] }}
          projectId="proj-1"
          selectionEnabled={true}
          isSelectionMode={true}
          isSelected={true}
          onToggleSelect={vi.fn()}
        />
      </QueryClientProvider>
    );

    const dragOptions = mockUseStudioItemDrag.mock.calls.at(-1)?.[0];
    expect(dragOptions.itemId).toBe("wf-1");
    expect(dragOptions.getDragItems()).toEqual([
      { itemType: "workflow", id: "wf-1" },
      { itemType: "collection", id: "folder-parent" },
    ]);

    const invalidIds = dragOptions.getInvalidDropFolderIds();
    expect(invalidIds.has("folder-parent")).toBe(true);
    expect(invalidIds.has("folder-child")).toBe(true);
    expect(invalidIds.has("folder-grandchild")).toBe(true);
    expect(invalidIds.has("folder-safe")).toBe(false);
  });

  it("checks justDraggedRef before onToggleSelect on card click", () => {
    const onToggleSelect = vi.fn();
    mockDragReturn = {
      ...mockDragReturn,
      justDraggedRef: { current: true },
    };

    const { container } = render(
      <StudioMediaGridCard
        workflow={{ id: "wf-guard-1", display_name: "Guarded", items: [{ id: "item-1" }] }}
        projectId="proj-1"
        selectionEnabled={true}
        isSelectionMode={true}
        isSelected={true}
        onToggleSelect={onToggleSelect}
      />
    );

    fireEvent.click(container.firstChild);
    expect(onToggleSelect).not.toHaveBeenCalled();

    mockDragReturn.justDraggedRef.current = false;
    fireEvent.click(container.firstChild);
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
  });

  it("renders stacked multi-item drag ghost with count badge and target action labels", () => {
    mockDragReturn = {
      handlePointerDown: mockHandlePointerDown,
      isDragging: true,
      dragTarget: { target: "add-to-collection", collectionId: "col-1" },
      dragCount: 3,
      justDraggedRef: { current: false },
    };

    const { rerender } = render(
      <StudioMediaGridCard
        workflow={{ id: "wf-ghost-1", display_name: "Ghost", items: [{ id: "item-1" }] }}
        projectId="proj-1"
        isSelectionMode={true}
        isSelected={true}
      />
    );

    const stackBack = document.body.querySelector('[data-slot="drag-stack-back"]');
    const badge = document.body.querySelector('[data-slot="drag-count-badge"]');
    const label = document.body.querySelector('[data-slot="drag-target-label"]');

    expect(stackBack).not.toBeNull();
    expect(stackBack?.className).toContain("bg-surface-card");
    expect(badge?.textContent).toBe("3");
    expect(badge?.className).toContain("bg-text-primary");
    expect(badge?.className).toContain("text-text-inverse");
    expect(label?.textContent).toBe("Move to folder");

    mockDragReturn = {
      ...mockDragReturn,
      dragTarget: { target: "move-to-root", area: "sidebar-root" },
    };
    rerender(
      <StudioMediaGridCard
        workflow={{ id: "wf-ghost-1", display_name: "Ghost", items: [{ id: "item-1" }] }}
        projectId="proj-1"
        isSelectionMode={true}
        isSelected={true}
      />
    );
    expect(document.body.querySelector('[data-slot="drag-target-label"]')?.textContent).toBe(
      "Move to root"
    );

    mockDragReturn = {
      ...mockDragReturn,
      dragTarget: { target: "move-out", area: "navbar" },
    };
    rerender(
      <StudioMediaGridCard
        workflow={{ id: "wf-ghost-1", display_name: "Ghost", items: [{ id: "item-1" }] }}
        projectId="proj-1"
        isSelectionMode={true}
        isSelected={true}
      />
    );
    expect(document.body.querySelector('[data-slot="drag-target-label"]')?.textContent).toBe(
      "Move out"
    );
  });
});
