/**
 * Studio Item Drag Service / Hook
 *
 * What it owns:
 * - Pointer-based drag gesture detection (distance threshold > 5px, ignores non-draggable tags).
 * - Global event dispatching (`dragstart`, `dragend`, `studio:drag-start`, `studio:drag-end`).
 * - Active drag state synchronization with `usePromptStore` (`isDraggingGalleryItem`, `draggedItem`).
 * - Real-time collision detection during drag against studio drop targets:
 *     - [data-collection-drop-id]: `studio:pointer-hover-target` ("add-to-collection")
 *     - [data-drop-back]: `studio:pointer-hover-target` ("move-out", area: "navbar")
 *     - [data-drop-root]: `studio:pointer-hover-target` ("move-out", area: "root")
 * - Drop execution event dispatching on pointer release:
 *     - `studio:drop-to-collection`
 *     - `studio:drop-to-back`
 * - Motion values updates (`mouseX`, `mouseY`, `lastPos`) for drag previews.
 *
 * Public methods:
 * - `detectDropTargetAtPoint(clientX, clientY, currentItemId)`: pure collision resolver.
 * - `useStudioItemDrag(options)`: React hook encapsulating full pointer drag lifecycle.
 */

import * as React from "react";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";

/**
 * Pure helper to detect the drop target under screen coordinates.
 *
 * @param {number} clientX
 * @param {number} clientY
 * @param {string|null} [currentItemId] - ID of current item being dragged (prevents self-drop)
 * @returns {{ target: "add-to-collection"|"move-out"|null, collectionId?: string, area?: "navbar"|"root" }}
 */
export function detectDropTargetAtPoint(clientX, clientY, currentItemId = null) {
  if (typeof document === "undefined" || typeof document.elementFromPoint !== "function") {
    return { target: null };
  }
  const targetEl = document.elementFromPoint(clientX, clientY);
  if (!targetEl) return { target: null };

  const colCard = targetEl.closest("[data-collection-drop-id]");
  const backBtn = targetEl.closest("[data-drop-back]");
  const rootDrop = targetEl.closest("[data-drop-root]");

  if (colCard) {
    const colId = colCard.dataset.collectionDropId;
    if (!currentItemId || colId !== currentItemId) {
      return { target: "add-to-collection", collectionId: colId };
    }
  }

  if (backBtn) {
    return { target: "move-out", area: "navbar" };
  }

  if (rootDrop) {
    return { target: "move-out", area: "root" };
  }

  return { target: null };
}

/**
 * React hook to manage pointer drag gestures for studio grid items (workflows or collections).
 *
 * @param {Object} options
 * @param {"workflow"|"collection"} options.itemType
 * @param {Object} options.item - Raw workflow or collection entity
 * @param {string} options.itemId - Unique ID of the dragged item
 * @param {string} [options.url] - Media preview URL
 * @param {boolean} [options.isDraggable=true]
 * @param {boolean} [options.isRenaming=false]
 * @param {Object} [options.mouseX] - Framer motion value
 * @param {Object} [options.mouseY] - Framer motion value
 * @param {Object} [options.lastPos] - Ref to store last {x, y}
 * @param {Function} [options.onDragStateChange] - (isDragging) => void
 * @returns {{ handlePointerDown: Function, isDragging: boolean, dragTarget: string|null, justDraggedRef: React.MutableRefObject<boolean> }}
 */
export function useStudioItemDrag({
  itemType,
  item,
  itemId,
  url,
  isDraggable = true,
  isRenaming = false,
  mouseX,
  mouseY,
  lastPos,
  onDragStateChange,
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragTarget, setDragTarget] = React.useState(null);

  React.useEffect(() => {
    if (!isDragging) {
      setDragTarget(null);
      return;
    }
    const onTargetChange = (e) => setDragTarget(e.detail?.target ?? null);
    const hideBlockCursor = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
    window.addEventListener("studio:drag-target-change", onTargetChange);
    window.addEventListener("dragover", hideBlockCursor);
    return () => {
      window.removeEventListener("studio:drag-target-change", onTargetChange);
      window.removeEventListener("dragover", hideBlockCursor);
    };
  }, [isDragging]);

  const pointerStartRef = React.useRef(null);
  const isPointerDraggingRef = React.useRef(false);
  const justDraggedRef = React.useRef(false);
  const activeListenersRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (activeListenersRef.current) {
        window.removeEventListener("pointermove", activeListenersRef.current.onPointerMove);
        window.removeEventListener("pointerup", activeListenersRef.current.onPointerUp);
        window.removeEventListener("pointercancel", activeListenersRef.current.onPointerUp);
      }
    };
  }, []);

  const handlePointerDown = React.useCallback(
    (e) => {
      if (e.button !== 0 || isRenaming || !isDraggable) return;
      if (e.target?.closest?.("button, input, textarea, [data-prevent-drag], a, [role='menuitem']")) return;

      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      isPointerDraggingRef.current = false;

      const onPointerMove = (moveEvent) => {
        if (!pointerStartRef.current) return;
        const dx = moveEvent.clientX - pointerStartRef.current.x;
        const dy = moveEvent.clientY - pointerStartRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (!isPointerDraggingRef.current && dist > 5) {
          isPointerDraggingRef.current = true;
          setIsDragging(true);
          onDragStateChange?.(true);

          usePromptStore.getState().setIsDraggingGalleryItem(true);
          usePromptStore.getState().setDraggedItem({
            type: itemType,
            id: itemId,
            [itemType]: item,
            item,
            url,
          });

          window.dispatchEvent(new Event("dragstart"));
          window.dispatchEvent(new CustomEvent("studio:drag-start"));
        }

        if (isPointerDraggingRef.current) {
          if (lastPos) lastPos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
          if (mouseX) mouseX.set(moveEvent.clientX);
          if (mouseY) mouseY.set(moveEvent.clientY);

          const dropInfo = detectDropTargetAtPoint(moveEvent.clientX, moveEvent.clientY, itemId);

          if (dropInfo.target === "add-to-collection") {
            window.dispatchEvent(
              new CustomEvent("studio:pointer-hover-target", {
                detail: { target: "add-to-collection", collectionId: dropInfo.collectionId },
              })
            );
            setDragTarget("add-to-collection");
          } else if (dropInfo.target === "move-out") {
            window.dispatchEvent(
              new CustomEvent("studio:pointer-hover-target", {
                detail: { target: "move-out", area: dropInfo.area },
              })
            );
            setDragTarget("move-out");
          } else {
            window.dispatchEvent(
              new CustomEvent("studio:pointer-hover-target", { detail: { target: null } })
            );
            setDragTarget(null);
          }
        }
      };

      const onPointerUp = (upEvent) => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);

        if (isPointerDraggingRef.current) {
          isPointerDraggingRef.current = false;
          justDraggedRef.current = true;
          setTimeout(() => {
            justDraggedRef.current = false;
          }, 150);

          setIsDragging(false);
          setDragTarget(null);
          onDragStateChange?.(false);

          usePromptStore.getState().setIsDraggingGalleryItem(false);
          usePromptStore.getState().setDraggedItem(null);

          window.dispatchEvent(new Event("dragend"));
          window.dispatchEvent(new CustomEvent("studio:drag-end"));
          window.dispatchEvent(
            new CustomEvent("studio:pointer-hover-target", { detail: { target: null } })
          );

          const dropInfo = detectDropTargetAtPoint(upEvent.clientX, upEvent.clientY, itemId);

          if (dropInfo.target === "add-to-collection" && itemId && dropInfo.collectionId) {
            window.dispatchEvent(
              new CustomEvent("studio:drop-to-collection", {
                detail: { itemType, itemId, targetFolderId: dropInfo.collectionId },
              })
            );
          } else if (dropInfo.target === "move-out" && itemId) {
            window.dispatchEvent(
              new CustomEvent("studio:drop-to-back", {
                detail: {
                  itemType,
                  itemId,
                  ...(itemType === "workflow" ? { workflowId: itemId } : { collectionId: itemId }),
                },
              })
            );
          }
        }

        pointerStartRef.current = null;
        activeListenersRef.current = null;
      };

      activeListenersRef.current = { onPointerMove, onPointerUp };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    },
    [isRenaming, isDraggable, itemType, item, itemId, url, mouseX, mouseY, lastPos, onDragStateChange]
  );

  return {
    handlePointerDown,
    isDragging,
    dragTarget,
    justDraggedRef,
  };
}
