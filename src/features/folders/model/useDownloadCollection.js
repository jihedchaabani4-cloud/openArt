import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import JSZip from "jszip";
import { api } from "@/shared/api/client";
import { downloadBlob } from "@/shared/lib/utils";
import { queryKeys } from "@/shared/api/queryKeys";
import { logger } from "@/shared/lib/logger";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { toast } from "sonner";

/**
 * Clean filename utility removing invalid filesystem characters.
 */
function sanitizeFilename(name) {
  return (
    String(name || "untitled")
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim()
      .slice(0, 60) || "untitled"
  );
}

/**
 * Extract clean extension from URL or media metadata.
 */
function getExtensionFromUrl(url = "", isVideo = false) {
  try {
    const clean = url.split("?")[0].split("#")[0];
    const dot = clean.lastIndexOf(".");
    if (dot !== -1 && clean.length - dot <= 6) {
      const ext = clean.slice(dot + 1).toLowerCase();
      if (["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov", "svg"].includes(ext)) {
        return ext;
      }
    }
  } catch {}
  return isVideo ? "mp4" : "png";
}

/**
 * Canonical URL extractor supporting all backend media schemas.
 */
function extractMediaUrl(item) {
  if (!item) return null;
  if (typeof item === "string") return item;
  return (
    item.url ??
    item.file_url ??
    item.src ??
    item.image?.generatedImage?.url ??
    item.image?.url ??
    item.video?.generatedVideo?.uri ??
    item.video?.generatedVideo?.url ??
    item.video?.url ??
    item.asset?.file_url ??
    item.primary_media_url ??
    item.primary_media?.url ??
    null
  );
}

/**
 * Canonical video detector supporting all backend media schemas.
 */
function isMediaVideo(item, url = "") {
  if (!item && !url) return false;
  return Boolean(
    item?.isVideo ||
    item?.is_video ||
    item?.type === "video" ||
    item?.asset_type === "video" ||
    item?.video ||
    /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url || "")
  );
}

/**
 * Checks if an item (workflow or media) belongs to a target folder / collection.
 */
function isItemInFolder(item, targetFolderId) {
  if (!item || !targetFolderId) return false;
  const target = String(targetFolderId);
  const candidates = [
    item.folder_id,
    item.folderId,
    item.collection_id,
    item.collectionId,
    item.metadata?.folder_id,
    item.metadata?.folderId,
    item.metadata?.collection_id,
    item.metadata?.collectionId,
  ];
  return candidates.some((c) => c != null && String(c) === target);
}

/**
 * Core service function: downloads a collection, its workflows, workflow media,
 * and all nested sub-collections as a organized ZIP archive.
 */
export async function downloadCollectionAsZip({
  collectionId,
  collectionName = "Untitled collection",
  projectId = null,
  folders: passedFolders = null,
  workflows: passedWorkflows = null,
  queryClient = null,
} = {}) {
  if (!collectionId) {
    throw new Error("collectionId is required");
  }

  const effectiveProjectId =
    projectId ||
    (typeof window !== "undefined"
      ? useWorkflowsStore.getState?.().selectedProjectId
      : null);

  // 1. Resolve folders list
  let allFolders = Array.isArray(passedFolders) ? [...passedFolders] : null;
  if ((!allFolders || allFolders.length === 0) && queryClient && effectiveProjectId) {
    const cached = queryClient.getQueryData(queryKeys.folders.byProject(effectiveProjectId));
    if (Array.isArray(cached)) allFolders = cached;
    else if (Array.isArray(cached?.items)) allFolders = cached.items;
  }
  if ((!allFolders || allFolders.length === 0) && queryClient && effectiveProjectId) {
    const cachedProject = queryClient.getQueryData(queryKeys.projectData.byProject(effectiveProjectId));
    const projectFolders =
      cachedProject?.projectContents?.collections ||
      cachedProject?.collections ||
      cachedProject?.projectContents?.folders ||
      cachedProject?.folders;
    if (Array.isArray(projectFolders) && projectFolders.length > 0) {
      allFolders = projectFolders;
    }
  }
  if (!allFolders) allFolders = [];

  // 2. Resolve project contents (workflows & media)
  let projectContents = null;
  if (queryClient && effectiveProjectId) {
    const cached = queryClient.getQueryData(queryKeys.projectData.byProject(effectiveProjectId));
    if (cached?.projectContents) {
      projectContents = cached.projectContents;
    }
  }
  if (!projectContents && effectiveProjectId) {
    try {
      const res = await api.get(`/workflows/project-data/${effectiveProjectId}`);
      const data =
        res?.data?.data?.json ||
        res?.data?.json ||
        res?.result?.data?.json ||
        res?.json ||
        res?.data;
      if (data?.projectContents) {
        projectContents = data.projectContents;
        queryClient?.setQueryData(queryKeys.projectData.byProject(effectiveProjectId), data);
        if (!allFolders || allFolders.length === 0) {
          const fromContents =
            projectContents.collections ||
            projectContents.folders ||
            data.collections ||
            data.folders;
          if (Array.isArray(fromContents) && fromContents.length > 0) {
            allFolders = fromContents;
          }
        }
      }
    } catch (err) {
      logger.warn("download_collection_fetch_project_data_failed", { error: err?.message });
    }
  }

  const rawWorkflows = Array.isArray(projectContents?.workflows) ? projectContents.workflows : [];
  const rawMedia = Array.isArray(projectContents?.media) ? projectContents.media : [];

  // Merge workflows from projectContents with any passedWorkflows
  const workflowsMap = new Map();
  for (const w of rawWorkflows) {
    if (w?.id || w?.name) {
      workflowsMap.set(String(w.id || w.name), w);
    }
  }
  if (Array.isArray(passedWorkflows)) {
    for (const w of passedWorkflows) {
      const key = String(w.id || w.name || "");
      if (key) {
        const existing = workflowsMap.get(key) || {};
        workflowsMap.set(key, { ...existing, ...w });
      }
    }
  }
  const allWorkflows = Array.from(workflowsMap.values());

  // Index media by workflow ID variants
  const mediaByWorkflow = {};
  for (const m of rawMedia) {
    const wfId = m.workflowId || m.workflow_id || m.workflowName;
    if (!wfId) continue;
    const strId = String(wfId);
    (mediaByWorkflow[strId] ??= []).push(m);
    const cleanId = strId.replace(/^workflows\//, "");
    if (cleanId !== strId) {
      (mediaByWorkflow[cleanId] ??= []).push(m);
    }
  }

  const targetFolder = allFolders.find(
    (f) => String(f.id) === String(collectionId) || f.name === collectionId
  );
  const cleanRootName = sanitizeFilename(
    targetFolder?.name || collectionName || "Untitled collection"
  );
  const rootFolderId = targetFolder?.id || collectionId;

  const zip = new JSZip();
  let totalFiles = 0;

  // Recursive collector
  async function collectFolderContents(currentFolderId, zipFolder) {
    const folderKey = String(currentFolderId);
    const workflowsInFolder = allWorkflows.filter((w) => isItemInFolder(w, folderKey));

    const collectedMediaKeys = new Set();
    const mediaToDownload = [];

    function addMediaItem(item, parentWf = null) {
      if (!item) return;
      if (item.status === "failed" || item.status === "rejected") return;

      const url = extractMediaUrl(item);
      if (!url) return;

      const dedupeKey = item.id || item.name || url;
      if (collectedMediaKeys.has(dedupeKey)) return;
      collectedMediaKeys.add(dedupeKey);

      const isVideo = isMediaVideo(item, url);
      const wfDisplayName =
        parentWf?.display_name ||
        parentWf?.title ||
        parentWf?.name ||
        parentWf?.metadata?.displayName;
      const baseName = sanitizeFilename(
        wfDisplayName ||
        item.name ||
        item.id ||
        (parentWf?.prompt ? parentWf.prompt.slice(0, 30) : null) ||
        "media"
      );

      mediaToDownload.push({
        url,
        isVideo,
        baseName,
        id: item.id || parentWf?.id || null,
      });
    }

    // 1. Collect media belonging to workflows in this folder
    for (const wf of workflowsInFolder) {
      const cleanWfId = String(wf.id || wf.name || "").replace(/^workflows\//, "");
      const wfItems =
        (Array.isArray(wf.items) && wf.items.length > 0 ? wf.items : null) ||
        (Array.isArray(wf.media) && wf.media.length > 0 ? wf.media : null) ||
        (Array.isArray(wf.media_items) && wf.media_items.length > 0 ? wf.media_items : null) ||
        mediaByWorkflow[wf.id] ||
        mediaByWorkflow[wf.name] ||
        mediaByWorkflow[cleanWfId] ||
        [];

      if (wfItems.length > 0) {
        for (const it of wfItems) {
          addMediaItem(it, wf);
        }
      } else {
        if (wf.primary_media) {
          addMediaItem(wf.primary_media, wf);
        } else if (wf.primary_media_url || wf.url || wf.file_url) {
          addMediaItem(
            {
              url: wf.primary_media_url || wf.url || wf.file_url,
              isVideo: isMediaVideo(wf),
            },
            wf
          );
        }
      }
    }

    // 2. Collect any direct media in rawMedia scoped to this folder
    for (const m of rawMedia) {
      if (isItemInFolder(m, folderKey)) {
        addMediaItem(m, null);
      }
    }

    // 3. Download media blobs into current zipFolder
    const usedNames = new Set();
    for (let i = 0; i < mediaToDownload.length; i++) {
      const item = mediaToDownload[i];
      try {
        const blob = await api.getBlob(item.url);
        const ext = getExtensionFromUrl(item.url, item.isVideo);
        let finalName = `${item.baseName}.${ext}`;
        let duplicateCounter = 1;
        while (usedNames.has(finalName)) {
          finalName = `${item.baseName}-${duplicateCounter}.${ext}`;
          duplicateCounter++;
        }
        usedNames.add(finalName);

        zipFolder.file(finalName, blob);
        totalFiles++;
      } catch (err) {
        logger.warn("collection_media_download_failed", {
          mediaId: item.id || "unknown",
          error: err?.message,
        });
      }
    }

    // 4. Collect child sub-collections (sections)
    const childFolders = allFolders.filter((f) => {
      const pId = f.parentId || f.parent_id;
      return pId != null && String(pId) === folderKey;
    });

    for (const child of childFolders) {
      const childFolderName = sanitizeFilename(
        child.name || child.display_name || "Untitled section"
      );
      const childZipFolder = zipFolder.folder(childFolderName);
      await collectFolderContents(child.id, childZipFolder);
    }
  }

  // Execute recursive collection from rootFolderId
  await collectFolderContents(rootFolderId, zip);

  if (totalFiles === 0) {
    toast.info(`Collection "${cleanRootName}" has no media to download.`);
    return { success: false, totalFiles: 0 };
  }

  const toastId = toast.loading(
    `Zipping collection "${cleanRootName}" (${totalFiles} ${
      totalFiles === 1 ? "file" : "files"
    })...`
  );

  try {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadBlob(zipBlob, `${cleanRootName}.zip`);
    toast.success(`Downloaded "${cleanRootName}.zip"`, { id: toastId });
    return { success: true, totalFiles };
  } catch (err) {
    toast.error(`Failed to download collection "${cleanRootName}"`, { id: toastId });
    throw err;
  }
}

/**
 * Custom hook providing download collection capabilities.
 */
export function useDownloadCollection() {
  let queryClient = null;
  try {
    queryClient = useQueryClient();
  } catch {
    // Graceful fallback when rendered outside a QueryClientProvider (e.g. isolated test environments)
  }
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadCollection = useCallback(
    async (params) => {
      setIsDownloading(true);
      try {
        return await downloadCollectionAsZip({
          ...params,
          queryClient,
        });
      } finally {
        setIsDownloading(false);
      }
    },
    [queryClient]
  );

  return { downloadCollection, isDownloading };
}

