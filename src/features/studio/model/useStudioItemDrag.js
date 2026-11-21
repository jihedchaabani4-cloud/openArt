/**
 * Studio Item Drag Service / Hook
 *
 * What it owns:
 * - Pointer-based drag gesture detection (distance threshold > 5px, ignores non-draggable tags).
 * - Single & multi-selected drag payloads (`getDragItems`, `getInvalidDropFolderIds`, `dragCount`).
 * - Global event dispatching (`dragstart`, `dragend`, `studio:drag-start`, `studio:drag-end`).
 * - Active drag state synchronization with `usePromptStore` (`isDraggingGalleryItem`, `draggedItem`).
 * - Real-time collision detection during drag against studio drop targets:
 *     - [data-collection-drop-id]: `studio:pointer-hover-target` ("add-to-collection")
 *     - [data-drop-project-root="true"]: `studio:pointer-hover-target` ("move-to-root", area: "sidebar-root")
 *     - [data-drop-back]: `studio:pointer-hover-target` ("move-out", area: "navbar")
 *     - [data-drop-root]: `studio:pointer-hover-target` ("move-out", area: "root")
 * - Drop execution event dispatching on pointer release:
 *     - `studio:drop-to-collection`
 *     - `studio:drop-to-project-root`
 *     - `studio:drop-to-back`
 * - Motion values updates (`mouseX`, `mouseY`, `lastPos`) for drag previews.
 *
 * Public methods:
 * - `detectDropTargetAtPoint(clientX, clientY, currentItemId, invalidFolderIds)`: pure collision resolver.
 * - `useStudioItemDrag(options)`: React hook encapsulating full pointer drag lifecycle.
 */

import * as React from "react";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";

function isInvalidFolder(invalidFolderIds, colId) {
  if (!invalidFolderIds || !colId) return false;
  if (typeof invalidFolderIds.has === "function") {
    return invalidFolderIds.has(colId) || invalidFolderIds.has(String(colId));
  }
  if (Array.isArray(invalidFolderIds)) {
    return invalidFolderIds.includes(colId) || invalidFolderIds.includes(String(colId));
  }
  return false;
}

function sameDragTarget(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.target === b.target && a.collectionId === b.collectionId && a.area === b.area;
}

/**
 * Pure helper to detect the drop target under screen coordinates.
 *
 * @param {number} clientX
 * @param {number} clientY
 * @param {string|null} [currentItemId] - ID of current item being dragged (prevents self-drop)
 * @param {Set<string>|Array<string>|null} [invalidFolderIds] - Folder IDs blocked from receiving drops
 * @returns {{ target: "add-to-collection"|"move-to-root"|"move-out"|null, collectionId?: string, area?: "sidebar-root"|"navbar"|"root" }}
 */
export function detectDropTargetAtPoint(
  clientX,
  clientY,
  currentItemId = null,
  invalidFolderIds = null
) {
  if (typeof document === "undefined" || typeof document.elementFromPoint !== "function") {
    return { target: null };
  }
  const targetEl = document.elementFromPoint(clientX, clientY);
  if (!targetEl) return { target: null };

  const colCard = targetEl.closest("[data-collection-drop-id]");
  if (colCard) {
    const colId = colCard.dataset.collectionDropId;
    const isSelf = Boolean(currentItemId) && String(colId) === String(currentItemId);
    if (colId && !isSelf && !isInvalidFolder(invalidFolderIds, colId)) {
      return { target: "add-to-collection", collectionId: colId };
    }
  }

  const projectRootDrop = targetEl.closest('[data-drop-project-root="true"]');
  if (projectRootDrop) {
    return { target: "move-to-root", area: "sidebar-root" };
  }

  const backBtn = targetEl.closest("[data-drop-back]");
  if (backBtn) {
    return { target: "move-out", area: "navbar" };
  }

  const rootDrop = targetEl.closest("[data-drop-root]");
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
 * @param {() => Array<{ itemType: "workflow"|"collection", id: string }>} [options.getDragItems]
 * @param {() => Set<string>} [options.getInvalidDropFolderIds]
 * @returns {{ handlePointerDown: Function, isDragging: boolean, dragTarget: Object|null, dragCount: number, justDraggedRef: React.MutableRefObject<boolean> }}
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
  getDragItems,
  getInvalidDropFolderIds,
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragTarget, setDragTarget] = React.useState(null);
  const [dragCount, setDragCount] = React.useState(1);

  const getDragItemsRef = React.useRef(getDragItems);
  getDragItemsRef.current = getDragItems;
  const getInvalidDropFolderIdsRef = React.useRef(getInvalidDropFolderIds);
  getInvalidDropFolderIdsRef.current = getInvalidDropFolderIds;

  React.useEffect(() => {
    if (!isDragging) {
      setDragTarget(null);
      return;
    }
    const onTargetChange = (e) => {
      const raw = e.detail?.target ?? null;
      const next = !raw ? null : typeof raw === "string" ? { target: raw } : raw;
      setDragTarget((prev) => (sameDragTarget(prev, next) ? prev : next));
    };
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
  const justDraggedTimerRef = React.useRef(null);
  const activeListenersRef = React.useRef(null);
  const clickSuppressCleanupRef = React.useRef(null);

  const clearClickSuppression = React.useCallback(() => {
    if (clickSuppressCleanupRef.current) {
      clickSuppressCleanupRef.current();
      clickSuppressCleanupRef.current = null;
    }
  }, []);

  const installTrailingClickSuppression = React.useCallback(() => {
    clearClickSuppression();
    let timerId = null;

    const suppressClick = (clickEvent) => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      clickEvent.stopImmediatePropagation?.();
      clearClickSuppression();
    };

    const cleanup = () => {
      window.removeEventListener("click", suppressClick, true);
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    window.addEventListener("click", suppressClick, true);
    timerId = setTimeout(() => {
      clearClickSuppression();
    }, 0);
    clickSuppressCleanupRef.current = cleanup;
  }, [clearClickSuppression]);

  React.useEffect(() => {
    return () => {
      clearClickSuppression();
      if (justDraggedTimerRef.current) {
        clearTimeout(justDraggedTimerRef.current);
        justDraggedTimerRef.current = null;
      }
      if (activeListenersRef.current) {
        window.removeEventListener("pointermove", activeListenersRef.current.onPointerMove);
        window.removeEventListener("pointerup", activeListenersRef.current.onPointerUp);
        window.removeEventListener("pointercancel", activeListenersRef.current.onPointerUp);
        window.removeEventListener("dragstart", activeListenersRef.current.onNativeDragStart, true);
        activeListenersRef.current = null;
      }
      if (isPointerDraggingRef.current) {
        isPointerDraggingRef.current = false;
        usePromptStore.getState().setIsDraggingGalleryItem(false);
        usePromptStore.getState().setDraggedItem(null);
        window.dispatchEvent(new Event("dragend"));
        window.dispatchEvent(new CustomEvent("studio:drag-end"));
        window.dispatchEvent(
          new CustomEvent("studio:pointer-hover-target", { detail: { target: null } })
        );
      }
    };
  }, [clearClickSuppression]);

  const handlePointerDown = React.useCallback(
    (e) => {
      if (e.button !== 0 || isRenaming || !isDraggable) return;
      if (e.target?.closest?.("button, input, textarea, [data-prevent-drag], a, [role='menuitem']")) return;

      clearClickSuppression();
      if (activeListenersRef.current) {
        window.removeEventListener("pointermove", activeListenersRef.current.onPointerMove);
        window.removeEventListener("pointerup", activeListenersRef.current.onPointerUp);
        window.removeEventListener("pointercancel", activeListenersRef.current.onPointerUp);
        window.removeEventListener("dragstart", activeListenersRef.current.onNativeDragStart, true);
        activeListenersRef.current = null;
      }

      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      isPointerDraggingRef.current = false;

      let resolvedItems = [];
      let invalidFolderIds = new Set();

      // Block native HTML5 <img> dragstart while pointer drag is tracked so the browser does not emit pointercancel
      const onNativeDragStart = (dragEvent) => {
        if (dragEvent.isTrusted) {
          dragEvent.preventDefault();
        }
      };

      const resolveDragItems = () => {
        const fallback = itemId ? [{ itemType, id: String(itemId) }] : [];
        if (typeof getDragItemsRef.current !== "function") return fallback;
        const raw = getDragItemsRef.current();
        if (!Array.isArray(raw) || raw.length === 0) return fallback;
        const valid = raw
          .filter((entry) => entry && entry.id != null && entry.id !== "")
          .map((entry) => ({
            itemType: entry.itemType === "collection" ? "collection" : "workflow",
            id: String(entry.id),
          }));
        return valid.length > 0 ? valid : fallback;
      };

      const resolveInvalidFolderIds = (items) => {
        const ids = new Set();
        if (typeof getInvalidDropFolderIdsRef.current === "function") {
          const custom = getInvalidDropFolderIdsRef.current();
          if (custom) {
            for (const id of custom) {
              if (id != null && id !== "") ids.add(String(id));
            }
          }
        } else if (itemType === "collection" && itemId) {
          ids.add(String(itemId));
        }
        for (const entry of items) {
          if (entry.itemType === "collection" && entry.id) {
            ids.add(String(entry.id));
          }
        }
        return ids;
      };

      const onPointerMove = (moveEvent) => {
        if (!pointerStartRef.current) return;
        const dx = moveEvent.clientX - pointerStartRef.current.x;
        const dy = moveEvent.clientY - pointerStartRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (!isPointerDraggingRef.current && dist > 5) {
          resolvedItems = resolveDragItems();
          invalidFolderIds = resolveInvalidFolderIds(resolvedItems);

          isPointerDraggingRef.current = true;
          setIsDragging(true);
          setDragCount(resolvedItems.length || 1);
          onDragStateChange?.(true);

          usePromptStore.getState().setIsDraggingGalleryItem(true);
          usePromptStore.getState().setDraggedItem({
            type: itemType,
            id: itemId,
            [itemType]: item,
            item,
            url,
            items: resolvedItems,
          });

          window.dispatchEvent(new Event("dragstart"));
          window.dispatchEvent(new CustomEvent("studio:drag-start"));
        }

        if (isPointerDraggingRef.current) {
          if (lastPos) lastPos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
          if (mouseX) mouseX.set(moveEvent.clientX);
          if (mouseY) mouseY.set(moveEvent.clientY);

          const dropInfo = detectDropTargetAtPoint(
            moveEvent.clientX,
            moveEvent.clientY,
            itemId,
            invalidFolderIds
          );

          window.dispatchEvent(
            new CustomEvent("studio:pointer-hover-target", { detail: dropInfo })
          );
          const nextTarget = dropInfo.target ? dropInfo : null;
          setDragTarget((prev) => (sameDragTarget(prev, nextTarget) ? prev : nextTarget));
        }
      };

      const onPointerUp = (upEvent) => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("dragstart", onNativeDragStart, true);

        if (isPointerDraggingRef.current) {
          isPointerDraggingRef.current = false;
          justDraggedRef.current = true;
          if (justDraggedTimerRef.current) clearTimeout(justDraggedTimerRef.current);
          justDraggedTimerRef.current = setTimeout(() => {
            justDraggedRef.current = false;
            justDraggedTimerRef.current = null;
          }, 150);

          if (upEvent.type !== "pointercancel") {
            installTrailingClickSuppression();
          }

          setIsDragging(false);
          setDragTarget(null);
          setDragCount(1);
          onDragStateChange?.(false);

          usePromptStore.getState().setIsDraggingGalleryItem(false);
          usePromptStore.getState().setDraggedItem(null);

          window.dispatchEvent(new Event("dragend"));
          window.dispatchEvent(new CustomEvent("studio:drag-end"));
          window.dispatchEvent(
            new CustomEvent("studio:pointer-hover-target", { detail: { target: null } })
          );

          if (upEvent.type !== "pointercancel" && (itemId || resolvedItems.length > 0)) {
            const dropInfo = detectDropTargetAtPoint(
              upEvent.clientX,
              upEvent.clientY,
              itemId,
              invalidFolderIds
            );
            const itemsField = resolvedItems.length > 1 ? { items: resolvedItems } : {};

            if (dropInfo.target === "add-to-collection" && dropInfo.collectionId) {
              window.dispatchEvent(
                new CustomEvent("studio:drop-to-collection", {
                  detail: {
                    itemType,
                    itemId,
                    targetFolderId: dropInfo.collectionId,
                    ...itemsField,
                  },
                })
              );
            } else if (dropInfo.target === "move-to-root") {
              window.dispatchEvent(
                new CustomEvent("studio:drop-to-project-root", {
                  detail: {
                    itemType,
                    itemId,
                    targetFolderId: null,
                    items: resolvedItems,
                  },
                })
              );
            } else if (dropInfo.target === "move-out") {
              window.dispatchEvent(
                new CustomEvent("studio:drop-to-back", {
                  detail: {
                    itemType,
                    itemId,
                    ...(itemType === "workflow" ? { workflowId: itemId } : { collectionId: itemId }),
                    ...itemsField,
                  },
                })
              );
            }
          }
        }

        pointerStartRef.current = null;
        activeListenersRef.current = null;
      };

      activeListenersRef.current = { onPointerMove, onPointerUp, onNativeDragStart };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("dragstart", onNativeDragStart, true);
    },
    [
      isRenaming,
      isDraggable,
      itemType,
      item,
      itemId,
      url,
      mouseX,
      mouseY,
      lastPos,
      onDragStateChange,
      clearClickSuppression,
      installTrailingClickSuppression,
    ]
  );

  return {
    handlePointerDown,
    isDragging,
    dragTarget,
    dragCount,
    justDraggedRef,
  };
}
