"use client";

import React, { useMemo, useCallback } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import { resolveMainMedia } from "@/features/workflows/core/resolveMediaRef";
import { toMediaItem } from "@/features/workflows/core/toMediaItem";
import {
  getItemMetadata as getDisplayMeta,
  getStudioGridDensity,
  getCachedImageDimensions,
} from "@/shared/lib/displayUtils";
import { MediaCard } from "./MediaCard";
import { MediaTile } from "./MediaTile";

const WORKFLOW_MEDIA_CACHE = new WeakMap();
const RAW_MEDIA_CACHE = new WeakMap();

const EMPTY_IMAGE_SRC =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
const EMPTY_COLLECTION_SRC =
  "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg'/>";

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

/**
 * Computes photo dimensions for RowsPhotoAlbum from a normalized MediaItem and optional parent workflow.
 *
 * @param {MediaItem} mediaItem
 * @param {Object|null} [workflow]
 * @returns {{ width: number, height: number }}
 */
function computePhotoDimensions(mediaItem, workflow = null) {
  const natural = getCachedImageDimensions(mediaItem?.url);
  let wNum = natural?.width || mediaItem?.width;
  let hNum = natural?.height || mediaItem?.height;

  if (!wNum || !hNum) {
    const meta = getDisplayMeta(mediaItem?.raw || mediaItem, workflow);
    const aspect =
      meta?.aspect && meta.aspect !== "auto"
        ? meta.aspect
        : mediaItem?.kind === "video"
        ? "16/9"
        : "3/4";
    const [wStr, hStr] = String(aspect).replace(":", "/").split("/");
    wNum = parseFloat(wStr) || 3;
    hNum = parseFloat(hStr) || 4;
  }

  const BASE = 1200;
  const maxDim = Math.max(wNum, hNum) || 1;
  return {
    width: Math.round(BASE * (wNum / maxDim)),
    height: Math.round(BASE * (hNum / maxDim)),
  };
}

/**
 * SharedGalleryGrid - Unified memoized gallery grid for Cinema Studio screens.
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
  gridSize = "md",
  gridSpacing = "sm",
  variant = "card",
  CardComponent = null,
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
  const density = getStudioGridDensity(gridSize, gridSpacing);
  const targetRowHeight = propTargetRowHeight ?? density.targetRowHeight;
  const spacing = propSpacing ?? density.spacing;
  const singleRowMaxHeight =
    targetRowHeight * (density.maxRowHeightMultiplier ?? 1);

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
    return normalizedEntries.reduce((acc, entry, i) => {
      if (!entry) return acc;

      if (entry.type === "collection") {
        const col = entry.data;
        const cover = collectionCoverById?.get(col?.id);
        acc.push({
          src: EMPTY_COLLECTION_SRC,
          width: 1200,
          height: 1200,
          key: entry.key || `col-${col?.id || i}`,
          itemType: "collection",
          collection: col,
          coverUrl: cover?.url || null,
          coverIsVideo: cover?.isVideo || false,
        });
        return acc;
      }

      if (entry.type === "workflow") {
        const workflow = entry.data;
        const mediaItem = resolveCachedWorkflowMediaItem(workflow);
        if (!mediaItem) return acc;

        const { width, height } = computePhotoDimensions(mediaItem, workflow);
        acc.push({
          src: mediaItem.url || EMPTY_IMAGE_SRC,
          width,
          height,
          key: entry.key || workflow?.id || workflow?.name || String(i),
          itemType: "workflow",
          workflow,
          item: mediaItem,
        });
        return acc;
      }

      const mediaItem = resolveCachedMediaItem(entry.data ?? entry, workflow);
      if (!mediaItem) return acc;

      const { width, height } = computePhotoDimensions(mediaItem, workflow);
      acc.push({
        src: mediaItem.url || EMPTY_IMAGE_SRC,
        width,
        height,
        key: entry.key || mediaItem.id || String(i),
        itemType: "media",
        item: mediaItem,
      });
      return acc;
    }, []);
  }, [normalizedEntries, collectionCoverById, workflow]);

  const DefaultCard = variant === "tile" ? MediaTile : MediaCard;
  const ResolvedCard = CardComponent || DefaultCard;

  const renderPhoto = useCallback(
    (_, { photo, width, height }) => {
      if (photo.itemType === "collection") {
        return (
          <ResolvedCard
            key={photo.key}
            collection={photo.collection}
            itemType="collection"
            coverUrl={photo.coverUrl}
            coverIsVideo={photo.coverIsVideo}
            projectId={projectId}
            onClick={onCollectionClick}
            className={itemClassName}
            width={width}
            height={height}
            {...cardProps}
          />
        );
      }

      if (photo.itemType === "workflow") {
        return (
          <ResolvedCard
            key={photo.key}
            item={photo.item}
            workflow={photo.workflow}
            itemType="workflow"
            projectId={projectId}
            onClick={onWorkflowClick || onItemClick}
            onSelect={onSelect}
            className={itemClassName}
            width={width}
            height={height}
            {...cardProps}
          />
        );
      }

      return (
        <ResolvedCard
          key={photo.key}
          item={photo.item}
          onClick={onItemClick}
          onSelect={onSelect}
          className={itemClassName}
          width={width}
          height={height}
          {...cardProps}
        />
      );
    },
    [
      projectId,
      onCollectionClick,
      onWorkflowClick,
      onItemClick,
      onSelect,
      itemClassName,
      cardProps,
    ]
  );

  const albumRender = useMemo(
    () => ({
      photo: renderPhoto,
    }),
    [renderPhoto]
  );

  return (
    <RowsPhotoAlbum
      photos={photos}
      defaultContainerWidth={defaultContainerWidth}
      targetRowHeight={targetRowHeight}
      spacing={spacing}
      rowConstraints={propRowConstraints ?? { singleRowMaxHeight }}
      render={albumRender}
    />
  );
});
SharedGalleryGrid.displayName = "SharedGalleryGrid";

export default SharedGalleryGrid;
