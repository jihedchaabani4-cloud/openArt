/**
 * Canonical media reference helpers for PromptBar.
 */

/** Extracts the canonical asset ID from any media asset object or string. */
export function getAssetId(asset) {
  if (!asset) return null;
  if (typeof asset === "string") {
    const s = asset.trim();
    return s || null;
  }
  if (typeof asset !== "object") return String(asset);
  return (
    asset.workflow_id ||
    asset.workflowId ||
    asset.id ||
    asset.asset_id ||
    asset.assetId ||
    asset.ref_media_id ||
    asset.url ||
    null
  );
}

/** Checks whether two media references represent the same underlying asset. */
export function sameAsset(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;

  const idA = getAssetId(a);
  const idB = getAssetId(b);
  if (idA && idB && idA === idB) return true;

  const getCandidateKeys = (item) => {
    if (!item) return [];
    if (typeof item === "string") return [item.trim()].filter(Boolean);
    if (typeof item === "object") {
      return [
        item.workflow_id,
        item.workflowId,
        item.id,
        item.asset_id,
        item.assetId,
        item.ref_media_id,
        item.url,
        item.preview,
        item.file_url,
      ]
        .filter(Boolean)
        .map((k) => String(k).trim());
    }
    return [];
  };

  const keysA = getCandidateKeys(a);
  const keysB = new Set(getCandidateKeys(b));
  return keysA.some((k) => keysB.has(k));
}

/** Checks whether a media value is safe to persist to storage (excludes Files, Blobs, blob: and data: URLs). */
export function isPersistableMedia(value) {
  if (value === undefined || value === null || value === "") return false;

  if (typeof Blob !== "undefined" && value instanceof Blob) return false;
  if (typeof File !== "undefined" && value instanceof File) return false;
  if (typeof value === "object") {
    const tag = Object.prototype.toString.call(value);
    if (tag === "[object File]" || tag === "[object Blob]") return false;
    if (typeof value.arrayBuffer === "function" && typeof value.size === "number") return false;
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s || s.startsWith("blob:") || s.startsWith("data:")) return false;
    return true;
  }

  if (typeof value === "object") {
    const url = value.url || value.preview || value.file_url || value.src;
    if (typeof url === "string") {
      const s = url.trim();
      if (s.startsWith("blob:") || s.startsWith("data:")) return false;
    }
    return Boolean(getAssetId(value) || url);
  }

  return false;
}

/** Returns a safe log descriptor (kind:id) for a media value without exposing private or signed URLs. */
export function describeMedia(value) {
  if (!value) return "none";
  const id = getAssetId(value) || "unknown_id";
  let kind = "media";

  if (typeof value === "string") {
    kind = value.startsWith("http") ? "url" : "id";
  } else if (typeof value === "object") {
    if (typeof Blob !== "undefined" && value instanceof Blob) {
      kind = "blob";
    } else if (value.is_character || value.type === "character" || String(value.workflow_type || "").toUpperCase().includes("CHARACTER")) {
      kind = "character";
    } else if (value.is_element || value.type === "element" || String(value.workflow_type || "").toUpperCase().includes("ELEMENT")) {
      kind = "element";
    } else if (value.type) {
      kind = String(value.type);
    }
  }

  const safeId =
    typeof id === "string" && (id.startsWith("http://") || id.startsWith("https://") || id.startsWith("blob:"))
      ? "[media_url]"
      : id;

  return `${kind}:${safeId}`;
}
