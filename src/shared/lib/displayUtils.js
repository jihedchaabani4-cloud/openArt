// src/shared/lib/displayUtils.js
// ✅ Pure UI helpers — no business logic, no side effects

/**
 * Returns CSS classes for a generation grid based on size variant.
 */
export function getGridClass(_group, _count, gridSize = "lg") {
  const layouts = {
    sm: { container: "flex flex-wrap gap-1.5", maxHeight: "h-[250px]" },
    md: { container: "flex flex-wrap gap-2.5", maxHeight: "h-[350px]" },
    lg: { container: "flex flex-wrap gap-4",   maxHeight: "h-[450px]" },
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

/**
 * Resolves display metadata for a generation item.
 * Supports BOTH the old schema (item.file_url, item.asset_type)
 * AND the new projectData schema (item.image, item.video, item.mediaMetadata).
 *
 * Returns: { isVideo, isAudio, url, aspect, ratioStr, status }
 */
export function getItemMetadata(item, group) {
  if (!item) return { status: 'empty' };

  const normalizeStatus = (rawStatus, resolvedUrl, rawError) => {
    const s = (rawStatus || "").toString().toLowerCase();
    if (s === "success" || s === "completed") return "completed";
    if (s === "processing" || s === "pending" || s === "uploading" || s === "queued" || s === "in_progress" || s === "starting") return "processing";
    if (s === "rejected") return "rejected";

    // Heuristic: some providers return "failed" but the error indicates a safety/policy block.
    // Map those to the dedicated UI state so the user sees the correct guidance.
    const e = (rawError || "").toString().toLowerCase();
    if (e.includes("policy") || e.includes("policies") || e.includes("safety") || e.includes("violate")) {
      return "rejected";
    }
    if (s === "failed" || s === "error") return "failed";

    // Backward-compat fallback: if URL exists it's done, otherwise treat as processing.
    return resolvedUrl ? "completed" : "processing";
  };

  // ── Unified URL Resolution ────────────────────────────────────────────────
  const url = item.url ?? 
              item.image?.url ?? 
              item.video?.url ?? 
              item.image?.generatedImage?.url ?? 
              item.video?.generatedVideo?.url ?? 
              item.file_url ?? 
              item.asset?.file_url ?? 
              (item._displayType === 'shot' ? item.video_url : null);

  // ── New schema: item has item.image or item.video ──────────────────────────
  if (item?.image || item?.video || item?.mediaMetadata) {
    const isVideo = !!item.video || item.asset_type === 'video';
    const isAudio = item.asset_type === 'audio';

    const mediaObj = item.image ?? item.video;
    // Dimensions from the nested image/video object
    const dims = mediaObj?.dimensions ?? (item.image?.generatedImage) ?? item.dimensions ?? null;
    const w = dims?.width;
    const h = dims?.height;
    const aspect = (w && h) ? `${w}/${h}` : (isVideo ? '16/9' : '3/4');

    return {
      isVideo,
      isAudio,
      url,
      aspect,
      ratioStr: null,
      status: normalizeStatus(item.status || item.media_status, url, item.error),
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

  const ratioStr =
    item.params?.ratio ??
    (group?.params?.ratio || null) ??
    item.asset?.meta_data?.ratio ??
    (item._displayType === 'shot' ? '16:9' : null);

  const meta = item.asset?.meta_data;
  let aspect;
  if (isAudio) {
    aspect = '4/1';
  } else if (meta?.width && meta?.height) {
    aspect = `${meta.width}/${meta.height}`;
  } else {
    const RATIO_MAP = {
      '16:9': '16/9', '9:16': '9/16', '1:1': '1/1',
      '4:3': '4/3',   '3:4': '3/4',   '2:3': '2/3',
      '3:2': '3/2',   '21:9': '21/9',
    };
    aspect = RATIO_MAP[ratioStr] ?? '3/4';
  }

  return {
    isVideo,
    isAudio,
    url,
    aspect,
    ratioStr,
    status: normalizeStatus(item.status || item.media_status, url, item.error),
  };
}

/**
 * Returns the primary media item for a workflow (CAE or upload).
 * Fallback to the first item if no CAE/upload found.
 * 
 * @param {Object} workflow - The workflow object containing items
 * @returns {Object|null} - The primary media item
 */
export function getPrimaryMedia(workflow) {
  if (!workflow?.items || workflow.items.length === 0) return null;
  
  const primaryId = workflow.metadata?.primaryMediaId;
  if (primaryId) {
    const target = workflow.items.find(i => (i.id === primaryId || i.name === primaryId) && i.status !== 'deleted');
    return target || null;
  }
  return null;
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

