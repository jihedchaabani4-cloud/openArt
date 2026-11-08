import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStudioItemDrag, detectDropTargetAtPoint } from "../model/useStudioItemDrag";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";

describe("detectDropTargetAtPoint", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.elementFromPoint = vi.fn();
  });

  it("detects collection drop target with collectionId", () => {
    const colEl = document.createElement("div");
    colEl.setAttribute("data-collection-drop-id", "col-123");
    document.body.appendChild(colEl);

    document.elementFromPoint = vi.fn().mockReturnValue(colEl);

    const result = detectDropTargetAtPoint(100, 100, "item-other");
    expect(result).toEqual({ target: "add-to-collection", collectionId: "col-123" });
  });

  it("ignores collection card if it is the item being dragged", () => {
    const colEl = document.createElement("div");
    colEl.setAttribute("data-collection-drop-id", "col-same");
    document.body.appendChild(colEl);

    document.elementFromPoint = vi.fn().mockReturnValue(colEl);

    const result = detectDropTargetAtPoint(100, 100, "col-same");
    expect(result).toEqual({ target: null });
  });

  it("detects navbar back button drop target", () => {
    const backBtn = document.createElement("button");
    backBtn.setAttribute("data-drop-back", "true");
    document.body.appendChild(backBtn);

    document.elementFromPoint = vi.fn().mockReturnValue(backBtn);

    const result = detectDropTargetAtPoint(50, 50);
    expect(result).toEqual({ target: "move-out", area: "navbar" });
  });

  it("detects root drop banner target", () => {
    const rootEl = document.createElement("div");
    rootEl.setAttribute("data-drop-root", "true");
    document.body.appendChild(rootEl);

    document.elementFromPoint = vi.fn().mockReturnValue(rootEl);

    const result = detectDropTargetAtPoint(200, 200);
    expect(result).toEqual({ target: "move-out", area: "root" });
  });

  it("returns null target when not over a drop element", () => {
    const emptyDiv = document.createElement("div");
    document.body.appendChild(emptyDiv);

    document.elementFromPoint = vi.fn().mockReturnValue(emptyDiv);

    const result = detectDropTargetAtPoint(300, 300);
    expect(result).toEqual({ target: null });
  });
});

describe("useStudioItemDrag hook", () => {
  beforeEach(() => {
    document.elementFromPoint = vi.fn().mockReturnValue(null);
    usePromptStore.getState().setIsDraggingGalleryItem(false);
    usePromptStore.getState().setDraggedItem(null);
  });

  it("does not start dragging if moved less than 5px", () => {
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
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent("pointermove", { clientX: 102, clientY: 102 })
      );
    });

    expect(result.current.isDragging).toBe(false);
    expect(usePromptStore.getState().isDraggingGalleryItem).toBe(false);

    unmount();
  });

  it("starts dragging when moved beyond 5px and dispatches events", () => {
    const dragStartSpy = vi.fn();
    window.addEventListener("studio:drag-start", dragStartSpy);

    const { result, unmount } = renderHook(() =>
      useStudioItemDrag({
        itemType: "workflow",
        item: { id: "wf-1" },
        itemId: "wf-1",
        url: "https://example.com/thumb.jpg",
      })
    );

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        clientX: 100,
        clientY: 100,
        target: document.createElement("div"),
      });
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent("pointermove", { clientX: 110, clientY: 110 })
      );
    });

    expect(result.current.isDragging).toBe(true);
    expect(usePromptStore.getState().isDraggingGalleryItem).toBe(true);
    expect(usePromptStore.getState().draggedItem?.id).toBe("wf-1");
    expect(dragStartSpy).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(
        new MouseEvent("pointerup", { clientX: 110, clientY: 110 })
      );
    });

    window.removeEventListener("studio:drag-start", dragStartSpy);
    unmount();
  });

  it("dispatches studio:drop-to-collection when released over a collection card", () => {
    const colEl = document.createElement("div");
    colEl.setAttribute("data-collection-drop-id", "target-col");
    document.body.appendChild(colEl);
    document.elementFromPoint = vi.fn().mockReturnValue(colEl);

    const dropToCollectionSpy = vi.fn();
    window.addEventListener("studio:drop-to-collection", dropToCollectionSpy);

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
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent("pointermove", { clientX: 120, clientY: 120 })
      );
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent("pointerup", { clientX: 120, clientY: 120 })
      );
    });

    expect(dropToCollectionSpy).toHaveBeenCalledTimes(1);
    expect(dropToCollectionSpy.mock.calls[0][0].detail).toEqual({
      itemType: "workflow",
      itemId: "wf-1",
      targetFolderId: "target-col",
    });

    window.removeEventListener("studio:drop-to-collection", dropToCollectionSpy);
    unmount();
  });
});
