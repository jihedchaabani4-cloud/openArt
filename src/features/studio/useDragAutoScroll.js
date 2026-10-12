"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";

/**
 * useDragAutoScroll
 * 
 * Provides two core UX enhancements during drag & drop:
 * 1. Mouse wheel scrolling while dragging: allows using mouse wheel or trackpad
 *    to scroll through galleries while dragging cards.
 * 2. Edge auto-scrolling: moving the dragged item near the top ("toppage") or
 *    bottom ("button page") of the viewport/container automatically scrolls up/down.
 */

/**
 * Finds the active scrollable container in the DOM.
 * Prioritizes element under (x, y), falls back to studio scroll container or window.
 */
export function findScrollContainer(x, y) {
  if (typeof document === "undefined") return null;

  // 1. Check element under pointer
  if (typeof x === "number" && typeof y === "number" && typeof document.elementFromPoint === "function") {
    let el = document.elementFromPoint(x, y);
    while (el && el !== document.body && el !== document.documentElement) {
      if (el instanceof HTMLElement) {
        const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
        const overflowY = style?.overflowY;
        const isScrollable = (overflowY === "auto" || overflowY === "scroll" || el.classList.contains("overflow-y-auto"))
          && el.scrollHeight > el.clientHeight;
        if (isScrollable) {
          return el;
        }
      }
      el = el.parentElement;
    }
  }

  // 2. Fallback to active studio gallery scroll container
  const candidates = document.querySelectorAll(
    '[data-scroll-container="true"], .custom-scrollbar, .overflow-y-auto'
  );
  for (const c of candidates) {
    if (c instanceof HTMLElement && c.scrollHeight > c.clientHeight) {
      return c;
    }
  }

  // 3. Fallback to documentElement if page is scrollable
  if (document.documentElement && document.documentElement.scrollHeight > (window.innerHeight || 0)) {
    return document.documentElement;
  }

  return null;
}

/**
 * Scrolls the given container safely by (deltaY, deltaX).
 */
export function scrollContainerBy(container, deltaY, deltaX = 0) {
  if (!container) return;
  if (
    container === document.documentElement ||
    container === document.body ||
    container === window
  ) {
    if (typeof window.scrollBy === "function") {
      window.scrollBy({ top: deltaY, left: deltaX, behavior: "instant" });
    }
  } else {
    container.scrollTop += deltaY;
    if (deltaX) container.scrollLeft += deltaX;
  }
}

/**
 * Calculates container bounding box relative to viewport.
 */
function getContainerBounds(container) {
  if (
    !container ||
    container === document.documentElement ||
    container === document.body ||
    container === window
  ) {
    return {
      top: 0,
      bottom: typeof window !== "undefined" ? window.innerHeight : 1000,
      left: 0,
      right: typeof window !== "undefined" ? window.innerWidth : 1000,
      height: typeof window !== "undefined" ? window.innerHeight : 1000,
      width: typeof window !== "undefined" ? window.innerWidth : 1000,
    };
  }
  return container.getBoundingClientRect();
}

export function useDragAutoScroll(options = {}) {
  const {
    containerRef = null,
    topThreshold = 130,
    bottomThreshold = 130,
    minSpeed = 3,
    maxSpeed = 22,
    enabled = true,
  } = options;

  const isDraggingRef = useRef(false);
  const pointerPosRef = useRef(null);
  const rafIdRef = useRef(null);

  const getTargetContainer = useCallback(
    (x, y) => {
      if (containerRef && containerRef.current) {
        return containerRef.current;
      }
      return findScrollContainer(x, y);
    },
    [containerRef]
  );

  // Compute scroll delta based on pointer position relative to container / edge
  const calculateScrollSpeed = useCallback(
    (container, pointerY) => {
      if (!container || pointerY == null) return 0;

      const bounds = getContainerBounds(container);
      const topEdge = Math.max(bounds.top, 0);
      const windowHeight = typeof window !== "undefined" ? window.innerHeight : 1000;
      const bottomEdge = Math.min(bounds.bottom, windowHeight);

      // Check top zone (scroll UP)
      if (pointerY <= topEdge + topThreshold) {
        const dist = pointerY - topEdge;
        let speed = maxSpeed;
        if (dist > 30) {
          const ratio = 1 - (dist - 30) / Math.max(1, topThreshold - 30);
          speed = minSpeed + ratio * (maxSpeed - minSpeed);
        }
        return -Math.max(minSpeed, Math.min(maxSpeed, Math.round(speed)));
      }

      // Check bottom zone (scroll DOWN)
      if (pointerY >= bottomEdge - bottomThreshold) {
        const dist = bottomEdge - pointerY;
        let speed = maxSpeed;
        if (dist > 30) {
          const ratio = 1 - (dist - 30) / Math.max(1, bottomThreshold - 30);
          speed = minSpeed + ratio * (maxSpeed - minSpeed);
        }
        return Math.max(minSpeed, Math.min(maxSpeed, Math.round(speed)));
      }

      return 0;
    },
    [topThreshold, bottomThreshold, minSpeed, maxSpeed]
  );

  // Stop auto-scrolling loop
  const stopAutoScrollLoop = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Main RAF tick for auto-scroll
  const tickAutoScroll = useCallback(() => {
    if (!isDraggingRef.current || !pointerPosRef.current) {
      stopAutoScrollLoop();
      return;
    }

    const { x, y } = pointerPosRef.current;
    const container = getTargetContainer(x, y);
    const speed = calculateScrollSpeed(container, y);

    if (speed !== 0 && container) {
      if (speed < 0 && container.scrollTop > 0) {
        scrollContainerBy(container, speed);
      } else if (speed > 0) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (container.scrollTop < maxScroll) {
          scrollContainerBy(container, speed);
        }
      }
      rafIdRef.current = requestAnimationFrame(tickAutoScroll);
    } else {
      // Out of edge zone: stop loop until pointer re-enters zone
      stopAutoScrollLoop();
    }
  }, [getTargetContainer, calculateScrollSpeed, stopAutoScrollLoop]);

  // Start auto-scroll loop if not already running
  const startAutoScrollLoop = useCallback(() => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(tickAutoScroll);
  }, [tickAutoScroll]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // 1. Sync with usePromptStore's isDraggingGalleryItem
    const unsubscribe = usePromptStore.subscribe((state) => {
      const isDraggingGallery = Boolean(state.isDraggingGalleryItem);
      isDraggingRef.current = isDraggingGallery;
      if (!isDraggingGallery) {
        pointerPosRef.current = null;
        stopAutoScrollLoop();
      }
    });

    // 2. Window drag lifecycle listeners
    const handleDragStart = () => {
      isDraggingRef.current = true;
    };

    const handleDragEnd = () => {
      isDraggingRef.current = false;
      pointerPosRef.current = null;
      stopAutoScrollLoop();
    };

    // 3. Pointer tracking during drag
    const handlePointerDrag = (e) => {
      if (!isDraggingRef.current) return;
      if (e.clientX === 0 && e.clientY === 0) return; // browser dragend artifact

      pointerPosRef.current = { x: e.clientX, y: e.clientY };

      const container = getTargetContainer(e.clientX, e.clientY);
      const speed = calculateScrollSpeed(container, e.clientY);
      if (speed !== 0) {
        startAutoScrollLoop();
      }
    };

    // 4. Mouse wheel during drag
    const handleWheel = (e) => {
      if (!isDraggingRef.current) return;

      const container = getTargetContainer(e.clientX, e.clientY);
      if (container) {
        let deltaY = e.deltaY;
        if (e.deltaMode === 1) deltaY *= 24; // lines
        else if (e.deltaMode === 2) deltaY *= 400; // pages

        let deltaX = e.deltaX;
        if (e.deltaMode === 1) deltaX *= 24;

        scrollContainerBy(container, deltaY, deltaX);

        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    let dragEnterCounter = 0;

    const handleDragEnter = (e) => {
      dragEnterCounter++;
      if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.length > 0) {
        isDraggingRef.current = true;
      }
    };

    const handleDragLeave = () => {
      dragEnterCounter--;
      if (dragEnterCounter <= 0) {
        dragEnterCounter = 0;
        if (!usePromptStore.getState().isDraggingGalleryItem) {
          isDraggingRef.current = false;
          pointerPosRef.current = null;
          stopAutoScrollLoop();
        }
      }
    };

    window.addEventListener("dragstart", handleDragStart, { capture: true });
    window.addEventListener("dragend", handleDragEnd, { capture: true });
    window.addEventListener("drop", handleDragEnd, { capture: true });
    window.addEventListener("dragenter", handleDragEnter, { capture: true });
    window.addEventListener("dragleave", handleDragLeave, { capture: true });
    window.addEventListener("dragover", handlePointerDrag, { capture: true, passive: true });
    window.addEventListener("drag", handlePointerDrag, { capture: true, passive: true });
    window.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    window.addEventListener("mouseup", handleDragEnd, { capture: true });

    return () => {
      unsubscribe();
      stopAutoScrollLoop();
      window.removeEventListener("dragstart", handleDragStart, { capture: true });
      window.removeEventListener("dragend", handleDragEnd, { capture: true });
      window.removeEventListener("drop", handleDragEnd, { capture: true });
      window.removeEventListener("dragenter", handleDragEnter, { capture: true });
      window.removeEventListener("dragleave", handleDragLeave, { capture: true });
      window.removeEventListener("dragover", handlePointerDrag, { capture: true });
      window.removeEventListener("drag", handlePointerDrag, { capture: true });
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("mouseup", handleDragEnd, { capture: true });
    };
  }, [
    enabled,
    getTargetContainer,
    calculateScrollSpeed,
    startAutoScrollLoop,
    stopAutoScrollLoop,
  ]);

  return {
    isDragging: isDraggingRef.current,
  };
}
