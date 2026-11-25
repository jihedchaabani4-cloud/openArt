import { getItemMetadata } from "@/shared/lib/generationUtils";
import { resolveMainMedia } from "@/features/workflows/core/resolveMediaRef";

const VIDEO_URL_REGEX = /\.(mp4|webm|mov|m4v)(\?|$)/i;

export function getMediaItemId(item) {
  return item?.id || item?.media_id || item?.name || null;
}

export function getWorkflowId(wf) {
  return wf?.id || wf?.name || null;
}

export function isVideoUrl(url) {
  return typeof url === "string" && VIDEO_URL_REGEX.test(url);
}

export function getWorkflowThumbInfo(wf) {
  if (!wf) {
    return { isVideo: false, posterUrl: null, url: null };
  }

  const primary = resolveMainMedia(wf);
  if (primary) {
    const isVideo = primary.kind === "video" || isVideoUrl(primary.url);
    const posterUrl =
      primary.thumbUrl && !isVideoUrl(primary.thumbUrl) ? primary.thumbUrl : null;
    if (posterUrl || primary.url) {
      return {
        isVideo,
        posterUrl,
        url: primary.url || null,
      };
    }
  }

  const items = Array.isArray(wf?.items) ? wf.items : [];
  for (const it of items) {
    const meta = getItemMetadata(it, wf);
    if (meta?.url) {
      const isVideo = Boolean(meta.isVideo) || isVideoUrl(meta.url);
      const posterUrl =
        meta.thumbUrl && !isVideoUrl(meta.thumbUrl) ? meta.thumbUrl : null;
      return { isVideo, posterUrl, url: meta.url };
    }
  }

  return { isVideo: false, posterUrl: null, url: null };
}

export function isWorkflowTrashed(wf) {
  return Boolean(
    wf?.deleted_at ||
      wf?.deletedAt ||
      wf?.trashed_at ||
      wf?.is_deleted ||
      wf?.status === "trashed"
  );
}

export function resolveActiveWorkflowItem(workflow, selectedItemId, resolvedPrimary) {
  if (!workflow) return null;

  const items = Array.isArray(workflow.items) ? workflow.items : [];
  if (selectedItemId) {
    const match = items.find((it) => getMediaItemId(it) === selectedItemId);
    if (match) return match;
  }

  if (resolvedPrimary) {
    return resolvedPrimary.raw || resolvedPrimary;
  }

  return {
    id: getWorkflowId(workflow),
    status: workflow.status || "processing",
    url: null,
  };
}

export function resolveEditPreviewUrl({ activeMeta, resolvedPrimary, workflow } = {}) {
  if (activeMeta?.url) return activeMeta.url;
  if (resolvedPrimary?.thumbUrl || resolvedPrimary?.url) {
    return resolvedPrimary.thumbUrl || resolvedPrimary.url;
  }

  const items = Array.isArray(workflow?.items) ? workflow.items : [];
  for (const it of items) {
    const meta = getItemMetadata(it, workflow);
    if (meta?.url) return meta.url;
  }

  return null;
}

export function resolveWorkflowDisplayTitle(workflow) {
  return workflow?.display_name || workflow?.metadata?.displayName || "Untitled Workflow";
}
