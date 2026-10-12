import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import JSZip from "jszip";
import { api } from "@/shared/api/client";
import { downloadBlob } from "@/shared/lib/utils";
import { queryKeys } from "@/shared/api/queryKeys";
import { toast } from "sonner";

/**
 * Clean filename utility removing invalid filesystem characters.
 */
function sanitizeFilename(name) {
  return String(name || "untitled")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim()
    .slice(0, 60) || "untitled";
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
 * Core service function: downloads a collection and all its sub-collections as a ZIP archive.
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

  // 1. Resolve folders list
  let allFolders = Array.isArray(passedFolders) ? passedFolders : null;
  if (!allFolders && queryClient && projectId) {
    const cached = queryClient.getQueryData(queryKeys.folders.byProject(projectId));
    if (Array.isArray(cached)) allFolders = cached;
    else if (Array.isArray(cached?.items)) allFolders = cached.items;
  }
  if (!allFolders) allFolders = [];

  // 2. Resolve workflows list
  let allWorkflows = Array.isArray(passedWorkflows) ? passedWorkflows : null;
  if (!allWorkflows && queryClient && projectId) {
    const projectData = queryClient.getQueryData(queryKeys.projectData.byProject(projectId));
    if (Array.isArray(projectData?.projectContents?.workflows)) {
      allWorkflows = projectData.projectContents.workflows;
    }
  }
  if (!allWorkflows) allWorkflows = [];

  const targetFolder = allFolders.find((f) => f.id === collectionId);
  const cleanRootName = sanitizeFilename(targetFolder?.name || collectionName || "Untitled collection");

  const zip = new JSZip();
  let totalFiles = 0;

  // Recursive collector
  async function collectFolderContents(currentFolderId, zipFolder) {
    // Collect workflows directly in currentFolderId
    const workflowsInFolder = allWorkflows.filter((w) => {
      const fid = w.folder_id || w.folderId || w.metadata?.folder_id || w.metadata?.folderId;
      return fid === currentFolderId;
    });

    const usedNames = new Set();

    for (let wIdx = 0; wIdx < workflowsInFolder.length; wIdx++) {
      const wf = workflowsInFolder[wIdx];

      // Extract all valid media items
      const mediaList = [];
      if (Array.isArray(wf.items) && wf.items.length > 0) {
        for (const it of wf.items) {
          if (it?.url && it?.status !== "failed") {
            mediaList.push({ url: it.url, isVideo: Boolean(it.isVideo) });
          }
        }
      }
      if (mediaList.length === 0 && Array.isArray(wf.media_items) && wf.media_items.length > 0) {
        for (const it of wf.media_items) {
          if (it?.url && it?.status !== "failed") {
            mediaList.push({ url: it.url, isVideo: Boolean(it.isVideo) });
          }
        }
      }
      if (mediaList.length === 0) {
        const primaryUrl = wf.primary_media?.url || wf.url;
        if (primaryUrl) {
          mediaList.push({
            url: primaryUrl,
            isVideo: Boolean(
              wf.primary_media?.isVideo ||
              wf.isVideo ||
              /\.(mp4|webm|mov)$/i.test(primaryUrl)
            ),
          });
        }
      }

      for (let mIdx = 0; mIdx < mediaList.length; mIdx++) {
        const item = mediaList[mIdx];
        try {
          const blob = await api.getBlob(item.url);
          const ext = getExtensionFromUrl(item.url, item.isVideo);
          const baseName = sanitizeFilename(
            wf.display_name ||
            wf.title ||
            (wf.prompt ? wf.prompt.slice(0, 30) : `asset-${wf.id || wIdx + 1}`)
          );

          let finalName = mediaList.length > 1
            ? `${baseName}-${mIdx + 1}.${ext}`
            : `${baseName}.${ext}`;

          let duplicateCounter = 1;
          while (usedNames.has(finalName)) {
            finalName = `${baseName}-${duplicateCounter}.${ext}`;
            duplicateCounter++;
          }
          usedNames.add(finalName);

          zipFolder.file(finalName, blob);
          totalFiles++;
        } catch (err) {
          console.error(`Failed to download media for workflow ${wf.id}:`, err);
        }
      }
    }

    // Collect child sub-collections (sections)
    const childFolders = allFolders.filter(
      (f) => f.parentId === currentFolderId || f.parent_id === currentFolderId
    );

    for (const child of childFolders) {
      const childFolderName = sanitizeFilename(child.name || "Untitled section");
      const childZipFolder = zipFolder.folder(childFolderName);
      await collectFolderContents(child.id, childZipFolder);
    }
  }

  // Execute recursive collection
  await collectFolderContents(collectionId, zip);

  if (totalFiles === 0) {
    toast.info(`Collection "${cleanRootName}" has no media to download.`);
    return { success: false, totalFiles: 0 };
  }

  const toastId = toast.loading(`Zipping collection "${cleanRootName}" (${totalFiles} ${totalFiles === 1 ? "file" : "files"})...`);

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
  const queryClient = useQueryClient();
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
