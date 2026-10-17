import { resolveMainMedia } from "@/features/workflows/core/resolveMediaRef";

const DATE_HEADING_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export const PAGE_SIZE = 30;

export function isVideoUrl(url = "") {
  return /\.(mp4|webm|mov)$/i.test(url);
}

/**
 * Resolves the display media for a library entry:
 * 1. If `entry.primary_media` is explicitly present (user pin), return it.
 * 2. Otherwise resolve from `entry.candidates` / `entry.workflow_media` / `entry.workflow.items`
 *    using the canonical `resolveMainMedia(entry.workflow, candidates)` ladder.
 *
 * @param {Object|null} entry
 * @returns {Object}
 */
export function resolveLibraryEntryMedia(entry) {
  if (!entry || typeof entry !== "object") return {};

  const primary = entry.primary_media;
  if (
    primary &&
    typeof primary === "object" &&
    Boolean(primary.url || primary.id || primary.status)
  ) {
    return primary;
  }

  const candidates =
    entry.candidates ||
    entry.workflow_media ||
    entry.workflow?.items ||
    entry.workflow?.media ||
    [];

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return {};
  }

  const resolved = resolveMainMedia(entry.workflow || {}, candidates);
  if (!resolved) {
    return {};
  }

  const raw = resolved.raw || {};
  return {
    ...resolved,
    id: resolved.id || raw.id || null,
    url: resolved.url || null,
    status: raw.status || resolved.status || null,
    width: resolved.width ?? raw.width ?? null,
    height: resolved.height ?? raw.height ?? null,
    error_message: raw.error_message ?? resolved.error ?? null,
    create_time: raw.create_time ?? raw.created_at ?? resolved.createdAt ?? null,
  };
}

export function getEntryTimestamp(entry) {
  const media = resolveLibraryEntryMedia(entry);
  return media?.create_time || media?.created_at || entry?.workflow?.create_time || entry?.workflow?.created_at || null;
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

export function filterLibraryItems(items = [], { searchQuery = "", mediaFilter = "all", categoryFilter = "all" } = {}) {
  const query = searchQuery.trim().toLowerCase();

  return items.filter((entry) => {
    const workflow = entry?.workflow || {};
    const media = resolveLibraryEntryMedia(entry);
    const isVideo = isVideoUrl(media.url);
    const category = resolveLibraryCategory(entry);
    const searchableText = [
      workflow.display_name,
      entry?.generation_info?.prompt,
      entry?.generation_info?.model,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (query && !searchableText.includes(query)) return false;
    if (mediaFilter === "image" && isVideo) return false;
    if (mediaFilter === "video" && !isVideo) return false;
    if (categoryFilter !== "all" && category !== categoryFilter) return false;

    return true;
  });
}

export function buildGroupedPhotos(items = []) {
  const BASE = 1200;
  const groups = new Map();

  items.forEach((entry, index) => {
    const media = resolveLibraryEntryMedia(entry);
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

export function buildDownloadFilename(entry) {
  const media = resolveLibraryEntryMedia(entry);
  const workflow = entry?.workflow || {};
  const rawUrl = media.url || "";
  const extensionMatch = rawUrl.match(/\.([a-z0-9]+)(?:[?#].*)?$/i);
  const fallbackExtension = isVideoUrl(rawUrl) ? "mp4" : "png";
  const extension = extensionMatch?.[1] || fallbackExtension;
  const baseName =
    workflow.display_name?.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "-") ||
    workflow.id ||
    media.id ||
    "asset";

  return `${baseName}.${extension}`;
}

export function buildAssetsZipFilename() {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join("-");

  const appName = (process.env.NEXT_PUBLIC_APP_NAME || "Labveil").toLowerCase();
  return `${appName}-assets-${timestamp}.zip`;
}
