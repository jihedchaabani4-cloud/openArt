// [FSD Layer: features/workflows/model] — Pointer-driven marquee drag-selection hook for Studio galleries.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { scrollContainerBy } from "@/features/studio/model/useDragAutoScroll";
import { useStudioSelectionStore } from "./useStudioSelectionStore";

const ACTIVATION_THRESHOLD_PX = 5;
const EDGE_SCROLL_ZONE_PX = 40;
const MIN_EDGE_SCROLL_SPEED = 4;
const MAX_EDGE_SCROLL_SPEED = 18;

const INTERACTIVE_SELECTOR =
  'button, input, textarea, select, a, [role="checkbox"], [role="menuitem"], [role="slider"], [data-prevent-drag], [data-selection-bar="true"]';

/**
 * Axis-aligned bounding-box intersection check.
 * Supports `{ left, top, right, bottom }` and `{ left, top, width, height }` shapes.
 * Zero-area points return false; touching edges return false.
 */
export function rectsIntersect(a, b) {
  if (!a || !b) return false;
  const aRight = a.right ?? a.left + (a.width ?? 0);
  const aBottom = a.bottom ?? a.top + (a.height ?? 0);
  const bRight = b.right ?? b.left + (b.width ?? 0);
  const bBottom = b.bottom ?? b.top + (b.height ?? 0);

  if (
    (aRight <= a.left && aBottom <= a.top) ||
    (bRight <= b.left && bBottom <= b.top)
  ) {
    return false;
  }

  return a.left < bRight && aRight > b.left && a.top < bBottom && aBottom > b.top;
}

/**
 * Combines base selection keys with live marquee hit keys according to modifier mode:
 * - "replace": hitKeys only
 * - "add": union of baseKeys and hitKeys
 * - "toggle": symmetric difference (XOR) of baseKeys and hitKeys
 */
export function computeMarqueeSelection(baseKeys = [], hitKeys = [], mode = "replace") {
  const cleanBase = Array.from(
    new Set((Array.isArray(baseKeys) ? baseKeys : []).filter((k) => typeof k === "string" && k.length > 0))
  );
  const cleanHits = Array.from(
    new Set((Array.isArray(hitKeys) ? hitKeys : []).filter((k) => typeof k === "string" && k.length > 0))
  );

  if (mode === "add") {
    return Array.from(new Set([...cleanBase, ...cleanHits]));
  }

  if (mode === "toggle") {
    const baseSet = new Set(cleanBase);
    const hitSet = new Set(cleanHits);
    return [
      ...cleanBase.filter((k) => !hitSet.has(k)),
      ...cleanHits.filter((k) => !baseSet.has(k)),
    ];
  }

  return cleanHits;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getModifierMode(event) {
  if (event.ctrlKey || event.metaKey) return "toggle";
  if (event.shiftKey) return "add";
  return "replace";
}

function computeEdgeScrollSpeed(clientY, scRect) {
  if (!scRect || scRect.height <= 0) return 0;
  if (clientY < scRect.top + EDGE_SCROLL_ZONE_PX) {
    const ratio = clamp((scRect.top + EDGE_SCROLL_ZONE_PX - clientY) / EDGE_SCROLL_ZONE_PX, 0, 1);
    return -Math.round(
      MIN_EDGE_SCROLL_SPEED + ratio * (MAX_EDGE_SCROLL_SPEED - MIN_EDGE_SCROLL_SPEED)
    );
  }
  if (clientY > scRect.bottom - EDGE_SCROLL_ZONE_PX) {
    const ratio = clamp((clientY - (scRect.bottom - EDGE_SCROLL_ZONE_PX)) / EDGE_SCROLL_ZONE_PX, 0, 1);
    return Math.round(
      MIN_EDGE_SCROLL_SPEED + ratio * (MAX_EDGE_SCROLL_SPEED - MIN_EDGE_SCROLL_SPEED)
    );
  }
  return 0;
}

function applyMarqueeBoxStyle(el, rect) {
  if (!el || !rect) return;
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.top}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

function arraysShallowEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Pointer-driven marquee drag-selection hook.
 *
 * Attaches to the nearest `[data-scroll-container="true"]` ancestor (or `containerRef.current`),
 * caches card bounding rects once in content coordinates at drag start, mutates the marquee box
 * directly via DOM ref (only 2 React renders per drag: start & end), supports edge auto-scroll
 * and modifier keys (replace / Shift add / Ctrl|Meta toggle), and yields to draggable cards
 * (`[data-draggable-card="true"]`).
 */
export function useMarqueeSelection({
  containerRef,
  enabled = false,
  setSelectedKeys,
} = {}) {
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const marqueeRectRef = useRef(null);
  const marqueeBoxElRef = useRef(null);

  const marqueeBoxRef = useCallback((node) => {
    marqueeBoxElRef.current = node;
    if (node && marqueeRectRef.current) {
      applyMarqueeBoxStyle(node, marqueeRectRef.current);
    }
  }, []);

  const setSelectedKeysRef = useRef(setSelectedKeys);
  setSelectedKeysRef.current = setSelectedKeys;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      marqueeRectRef.current = null;
      setIsMarqueeActive(false);
      return undefined;
    }

    const container = containerRef?.current;
    if (!container) return undefined;

    const scrollContainer =
      container.closest?.('[data-scroll-container="true"]') || container;

    let isTracking = false;
    let isActive = false;
    let startClientX = 0;
    let startClientY = 0;
    let lastClientX = 0;
    let lastClientY = 0;
    let anchorContentX = 0;
    let anchorContentY = 0;
    let startMode = "replace";
    let activeMode = "replace";
    let baseKeys = [];
    let prevUserSelect = "";
    let rafId = null;
    let clickSuppressCleanup = null;
    let cachedCardRects = null;
    let cachedScRect = null;
    let cachedScrollWidth = 0;
    let cachedScrollHeight = 0;
    let lastEmittedKeys = null;

    const stopAutoScroll = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const clearClickSuppression = () => {
      if (clickSuppressCleanup) {
        clickSuppressCleanup();
        clickSuppressCleanup = null;
      }
    };

    const installTrailingClickSuppression = () => {
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
      clickSuppressCleanup = cleanup;
    };

    const buildCardRectCache = (currentContainer) => {
      const scRect = scrollContainer.getBoundingClientRect();
      const offsetX = scrollContainer.scrollLeft - scRect.left;
      const offsetY = scrollContainer.scrollTop - scRect.top;
      const selectableEls = currentContainer.querySelectorAll("[data-selection-key]");
      const rects = [];
      for (let i = 0; i < selectableEls.length; i++) {
        const el = selectableEls[i];
        const key = el.getAttribute("data-selection-key");
        if (!key) continue;
        const r = el.getBoundingClientRect();
        rects.push({
          key,
          left: r.left + offsetX,
          top: r.top + offsetY,
          right: r.right + offsetX,
          bottom: r.bottom + offsetY,
        });
      }
      cachedCardRects = rects;
      cachedScRect = scRect;
      cachedScrollWidth = scrollContainer.scrollWidth;
      cachedScrollHeight = scrollContainer.scrollHeight;
    };

    const updateMarquee = () => {
      const currentContainer = containerRef?.current;
      if (!currentContainer || !isActive) return;

      if (
        !cachedCardRects ||
        !cachedScRect ||
        scrollContainer.scrollWidth !== cachedScrollWidth ||
        scrollContainer.scrollHeight !== cachedScrollHeight
      ) {
        buildCardRectCache(currentContainer);
      }

      const scRect = cachedScRect;
      const hasBounds = scRect.width > 0 && scRect.height > 0;
      const scrollLeft = scrollContainer.scrollLeft;
      const scrollTop = scrollContainer.scrollTop;

      const anchorViewportX = scRect.left + anchorContentX - scrollLeft;
      const anchorViewportY = scRect.top + anchorContentY - scrollTop;

      const pointerX = hasBounds
        ? clamp(lastClientX, scRect.left, scRect.right)
        : lastClientX;
      const pointerY = hasBounds
        ? clamp(lastClientY, scRect.top, scRect.bottom)
        : lastClientY;

      const visualLeft = hasBounds
        ? clamp(Math.min(anchorViewportX, pointerX), scRect.left, scRect.right)
        : Math.min(anchorViewportX, pointerX);
      const visualRight = hasBounds
        ? clamp(Math.max(anchorViewportX, pointerX), scRect.left, scRect.right)
        : Math.max(anchorViewportX, pointerX);
      const visualTop = hasBounds
        ? clamp(Math.min(anchorViewportY, pointerY), scRect.top, scRect.bottom)
        : Math.min(anchorViewportY, pointerY);
      const visualBottom = hasBounds
        ? clamp(Math.max(anchorViewportY, pointerY), scRect.top, scRect.bottom)
        : Math.max(anchorViewportY, pointerY);

      const nextRect = {
        left: visualLeft,
        top: visualTop,
        width: Math.max(0, visualRight - visualLeft),
        height: Math.max(0, visualBottom - visualTop),
      };
      marqueeRectRef.current = nextRect;
      applyMarqueeBoxStyle(marqueeBoxElRef.current, nextRect);

      const pointerContentX = pointerX - scRect.left + scrollLeft;
      const pointerContentY = pointerY - scRect.top + scrollTop;
      const hitBoxContent = {
        left: Math.min(anchorContentX, pointerContentX),
        right: Math.max(anchorContentX, pointerContentX),
        top: Math.min(anchorContentY, pointerContentY),
        bottom: Math.max(anchorContentY, pointerContentY),
      };

      const hitKeys = [];
      for (let i = 0; i < cachedCardRects.length; i++) {
        const card = cachedCardRects[i];
        if (rectsIntersect(card, hitBoxContent)) {
          hitKeys.push(card.key);
        }
      }

      const nextKeys = computeMarqueeSelection(baseKeys, hitKeys, activeMode);
      if (arraysShallowEqual(lastEmittedKeys, nextKeys)) return;
      lastEmittedKeys = nextKeys;

      const setter =
        setSelectedKeysRef.current || useStudioSelectionStore.getState().setSelectedKeys;
      setter?.(nextKeys);
    };

    const tickAutoScroll = () => {
      rafId = null;
      if (!isActive) return;

      const scRect = cachedScRect || scrollContainer.getBoundingClientRect();
      const speed = computeEdgeScrollSpeed(lastClientY, scRect);
      if (speed === 0) return;

      const maxScroll = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
      const canScrollUp = speed < 0 && scrollContainer.scrollTop > 0;
      const canScrollDown = speed > 0 && scrollContainer.scrollTop < maxScroll;

      if (canScrollUp || canScrollDown) {
        scrollContainerBy(scrollContainer, speed, 0);
        updateMarquee();
        rafId = requestAnimationFrame(tickAutoScroll);
      }
    };

    const ensureAutoScroll = () => {
      if (!isActive) return;
      const scRect = cachedScRect || scrollContainer.getBoundingClientRect();
      const speed = computeEdgeScrollSpeed(lastClientY, scRect);
      if (speed !== 0 && rafId === null) {
        rafId = requestAnimationFrame(tickAutoScroll);
      } else if (speed === 0) {
        stopAutoScroll();
      }
    };

    const handleScroll = () => {
      if (!isActive) return;
      updateMarquee();
    };

    const finishDrag = ({ suppressNextClick = false } = {}) => {
      if (!isTracking) return;
      const wasActive = isActive;

      isTracking = false;
      isActive = false;
      cachedCardRects = null;
      cachedScRect = null;
      lastEmittedKeys = null;
      stopAutoScroll();

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("blur", handleWindowBlur);
      scrollContainer.removeEventListener("scroll", handleScroll);

      if (wasActive) {
        document.body.style.userSelect = prevUserSelect;
        marqueeRectRef.current = null;
        setIsMarqueeActive(false);
        if (suppressNextClick) {
          installTrailingClickSuppression();
        }
      }
    };

    const handlePointerMove = (e) => {
      if (!isTracking) return;
      lastClientX = e.clientX;
      lastClientY = e.clientY;

      if (!isActive) {
        if (Math.hypot(e.clientX - startClientX, e.clientY - startClientY) < ACTIVATION_THRESHOLD_PX) {
          return;
        }
        isActive = true;
        baseKeys = useStudioSelectionStore.getState().selectedKeys;
        cachedCardRects = null;
        lastEmittedKeys = null;
        window.getSelection?.()?.removeAllRanges?.();
        prevUserSelect = document.body.style.userSelect;
        document.body.style.userSelect = "none";
        setIsMarqueeActive(true);
      }

      activeMode = startMode !== "replace" ? startMode : getModifierMode(e);
      updateMarquee();
      ensureAutoScroll();
    };

    const handlePointerUp = () => {
      finishDrag({ suppressNextClick: true });
    };

    const handlePointerCancel = () => {
      finishDrag({ suppressNextClick: false });
    };

    const handleWindowBlur = () => {
      finishDrag({ suppressNextClick: false });
    };

    const handlePointerDown = (e) => {
      if (e.button !== 0 || e.pointerType === "touch") return;

      const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
      if (targetEl?.closest?.(INTERACTIVE_SELECTOR)) return;

      // Yield to draggable cards (single drag at 0 selected, multi-drag on selected cards)
      if (targetEl?.closest?.('[data-draggable-card="true"]')) {
        return;
      }

      const scRect = scrollContainer.getBoundingClientRect();
      // Ignore clicks directly on a visible vertical scrollbar track
      if (
        scrollContainer.clientWidth > 0 &&
        scrollContainer.offsetWidth > scrollContainer.clientWidth &&
        e.clientX > scRect.left + scrollContainer.clientWidth
      ) {
        return;
      }

      clearClickSuppression();
      isTracking = true;
      isActive = false;
      startClientX = e.clientX;
      startClientY = e.clientY;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      anchorContentX = e.clientX - scRect.left + scrollContainer.scrollLeft;
      anchorContentY = e.clientY - scRect.top + scrollContainer.scrollTop;
      startMode = getModifierMode(e);
      activeMode = startMode;

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);
      window.addEventListener("blur", handleWindowBlur);
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    };

    scrollContainer.addEventListener("pointerdown", handlePointerDown);

    return () => {
      scrollContainer.removeEventListener("pointerdown", handlePointerDown);
      finishDrag({ suppressNextClick: false });
      clearClickSuppression();
    };
  }, [containerRef, enabled]);

  return { isMarqueeActive, marqueeBoxRef, marqueeRectRef };
}
