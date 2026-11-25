// src/shared/lib/displayUtils.js
// ✅ Pure UI helpers — no business logic, no side effects
import { resolveMainMedia } from "@/features/workflows/core/resolveMediaRef";

export const STUDIO_GRID_SPACING_CONFIG = {
  sm: { px: 4 },
  md: { px: 8 },
  lg: { px: 16 },
};

export function getStudioGridSpacingPx(spacingKey = "sm") {
  return STUDIO_GRID_SPACING_CONFIG[spacingKey]?.px ?? 4;
}

export const STUDIO_GRID_SIZE_STOPS = ["xs", "sm", "md", "lg", "xl"];

export const STUDIO_GRID_CONFIG = {
  xs: {
    targetRowHeight: 145,
    minRowHeight: 100,
    maxRowHeight: 185,
    maxRowHeightMultiplier: 1.25,
  },
  sm: {
    targetRowHeight: 190,
    minRowHeight: 130,
    maxRowHeight: 240,
    maxRowHeightMultiplier: 1.25,
  },
  md: {
    targetRowHeight: 280,
    minRowHeight: 190,
    maxRowHeight: 350,
    maxRowHeightMultiplier: 1.25,
  },
  lg: {
    targetRowHeight: 400,
    minRowHeight: 260,
    maxRowHeight: 490,
    maxRowHeightMultiplier: 1.25,
  },
  xl: {
    targetRowHeight: 520,
    minRowHeight: 340,
    maxRowHeight: 620,
    maxRowHeightMultiplier: 1.25,
  },
};

export function getResponsiveTargetRowHeight(baseTargetHeight, containerWidth) {
  const base = Number(baseTargetHeight);
  if (!Number.isFinite(base) || base <= 0) return baseTargetHeight;
  const width = Number(containerWidth);
  if (!Number.isFinite(width) || width <= 0) return Math.round(base);

  let factor = 1.0;
  if (width < 640) factor = 0.72;
  else if (width < 768) factor = 0.78;
  else if (width < 1024) factor = 0.88;
  else if (width > 1800) factor = 1.12;

  return Math.round(base * factor);
}

const imageDimensionCache = new Map();
const imageDimensionListeners = new Set();

const EPHEMERAL_URL_QUERY_PARAMS = new Set([
  "token",
  "sig",
  "signature",
  "expires",
  "policy",
  "key-pair-id",
  "googleaccessid",
  "x-amz-algorithm",
  "x-amz-credential",
  "x-amz-date",
  "x-amz-expires",
  "x-amz-security-token",
  "x-amz-signature",
  "x-amz-signedheaders",
  "x-goog-algorithm",
  "x-goog-credential",
  "x-goog-date",
  "x-goog-expires",
  "x-goog-signature",
  "x-goog-signedheaders",
]);

/**
 * Normalizes a media URL into a stable dimension-cache key by stripping ephemeral
 * signed-URL auth query params (e.g. Supabase ?token=..., S3/GCS signatures)
 * while preserving meaningful params (transform, id, version, etc.).
 */
export function normalizeDimensionCacheKey(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (!trimmed.includes("?")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    let changed = false;
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (EPHEMERAL_URL_QUERY_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
        changed = true;
      }
    }
    if (!changed) return trimmed;
    const qs = parsed.searchParams.toString();
    return `${parsed.origin}${parsed.pathname}${qs ? `?${qs}` : ""}`;
  } catch {
    return trimmed;
  }
}

const ASPECT_RATIO_ENUM_MAP = {
  IMAGE_ASPECT_RATIO_LANDSCAPE: "16/9",
  VIDEO_ASPECT_RATIO_LANDSCAPE: "16/9",
  IMAGE_ASPECT_RATIO_PORTRAIT: "9/16",
  VIDEO_ASPECT_RATIO_PORTRAIT: "9/16",
  IMAGE_ASPECT_RATIO_SQUARE: "1/1",
  VIDEO_ASPECT_RATIO_SQUARE: "1/1",
};

const RATIO_PAIR_RE = /^\s*(\d+(?:\.\d+)?)\s*[:/x×]\s*(\d+(?:\.\d+)?)\s*$/i;
const POSITIVE_NUMBER_RE = /^\s*(\d+(?:\.\d+)?)\s*$/;

/**
 * Parses a ratio input ("16:9", "16/9", "9x16", "16 / 9", enum, or positive number)
 * into { ratio, css, label }. Returns null for "auto", unspecified enums, or invalid text.
 */
export function parseAspectRatioValue(raw) {
  if (raw == null) return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    const css = String(raw);
    return { ratio: raw, css, label: css };
  }
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (upper in ASPECT_RATIO_ENUM_MAP) {
    const mapped = ASPECT_RATIO_ENUM_MAP[upper];
    const [w, h] = mapped.split("/").map(Number);
    return { ratio: w / h, css: mapped, label: `${w}:${h}` };
  }

  const pairMatch = RATIO_PAIR_RE.exec(trimmed);
  if (pairMatch) {
    const w = parseFloat(pairMatch[1]);
    const h = parseFloat(pairMatch[2]);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      return { ratio: w / h, css: `${pairMatch[1]}/${pairMatch[2]}`, label: `${pairMatch[1]}:${pairMatch[2]}` };
    }
    return null;
  }

  const numMatch = POSITIVE_NUMBER_RE.exec(trimmed);
  if (numMatch) {
    const num = parseFloat(numMatch[1]);
    if (Number.isFinite(num) && num > 0) {
      return { ratio: num, css: String(num), label: String(num) };
    }
  }

  return null;
}

/**
 * Normalizes a ratio string into a valid CSS `aspect-ratio` value (e.g. "9:16" -> "9/16").
 * Returns null for invalid or non-ratio values like "auto".
 */
export function normalizeCssAspectRatio(raw) {
  return parseAspectRatioValue(raw)?.css ?? null;
}

/**
 * Subscribe to verified natural image/video dimension updates (>3% ratio change or first measurement).
 * Returns an unsubscribe function.
 */
export function subscribeImageDimensions(listener) {
  if (typeof listener !== "function") return () => {};
  imageDimensionListeners.add(listener);
  return () => {
    imageDimensionListeners.delete(listener);
  };
}

/**
 * Retrieve verified natural dimensions for an image URL if already loaded.
 */
export function getCachedImageDimensions(url) {
  const key = normalizeDimensionCacheKey(url);
  if (!key) return null;
  return imageDimensionCache.get(key) || null;
}

const MAX_DIMENSION_CACHE = 500;
const DIMENSION_RATIO_NOTIFY_THRESHOLD = 0.03;

/**
 * Store verified natural pixel width/height for an image URL to preserve authentic ratio.
 */
export function setCachedImageDimensions(url, width, height) {
  const key = normalizeDimensionCacheKey(url);
  if (!key || !width || !height || isNaN(width) || isNaN(height)) return;
  const w = Math.round(width);
  const h = Math.round(height);
  if (w <= 0 || h <= 0) return;

  const prev = imageDimensionCache.get(key);
  const prevRatio = prev ? prev.width / prev.height : null;
  const nextRatio = w / h;
  const shouldNotify =
    prevRatio === null ||
    Math.abs(nextRatio - prevRatio) / prevRatio > DIMENSION_RATIO_NOTIFY_THRESHOLD;

  if (!prev && imageDimensionCache.size >= MAX_DIMENSION_CACHE) {
    const firstKey = imageDimensionCache.keys().next().value;
    imageDimensionCache.delete(firstKey);
  }
  imageDimensionCache.set(key, {
    width: w,
    height: h,
    aspect: `${w}/${h}`,
  });

  if (shouldNotify && imageDimensionListeners.size > 0) {
    imageDimensionListeners.forEach((listener) => {
      try {
        listener(url, w, h);
      } catch {
        // Isolate subscriber errors
      }
    });
  }
}

export function getStudioGridDensity(gridSize = "md", gridSpacing = "sm") {
  const base = STUDIO_GRID_CONFIG[gridSize] || STUDIO_GRID_CONFIG.md;
  const spacingPx = getStudioGridSpacingPx(gridSpacing);
  return { ...base, spacing: spacingPx };
}

/**
 * Returns CSS classes for a generation grid based on size variant.
 */
export function getGridClass(_group, _count, gridSize = "lg") {
  const layouts = {
    xs: { container: "flex flex-wrap gap-xxs",   maxHeight: "h-[240px]" },
    sm: { container: "flex flex-wrap gap-xxs",   maxHeight: "h-[320px]" },
    md: { container: "flex flex-wrap gap-xxs",   maxHeight: "h-[500px]" },
    lg: { container: "flex flex-wrap gap-xxs",   maxHeight: "h-[650px]" },
    xl: { container: "flex flex-wrap gap-xxs",   maxHeight: "h-[780px]" },
  };
  const props = layouts[gridSize] ?? layouts.lg;
  return { gridClass: props.container, maxHeightClass: props.maxHeight };
}

/**
 * Formats a date string into a human-readable short format.
 * e.g. "Jan 5, 02:30 PM"
 */
export function formatGenerationDate(dateString) {
  if (!dateString) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month:  "short",
      day:    "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return "";
  }
}

export function formatPromptForDisplay(prompt) {
  if (!prompt) return "";

  return String(prompt)
    .replace(/<Trait:\s*([^>]+)>/gi, (_, label) => `${String(label || "").trim()}, `)
    .replace(/<MediaAsset:\s*[^>]+>/gi, "")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,+/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
}

/**
 * Resolves display metadata for a generation item.
 * Supports BOTH the old schema (item.file_url, item.asset_type)
 * AND the new projectData schema (item.image, item.video, item.mediaMetadata).
 *
 * Returns: { isVideo, isAudio, url, aspect, ratioStr, status }
 */
export function getItemMetadata(item, group) {
  if (!item) return { status: 'empty' };

  const normalizeStatus = (rawStatus, resolvedUrl, rawError, _createdAt) => {
    const s = (rawStatus || "").toString().toLowerCase();
    if (s === "success" || s === "completed") return "completed";
    if (s === "uploading") return "uploading";
    if (s === "processing" || s === "pending" || s === "queued" || s === "in_progress" || s === "starting") {
      return "processing";
    }
    if (s === "rejected") return "rejected";

    // Heuristic: some providers return "failed" but the error indicates a safety/policy block.
    // Map those to the dedicated UI state so the user sees the correct guidance.
    const e = (rawError || "").toString().toLowerCase();
    if (e.includes("policy") || e.includes("policies") || e.includes("safety") || e.includes("violate")) {
      return "rejected";
    }
    if (s === "failed" || s === "error") return "failed";

    // Backward-compat fallback: if URL exists it's done, otherwise treat as processing.
    if (resolvedUrl) return "completed";
    return "processing";
  };

  const itemCreatedAt = item.create_time || item.created_at || item.createdAt;

  // ── Unified URL Resolution (aligned with toMediaItem.resolveMediaUrl) ────
  const url =
    resolveMediaUrl(item) ??
    (item._displayType === 'shot' ? item.video_url : null);

  function pickValidRatio(candidates) {
    for (const c of candidates) {
      const parsed = parseAspectRatioValue(c);
      if (parsed) return parsed;
    }
    return null;
  }

  function extractItemRatio(targetItem) {
    if (!targetItem) return null;
    const mediaObj = targetItem?.image ?? targetItem?.video;
    return pickValidRatio([
      targetItem?.aspectRatio,
      targetItem?.aspect_ratio,
      targetItem?.ratio,
      targetItem?.params?.ratio,
      targetItem?.params?.aspectRatio,
      targetItem?.params?.aspect_ratio,
      targetItem?.generationConfig?.aspectRatio,
      targetItem?.generationConfig?.aspect_ratio,
      targetItem?.generationConfig?.ratio,
      targetItem?.generation_config?.aspectRatio,
      targetItem?.generation_config?.aspect_ratio,
      targetItem?.generation_config?.ratio,
      targetItem?.metadata?.generationConfig?.aspectRatio,
      targetItem?.metadata?.generationConfig?.aspect_ratio,
      targetItem?.metadata?.generationConfig?.ratio,
      targetItem?.metadata?.generation_config?.aspectRatio,
      targetItem?.metadata?.generation_config?.aspect_ratio,
      targetItem?.metadata?.generation_config?.ratio,
      targetItem?.mediaMetadata?.requestData?.generationConfig?.aspectRatio,
      targetItem?.mediaMetadata?.requestData?.generationConfig?.aspect_ratio,
      targetItem?.mediaMetadata?.requestData?.generationConfig?.ratio,
      mediaObj?.userUploadedImage?.aspectRatio,
      mediaObj?.userUploadedImage?.aspect_ratio,
      mediaObj?.generatedImage?.aspectRatio,
      mediaObj?.generatedImage?.aspect_ratio,
      targetItem?.asset?.meta_data?.ratio,
      targetItem?.asset?.meta_data?.aspectRatio,
      targetItem?.asset?.meta_data?.aspect_ratio,
      targetItem?._displayType === 'shot' ? '16:9' : null,
    ]);
  }

  function extractGroupRatio(targetGroup) {
    if (!targetGroup) return null;
    return pickValidRatio([
      targetGroup?.generationConfig?.ratio,
      targetGroup?.generationConfig?.aspectRatio,
      targetGroup?.generationConfig?.aspect_ratio,
      targetGroup?.generation_config?.ratio,
      targetGroup?.generation_config?.aspectRatio,
      targetGroup?.generation_config?.aspect_ratio,
      targetGroup?.metadata?.generationConfig?.ratio,
      targetGroup?.metadata?.generationConfig?.aspectRatio,
      targetGroup?.metadata?.generationConfig?.aspect_ratio,
      targetGroup?.metadata?.generation_config?.ratio,
      targetGroup?.metadata?.generation_config?.aspectRatio,
      targetGroup?.metadata?.generation_config?.aspect_ratio,
      targetGroup?.params?.ratio,
      targetGroup?.params?.aspectRatio,
      targetGroup?.params?.aspect_ratio,
      targetGroup?.aspectRatio,
      targetGroup?.aspect_ratio,
      targetGroup?.ratio,
    ]);
  }

  function isPositivePair(w, h) {
    const nw = Number(w);
    const nh = Number(h);
    return Number.isFinite(nw) && Number.isFinite(nh) && nw > 0 && nh > 0;
  }

  function resolveAspectAndLabel({ isAudioFlag, isVideoFlag, itemW, itemH, groupW, groupH }) {
    const itemRatio = extractItemRatio(item);
    const groupRatio = extractGroupRatio(group);
    const hasItemDims = isPositivePair(itemW, itemH);
    const hasGroupDims = isPositivePair(groupW, groupH);

    const role = String(item?.role || item?.mediaRole || "").trim().toLowerCase();
    const isDetail = role === "detail" || role === "reference";
    const isChar =
      !isDetail &&
      (group?.workflow_type === "CHARACTER" ||
        group?.workflow_type === "CHARACTER_SHEET" ||
        group?.is_character ||
        group?.entity_type === "character" ||
        role === "sheet" ||
        role === "turnaround");
    const isElem =
      group?.workflow_type === "ELEMENT_SHEET" ||
      group?.is_element ||
      group?.entity_type === "element";

    let aspect;
    if (isAudioFlag) {
      aspect = "4/1";
    } else if (cachedDims?.aspect) {
      aspect = cachedDims.aspect;
    } else if (itemRatio) {
      aspect = itemRatio.css;
    } else if (hasItemDims) {
      aspect = `${Number(itemW)}/${Number(itemH)}`;
    } else if (groupRatio) {
      aspect = groupRatio.css;
    } else if (hasGroupDims) {
      aspect = `${Number(groupW)}/${Number(groupH)}`;
    } else {
      aspect = isElem ? null : (isChar ? "16/9" : (isVideoFlag ? "16/9" : null));
    }

    const ratioStr = cachedDims
      ? intrinsicSizeToRatioLabel(cachedDims.width, cachedDims.height)
      : itemRatio
        ? itemRatio.label
        : hasItemDims
          ? intrinsicSizeToRatioLabel(itemW, itemH)
          : groupRatio
            ? groupRatio.label
            : hasGroupDims
              ? intrinsicSizeToRatioLabel(groupW, groupH)
              : null;

    return { aspect, ratioStr };
  }

  const cachedDims = getCachedImageDimensions(url);

  // ── New schema: item has item.image or item.video ──────────────────────────
  if (item?.image || item?.video || item?.mediaMetadata) {
    const isVideo = !!item.video || item.asset_type === 'video';
    const isAudio = item.asset_type === 'audio';

    const mediaObj = item.image ?? item.video;
    const itemDims = mediaObj?.dimensions ?? item.image?.generatedImage ?? item.dimensions ?? null;
    const itemW = itemDims?.width ?? item.width ?? item.params?.width ?? null;
    const itemH = itemDims?.height ?? item.height ?? item.params?.height ?? null;
    const groupW = group?.dimensions?.width ?? group?.params?.width ?? null;
    const groupH = group?.dimensions?.height ?? group?.params?.height ?? null;

    const { aspect, ratioStr } = resolveAspectAndLabel({
      isAudioFlag: isAudio,
      isVideoFlag: isVideo,
      itemW,
      itemH,
      groupW,
      groupH,
    });

    return {
      isVideo,
      isAudio,
      url,
      aspect,
      ratioStr,
      status: normalizeStatus(item.status || item.media_status, url, item.error, itemCreatedAt),
      prompt: item.params?.prompt ?? item.mediaMetadata?.requestData?.promptInputs?.[0]?.textInput ?? '',
    };
  }

  // ── Old schema fallback ───────────────────────────────────────────────────
  const isVideo =
    item.asset_type === 'video' ||
    item.asset?.asset_type === 'video' ||
    item._displayType === 'shot';
  const isAudio =
    item.asset_type === 'audio' ||
    item.asset?.asset_type === 'audio';

  const itemW = item.dimensions?.width ?? item.asset?.meta_data?.width ?? item.width ?? item.params?.width ?? null;
  const itemH = item.dimensions?.height ?? item.asset?.meta_data?.height ?? item.height ?? item.params?.height ?? null;
  const groupW = group?.dimensions?.width ?? group?.params?.width ?? null;
  const groupH = group?.dimensions?.height ?? group?.params?.height ?? null;

  const { aspect, ratioStr } = resolveAspectAndLabel({
    isAudioFlag: isAudio,
    isVideoFlag: isVideo,
    itemW,
    itemH,
    groupW,
    groupH,
  });

  return {
    isVideo,
    isAudio,
    url,
    aspect,
    ratioStr,
    status: normalizeStatus(item.status || item.media_status, url, item.error, itemCreatedAt),
    prompt: item.params?.prompt ?? item.prompt ?? '',
  };
}


/** Greatest common divisor for simplifying pixel dimensions to a ratio label. */
function gcdInt(a, b) {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/**
 * Pixel width/height → stable "W:H" label for edit UI / API (snaps near common presets).
 */
export function intrinsicSizeToRatioLabel(width, height) {
  if (!width || !height) return "1:1";
  const w = Number(width);
  const h = Number(height);
  if (!w || !h || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return "1:1";

  const r = w / h;
  const presets = [
    [16 / 9, "16:9"],
    [9 / 16, "9:16"],
    [4 / 3,  "4:3"],
    [3 / 4,  "3:4"],
    [1,      "1:1"],
    [3 / 2,  "3:2"],
    [2 / 3,  "2:3"],
    [21 / 9, "21:9"],
    [9 / 21, "9:21"],
    [4 / 5,  "4:5"],
    [5 / 4,  "5:4"],
  ];
  for (const [val, label] of presets) {
    if (Math.abs(r - val) / val < 0.05) return label; // 5% relative tolerance
  }
  const g = gcdInt(w, h);
  const rw = Math.round(w / g);
  const rh = Math.round(h / g);
  if (rw > 50 || rh > 50) {
    return `${Number(r.toFixed(2))}:1`;
  }
  return `${rw}:${rh}`;
}

/** CSS aspect-ratio value from real pixel dimensions (more accurate than metadata ratio). */
export function intrinsicSizeToCssAspect(width, height) {
  if (!width || !height) return "1 / 1";
  return `${Math.round(width)} / ${Math.round(height)}`;
}

function resolvePrimaryRawMedia(workflow) {
  if (!workflow) return null;

  const resolved = resolveMainMedia(workflow);
  if (resolved) {
    return resolved.raw || resolved;
  }

  // Fallback for workflows without attached items: return dummy primary item so card renders in grid
  return {
    id: workflow.id || workflow.name,
    status: workflow.status || "processing",
    url: null,
  };
}

/**
 * Returns the primary media item for a workflow (CAE or upload).
 * Fallback to the first item if no CAE/upload found.
 *
 * @deprecated Use `resolveMainMedia` from `@/features/workflows/core/resolveMediaRef` instead.
 * @param {Object} workflow - The workflow object containing items
 * @returns {Object|null} - The primary media item
 */
export function getPrimaryMedia(workflow) {
  return resolvePrimaryRawMedia(workflow);
}

/**
 * Returns the generation configuration of the primary media.
 *
 * @deprecated Use `resolveMainMedia` from `@/features/workflows/core/resolveMediaRef` instead.
 * @param {Object} workflow - The workflow object
 * @returns {Object|null} - The generation configuration
 */
export function getPrimaryMediaConfig(workflow) {
  const primary = resolvePrimaryRawMedia(workflow);
  return primary?.generationConfig || null;
}

// ─── Canonical Media Utilities ───────────────────────────────────────────────
// Single source of truth for URL resolution and video detection.
// Use these instead of repeating the long ?? chain in every component.

/**
 * Resolves the display URL from any media item shape the backend may return.
 * Handles all known field variants (new schema, legacy schema, upload schema).
 *
 * @param {Object|null} item - A media item from projectContents.media or library
 * @returns {string|null} - The resolved URL, or null if not found
 */
export function resolveMediaUrl(item) {
  if (!item) return null;
  return (
    item.url                              ??
    item.image?.generatedImage?.url       ??
    item.image?.url                       ??
    item.video?.generatedVideo?.uri       ??
    item.video?.generatedVideo?.url       ??
    item.video?.url                       ??
    item.preview                          ??
    item.thumbnail                        ??
    item.file_url                         ??
    item.asset?.file_url                  ??
    item.image_url                        ??
    item.src                              ??
    null
  );
}

/**
 * Determines whether a media item is a video.
 * Handles all known field variants.
 *
 * @param {Object|null} item - A media item
 * @returns {boolean}
 */
export function isMediaVideo(item) {
  if (!item) return false;
  return (
    item.type === "video"      ||
    item.is_video === true     ||
    !!item.video               ||
    item.asset_type === "video"
  );
}

const NON_ASSET_WORKFLOW_TYPES = new Set([
  "ELEMENT_SHEET",
  "ELEMENT",
  "CHARACTER",
  "CHARACTER_SHEET",
]);

function isActiveAssetWorkflow(workflow) {
  if (!workflow || workflow.deleted_at || workflow.metadata?.deleted_at) {
    return false;
  }
  const wType = String(workflow.workflow_type || workflow.workflowType || "").toUpperCase();
  return !NON_ASSET_WORKFLOW_TYPES.has(wType);
}

export function getWorkflowFolderId(workflow) {
  if (!workflow) return null;
  const directFolder =
    workflow.folder_id ||
    workflow.folderId ||
    workflow.metadata?.folder_id ||
    workflow.metadata?.folderId;
  if (directFolder) return directFolder;

  // Do not fall back to stale collection_id fields when folder_id was explicitly cleared to null.
  const hasExplicitNullFolder =
    workflow.folder_id === null ||
    workflow.folderId === null ||
    workflow.metadata?.folder_id === null ||
    workflow.metadata?.folderId === null;
  if (hasExplicitNullFolder) return null;

  return (
    workflow.collection_id ||
    workflow.collectionId ||
    workflow.metadata?.collection_id ||
    workflow.metadata?.collectionId ||
    null
  );
}

/**
 * Scopes a list of workflows to the exact same direct folder as `currentWorkflow`.
 * - If `currentWorkflow` belongs to a folder, returns only workflows in that same folder.
 * - If `currentWorkflow` is at project root (no folder), returns only root-level workflows.
 */
export function filterWorkflowsByFolderScope(
  workflows,
  currentWorkflow = null,
  fallbackFolderId = null
) {
  if (!Array.isArray(workflows) || workflows.length === 0) return [];
  const targetFolderId = currentWorkflow
    ? getWorkflowFolderId(currentWorkflow)
    : (fallbackFolderId || null);

  return workflows.filter((wf) => {
    const wfFolderId = getWorkflowFolderId(wf);
    return targetFolderId ? wfFolderId === targetFolderId : !wfFolderId;
  });
}

function getWorkflowMediaTime(workflow) {
  const media = resolvePrimaryRawMedia(workflow);
  const raw =
    media?.updated_at ||
    media?.updatedAt ||
    media?.create_time ||
    media?.created_at ||
    media?.createdAt ||
    workflow?.updated_at ||
    workflow?.updatedAt ||
    workflow?.create_time ||
    workflow?.created_at ||
    workflow?.createdAt;
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

/**
 * Direct-only active asset workflow count per collection (ZERO recursion into nested child folders).
 */
export function buildCollectionDirectCountById(workflows) {
  const counts = new Map();
  (workflows || []).forEach((workflow) => {
    if (!isActiveAssetWorkflow(workflow)) return;
    const folderId = getWorkflowFolderId(workflow);
    if (!folderId) return;
    counts.set(folderId, (counts.get(folderId) || 0) + 1);
  });
  return counts;
}

/**
 * Cover + direct-only item count for a collection.
 * - `url` / `isVideo`: last completed media whose direct folder_id is that collection.
 * - `count`: direct-only count of active asset workflows in that collection (ZERO recursion).
 * Media inside nested collections is never used for a parent cover or count.
 */
export function buildCollectionCoverById(workflows) {
  const byId = new Map();
  (workflows || []).forEach((workflow) => {
    if (!isActiveAssetWorkflow(workflow)) return;
    const folderId = getWorkflowFolderId(workflow);
    if (!folderId) return;

    const current = byId.get(folderId);
    const nextCount = (current?.count || 0) + 1;

    const media = resolvePrimaryRawMedia(workflow);
    const meta = getItemMetadata(media, workflow);
    const hasCompletedCover = Boolean(meta?.url && meta.status === "completed");

    if (hasCompletedCover) {
      const time = getWorkflowMediaTime(workflow);
      if (!current || !current.url || time >= current.time) {
        byId.set(folderId, {
          url: meta.url,
          isVideo: Boolean(meta.isVideo),
          time,
          count: nextCount,
        });
        return;
      }
    }

    if (current) {
      current.count = nextCount;
    } else {
      byId.set(folderId, {
        url: null,
        isVideo: false,
        time: -1,
        count: nextCount,
      });
    }
  });
  return byId;
}
