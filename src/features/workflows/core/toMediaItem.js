/**
 * [FSD Layer: features/workflows/core]
 * Canonical MediaItem Normalizer & URL Resolution Pipeline.
 * 
 * Rules:
 * - Pure JavaScript: zero React, zero DOM.
 * - Single source of truth for URL resolution union ladder.
 * - Maps database statuses ('success', 'completed') to canonical 3-state MediaItem status.
 */

const VALID_ROLES = new Set([
  "output",
  "original",
  "sheet",
  "detail",
  "reference",
  "avatar",
  "turnaround",
]);

/**
 * Resolves the canonical display URL from any media asset object or string,
 * uniting all known property variants across the codebase.
 *
 * @param {Object|string|null} media
 * @returns {string|null}
 */
export function resolveMediaUrl(media) {
  if (!media) return null;
  if (typeof media === "string") {
    const trimmed = media.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof media !== "object") return null;

  return (
    media.url ??
    media.image?.generatedImage?.url ??
    media.image?.url ??
    media.video?.generatedVideo?.uri ??
    media.video?.generatedVideo?.url ??
    media.video?.url ??
    media.preview ??
    media.thumbnail ??
    media.file_url ??
    media.asset?.file_url ??
    media.image_url ??
    media.src ??
    media.rawValue?.url ??
    media.rawValue?.preview ??
    media.rawValue?.file_url ??
    null
  );
}

/**
 * Resolves the thumbnail / low-res preview URL if available.
 *
 * @param {Object|null} media
 * @returns {string|null}
 */
export function resolveThumbUrl(media) {
  if (!media || typeof media !== "object") return null;
  return (
    media.thumbUrl ??
    media.thumb_url ??
    media.thumbnail ??
    media.preview ??
    media.rawValue?.thumbUrl ??
    media.rawValue?.preview ??
    null
  );
}

/**
 * Normalizes role values into canonical enum.
 *
 * @param {string|null} role
 * @returns {string|null}
 */
export function normalizeRole(role) {
  if (!role) return null;
  const r = String(role).trim().toLowerCase();
  if (VALID_ROLES.has(r)) return r;
  if (r === "character_sheet") return "sheet";
  if (r === "character_detail") return "detail";
  return null;
}

/**
 * Normalizes database and UI lifecycle statuses into the canonical MediaItem status:
 * 'processing' | 'failed' | 'ready'.
 * Note: 'loading', 'empty', and 'notFound' belong to the selector hook lifecycle, not to MediaItem.
 *
 * @param {string|null} status
 * @param {string|Error|null} error
 * @param {string|null} url
 * @returns {'processing' | 'failed' | 'ready'}
 */
export function normalizeMediaStatus(status, error = null, url = null) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "failed" || s === "error" || s === "rejected" || Boolean(error)) {
    return "failed";
  }
  if (s === "processing" || s === "pending" || s === "uploading" || s === "queued") {
    return "processing";
  }
  if (s === "ready" || s === "success" || s === "completed" || Boolean(url)) {
    return "ready";
  }
  return "processing";
}

/**
 * Determines whether a media item represents a video asset.
 *
 * @param {Object|null} media
 * @param {string|null} resolvedUrl
 * @returns {boolean}
 */
export function isVideoMedia(media, resolvedUrl = null) {
  if (!media) return false;
  if (media.kind === "video" || media.type === "video" || media.is_video === true) return true;
  if (Boolean(media.video) && !Boolean(media.image)) return true;
  const urlToCheck = resolvedUrl || resolveMediaUrl(media);
  if (urlToCheck && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(urlToCheck)) return true;
  return false;
}

/**
 * Normalizes any raw media record or payload into the canonical MediaItem interface.
 *
 * @param {Object} raw
 * @param {Object} [context]
 * @param {string} [context.workflowId]
 * @param {string} [context.role]
 * @param {{ type: 'character' | 'element' | 'workflow', id: string }} [context.owner]
 * @returns {MediaItem}
 */
export function toMediaItem(raw, context = {}) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const url = resolveMediaUrl(raw);
  const thumbUrl = resolveThumbUrl(raw);
  const isVideo = isVideoMedia(raw, url);
  const kind = isVideo ? "video" : "image";

  const workflowId = String(
    context.workflowId ||
    raw.workflowId ||
    raw.workflow_id ||
    ""
  );

  const rawId = raw.id ?? raw.name ?? raw.asset_id ?? "";
  const id = String(rawId);

  const rawRole = context.role ?? raw.role ?? raw.mediaRole ?? raw.step_id ?? raw.workflowStepId ?? null;
  const role = normalizeRole(rawRole);

  const rawStatus = raw.status ?? raw.media_status ?? null;
  const error = raw.error ?? raw.error_message ?? null;
  const status = normalizeMediaStatus(rawStatus, error, url);

  const w = raw.width ?? raw.dimensions?.width ?? raw.params?.width ?? raw.meta_data?.width ?? raw.asset?.meta_data?.width ?? null;
  const h = raw.height ?? raw.dimensions?.height ?? raw.params?.height ?? raw.meta_data?.height ?? raw.asset?.meta_data?.height ?? null;
  const width = typeof w === "number" && !isNaN(w) && w > 0 ? w : (Number(w) || null);
  const height = typeof h === "number" && !isNaN(h) && h > 0 ? h : (Number(h) || null);

  const name = raw.display_name ?? raw.name ?? raw.title ?? null;

  let owner = context.owner;
  if (!owner) {
    if (raw.character_id || raw.characterId) {
      owner = { type: "character", id: String(raw.character_id || raw.characterId) };
    } else if (raw.element_id || raw.elementId) {
      owner = { type: "element", id: String(raw.element_id || raw.elementId) };
    } else {
      owner = { type: "workflow", id: workflowId };
    }
  }

  return {
    id,
    workflowId,
    kind,
    role,
    url,
    thumbUrl,
    width,
    height,
    status,
    error: error ? String(error) : null,
    name,
    owner,
    raw,
  };
}

export default toMediaItem;
