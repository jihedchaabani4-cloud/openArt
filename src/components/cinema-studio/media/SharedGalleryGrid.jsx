"use client";

import React, { useMemo, useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { resolveMainMedia } from "@/features/workflows/core/resolveMediaRef";
import { toMediaItem } from "@/features/workflows/core/toMediaItem";
import { useWorkflowUiStore } from "@/features/workflows/model/useWorkflowUiStore";
import {
  useStudioSelectionStore,
  makeSelectionKey,
  hasSelectedKey,
} from "@/features/workflows/model/useStudioSelectionStore";
import { resolveStudioActions } from "@/features/workflows/lib/studioActionRules";
import { useMarqueeSelection } from "@/features/workflows/model/useMarqueeSelection";
import { Checkbox } from "@/components/base/checkbox";
import {
  getItemMetadata as getDisplayMeta,
  getStudioGridDensity,
  getResponsiveTargetRowHeight,
  getCachedImageDimensions,
  subscribeImageDimensions,
  STUDIO_GRID_SIZE_STOPS,
} from "@/shared/lib/displayUtils";
import { clampAspectRatio, computeJustifiedRows } from "@/shared/lib/justifiedLayout";
import { MediaCard } from "./MediaCard";
import { MediaTile } from "./MediaTile";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const WORKFLOW_MEDIA_CACHE = new WeakMap();
const RAW_MEDIA_CACHE = new WeakMap();

const EMPTY_IMAGE_SRC =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
const EMPTY_COLLECTION_SRC =
  "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg'/>";
const EMPTY_SELECTION_KEYS = [];
const EMPTY_PROPS = {};

const DateGroupCheckbox = React.memo(function DateGroupCheckbox({
  sectionKeys,
  label,
  onToggleGroup,
}) {
  const checkState = useStudioSelectionStore((s) => {
    if (sectionKeys.length === 0 || s.selectedKeys.length === 0) {
      return "unchecked";
    }
    let count = 0;
    for (let i = 0; i < sectionKeys.length; i++) {
      if (hasSelectedKey(s, sectionKeys[i])) count++;
    }
    if (count === 0) return "unchecked";
    return count === sectionKeys.length ? "checked" : "indeterminate";
  });

  const handleCheckedChange = useCallback(() => {
    onToggleGroup(sectionKeys);
  }, [onToggleGroup, sectionKeys]);

  return (
    <Checkbox
      variant="default"
      checked={
        checkState === "checked"
          ? true
          : checkState === "indeterminate"
            ? "indeterminate"
            : false
      }
      onCheckedChange={handleCheckedChange}
      aria-label={`Select all from ${label}`}
    />
  );
});
DateGroupCheckbox.displayName = "DateGroupCheckbox";

const SelectableCardSlot = React.memo(function SelectableCardSlot({
  photo,
  selKey,
  width,
  height,
  index,
  selectionEnabled,
  isSelectionMode,
  onToggleSelectKey,
  ResolvedCard,
  renderCard,
  cardProps,
  projectId,
  onWorkflowClick,
  onCollectionClick,
  onItemClick,
  onSelect,
  itemClassName,
}) {
  const isSelected = useStudioSelectionStore((s) =>
    selectionEnabled && selKey ? hasSelectedKey(s, selKey) : false
  );

  const onToggleSelect = useCallback(
    (e) => {
      if (selKey) onToggleSelectKey(selKey, e);
    },
    [onToggleSelectKey, selKey]
  );

  const selectionProps =
    selectionEnabled && selKey
      ? {
          isSelected,
          isSelectionMode,
          selectionEnabled: true,
          onToggleSelect,
        }
      : EMPTY_PROPS;

  let content;
  if (typeof renderCard === "function") {
    content = renderCard({
      photo,
      item: photo.item,
      workflow: photo.workflow,
      collection: photo.collection,
      itemCount: photo.itemCount,
      width,
      height,
      index,
      ...selectionProps,
    });
  } else if (photo.itemType === "collection") {
    content = (
      <ResolvedCard
        collection={photo.collection}
        itemType="collection"
        coverUrl={photo.coverUrl}
        coverIsVideo={photo.coverIsVideo}
        itemCount={photo.itemCount}
        projectId={projectId}
        onClick={onCollectionClick}
        className={itemClassName}
        width={width}
        height={height}
        {...selectionProps}
        {...cardProps}
      />
    );
  } else if (photo.itemType === "workflow") {
    content = (
      <ResolvedCard
        item={photo.item}
        workflow={photo.workflow}
        itemType="workflow"
        projectId={projectId}
        onClick={onWorkflowClick || onItemClick}
        onSelect={onSelect}
        className={itemClassName}
        width={width}
        height={height}
        {...selectionProps}
        {...cardProps}
      />
    );
  } else {
    content = (
      <ResolvedCard
        item={photo.item}
        onClick={onItemClick}
        onSelect={onSelect}
        className={itemClassName}
        width={width}
        height={height}
        {...selectionProps}
        {...cardProps}
      />
    );
  }

  return (
    <div
      data-gallery-card="true"
      data-selection-key={selKey || undefined}
      className="shrink-0"
      style={{ width, height }}
    >
      {content}
    </div>
  );
});
SelectableCardSlot.displayName = "SelectableCardSlot";

function getPhotoSelectionKey(photo) {
  if (!photo) return null;
  if (photo.itemType === "collection") {
    if (!resolveStudioActions({ entityType: "collection", item: photo.collection }).can.select) {
      return null;
    }
    const id = photo.collection?.id || photo.collection?.folder_id || photo.collection?.folderId;
    return id ? makeSelectionKey("collection", id) : null;
  }
  const { can } = resolveStudioActions({
    workflow: photo.workflow,
    item: photo.item,
  });
  if (!can.select) return null;
  if (photo.itemType === "workflow") {
    const id = photo.workflow?.id || photo.workflow?.name;
    return id ? makeSelectionKey("workflow", id) : null;
  }
  const id = photo.item?.workflowId || photo.item?.id;
  return id ? makeSelectionKey("workflow", id) : null;
}

function isEditableTarget(el) {
  if (!el || typeof el.tagName !== "string") return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  if (typeof el.closest === "function" && el.closest("[contenteditable='true'], [contenteditable='']")) {
    return true;
  }
  return false;
}

const DATE_GROUP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function resolvePhotoTimestamp(photo, fallbackWorkflow = null) {
  if (!photo || photo.itemType === "collection") return null;
  const wf = photo.workflow || fallbackWorkflow;
  const rawItem = photo.item?.raw || photo.item;
  const rawTime =
    wf?.metadata?.createTime ||
    wf?.create_time ||
    wf?.created_at ||
    wf?.deleted_at ||
    rawItem?.metadata?.createTime ||
    rawItem?.create_time ||
    rawItem?.created_at ||
    photo.item?.create_time ||
    null;
  if (!rawTime) return null;
  const d = new Date(rawTime);
  return Number.isNaN(d.getTime()) ? null : d;
}

function groupPhotosByDate(photos = [], fallbackWorkflow = null) {
  const collectionPhotos = [];
  const datedGroups = new Map();
  const undatedPhotos = [];

  for (const photo of photos) {
    if (photo.itemType === "collection") {
      collectionPhotos.push(photo);
      continue;
    }
    const date = resolvePhotoTimestamp(photo, fallbackWorkflow);
    if (!date) {
      undatedPhotos.push(photo);
      continue;
    }
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    let group = datedGroups.get(key);
    if (!group) {
      group = {
        key,
        label: DATE_GROUP_FORMATTER.format(date),
        photos: [],
      };
      datedGroups.set(key, group);
    }
    group.photos.push(photo);
  }

  const sections = [];
  if (collectionPhotos.length > 0) {
    sections.push({ key: "__collections__", label: null, photos: collectionPhotos });
  }
  for (const group of datedGroups.values()) {
    sections.push(group);
  }
  if (undatedPhotos.length > 0) {
    sections.push({ key: "__undated__", label: "Undated", photos: undatedPhotos });
  }
  return sections;
}

/**
 * Resolves a raw or already-normalized media item into a canonical MediaItem,
 * preserving object reference stability via WeakMap.
 *
 * @param {Object|null} source
 * @param {Object|null} [workflow]
 * @returns {MediaItem|null}
 */
export function resolveCachedMediaItem(source, workflow = null) {
  if (!source || typeof source !== "object") return null;

  if (source.kind && source.status && "raw" in source) {
    return source;
  }

  if (RAW_MEDIA_CACHE.has(source)) {
    return RAW_MEDIA_CACHE.get(source);
  }

  const normalized = toMediaItem(source, {
    workflowId:
      workflow?.id ||
      workflow?.name ||
      source.workflowId ||
      source.workflow_id ||
      "",
  });

  if (normalized) {
    RAW_MEDIA_CACHE.set(source, normalized);
  }
  return normalized;
}

/**
 * Resolves a workflow's primary media into a canonical MediaItem from the project cache
 * without triggering any background HTTP requests, preserving reference identity via WeakMap.
 *
 * @param {Object|null} workflow
 * @returns {MediaItem|null}
 */
export function resolveCachedWorkflowMediaItem(workflow) {
  if (!workflow || typeof workflow !== "object") return null;

  if (WORKFLOW_MEDIA_CACHE.has(workflow)) {
    return WORKFLOW_MEDIA_CACHE.get(workflow);
  }

  const resolved = resolveMainMedia(workflow);
  if (resolved) {
    WORKFLOW_MEDIA_CACHE.set(workflow, resolved);
    return resolved;
  }

  const wfId = String(workflow.id || workflow.name || "");
  if (!wfId) return null;

  const fallback = toMediaItem(
    {
      id: wfId,
      workflow_id: wfId,
      status: workflow.status || "processing",
      url: null,
    },
    { workflowId: wfId }
  );

  return fallback;
}

function parseAspectString(aspect) {
  if (!aspect || aspect === "auto") return null;
  if (typeof aspect === "number" && Number.isFinite(aspect) && aspect > 0) {
    return aspect;
  }
  const str = String(aspect).trim();
  const parts = str.split(/[:/]/);
  if (parts.length === 2) {
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      return w / h;
    }
  }
  const num = parseFloat(str);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Computes clamped aspect ratio for a normalized MediaItem and optional parent workflow.
 * Precedence:
 *  1. Verified natural dimensions (getCachedImageDimensions)
 *  2. Explicit configured ratio (getItemMetadata().aspect — beats placeholder 1024x1024)
 *  3. Stored mediaItem.width / height
 *  4. Type fallback: video/character 16/9, element sheet 1/1, default 3/4
 */
function computePhotoAspectRatio(mediaItem, workflow = null) {
  const natural = getCachedImageDimensions(mediaItem?.url);
  if (natural?.width > 0 && natural?.height > 0) {
    return clampAspectRatio(natural.width / natural.height);
  }

  const meta = getDisplayMeta(mediaItem?.raw || mediaItem, workflow);
  const metaRatio =
    parseAspectString(meta?.aspect) ?? parseAspectString(mediaItem?.aspectRatio);
  if (metaRatio) {
    return clampAspectRatio(metaRatio);
  }

  const storedW = Number(mediaItem?.width);
  const storedH = Number(mediaItem?.height);
  if (Number.isFinite(storedW) && Number.isFinite(storedH) && storedW > 0 && storedH > 0) {
    return clampAspectRatio(storedW / storedH);
  }

  const isVideo = mediaItem?.kind === "video" || Boolean(meta?.isVideo);
  const isChar =
    workflow?.workflow_type === "CHARACTER" ||
    workflow?.workflow_type === "CHARACTER_SHEET" ||
    workflow?.is_character ||
    workflow?.entity_type === "character" ||
    mediaItem?.role === "sheet" ||
    mediaItem?.mediaRole === "sheet";
  if (isVideo || isChar) {
    return clampAspectRatio(16 / 9);
  }

  const isElementSheet =
    (workflow?.workflow_type === "ELEMENT_SHEET" ||
      workflow?.is_element ||
      workflow?.entity_type === "element") &&
    mediaItem?.role !== "detail" &&
    mediaItem?.mediaRole !== "detail" &&
    mediaItem?.raw?.role !== "detail";
  if (isElementSheet) {
    return clampAspectRatio(1);
  }

  return clampAspectRatio(3 / 4);
}

/**
 * SharedGalleryGrid - Unified memoized justified-row gallery grid for Cinema Studio screens.
 *
 * Consumes normalized MediaItem[] (`items`), workflow objects (`workflows`), or mixed
 * studio entries (`entries` with collections + workflows) resolved purely from the
 * project cache without background HTTP queries.
 */
export const SharedGalleryGrid = React.memo(function SharedGalleryGrid({
  items = null,
  workflows = null,
  entries = null,
  collectionCoverById = null,
  collectionCountById = null,
  gridSize = "md",
  gridSpacing = "sm",
  splitByDate: propSplitByDate = undefined,
  showFolders: propShowFolders = undefined,
  enableWheelResize = true,
  selectionEnabled = false,
  variant = "card",
  CardComponent = null,
  renderCard = null,
  cardProps = null,
  projectId = null,
  workflow = null,
  onWorkflowClick,
  onCollectionClick,
  onItemClick,
  onSelect,
  itemClassName = "",
  defaultContainerWidth = 1200,
  targetRowHeight: propTargetRowHeight = null,
  spacing: propSpacing = null,
  rowConstraints: propRowConstraints = null,
}) {
  const storeSplitByDate = useWorkflowUiStore((s) => s.splitByDate);
  const splitByDate = propSplitByDate ?? storeSplitByDate;
  const storeShowFolders = useWorkflowUiStore((s) => s.showFolders);
  const showFolders = propShowFolders ?? (storeShowFolders !== false);

  const isSelectionMode = useStudioSelectionStore(
    (s) => selectionEnabled && s.selectedKeys.length > 0
  );
  const toggleItem = useStudioSelectionStore((s) => s.toggleItem);
  const toggleGroup = useStudioSelectionStore((s) => s.toggleGroup);
  const selectAll = useStudioSelectionStore((s) => s.selectAll);
  const setSelectedKeys = useStudioSelectionStore((s) => s.setSelectedKeys);
  const pruneToVisible = useStudioSelectionStore((s) => s.pruneToVisible);
  const clearSelection = useStudioSelectionStore((s) => s.clearSelection);

  const containerRef = useRef(null);
  const activeUrlsRef = useRef(new Set());
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [dimVersion, setDimVersion] = useState(0);

  // Immediate pre-paint measurement + ResizeObserver reflow
  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = (rawWidth) => {
      const next = Math.floor(Number(rawWidth) || 0);
      if (next > 0) {
        setMeasuredWidth((prev) => (prev === next ? prev : next));
      }
    };

    const style = typeof window !== "undefined" ? window.getComputedStyle(el) : null;
    const padX = style
      ? (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0)
      : 0;
    const raw = el.clientWidth || el.getBoundingClientRect?.().width || 0;
    updateWidth(Math.max(0, raw - padX));

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((observerEntries) => {
      for (const entry of observerEntries) {
        const w = entry.contentRect?.width ?? el.clientWidth;
        if (w > 0) updateWidth(w);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Middle mouse button hold + scroll wheel shortcut to step gridSize (xs..xl)
  useEffect(() => {
    if (!enableWheelResize) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    let isMiddleDown = false;
    let lastStepAt = 0;
    const STEP_COOLDOWN_MS = 140;

    const handleMouseDown = (e) => {
      if (e.button !== 1) return;
      if (e.target instanceof Element && e.target.closest("a")) return;
      isMiddleDown = true;
      e.preventDefault();
    };

    const handleRelease = (e) => {
      if (e.type === "blur" || e.button === 1) {
        isMiddleDown = false;
      }
    };

    const handleWheel = (e) => {
      const middleHeld = isMiddleDown || (e.buttons & 4) !== 0;
      if (!middleHeld || e.deltaY === 0) return;

      e.preventDefault();

      const now = Date.now();
      if (now - lastStepAt < STEP_COOLDOWN_MS) return;
      lastStepAt = now;

      const store = useWorkflowUiStore.getState();
      const currentIdx = STUDIO_GRID_SIZE_STOPS.indexOf(store.gridSize);
      const safeIdx = currentIdx >= 0 ? currentIdx : STUDIO_GRID_SIZE_STOPS.indexOf("md");
      const delta = e.deltaY < 0 ? 1 : -1;
      const nextIdx = Math.min(STUDIO_GRID_SIZE_STOPS.length - 1, Math.max(0, safeIdx + delta));
      if (nextIdx !== safeIdx) {
        store.setGridSize(STUDIO_GRID_SIZE_STOPS[nextIdx]);
      }
    };

    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("mouseup", handleRelease);
    window.addEventListener("blur", handleRelease);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("wheel", handleWheel);
      window.removeEventListener("mouseup", handleRelease);
      window.removeEventListener("blur", handleRelease);
    };
  }, [enableWheelResize]);

  // rAF-batched reactive reflow when images/videos report true natural dimensions
  useEffect(() => {
    let rafId = null;
    const unsubscribe = subscribeImageDimensions((url) => {
      if (!activeUrlsRef.current.has(url)) return;
      if (rafId !== null) return;
      if (typeof requestAnimationFrame === "function") {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          setDimVersion((v) => v + 1);
        });
      } else {
        rafId = setTimeout(() => {
          rafId = null;
          setDimVersion((v) => v + 1);
        }, 0);
      }
    });

    return () => {
      unsubscribe();
      if (rafId !== null) {
        if (typeof cancelAnimationFrame === "function") {
          cancelAnimationFrame(rafId);
        } else {
          clearTimeout(rafId);
        }
      }
    };
  }, []);

  const containerWidth = measuredWidth > 0 ? measuredWidth : defaultContainerWidth;
  const density = getStudioGridDensity(gridSize, gridSpacing);
  const spacing = propSpacing ?? density.spacing;
  const baseTargetRowHeight = propTargetRowHeight ?? density.targetRowHeight;
  const targetRowHeight =
    propTargetRowHeight != null
      ? propTargetRowHeight
      : getResponsiveTargetRowHeight(baseTargetRowHeight, containerWidth);

  const maxRowHeightMultiplier =
    propRowConstraints?.singleRowMaxHeight && targetRowHeight > 0
      ? Math.max(1.05, propRowConstraints.singleRowMaxHeight / targetRowHeight)
      : (density.maxRowHeightMultiplier ?? 1.25);

  const normalizedEntries = useMemo(() => {
    if (Array.isArray(entries)) return entries;
    if (Array.isArray(workflows)) {
      return workflows.map((w, idx) => ({
        type: "workflow",
        data: w,
        key: w?.id || w?.name || `wf-${idx}`,
      }));
    }
    if (Array.isArray(items)) {
      return items.map((m, idx) => ({
        type: "media",
        data: m,
        key: m?.id || m?.name || m?.asset_id || `media-${idx}`,
      }));
    }
    return [];
  }, [entries, workflows, items]);

  const photos = useMemo(() => {
    // dimVersion triggers aspect recomputation after verified natural dimensions load
    void dimVersion;
    return normalizedEntries.reduce((acc, entry, i) => {
      if (!entry) return acc;

      if (entry.type === "collection") {
        if (!showFolders) return acc;
        const col = entry.data;
        const cover = collectionCoverById?.get(col?.id);
        const directItemCount =
          collectionCountById instanceof Map
            ? (collectionCountById.get(col?.id) ?? 0)
            : collectionCoverById instanceof Map
              ? (cover?.count ?? 0)
              : null;
        acc.push({
          src: EMPTY_COLLECTION_SRC,
          url: null,
          aspectRatio: 1,
          key: entry.key || `col-${col?.id || i}`,
          itemType: "collection",
          collection: col,
          coverUrl: cover?.url || null,
          coverIsVideo: cover?.isVideo || false,
          itemCount: directItemCount,
        });
        return acc;
      }

      if (entry.type === "workflow") {
        const wf = entry.data;
        const mediaItem = resolveCachedWorkflowMediaItem(wf);
        if (!mediaItem) return acc;

        const aspectRatio = computePhotoAspectRatio(mediaItem, wf);
        acc.push({
          src: mediaItem.url || EMPTY_IMAGE_SRC,
          url: mediaItem.url || null,
          aspectRatio,
          key: entry.key || wf?.id || wf?.name || String(i),
          itemType: "workflow",
          workflow: wf,
          item: mediaItem,
        });
        return acc;
      }

      const mediaItem = resolveCachedMediaItem(entry.data ?? entry, workflow);
      if (!mediaItem) return acc;

      const aspectRatio = computePhotoAspectRatio(mediaItem, workflow);
      acc.push({
        src: mediaItem.url || EMPTY_IMAGE_SRC,
        url: mediaItem.url || null,
        aspectRatio,
        key: entry.key || mediaItem.id || String(i),
        itemType: "media",
        item: mediaItem,
      });
      return acc;
    }, []);
  }, [normalizedEntries, collectionCoverById, collectionCountById, workflow, dimVersion, showFolders]);

  useIsomorphicLayoutEffect(() => {
    const nextUrls = new Set();
    for (let i = 0; i < photos.length; i++) {
      if (photos[i].url) nextUrls.add(photos[i].url);
    }
    activeUrlsRef.current = nextUrls;
  }, [photos]);

  // Reconcile dimensions cached synchronously by child <img ref> callbacks during commit
  // (before parent useEffect subscribes or activeUrlsRef updates).
  useEffect(() => {
    let needsReflow = false;
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (!photo.url) continue;
      const cached = getCachedImageDimensions(photo.url);
      if (!cached?.width || !cached?.height) continue;
      const clampedCached = clampAspectRatio(cached.width / cached.height);
      if (Math.abs(clampedCached - photo.aspectRatio) / photo.aspectRatio > 0.03) {
        needsReflow = true;
        break;
      }
    }
    if (needsReflow) {
      setDimVersion((v) => v + 1);
    }
  }, [photos]);

  const folderTargetRowHeight = Math.round(targetRowHeight * 1.25);

  const layout = useMemo(() => {
    if (splitByDate) return null;
    const collectionPhotos = [];
    const mediaPhotos = [];
    for (let i = 0; i < photos.length; i++) {
      if (photos[i].itemType === "collection") {
        collectionPhotos.push(photos[i]);
      } else {
        mediaPhotos.push(photos[i]);
      }
    }
    if (collectionPhotos.length === 0) {
      return computeJustifiedRows(photos, containerWidth, {
        targetRowHeight,
        gap: spacing,
        maxRowHeightMultiplier,
      });
    }
    const folderLayout = computeJustifiedRows(collectionPhotos, containerWidth, {
      targetRowHeight: folderTargetRowHeight,
      gap: spacing,
      maxRowHeightMultiplier,
    });
    const mediaLayout =
      mediaPhotos.length > 0
        ? computeJustifiedRows(mediaPhotos, containerWidth, {
            targetRowHeight,
            gap: spacing,
            maxRowHeightMultiplier,
          })
        : { rows: [] };
    return { rows: [...folderLayout.rows, ...mediaLayout.rows] };
  }, [splitByDate, photos, containerWidth, targetRowHeight, folderTargetRowHeight, spacing, maxRowHeightMultiplier]);

  const dateSections = useMemo(() => {
    if (!splitByDate) return null;
    return groupPhotosByDate(photos, workflow).map((section) => ({
      ...section,
      keys: section.photos.map(getPhotoSelectionKey).filter(Boolean),
      layout: computeJustifiedRows(section.photos, containerWidth, {
        targetRowHeight:
          section.key === "__collections__" ? folderTargetRowHeight : targetRowHeight,
        gap: spacing,
        maxRowHeightMultiplier,
      }),
    }));
  }, [splitByDate, photos, workflow, containerWidth, targetRowHeight, folderTargetRowHeight, spacing, maxRowHeightMultiplier]);

  const orderedKeys = useMemo(() => {
    if (!selectionEnabled) return EMPTY_SELECTION_KEYS;
    if (splitByDate && dateSections) {
      return dateSections.flatMap((section) => section.keys);
    }
    if (layout?.rows) {
      return layout.rows
        .flatMap((row) => row.items.map(({ item }) => getPhotoSelectionKey(item)))
        .filter(Boolean);
    }
    return photos.map(getPhotoSelectionKey).filter(Boolean);
  }, [selectionEnabled, splitByDate, dateSections, layout, photos]);

  const orderedKeysRef = useRef(EMPTY_SELECTION_KEYS);
  orderedKeysRef.current = orderedKeys;

  const handleToggleSelectKey = useCallback(
    (selKey, e) => {
      toggleItem(selKey, {
        shiftKey: Boolean(e?.shiftKey),
        orderedKeys: orderedKeysRef.current,
      });
    },
    [toggleItem]
  );

  const { isMarqueeActive, marqueeBoxRef } = useMarqueeSelection({
    containerRef,
    enabled: selectionEnabled,
    isSelectionMode,
    setSelectedKeys,
  });

  useEffect(() => {
    if (!selectionEnabled) return;
    if (useStudioSelectionStore.getState().selectedKeys.length > 0) {
      pruneToVisible(orderedKeys);
    }
  }, [selectionEnabled, orderedKeys, pruneToVisible]);

  useEffect(() => {
    if (!selectionEnabled) return undefined;

    const handleKeyDown = (e) => {
      if (isEditableTarget(document.activeElement) || isEditableTarget(e.target)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "a") {
        if (orderedKeys.length > 0) {
          e.preventDefault();
          selectAll(orderedKeys);
        }
        return;
      }

      if (e.key === "Escape" && !e.defaultPrevented) {
        if (useStudioSelectionStore.getState().selectedKeys.length > 0) {
          e.preventDefault();
          clearSelection();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectionEnabled, orderedKeys, selectAll, clearSelection]);

  // Clear selection when clicking empty space outside cards (Windows Explorer behavior)
  useEffect(() => {
    if (!selectionEnabled || !isSelectionMode) return undefined;
    const gridEl = containerRef.current;
    if (!gridEl) return undefined;
    const scrollContainer =
      gridEl.closest('[data-scroll-container="true"]') || gridEl;

    const handleBackgroundClick = (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest(
          '[data-selection-key], [data-date-group-header], [data-selection-bar="true"], button, a, input, textarea, select, [role="checkbox"], [role="menuitem"], [role="dialog"], [role="menu"]'
        )
      ) {
        return;
      }
      clearSelection();
    };

    scrollContainer.addEventListener("click", handleBackgroundClick);
    return () =>
      scrollContainer.removeEventListener("click", handleBackgroundClick);
  }, [selectionEnabled, isSelectionMode, clearSelection]);

  const DefaultCard = variant === "tile" ? MediaTile : MediaCard;
  const ResolvedCard = CardComponent || DefaultCard;

  const renderRows = (rows, keyPrefix = "row") =>
    rows.map((row, rowIndex) => (
      <div
        key={`${keyPrefix}-${rowIndex}`}
        className="flex items-start w-full"
        style={{ gap: spacing }}
        data-justified-row="true"
        data-justified={row.isJustified ? "true" : "false"}
      >
        {row.items.map(({ item: photo, width, height, index }) => (
          <SelectableCardSlot
            key={photo.key}
            photo={photo}
            selKey={selectionEnabled ? getPhotoSelectionKey(photo) : null}
            width={width}
            height={height}
            index={index}
            selectionEnabled={selectionEnabled}
            isSelectionMode={isSelectionMode}
            onToggleSelectKey={handleToggleSelectKey}
            ResolvedCard={ResolvedCard}
            renderCard={renderCard}
            cardProps={cardProps}
            projectId={projectId}
            onWorkflowClick={onWorkflowClick}
            onCollectionClick={onCollectionClick}
            onItemClick={onItemClick}
            onSelect={onSelect}
            itemClassName={itemClassName}
          />
        ))}
      </div>
    ));

  return (
    <div
      ref={containerRef}
      className={splitByDate ? "w-full p-3 flex flex-col gap-5" : "w-full p-3 flex flex-col"}
      style={splitByDate ? undefined : { gap: spacing, rowGap: spacing }}
      data-justified-grid="true"
      data-grid-size={gridSize}
      data-split-by-date={splitByDate ? "true" : "false"}
    >
      {splitByDate && dateSections
        ? dateSections.map((section) => (
            <section
              key={section.key}
              className="w-full flex flex-col"
              style={{ gap: spacing, rowGap: spacing }}
              data-date-section={section.key}
            >
              {section.label && (
                <div
                  className="flex items-center gap-2 pt-1 pb-1"
                  data-date-group-header={section.key}
                >
                  {selectionEnabled && section.keys.length > 0 && (
                    <DateGroupCheckbox
                      sectionKeys={section.keys}
                      label={section.label}
                      onToggleGroup={toggleGroup}
                    />
                  )}
                  <h3 className="ds-text-caption-l font-semibold text-text-primary">
                    {section.label}
                  </h3>
                </div>
              )}
              {renderRows(section.layout.rows, `sec-${section.key}`)}
            </section>
          ))
        : renderRows(layout?.rows ?? [])}
      {isMarqueeActive && (
        <div
          ref={marqueeBoxRef}
          data-slot="marquee-selection-box"
          aria-hidden="true"
          className="fixed pointer-events-none z-40 rounded-sm border border-dashed border-text-primary/70 bg-surface-tonal"
        />
      )}
    </div>
  );
});
SharedGalleryGrid.displayName = "SharedGalleryGrid";

export default SharedGalleryGrid;
