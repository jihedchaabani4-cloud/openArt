"use client";

import { useState, useRef, useEffect } from "react";
import { findNearestCard, isLeftmostCard } from "./spatialNavigation";

/**
 * useImportMediaKeyboard
 *
 * Desktop-class keyboard navigation state machine for ImportMediaPopover:
 * - Zones: 'sidebar' | 'gallery' | 'search'
 * - Spatial 2D navigation in grid layouts (via getBoundingClientRect)
 * - Per-category focus memory
 * - Sidebar navigation keeps focus in sidebar until ArrowRight or Enter is pressed
 * - ArrowLeft from leftmost card in row hands off to sidebar
 * - '/' quick-focuses the search bar
 */
export function useImportMediaKeyboard({
  open = false,
  availableCategories = [],
  selectedCategory,
  setSelectedCategory,
  visibleItems = [],
  layoutMode = "grid",
  categoryRefs,
  cardRefs,
  searchInputRef,
  onSelectAsset,
  onToggleAsset,
  onConfirmSelection,
  onClose,
}) {
  const [zone, setZone] = useState("gallery"); // "sidebar" | "gallery" | "search"
  const [highlightedCategoryIdx, setHighlightedCategoryIdx] = useState(0);
  const [highlightedAssetIdx, setHighlightedAssetIdx] = useState(0);

  // Focus Memory Map: preserves the last focused asset ID for each category
  const focusMemory = useRef({});
  const prevCategoryRef = useRef(selectedCategory);
  const prevOpenRef = useRef(open);

  const onSelectAssetRef = useRef(onSelectAsset);
  onSelectAssetRef.current = onSelectAsset;

  const onToggleAssetRef = useRef(onToggleAsset);
  onToggleAssetRef.current = onToggleAsset;

  const onConfirmSelectionRef = useRef(onConfirmSelection);
  onConfirmSelectionRef.current = onConfirmSelection;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const setSelectedCategoryRef = useRef(setSelectedCategory);
  setSelectedCategoryRef.current = setSelectedCategory;

  // Sync highlightedCategoryIdx with selectedCategory prop (idempotent)
  useEffect(() => {
    if (!selectedCategory || availableCategories.length === 0) return;
    const idx = availableCategories.findIndex((c) => c.id === selectedCategory);
    if (idx !== -1) {
      setHighlightedCategoryIdx((prev) => (prev !== idx ? idx : prev));
    }
  }, [selectedCategory, availableCategories]);

  // When selected category changes, restore memorized asset or default to 0
  useEffect(() => {
    if (prevCategoryRef.current !== selectedCategory) {
      prevCategoryRef.current = selectedCategory;

      if (!selectedCategory || visibleItems.length === 0) {
        setHighlightedAssetIdx((prev) => (prev !== 0 ? 0 : prev));
        return;
      }

      const memorizedId = focusMemory.current[selectedCategory];
      if (memorizedId) {
        const idx = visibleItems.findIndex(
          (it) => (it.id || it.workflow_id || it.workflowId) === memorizedId
        );
        const targetIdx = idx !== -1 ? idx : 0;
        setHighlightedAssetIdx((prev) => (prev !== targetIdx ? targetIdx : prev));
        return;
      }

      setHighlightedAssetIdx((prev) => (prev !== 0 ? 0 : prev));
    }
  }, [selectedCategory, visibleItems]);

  // Keep highlighted asset index within bounds (idempotent)
  useEffect(() => {
    if (visibleItems.length > 0) {
      setHighlightedAssetIdx((prev) => {
        if (prev >= visibleItems.length) {
          return visibleItems.length - 1;
        }
        return prev;
      });
    } else {
      setHighlightedAssetIdx((prev) => (prev !== 0 ? 0 : prev));
    }
  }, [visibleItems.length]);

  // Remember active asset for current category
  useEffect(() => {
    if (zone === "gallery" && visibleItems[highlightedAssetIdx] && selectedCategory) {
      const item = visibleItems[highlightedAssetIdx];
      focusMemory.current[selectedCategory] = item.id || item.workflow_id || item.workflowId;
    }
  }, [highlightedAssetIdx, zone, visibleItems, selectedCategory]);

  // Auto-scroll highlighted card into view smoothly
  useEffect(() => {
    if (zone === "gallery" && cardRefs?.current) {
      const el = cardRefs.current[highlightedAssetIdx];
      if (el) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedAssetIdx, zone, cardRefs]);

  // Auto-scroll highlighted category into view smoothly
  useEffect(() => {
    if (zone === "sidebar" && categoryRefs?.current) {
      const el = categoryRefs.current[highlightedCategoryIdx];
      if (el) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedCategoryIdx, zone, categoryRefs]);

  // Reset zone on initial open transition only
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setZone((prev) => (prev !== "gallery" ? "gallery" : prev));
    }
    prevOpenRef.current = open;
  }, [open]);

  // Global window capture keydown handler
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      // 1. Escape: Close dialog (or clear search if in search input)
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (zone === "search") {
          setZone("gallery");
          searchInputRef?.current?.blur();
        } else {
          onCloseRef.current?.();
        }
        return;
      }

      // 2. '/' shortcut to jump to search bar
      const isInputFocused =
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable ||
        Boolean(e.target.closest?.('[contenteditable="true"]'));

      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        e.stopPropagation();
        setZone("search");
        searchInputRef?.current?.focus();
        return;
      }

      // ── ZONE: SEARCH ──────────────────────────────────────────
      if (zone === "search") {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          setZone("gallery");
          searchInputRef?.current?.blur();
        } else if (e.key === "Tab") {
          e.preventDefault();
          e.stopPropagation();
          setZone("gallery");
          searchInputRef?.current?.blur();
        }
        return;
      }

      // ── ZONE: SIDEBAR ─────────────────────────────────────────
      if (zone === "sidebar") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          if (availableCategories.length === 0) return;
          const next = (highlightedCategoryIdx + 1) % availableCategories.length;
          setHighlightedCategoryIdx(next);
          setSelectedCategory?.(availableCategories[next].id);
          // Focus intentionally remains in sidebar!
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          e.stopPropagation();
          if (availableCategories.length === 0) return;
          const prev =
            (highlightedCategoryIdx - 1 + availableCategories.length) %
            availableCategories.length;
          setHighlightedCategoryIdx(prev);
          setSelectedCategory?.(availableCategories[prev].id);
          // Focus intentionally remains in sidebar!
        } else if (e.key === "ArrowRight" || e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          e.stopPropagation();
          // Handoff to gallery
          setZone("gallery");
        }
        return;
      }

      // ── ZONE: GALLERY ─────────────────────────────────────────
      if (zone === "gallery") {
        // Space: Toggle selection of current card (multi-selection)
        if (e.key === " " && !isInputFocused) {
          e.preventDefault();
          e.stopPropagation();
          const item = visibleItems[highlightedAssetIdx];
          if (item) {
            if (onToggleAssetRef.current) {
              onToggleAssetRef.current(item);
            } else {
              onSelectAssetRef.current?.(item);
            }
          }
          return;
        }

        // Enter: Commit multi-selection or directly select highlighted card
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          const item = visibleItems[highlightedAssetIdx];
          if (onConfirmSelectionRef.current) {
            onConfirmSelectionRef.current(item);
          } else if (item) {
            onSelectAssetRef.current?.(item);
          }
          return;
        }

        if (e.key === "Tab" && e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          setZone("sidebar");
          return;
        }

        // Jump to first / last item
        if (e.key === "Home") {
          e.preventDefault();
          e.stopPropagation();
          setHighlightedAssetIdx(0);
          return;
        }
        if (e.key === "End") {
          e.preventDefault();
          e.stopPropagation();
          setHighlightedAssetIdx(Math.max(0, visibleItems.length - 1));
          return;
        }

        // List mode simple navigation
        if (layoutMode === "list") {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            setHighlightedAssetIdx((p) => Math.min(visibleItems.length - 1, p + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            setHighlightedAssetIdx((p) => Math.max(0, p - 1));
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            e.stopPropagation();
            setZone("sidebar");
          }
          return;
        }

        // Grid mode spatial navigation (RowsPhotoAlbum)
        const currentEl = cardRefs?.current?.[highlightedAssetIdx];

        if (e.key === "ArrowDown") {
          e.preventDefault();
          e.stopPropagation();
          if (!currentEl) {
            setHighlightedAssetIdx((p) => Math.min(visibleItems.length - 1, p + 1));
            return;
          }
          const nearest = findNearestCard(currentEl, cardRefs.current, "ArrowDown");
          if (nearest !== -1) {
            setHighlightedAssetIdx(nearest);
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          e.stopPropagation();
          if (!currentEl) {
            setHighlightedAssetIdx((p) => Math.max(0, p - 1));
            return;
          }
          const nearest = findNearestCard(currentEl, cardRefs.current, "ArrowUp");
          if (nearest !== -1) {
            setHighlightedAssetIdx(nearest);
          }
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
          if (!currentEl) {
            setHighlightedAssetIdx((p) => Math.min(visibleItems.length - 1, p + 1));
            return;
          }
          const nearest = findNearestCard(currentEl, cardRefs.current, "ArrowRight");
          if (nearest !== -1) {
            setHighlightedAssetIdx(nearest);
          } else if (highlightedAssetIdx < visibleItems.length - 1) {
            // Natural wrap to next element in array if row ended
            setHighlightedAssetIdx((p) => p + 1);
          }
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          if (!currentEl) {
            setZone("sidebar");
            return;
          }

          // Check if at leftmost edge of current visual row
          const isLeftEdge = isLeftmostCard(currentEl, cardRefs.current);
          if (isLeftEdge) {
            // Handoff to Category Sidebar!
            setZone("sidebar");
          } else {
            const nearest = findNearestCard(currentEl, cardRefs.current, "ArrowLeft");
            if (nearest !== -1) {
              setHighlightedAssetIdx(nearest);
            } else {
              setHighlightedAssetIdx((p) => Math.max(0, p - 1));
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    open,
    zone,
    highlightedCategoryIdx,
    highlightedAssetIdx,
    availableCategories,
    visibleItems,
    layoutMode,
    cardRefs,
    categoryRefs,
    searchInputRef,
    setSelectedCategory,
    onSelectAsset,
    onClose,
  ]);

  return {
    zone,
    setZone,
    highlightedCategoryIdx,
    setHighlightedCategoryIdx,
    highlightedAssetIdx,
    setHighlightedAssetIdx,
  };
}
