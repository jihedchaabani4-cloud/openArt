// src/shared/lib/displayUtils.js
// ✅ Pure UI helpers — no business logic, no side effects

export const STUDIO_GRID_CONFIG = {
  sm: {
    targetRowHeight: 250,
    spacing: 12,
    maxRowHeightMultiplier: 1.0,
    cardGridClass: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3",
  },
  md: {
    targetRowHeight: 420,
    spacing: 16,
    maxRowHeightMultiplier: 1.0,
    cardGridClass: "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4",
  },
  lg: {
    targetRowHeight: 540,
    spacing: 20,
    maxRowHeightMultiplier: 1.0,
    cardGridClass: "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5",
  },
};

const imageDimensionCache = new Map();

/**
 * Retrieve verified natural dimensions for an image URL if already loaded.
 */
export function getCachedImageDimensions(url) {
  if (!url) return null;
  return imageDimensionCache.get(url) || null;
}

const MAX_DIMENSION_CACHE = 500;

/**
 * Store verified natural pixel width/height for an image URL to preserve authentic ratio.
 */
export function setCachedImageDimensions(url, width, height) {
  if (!url || !width || !height || isNaN(width) || isNaN(height)) return;
  const w = Math.round(width);
  const h = Math.round(height);
  if (w <= 0 || h <= 0) return;
  if (imageDimensionCache.size >= MAX_DIMENSION_CACHE) {
    const firstKey = imageDimensionCache.keys().next().value;
    imageDimensionCache.delete(firstKey);
  }
  imageDimensionCache.set(url, {
    width: w,
    height: h,
    aspect: `${w}/${h}`,
  });
}

export function getStudioGridDensity(gridSize = "md") {
  return STUDIO_GRID_CONFIG[gridSize] || STUDIO_GRID_CONFIG.md;
}

/**
 * Returns CSS classes for a generation grid based on size variant.
 */
export function getGridClass(_group, _count, gridSize = "lg") {
  const layouts = {
    sm: { container: "flex flex-wrap gap-2",   maxHeight: "h-[320px]" },
    md: { container: "flex flex-wrap gap-3",   maxHeight: "h-[500px]" },
    lg: { container: "flex flex-wrap gap-4",   maxHeight: "h-[650px]" },
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

  const normalizeStatus = (rawStatus, resolvedUrl, rawError, createdAt) => {
    const s = (rawStatus || "").toString().toLowerCase();
    if (s === "success" || s === "completed") return "completed";
    if (s === "processing" || s === "pending" || s === "uploading" || s === "queued" || s === "in_progress" || s === "starting") {
      const createdMs = createdAt ? new Date(createdAt).getTime() : 0;
      // UX Failsafe: if an item has been stuck processing for > 10 minutes, display as failed
      if (createdMs > 0 && (Date.now() - createdMs) > 10 * 60 * 1000) {
        return "failed";
      }
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
    const createdMs = createdAt ? new Date(createdAt).getTime() : 0;
    if (createdMs > 0 && (Date.now() - createdMs) > 10 * 60 * 1000) {
      return "failed";
    }
    return "processing";
  };

  const itemCreatedAt = item.create_time || item.created_at || item.createdAt;

  // ── Unified URL Resolution ────────────────────────────────────────────────
  const url = item.url ?? 
              item.image?.url ?? 
              item.video?.url ?? 
              item.image?.generatedImage?.url ?? 
              item.video?.generatedVideo?.url ?? 
              item.file_url ?? 
              item.asset?.file_url ?? 
              (item._displayType === 'shot' ? item.video_url : null);

  const cachedDims = getCachedImageDimensions(url);

  // ── New schema: item has item.image or item.video ──────────────────────────
  if (item?.image || item?.video || item?.mediaMetadata) {
    const isVideo = !!item.video || item.asset_type === 'video';
    const isAudio = item.asset_type === 'audio';

    const mediaObj = item.image ?? item.video;
    // Dimensions from the nested image/video object, or item directly
    const dims = mediaObj?.dimensions ?? (item.image?.generatedImage) ?? item.dimensions ?? null;
    const w = cachedDims?.width ?? dims?.width ?? item.width ?? item.params?.width ?? null;
    const h = cachedDims?.height ?? dims?.height ?? item.height ?? item.params?.height ?? null;
    const hasValidDims = w && h && !isNaN(w) && !isNaN(h) && Number(w) > 0 && Number(h) > 0;

    const rawRatio = (item.aspectRatio && item.aspectRatio !== "IMAGE_ASPECT_RATIO_UNSPECIFIED" ? item.aspectRatio : null)
      ?? (item.ratio && item.ratio !== "IMAGE_ASPECT_RATIO_UNSPECIFIED" ? item.ratio : null)
      ?? (mediaObj?.userUploadedImage?.aspectRatio && mediaObj.userUploadedImage.aspectRatio !== "IMAGE_ASPECT_RATIO_UNSPECIFIED" ? mediaObj.userUploadedImage.aspectRatio : null)
      ?? (mediaObj?.generatedImage?.aspectRatio || null)
      ?? (item.generationConfig?.aspectRatio || null)
      ?? (item.params?.ratio || null);

    let aspect;
    if (isAudio) {
      aspect = '4/1';
    } else if (cachedDims?.aspect) {
      aspect = cachedDims.aspect;
    } else if (hasValidDims) {
      aspect = `${w}/${h}`;
    } else if (rawRatio) {
      aspect = rawRatio.replace(':', '/');
    } else {
      aspect = isVideo ? '16/9' : '3/4';
    }

    const ratioStr = cachedDims 
      ? intrinsicSizeToRatioLabel(cachedDims.width, cachedDims.height)
      : (hasValidDims ? intrinsicSizeToRatioLabel(w, h) : (rawRatio || null));

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

  const w = cachedDims?.width ?? item.dimensions?.width ?? item.asset?.meta_data?.width ?? item.width ?? item.params?.width ?? null;
  const h = cachedDims?.height ?? item.dimensions?.height ?? item.asset?.meta_data?.height ?? item.height ?? item.params?.height ?? null;
  const hasValidDims = w && h && !isNaN(w) && !isNaN(h) && Number(w) > 0 && Number(h) > 0;

  let rawRatio =
    item.params?.ratio ??
    (group?.params?.ratio || null) ??
    item.asset?.meta_data?.ratio ??
    item.aspectRatio ??
    item.ratio ??
    (item._displayType === 'shot' ? '16:9' : null);

  if (rawRatio === "IMAGE_ASPECT_RATIO_UNSPECIFIED") rawRatio = null;

  let aspect;
  if (isAudio) {
    aspect = '4/1';
  } else if (cachedDims?.aspect) {
    aspect = cachedDims.aspect;
  } else if (hasValidDims) {
    aspect = `${w}/${h}`;
  } else if (rawRatio) {
    aspect = rawRatio.replace(':', '/');
  } else {
    const isChar = group?.workflow_type === "CHARACTER" || group?.workflow_type === "CHARACTER_SHEET" || group?.is_character || group?.entity_type === "character";
    const isElem = group?.workflow_type === "ELEMENT_SHEET" || group?.is_element || group?.entity_type === "element";
    const defaultRatio = isElem ? '1/1' : (isChar ? '1/1' : (isVideo ? '16/9' : '3/4'));
    aspect = defaultRatio;
  }

  const ratioStr = cachedDims
    ? intrinsicSizeToRatioLabel(cachedDims.width, cachedDims.height)
    : (hasValidDims ? intrinsicSizeToRatioLabel(w, h) : (rawRatio || null));

  return {
    isVideo,
    isAudio,
    url,
    aspect,
    ratioStr,
    status: normalizeStatus(item.status || item.media_status, url, item.error, itemCreatedAt),
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

/**
 * Returns the primary media item for a workflow (CAE or upload).
 * Fallback to the first item if no CAE/upload found.
 * 
 * @param {Object} workflow - The workflow object containing items
 * @returns {Object|null} - The primary media item
 */
export function getPrimaryMedia(workflow) {
  if (!workflow) return null;

  const wType = String(workflow.workflow_type || workflow.workflowType || "").toUpperCase();
  const isChar = wType === "CHARACTER" || wType === "CHARACTER_SHEET" || Boolean(workflow.is_character) || workflow.entity_type === "character" || Boolean(workflow.characterId) || Boolean(workflow.character);
  const isElem = wType === "ELEMENT" || wType === "ELEMENT_SHEET" || Boolean(workflow.is_element) || workflow.entity_type === "element" || Boolean(workflow.elementId) || Boolean(workflow.element);

  // 1. Character: Prioritize Body View (turnaround sheet)
  if (isChar) {
    const primaryId = workflow.primary_media_id || workflow.primaryMediaId || workflow.metadata?.primaryMediaId;
    if (primaryId) {
      const match = workflow.items?.find(i => (i.id === primaryId || i.name === primaryId) && Boolean(i.url || i.file_url));
      if (match) return match;
    }

    const bodyItem = workflow.items?.find(i => 
      i.status !== 'deleted' && 
      Boolean(i.url || i.file_url) && (
        i.step_id === "character_sheet" || 
        i.stepId === "character_sheet" || 
        i.role === "character_sheet" || 
        i.is_sheet === true
      )
    );
    if (bodyItem) return bodyItem;

    const validNonDetail = workflow.items?.find(i => 
      i.status !== 'deleted' && 
      i.step_id !== "character_detail" && 
      Boolean(i.url || i.file_url)
    );
    if (validNonDetail) return validNonDetail;

    const primaryMediaUrl = workflow.primary_media_url;
    if (primaryMediaUrl) {
      return {
        id: workflow.id || workflow.name,
        url: primaryMediaUrl,
        status: workflow.status === "failed" ? "failed" : "completed",
        is_sheet: true,
        dimensions: workflow.dimensions || (workflow.width && workflow.height ? { width: workflow.width, height: workflow.height } : null),
      };
    }

    const firstValid = workflow.items?.find(i => i.status !== 'deleted' && Boolean(i.url || i.file_url)) || workflow.items?.[0];
    if (firstValid) return firstValid;
  }

  // 2. Element: Pick one random/deterministic image from element images
  if (isElem) {
    const validItems = (workflow.items || []).filter(i => i.status !== 'deleted' && (i.url || i.file_url || i.image?.url));
    if (validItems.length > 0) {
      const hash = String(workflow.id || workflow.name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return validItems[hash % validItems.length];
    }

    const rawImgs = workflow.images || workflow.reference_images || workflow.element?.images || [];
    if (Array.isArray(rawImgs) && rawImgs.length > 0) {
      const hash = String(workflow.id || workflow.name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const picked = rawImgs[hash % rawImgs.length];
      const pickedUrl = typeof picked === 'string' ? picked : (picked?.url || picked?.file_url || picked?.src);
      if (pickedUrl) {
        return {
          id: workflow.id || workflow.name,
          url: pickedUrl,
          status: workflow.status === "failed" ? "failed" : "completed",
        };
      }
    }
  }

  if (workflow.items && workflow.items.length > 0) {
    const primaryId = workflow.metadata?.primaryMediaId;
    if (primaryId) {
      const target = workflow.items.find(i => (i.id === primaryId || i.name === primaryId) && i.status !== 'deleted');
      if (target) return target;
    }
    
    const firstValid = workflow.items.find(i => i.status !== 'deleted') || workflow.items[0];
    if (firstValid) return firstValid;
  }

  // Fallback for workflows without attached items: return dummy primary item so card renders in grid
  return {
    id: workflow.id || workflow.name,
    status: workflow.status || 'processing',
    url: null,
  };
}

/**
 * Returns the generation configuration of the primary media.
 * 
 * @param {Object} workflow - The workflow object
 * @returns {Object|null} - The generation configuration
 */
export function getPrimaryMediaConfig(workflow) {
  const primary = getPrimaryMedia(workflow);
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
    item.file_url                         ??
    item.asset?.file_url                  ??
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

export function getWorkflowFolderId(workflow) {
  return (
    workflow?.folder_id ||
    workflow?.folderId ||
    workflow?.metadata?.folder_id ||
    workflow?.metadata?.folderId ||
    null
  );
}

function getWorkflowMediaTime(workflow) {
  const media = getPrimaryMedia(workflow);
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
 * Cover for a collection = last completed media whose folder_id is that collection.
 * Media inside nested collections is never used for a parent cover.
 */
export function buildCollectionCoverById(workflows) {
  const byId = new Map();
  (workflows || []).forEach((workflow) => {
    const folderId = getWorkflowFolderId(workflow);
    if (!folderId) return;

    const media = getPrimaryMedia(workflow);
    const meta = getItemMetadata(media, workflow);
    if (!meta?.url || meta.status !== "completed") return;

    const time = getWorkflowMediaTime(workflow);
    const current = byId.get(folderId);
    if (!current || time >= current.time) {
      byId.set(folderId, {
        url: meta.url,
        isVideo: Boolean(meta.isVideo),
        time,
      });
    }
  });
  return byId;
}
