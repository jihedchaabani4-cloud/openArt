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
 * Returns: { isVideo, isAudio, url, aspect, ratioStr, status }
 */
export function getItemMetadata(item, group) {
  const isVideo =
    item.asset_type === "video" ||
    item.asset?.asset_type === "video" ||
    item._displayType === "shot";
  const isAudio =
    item.asset_type === "audio" ||
    item.asset?.asset_type === "audio";

  const url =
    item._displayType === "shot"
      ? item.video_url
      : (item.file_url ?? item.asset?.file_url);

  const ratioStr =
    item.params?.ratio ??
    group?.params?.ratio ??
    item.asset?.meta_data?.ratio ??
    (item._displayType === "shot" ? "16:9" : null);

  // If meta_data has raw pixel dimensions, build a precise CSS aspect ratio
  const meta = item.asset?.meta_data;
  let aspect;
  if (isAudio) {
    aspect = "4/1";
  } else if (meta?.width && meta?.height) {
    // Use exact pixel dimensions for pixel-perfect aspect ratio
    aspect = `${meta.width}/${meta.height}`;
  } else {
    const RATIO_MAP = {
      "16:9": "16/9",
      "9:16": "9/16",
      "1:1":  "1/1",
      "4:3":  "4/3",
      "3:4":  "3/4",
      "2:3":  "2/3",
      "3:2":  "3/2",
      "21:9": "21/9",
    };
    aspect = RATIO_MAP[ratioStr] ?? "3/4";
  }

  return { isVideo, isAudio, url, aspect, ratioStr, status: item.status };
}
