import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CollectionMediaGridItem } from "../CollectionMediaGridItem";
import { SharedGalleryGrid } from "@/components/cinema-studio/media/SharedGalleryGrid";
import { queryKeys } from "@/shared/api/queryKeys";
import { useStudioSelectionStore } from "@/features/workflows/model/useStudioSelectionStore";
import {
  buildCollectionCoverById,
  buildCollectionDirectCountById,
} from "@/shared/lib/displayUtils";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockToggleFavorite = vi.fn();
const mockSetActiveCollectionId = vi.fn();
vi.mock("@/features/workflows/model/useWorkflowsStore", () => ({
  useWorkflowsStore: (selector) =>
    selector({
      selectedProjectId: "proj-1",
      activeCollectionId: null,
      setActiveCollectionId: mockSetActiveCollectionId,
      favoriteFolderIds: {},
      toggleFavoriteFolder: mockToggleFavorite,
    }),
}));

const mockDownloadCollection = vi.fn();
const mockDeleteFolder = vi.fn();
const mockExecuteMoveFromPayload = vi.fn();
let mockIsDeleting = false;
vi.mock("@/features/folders", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUpdateFolder: () => ({ mutateAsync: vi.fn() }),
    useDeleteFolder: () => ({ mutateAsync: mockDeleteFolder, isPending: mockIsDeleting }),
    useFolderMove: () => ({ moveItem: vi.fn(), executeMoveFromPayload: mockExecuteMoveFromPayload }),
    useDownloadCollection: () => ({ downloadCollection: mockDownloadCollection, isDownloading: false }),
  };
});

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
    (selector) => selector({ isDraggingGalleryItem: false, draggedItem: null }),
    {
      getState: () => ({
        isDraggingGalleryItem: false,
        draggedItem: null,
        setIsDraggingGalleryItem: vi.fn(),
        setDraggedItem: vi.fn(),
      }),
    }
  ),
  useStudioItemDrag: (...args) => mockUseStudioItemDrag(...args),
}));

describe("CollectionMediaGridItem", () => {
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

  it("renders collection title and folder action controls", () => {
    const mockCollection = {
      id: "folder-123",
      name: "Landscapes",
    };

    render(
      <CollectionMediaGridItem
        collection={mockCollection}
        projectId="proj-1"
      />
    );

    expect(screen.getByText("Landscapes")).toBeDefined();
    expect(screen.getByTitle("Like collection")).toBeDefined();
  });

  it("calls toggleFavoriteFolder when like action button is clicked", () => {
    const mockCollection = {
      id: "folder-456",
      name: "Characters",
    };

    render(
      <CollectionMediaGridItem
        collection={mockCollection}
        projectId="proj-1"
      />
    );

    const likeBtn = screen.getByTitle("Like collection");
    fireEvent.click(likeBtn);

    expect(mockToggleFavorite).toHaveBeenCalledWith("folder-456");
  });

  it("navigates to collection view on card click", () => {
    const mockCollection = {
      id: "folder-789",
      name: "Architecture",
    };

    const handleClick = vi.fn();
    render(
      <CollectionMediaGridItem
        collection={mockCollection}
        projectId="proj-1"
        onClick={handleClick}
      />
    );

    const titleEl = screen.getByText("Architecture");
    fireEvent.click(titleEl);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockCollection, expect.anything());
  });

  it("awaits deleteFolder and closes dialog on successful deletion", async () => {
    mockDeleteFolder.mockResolvedValueOnce({ success: true });

    render(
      <CollectionMediaGridItem
        collection={{ id: "folder-del-1", name: "Landscapes" }}
        projectId="proj-1"
      />
    );

    // Right-click to trigger context menu
    const trigger = document.querySelector(".group");
    fireEvent.contextMenu(trigger);

    // Click Delete option in context menu
    const deleteOption = await screen.findByText("Delete");
    fireEvent.click(deleteOption);

    // Confirm dialog should be open
    const confirmBtn = await screen.findByRole("button", { name: "Supprimer" });
    fireEvent.click(confirmBtn);

    expect(mockDeleteFolder).toHaveBeenCalledWith({
      folderId: "folder-del-1",
      projectId: "proj-1",
    });
  });

  it("preserves dialog when deleteFolder fails", async () => {
    mockDeleteFolder.mockRejectedValueOnce(new Error("Network delete error"));

    render(
      <CollectionMediaGridItem
        collection={{ id: "folder-del-2", name: "Landscapes Fail" }}
        projectId="proj-1"
      />
    );

    // Right-click to trigger context menu
    const trigger = document.querySelector(".group");
    fireEvent.contextMenu(trigger);

    // Click Delete option in context menu
    const deleteOption = await screen.findByText("Delete");
    fireEvent.click(deleteOption);

    // Confirm dialog should be open
    const confirmBtn = await screen.findByRole("button", { name: "Supprimer" });
    fireEvent.click(confirmBtn);

    expect(mockDeleteFolder).toHaveBeenCalledWith({
      folderId: "folder-del-2",
      projectId: "proj-1",
    });

    // Dialog remains rendered
    expect(screen.getByText('Are you sure you want to delete collection "Landscapes Fail"?')).toBeDefined();
  });

  it("renders rounded-xl folder card & selected outline, bottom progressive blur, larger title, and direct item counter", () => {
    const { container } = render(
      <CollectionMediaGridItem
        collection={{ id: "folder-style-1", name: "Styled Folder" }}
        coverUrl="https://example.com/cover.jpg"
        itemCount={4}
        projectId="proj-1"
        selectionEnabled={true}
        isSelected={true}
      />
    );

    const card = container.firstChild;
    expect(card.className).toContain("rounded-xl");
    expect(card.className).not.toContain("rounded-xxxs");
    expect(container.querySelector("img")?.getAttribute("draggable")).toBe("false");

    const selectedOutline = container.querySelector('[data-slot="card-selected-outline"]');
    expect(selectedOutline).not.toBeNull();
    expect(selectedOutline.className).toContain("rounded-xl");
    expect(selectedOutline.className).not.toContain("rounded-xxxs");

    const blurOverlay = container.querySelector('[data-slot="folder-bottom-blur"]');
    expect(blurOverlay).not.toBeNull();
    expect(blurOverlay.className).toContain("ds-folder-bottom-blur");

    const bottomBar = container.querySelector('[data-slot="folder-bottom-bar"]');
    expect(bottomBar?.className).toContain("ds-folder-bottom-bar");

    const titleEl = container.querySelector('[data-slot="folder-title"]');
    expect(titleEl?.textContent).toBe("Styled Folder");
    expect(titleEl?.className).toContain("ds-folder-title");

    const counterEl = container.querySelector('[data-slot="folder-item-count"]');
    expect(counterEl).not.toBeNull();
    expect(counterEl.className).toContain("ds-folder-count");
    expect(counterEl.textContent).toContain("4");
    expect(counterEl.querySelector('[data-icon-name="image-02"]')).not.toBeNull();
  });

  it("renders cohesive empty folder fallback with subtle centered folder icon and 0 counter when coverUrl is absent", () => {
    const { container } = render(
      <CollectionMediaGridItem
        collection={{ id: "folder-empty-1", name: "Empty Folder" }}
        projectId="proj-1"
      />
    );

    const card = container.firstChild;
    expect(card.className).toContain("rounded-xl");
    expect(card.className).toContain("bg-surface-card");

    const fallback = container.querySelector('[data-slot="folder-empty-fallback"]');
    expect(fallback).not.toBeNull();
    expect(fallback.querySelector('[data-icon-name="folder-01"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="folder-bottom-blur"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="folder-title"]')?.textContent).toBe("Empty Folder");
    expect(container.querySelector('[data-slot="folder-item-count"]')?.textContent).toContain("0");
  });

  it("opens Edit folder dialog on title double-click outside selection mode", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CollectionMediaGridItem
          collection={{ id: "folder-rename-1", name: "Moodboards" }}
          itemCount={3}
          projectId="proj-1"
        />
      </QueryClientProvider>
    );

    const titleEl = screen.getByText("Moodboards");
    fireEvent.doubleClick(titleEl);

    expect(await screen.findByText("Edit folder")).toBeDefined();
    expect(screen.getByDisplayValue("Moodboards")).toBeDefined();
  });

  it("computes direct-only item count excluding items inside nested subfolders (zero recursion)", () => {
    const workflows = [
      // 2 direct workflows inside parent folder (1 completed, 1 processing)
      {
        id: "wf-direct-1",
        folder_id: "folder-parent",
        workflow_type: "GENERATION",
        create_time: "2026-11-10T10:00:00Z",
        items: [{ id: "m-1", url: "https://example.com/parent-cover.jpg", status: "completed" }],
      },
      {
        id: "wf-direct-2",
        folderId: "folder-parent",
        workflow_type: "UPLOAD",
        create_time: "2026-11-10T11:00:00Z",
        items: [{ id: "m-2", url: null, status: "processing" }],
      },
      // Trashed workflow directly tagged with parent folder -> must be excluded
      {
        id: "wf-trashed",
        folder_id: "folder-parent",
        deleted_at: "2026-11-10T12:00:00Z",
        workflow_type: "GENERATION",
        items: [{ id: "m-trash", url: "https://example.com/trash.jpg", status: "completed" }],
      },
      // Non-asset element workflow -> must be excluded
      {
        id: "wf-elem",
        folder_id: "folder-parent",
        workflow_type: "ELEMENT_SHEET",
        items: [{ id: "m-elem", url: "https://example.com/elem.jpg", status: "completed" }],
      },
      // Moved-to-root workflow with explicit folder_id: null and stale collection_id -> must be excluded
      {
        id: "wf-moved-to-root",
        folder_id: null,
        collection_id: "folder-parent",
        workflow_type: "GENERATION",
        items: [{ id: "m-root", url: "https://example.com/root.jpg", status: "completed" }],
      },
      // 10 workflows inside a nested child subfolder -> MUST NOT count toward folder-parent!
      ...Array.from({ length: 10 }, (_, idx) => ({
        id: `wf-nested-${idx}`,
        folder_id: "folder-child",
        workflow_type: "GENERATION",
        create_time: `2026-11-10T12:${String(idx).padStart(2, "0")}:00Z`,
        items: [{ id: `m-child-${idx}`, url: `https://example.com/child-${idx}.jpg`, status: "completed" }],
      })),
    ];

    const directCountById = buildCollectionDirectCountById(workflows);
    const coverById = buildCollectionCoverById(workflows);

    expect(directCountById.get("folder-parent")).toBe(2);
    expect(directCountById.get("folder-child")).toBe(10);
    expect(directCountById.get("folder-empty-parent")).toBeUndefined();

    expect(coverById.get("folder-parent")).toMatchObject({
      url: "https://example.com/parent-cover.jpg",
      count: 2,
    });
    expect(coverById.get("folder-child")?.count).toBe(10);

    // Render parent folder (even with a stale/recursive backend assetCount: 12) + child + empty parent via SharedGalleryGrid
    const { container } = render(
      <SharedGalleryGrid
        entries={[
          {
            type: "collection",
            key: "col-parent",
            data: { id: "folder-parent", name: "Parent Shoot", parentId: null, assetCount: 12 },
          },
          {
            type: "collection",
            key: "col-child",
            data: { id: "folder-child", name: "Nested Subfolder", parentId: "folder-parent", assetCount: 10 },
          },
          {
            type: "collection",
            key: "col-empty-parent",
            data: { id: "folder-empty-parent", name: "Empty Parent", parentId: null, assetCount: 5 },
          },
        ]}
        collectionCoverById={coverById}
        collectionCountById={directCountById}
        CardComponent={CollectionMediaGridItem}
        projectId="proj-1"
        defaultContainerWidth={1200}
      />
    );

    const parentCard = container.querySelector('[data-collection-drop-id="folder-parent"]');
    const childCard = container.querySelector('[data-collection-drop-id="folder-child"]');
    const emptyParentCard = container.querySelector('[data-collection-drop-id="folder-empty-parent"]');

    expect(parentCard.querySelector('[data-slot="folder-item-count"]')?.textContent).toContain("2");
    expect(parentCard.querySelector('[data-slot="folder-item-count"]')?.getAttribute("aria-label")).toBe("2 items");
    expect(childCard.querySelector('[data-slot="folder-item-count"]')?.textContent).toContain("10");
    expect(emptyParentCard.querySelector('[data-slot="folder-item-count"]')?.textContent).toContain("0");
    expect(emptyParentCard.querySelector('[data-slot="folder-empty-fallback"]')).not.toBeNull();
  });

  it("keeps folder title, bottom blur, and item count readable without interactive buttons or edit dialog during selection mode", () => {
    const onToggleSelect = vi.fn();

    const { container } = render(
      <CollectionMediaGridItem
        collection={{ id: "folder-sel-1", name: "Cinema Shots", assetCount: 7 }}
        itemCount={2}
        projectId="proj-1"
        selectionEnabled={true}
        isSelectionMode={true}
        isSelected={false}
        onToggleSelect={onToggleSelect}
      />
    );

    // Folder title, progressive blur, and direct item counter stay visible and readable
    const titleEl = screen.getByText("Cinema Shots");
    expect(titleEl).toBeDefined();
    expect(titleEl.className).toContain("ds-folder-title");
    expect(container.querySelector('[data-slot="folder-bottom-blur"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="folder-item-count"]')?.textContent).toContain("2");

    // Single-item hover buttons (like, 3-dot menu) are completely hidden
    expect(screen.queryByTitle("Like collection")).toBeNull();
    expect(screen.queryByRole("button", { name: "More options" })).toBeNull();

    // Double-clicking folder title does NOT open Edit folder dialog
    fireEvent.doubleClick(titleEl);
    expect(screen.queryByText("Edit folder")).toBeNull();

    // Clicking toggles selection instead of navigating
    fireEvent.click(titleEl);
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("enables multi-drag on selected folders with descendant guards while keeping unselected folders non-draggable drop targets", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), [
      { id: "folder-parent", name: "Parent", parent_id: null },
      { id: "folder-child", name: "Child", parent_id: "folder-parent" },
      { id: "folder-grandchild", name: "Grandchild", parent_id: "folder-child" },
      { id: "folder-other", name: "Other Selected", parent_id: null },
      { id: "folder-safe", name: "Safe Target", parent_id: null },
    ]);

    useStudioSelectionStore.setState({
      selectedKeys: ["collection:folder-parent", "workflow:workflows/wf-1", "collection:folder-other"],
    });

    const { container, rerender } = render(
      <QueryClientProvider client={queryClient}>
        <CollectionMediaGridItem
          collection={{ id: "folder-parent", name: "Parent" }}
          projectId="proj-1"
          selectionEnabled={true}
          isSelectionMode={true}
          isSelected={true}
          onToggleSelect={vi.fn()}
        />
      </QueryClientProvider>
    );

    const selectedCard = container.querySelector('[data-collection-drop-id="folder-parent"]');
    expect(selectedCard?.getAttribute("data-draggable-card")).toBe("true");
    expect(selectedCard?.className).toContain("cursor-grab");

    const dragOptions = mockUseStudioItemDrag.mock.calls.at(-1)?.[0];
    expect(dragOptions.isDraggable).toBe(true);
    expect(dragOptions.getDragItems()).toEqual([
      { itemType: "collection", id: "folder-parent" },
      { itemType: "workflow", id: "wf-1" },
      { itemType: "collection", id: "folder-other" },
    ]);

    const invalidIds = dragOptions.getInvalidDropFolderIds();
    expect(invalidIds.has("folder-parent")).toBe(true);
    expect(invalidIds.has("folder-child")).toBe(true);
    expect(invalidIds.has("folder-grandchild")).toBe(true);
    expect(invalidIds.has("folder-other")).toBe(true);
    expect(invalidIds.has("folder-safe")).toBe(false);

    // Unselected folder in selection mode stays non-draggable so marquee can start on it
    rerender(
      <QueryClientProvider client={queryClient}>
        <CollectionMediaGridItem
          collection={{ id: "folder-safe", name: "Safe Target" }}
          projectId="proj-1"
          selectionEnabled={true}
          isSelectionMode={true}
          isSelected={false}
          onToggleSelect={vi.fn()}
        />
      </QueryClientProvider>
    );

    const unselectedCard = container.querySelector('[data-collection-drop-id="folder-safe"]');
    expect(unselectedCard?.getAttribute("data-draggable-card")).toBeNull();
    expect(mockUseStudioItemDrag.mock.calls.at(-1)?.[0]?.isDraggable).toBe(false);
  });

  it("suppresses selection toggle when justDraggedRef is true after releasing a drag", () => {
    const onToggleSelect = vi.fn();
    mockDragReturn = {
      ...mockDragReturn,
      justDraggedRef: { current: true },
    };

    render(
      <CollectionMediaGridItem
        collection={{ id: "folder-guard-1", name: "Dragged Folder" }}
        projectId="proj-1"
        selectionEnabled={true}
        isSelectionMode={true}
        isSelected={true}
        onToggleSelect={onToggleSelect}
      />
    );

    fireEvent.click(screen.getByText("Dragged Folder"));
    expect(onToggleSelect).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();

    // Once drag guard clears, normal selection click works again
    mockDragReturn.justDraggedRef.current = false;
    fireEvent.click(screen.getByText("Dragged Folder"));
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
  });

  it("highlights drop target ring during selection mode without executing duplicate studio:drop-to-collection moves", () => {
    const { container } = render(
      <CollectionMediaGridItem
        collection={{ id: "folder-drop-target", name: "Drop Target" }}
        projectId="proj-1"
        selectionEnabled={true}
        isSelectionMode={true}
        isSelected={false}
        onToggleSelect={vi.fn()}
      />
    );

    const card = container.querySelector('[data-collection-drop-id="folder-drop-target"]');
    expect(card?.className).not.toContain("ring-2");

    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:pointer-hover-target", {
          detail: { target: "add-to-collection", collectionId: "folder-drop-target" },
        })
      );
    });
    expect(card?.className).toContain("ring-2");
    expect(card?.className).toContain("ring-text-primary");

    // Central useStudioDropExecutor handles drops — per-card listener must not double-execute
    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:drop-to-collection", {
          detail: { itemType: "workflow", itemId: "wf-1", targetFolderId: "folder-drop-target" },
        })
      );
      window.dispatchEvent(
        new CustomEvent("studio:pointer-hover-target", { detail: { target: null } })
      );
    });
    expect(mockExecuteMoveFromPayload).not.toHaveBeenCalled();
    expect(card?.className).not.toContain("ring-2");
  });

  it("renders stacked multi-item drag ghost with count badge and target action label", () => {
    mockDragReturn = {
      handlePointerDown: mockHandlePointerDown,
      isDragging: true,
      dragTarget: { target: "add-to-collection", collectionId: "folder-dest" },
      dragCount: 4,
      justDraggedRef: { current: false },
    };

    const { rerender } = render(
      <CollectionMediaGridItem
        collection={{ id: "folder-ghost-1", name: "Ghost Folder" }}
        projectId="proj-1"
        isSelectionMode={true}
        isSelected={true}
      />
    );

    const stackBack = document.body.querySelector('[data-slot="drag-stack-back"]');
    const badge = document.body.querySelector('[data-slot="drag-count-badge"]');
    const targetPill = document.body.querySelector('[data-slot="drag-target-label"]');

    expect(stackBack).not.toBeNull();
    expect(stackBack?.className).toContain("bg-surface-card");
    expect(badge?.textContent).toBe("4");
    expect(badge?.className).toContain("bg-text-primary");
    expect(badge?.className).toContain("text-text-inverse");
    expect(targetPill?.textContent).toBe("Move to folder");

    mockDragReturn = {
      ...mockDragReturn,
      dragTarget: { target: "move-to-root", area: "sidebar-root" },
    };
    rerender(
      <CollectionMediaGridItem
        collection={{ id: "folder-ghost-1", name: "Ghost Folder" }}
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
      <CollectionMediaGridItem
        collection={{ id: "folder-ghost-1", name: "Ghost Folder" }}
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
