import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

const {
  mockMoveAsset,
  mockUpdateFolder,
  mockToastSuccess,
  mockToastWarning,
  mockToastError,
} = vi.hoisted(() => ({
  mockMoveAsset: vi.fn(),
  mockUpdateFolder: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastWarning: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/features/folders/api/mutations/useMoveAssetToFolder", () => ({
  useMoveAssetToFolder: () => ({ mutateAsync: mockMoveAsset }),
}));

vi.mock("@/features/folders/api/mutations/useUpdateFolder", () => ({
  useUpdateFolder: () => ({ mutateAsync: mockUpdateFolder }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args) => mockToastSuccess(...args),
    warning: (...args) => mockToastWarning(...args),
    error: (...args) => mockToastError(...args),
  },
}));

import { queryKeys } from "@/shared/api/queryKeys";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";
import { useWorkflowUiStore } from "@/features/workflows/model/useWorkflowUiStore";
import { useStudioSelectionStore } from "@/features/workflows/model/useStudioSelectionStore";
import {
  useStudioItemDrag,
  detectDropTargetAtPoint,
} from "../useStudioItemDrag";
import {
  useStudioDropExecutor,
  resolveDropItems,
} from "../useStudioDropExecutor";

function createQueryWrapper(queryClient) {
  return function Wrapper({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("detectDropTargetAtPoint (multi-drag & sidebar root)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.elementFromPoint = vi.fn().mockReturnValue(null);
  });

  it("blocks drop onto any folder present in invalidFolderIds (selected folders & descendants)", () => {
    const colEl = document.createElement("div");
    colEl.setAttribute("data-collection-drop-id", "col-child");
    document.body.appendChild(colEl);
    document.elementFromPoint = vi.fn().mockReturnValue(colEl);

    const invalidIds = new Set(["col-parent", "col-child"]);
    expect(detectDropTargetAtPoint(100, 100, "wf-1", invalidIds)).toEqual({ target: null });

    // Valid sibling folder still resolves
    const siblingEl = document.createElement("div");
    siblingEl.setAttribute("data-collection-drop-id", "col-other");
    document.body.appendChild(siblingEl);
    document.elementFromPoint = vi.fn().mockReturnValue(siblingEl);

    expect(detectDropTargetAtPoint(100, 100, "wf-1", invalidIds)).toEqual({
      target: "add-to-collection",
      collectionId: "col-other",
    });
  });

  it("detects [data-drop-project-root='true'] as move-to-root and respects target priority order", () => {
    const rootBtn = document.createElement("button");
    rootBtn.setAttribute("data-drop-project-root", "true");
    const label = document.createElement("span");
    rootBtn.appendChild(label);
    document.body.appendChild(rootBtn);

    document.elementFromPoint = vi.fn().mockReturnValue(label);
    expect(detectDropTargetAtPoint(40, 80, "wf-1")).toEqual({
      target: "move-to-root",
      area: "sidebar-root",
    });

    // Priority: collection drop beats project-root, back, and root
    const nestedCol = document.createElement("div");
    nestedCol.setAttribute("data-collection-drop-id", "col-99");
    rootBtn.appendChild(nestedCol);
    document.elementFromPoint = vi.fn().mockReturnValue(nestedCol);

    expect(detectDropTargetAtPoint(40, 80, "wf-1")).toEqual({
      target: "add-to-collection",
      collectionId: "col-99",
    });
  });
});

describe("useStudioItemDrag (single & multi-selected drag)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.elementFromPoint = vi.fn().mockReturnValue(null);
    usePromptStore.getState().setIsDraggingGalleryItem(false);
    usePromptStore.getState().setDraggedItem(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("tracks dragCount, structured dragTarget, blocks invalid folders, and dispatches multi-item drop events", () => {
    const invalidColEl = document.createElement("div");
    invalidColEl.setAttribute("data-collection-drop-id", "col-child");
    const validColEl = document.createElement("div");
    validColEl.setAttribute("data-collection-drop-id", "col-target");
    const rootBtn = document.createElement("button");
    rootBtn.setAttribute("data-drop-project-root", "true");
    document.body.append(invalidColEl, validColEl, rootBtn);

    const hoverSpy = vi.fn();
    const dropCollectionSpy = vi.fn();
    const dropRootSpy = vi.fn();
    window.addEventListener("studio:pointer-hover-target", hoverSpy);
    window.addEventListener("studio:drop-to-collection", dropCollectionSpy);
    window.addEventListener("studio:drop-to-project-root", dropRootSpy);

    const multiItems = [
      { itemType: "workflow", id: "wf-1" },
      { itemType: "workflow", id: "wf-2" },
      { itemType: "collection", id: "col-parent" },
    ];

    const { result, unmount } = renderHook(() =>
      useStudioItemDrag({
        itemType: "workflow",
        item: { id: "wf-1" },
        itemId: "wf-1",
        getDragItems: () => multiItems,
        getInvalidDropFolderIds: () => new Set(["col-parent", "col-child"]),
      })
    );

    expect(result.current.dragCount).toBe(1);
    expect(result.current.dragTarget).toBeNull();

    // Start dragging
    act(() => {
      result.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
    });

    // Move over invalid descendant folder -> target stays null, dragCount === 3
    document.elementFromPoint = vi.fn().mockReturnValue(invalidColEl);
    act(() => {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 120, clientY: 120 }));
    });
    expect(result.current.isDragging).toBe(true);
    expect(result.current.dragCount).toBe(3);
    expect(result.current.dragTarget).toBeNull();

    // Move over sidebar "All assets" root drop target
    document.elementFromPoint = vi.fn().mockReturnValue(rootBtn);
    act(() => {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 50, clientY: 90 }));
    });
    expect(result.current.dragTarget).toEqual({
      target: "move-to-root",
      area: "sidebar-root",
    });
    expect(hoverSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: { target: "move-to-root", area: "sidebar-root" },
      })
    );

    // Move over valid folder & drop
    document.elementFromPoint = vi.fn().mockReturnValue(validColEl);
    act(() => {
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 200, clientY: 200 }));
    });
    expect(result.current.dragTarget).toEqual({
      target: "add-to-collection",
      collectionId: "col-target",
    });

    act(() => {
      window.dispatchEvent(new MouseEvent("pointerup", { clientX: 200, clientY: 200 }));
    });

    expect(result.current.isDragging).toBe(false);
    expect(result.current.dragCount).toBe(1);
    expect(result.current.dragTarget).toBeNull();
    expect(dropCollectionSpy).toHaveBeenCalledTimes(1);
    expect(dropCollectionSpy.mock.calls[0][0].detail).toEqual({
      itemType: "workflow",
      itemId: "wf-1",
      targetFolderId: "col-target",
      items: multiItems,
    });

    // Second drag released over sidebar "All assets" root -> dispatches studio:drop-to-project-root
    document.elementFromPoint = vi.fn().mockReturnValue(rootBtn);
    act(() => {
      result.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 50, clientY: 90 }));
      window.dispatchEvent(new MouseEvent("pointerup", { clientX: 50, clientY: 90 }));
    });

    expect(dropRootSpy).toHaveBeenCalledTimes(1);
    expect(dropRootSpy.mock.calls[0][0].detail).toEqual({
      itemType: "workflow",
      itemId: "wf-1",
      targetFolderId: null,
      items: multiItems,
    });

    window.removeEventListener("studio:pointer-hover-target", hoverSpy);
    window.removeEventListener("studio:drop-to-collection", dropCollectionSpy);
    window.removeEventListener("studio:drop-to-project-root", dropRootSpy);
    unmount();
  });

  it("cancels drag cleanly on pointercancel without firing drop events and cleans up on unmount mid-drag", () => {
    const validColEl = document.createElement("div");
    validColEl.setAttribute("data-collection-drop-id", "col-target");
    document.body.appendChild(validColEl);
    document.elementFromPoint = vi.fn().mockReturnValue(validColEl);

    const dropSpy = vi.fn();
    window.addEventListener("studio:drop-to-collection", dropSpy);

    const { result, unmount } = renderHook(() =>
      useStudioItemDrag({
        itemType: "workflow",
        item: { id: "wf-1" },
        itemId: "wf-1",
      })
    );

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 130, clientY: 130 }));
      window.dispatchEvent(new MouseEvent("pointercancel", { clientX: 130, clientY: 130 }));
    });

    expect(result.current.isDragging).toBe(false);
    expect(dropSpy).not.toHaveBeenCalled();

    // Start dragging again then unmount -> prompt store resets cleanly
    act(() => {
      result.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 130, clientY: 130 }));
    });
    expect(usePromptStore.getState().isDraggingGalleryItem).toBe(true);

    unmount();
    expect(usePromptStore.getState().isDraggingGalleryItem).toBe(false);
    expect(usePromptStore.getState().draggedItem).toBeNull();

    window.removeEventListener("studio:drop-to-collection", dropSpy);
  });

  it("suppresses the trailing capture-phase click after pointerup drag release, then restores normal clicks", () => {
    vi.useFakeTimers();
    const gridEl = document.createElement("div");
    gridEl.setAttribute("data-justified-grid", "true");
    document.body.appendChild(gridEl);
    const onGridClick = vi.fn();
    gridEl.addEventListener("click", onGridClick);

    const { result, unmount } = renderHook(() =>
      useStudioItemDrag({
        itemType: "workflow",
        item: { id: "wf-1" },
        itemId: "wf-1",
      })
    );

    // Active drag released over empty grid space
    act(() => {
      result.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 130, clientY: 130 }));
      window.dispatchEvent(new MouseEvent("pointerup", { clientX: 130, clientY: 130 }));
    });

    // Immediate trailing click is suppressed before reaching grid container
    const trailingClick = new MouseEvent("click", { bubbles: true, cancelable: true });
    gridEl.dispatchEvent(trailingClick);
    expect(onGridClick).not.toHaveBeenCalled();
    expect(trailingClick.defaultPrevented).toBe(true);

    // Subsequent normal click works immediately after one-shot suppression
    gridEl.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(onGridClick).toHaveBeenCalledTimes(1);

    // When no trailing click fires, setTimeout(..., 0) cleans up suppressor automatically
    act(() => {
      result.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 140, clientY: 140 }));
      window.dispatchEvent(new MouseEvent("pointerup", { clientX: 140, clientY: 140 }));
    });
    vi.runAllTimers();
    gridEl.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(onGridClick).toHaveBeenCalledTimes(2);

    // Sub-threshold press (< 5px) never installs click suppression
    act(() => {
      result.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
      window.dispatchEvent(new MouseEvent("pointermove", { clientX: 102, clientY: 101 }));
      window.dispatchEvent(new MouseEvent("pointerup", { clientX: 102, clientY: 101 }));
    });
    gridEl.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(onGridClick).toHaveBeenCalledTimes(3);

    unmount();
    vi.useRealTimers();
  });

  it("blocks trusted native dragstart during pointer tracking (preserving synthetic dragstart) and cleans up on pointerup/unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { result, unmount } = renderHook(() =>
      useStudioItemDrag({
        itemType: "workflow",
        item: { id: "wf-1" },
        itemId: "wf-1",
      })
    );

    // Start tracking -> capture-phase dragstart listener attached
    act(() => {
      result.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
    });

    const dragStartAddCall = addSpy.mock.calls.find(
      ([type, , options]) => type === "dragstart" && options === true
    );
    expect(dragStartAddCall).toBeTruthy();
    const nativeDragHandler = dragStartAddCall[1];

    // Trusted native dragstart is prevented; synthetic dragstart is preserved
    const trustedEv = { isTrusted: true, preventDefault: vi.fn() };
    const syntheticEv = { isTrusted: false, preventDefault: vi.fn() };
    nativeDragHandler(trustedEv);
    nativeDragHandler(syntheticEv);
    expect(trustedEv.preventDefault).toHaveBeenCalledTimes(1);
    expect(syntheticEv.preventDefault).not.toHaveBeenCalled();

    // Synthetic Event dispatched on window is not defaultPrevented
    const realSynthetic = new Event("dragstart", { bubbles: true, cancelable: true });
    window.dispatchEvent(realSynthetic);
    expect(realSynthetic.defaultPrevented).toBe(false);

    // Releasing pointer removes the capture-phase dragstart listener
    act(() => {
      window.dispatchEvent(new MouseEvent("pointerup", { clientX: 100, clientY: 100 }));
    });
    expect(removeSpy).toHaveBeenCalledWith("dragstart", nativeDragHandler, true);

    // Unmounting mid-track also removes the capture-phase dragstart listener
    addSpy.mockClear();
    removeSpy.mockClear();
    act(() => {
      result.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
    });
    const secondHandler = addSpy.mock.calls.find(
      ([type, , options]) => type === "dragstart" && options === true
    )?.[1];
    expect(secondHandler).toBeTypeOf("function");

    unmount();
    expect(removeSpy).toHaveBeenCalledWith("dragstart", secondHandler, true);
  });
});

describe("useStudioDropExecutor", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockMoveAsset.mockResolvedValue({ ok: true });
    mockUpdateFolder.mockResolvedValue({ ok: true });

    queryClient.setQueryData(queryKeys.folders.byProject("proj-1"), [
      { id: "col-root", name: "Root Folder", parentId: null },
      { id: "col-child", name: "Child Folder", parentId: "col-root" },
      { id: "col-grandchild", name: "Grandchild", parentId: "col-child" },
      { id: "col-target", name: "Shots", parentId: null },
    ]);

    useWorkflowUiStore.setState({ activeCollectionId: null });
    useStudioSelectionStore.setState({
      scopeKey: "assets:proj-1",
      selectedKeys: [],
      lastSelectedKey: null,
    });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
  });

  it("resolveDropItems handles items array, legacy single payloads, prefix stripping, and deduplication", () => {
    expect(
      resolveDropItems({
        items: [
          { itemType: "workflow", id: "workflows/wf-1" },
          { itemType: "workflow", id: "wf-1" },
          { itemType: "collection", id: "col-1" },
        ],
      })
    ).toEqual([
      { itemType: "workflow", id: "wf-1" },
      { itemType: "collection", id: "col-1" },
    ]);

    expect(
      resolveDropItems({ itemType: "workflow", itemId: "wf-single" })
    ).toEqual([{ itemType: "workflow", id: "wf-single" }]);

    expect(
      resolveDropItems({ collectionId: "col-legacy" })
    ).toEqual([{ itemType: "collection", id: "col-legacy" }]);
  });

  it("executes single-item studio:drop-to-collection once, invalidates caches, and preserves unrelated selection", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    useStudioSelectionStore.getState().setSelectedKeys(["workflow:wf-other"]);

    const { unmount } = renderHook(() => useStudioDropExecutor("proj-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:drop-to-collection", {
          detail: { itemType: "workflow", itemId: "wf-1", targetFolderId: "col-target" },
        })
      );
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    });

    expect(mockMoveAsset).toHaveBeenCalledTimes(1);
    expect(mockMoveAsset).toHaveBeenCalledWith({
      assetId: "wf-1",
      folderId: "col-target",
      projectId: "proj-1",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.projectData.byProject("proj-1"),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.folders.byProject("proj-1"),
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Moved 1 item to "Shots"');
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:wf-other"]);

    unmount();
  });

  it("executes multi-item mixed drop, skips self/descendant folders, invalidates once, and clears selection", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    useStudioSelectionStore
      .getState()
      .setSelectedKeys([
        "workflow:workflows/wf-1",
        "collection:col-root",
        "collection:col-target",
      ]);

    const { unmount } = renderHook(() => useStudioDropExecutor("proj-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    // Drop onto col-grandchild: col-root is ancestor (MUST skip), col-target is valid, wf-1 is valid
    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:drop-to-collection", {
          detail: {
            itemType: "workflow",
            itemId: "workflows/wf-1",
            targetFolderId: "col-grandchild",
            items: [
              { itemType: "workflow", id: "workflows/wf-1" },
              { itemType: "collection", id: "col-root" },
              { itemType: "collection", id: "col-grandchild" },
              { itemType: "collection", id: "col-target" },
            ],
          },
        })
      );
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    });

    expect(mockMoveAsset).toHaveBeenCalledTimes(1);
    expect(mockMoveAsset).toHaveBeenCalledWith({
      assetId: "wf-1",
      folderId: "col-grandchild",
      projectId: "proj-1",
    });
    expect(mockUpdateFolder).toHaveBeenCalledTimes(1);
    expect(mockUpdateFolder).toHaveBeenCalledWith({
      folderId: "col-target",
      patch: { parentId: "col-grandchild" },
      projectId: "proj-1",
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);
    expect(mockToastSuccess).toHaveBeenCalledWith('Moved 2 items to "Grandchild"');

    unmount();
  });

  it("handles studio:drop-to-project-root (null target) and studio:drop-to-back (one level up)", async () => {
    const { unmount } = renderHook(() => useStudioDropExecutor("proj-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    // 1. studio:drop-to-project-root -> moves to null ("All assets")
    useStudioSelectionStore
      .getState()
      .setSelectedKeys(["workflow:wf-1", "collection:col-child"]);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:drop-to-project-root", {
          detail: {
            itemType: "workflow",
            itemId: "wf-1",
            targetFolderId: null,
            items: [
              { itemType: "workflow", id: "wf-1" },
              { itemType: "collection", id: "col-child" },
            ],
          },
        })
      );
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    });

    expect(mockMoveAsset).toHaveBeenCalledWith({
      assetId: "wf-1",
      folderId: null,
      projectId: "proj-1",
    });
    expect(mockUpdateFolder).toHaveBeenCalledWith({
      folderId: "col-child",
      patch: { parentId: null },
      projectId: "proj-1",
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Moved 2 items to All assets");
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);

    // 2. studio:drop-to-back from col-child -> moves up to col-root
    vi.clearAllMocks();
    mockMoveAsset.mockResolvedValue({ ok: true });
    useWorkflowUiStore.setState({ activeCollectionId: "col-child" });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:drop-to-back", {
          detail: {
            itemType: "workflow",
            itemId: "wf-2",
            workflowId: "wf-2",
          },
        })
      );
    });

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
    });

    expect(mockMoveAsset).toHaveBeenCalledWith({
      assetId: "wf-2",
      folderId: "col-root",
      projectId: "proj-1",
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Moved 1 item to "Root Folder"');

    unmount();
  });

  it("shows toast.warning on partial failure and toast.error (preserving selection) when all moves fail", async () => {
    const { unmount } = renderHook(() => useStudioDropExecutor("proj-1"), {
      wrapper: createQueryWrapper(queryClient),
    });

    // Partial failure: 1 succeeds, 1 rejects
    mockMoveAsset
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error("boom"));
    useStudioSelectionStore.getState().setSelectedKeys(["workflow:wf-1", "workflow:wf-2"]);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:drop-to-collection", {
          detail: {
            itemType: "workflow",
            itemId: "wf-1",
            targetFolderId: "col-target",
            items: [
              { itemType: "workflow", id: "wf-1" },
              { itemType: "workflow", id: "wf-2" },
            ],
          },
        })
      );
    });

    await waitFor(() => {
      expect(mockToastWarning).toHaveBeenCalledTimes(1);
    });
    expect(mockToastWarning).toHaveBeenCalledWith("Moved 1 item; 1 failed");
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual([]);

    // Total failure: selection stays intact
    vi.clearAllMocks();
    mockMoveAsset.mockRejectedValue(new Error("network"));
    useStudioSelectionStore.getState().setSelectedKeys(["workflow:wf-1"]);

    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:drop-to-collection", {
          detail: {
            itemType: "workflow",
            itemId: "wf-1",
            targetFolderId: "col-target",
          },
        })
      );
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledTimes(1);
    });
    expect(mockToastError).toHaveBeenCalledWith("Failed to move item.");
    expect(useStudioSelectionStore.getState().selectedKeys).toEqual(["workflow:wf-1"]);

    unmount();
  });
});
