const DATE_HEADING_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export const PAGE_SIZE = 30;

export function isVideoUrl(url = "") {
  return /\.(mp4|webm|mov)$/i.test(url);
}

export function getEntryTimestamp(entry) {
  return entry?.primary_media?.create_time || entry?.workflow?.create_time || null;
}

export function formatDateHeading(value) {
  if (!value) return "Unknown Date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown Date";
  return DATE_HEADING_FORMATTER.format(date);
}

export function resolveLibraryCategory(entry) {
  const workflowType = (entry?.workflow?.workflow_type || "").toUpperCase();
  const displayName = (entry?.workflow?.display_name || "").toLowerCase();
  const prompt = (entry?.generation_info?.prompt || "").toLowerCase();
  const haystack = [displayName, prompt].filter(Boolean).join(" ");

  // 1. Structured Element Sheets
  if (workflowType === "ELEMENT_SHEET") {
    if (haystack.includes("product")) return "product";
    if (haystack.includes("location")) return "location";
    // Default for Element Sheets is character
    return "character";
  }

  // 2. All other generations (Image/Video) go to Media
  return "media";
}

export function buildGroupedPhotos(items = []) {
  const BASE = 1200;
  const groups = new Map();

  items.forEach((entry, index) => {
    const media = entry?.primary_media || {};
    if (!media.url) return;

    const width = Number(media.width) || 3;
    const height = Number(media.height) || 4;
    const maxDim = Math.max(width, height);
    const timestamp = getEntryTimestamp(entry);
    const groupLabel = formatDateHeading(timestamp);
    const photo = {
      src: media.url,
      width: Math.round(BASE * (width / maxDim)),
      height: Math.round(BASE * (height / maxDim)),
      key: entry?.workflow?.id || String(index),
      entry,
    };

    if (!groups.has(groupLabel)) {
      groups.set(groupLabel, []);
    }

    groups.get(groupLabel).push(photo);
  });

  return Array.from(groups.entries()).map(([label, photos]) => ({
    label,
    photos,
  }));
}
