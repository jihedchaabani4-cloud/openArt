// [FSD Layer: features/workflows/model] — Bulk actions hook for Cinema Studio multi-select.
import { useState, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import JSZip from "jszip";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { downloadBlob } from "@/shared/lib/utils";
import { logger } from "@/shared/lib/logger";
import { getItemMetadata } from "@/shared/lib/generationUtils";
import { downloadMediaItem } from "@/features/media/api/lib/downloadMediaItem";
import {
  useMoveAssetToFolder,
  useUpdateFolder,
} from "@/features/folders/api/foldersApi";
import { isFolderDescendant } from "@/features/folders/model/useFolderMove";
import { useRestoreWorkflow } from "@/features/trash/api/mutations/useRestoreWorkflow";
import { useTrashDelete } from "@/features/trash/api/mutations/useTrashDelete";
import { promptBarService } from "@/features/prompt-bar";
import { useToggleWorkflowLike } from "../api/mutations/useToggleWorkflowLike";
import { useWorkspaceBulkDelete } from "../api/mutations/useWorkspaceBulkDelete";
import { resolveMainMedia } from "../core/resolveMediaRef";
import {
  areAllWorkflowMediaFailed,
  hasInFlightWorkspaceDeleteTargets,
  MEDIA_PROCESSING_DEFAULT_MESSAGE,
} from "../lib/mediaStatusHelpers";
import {
  resolveBulkActionRules,
  resolveStudioActions,
} from "../lib/studioActionRules";

const KNOWN_MEDIA_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov", "svg"]);

function cleanWorkflowId(id) {
  return String(id || "").replace(/^workflows\//, "");
}

function sanitizeFilename(name) {
  return (
    String(name || "untitled")
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim()
      .slice(0, 60) || "untitled"
  );
}

function getExtensionFromUrl(url = "", isVideo = false) {
  try {
    const clean = String(url).split("?")[0].split("#")[0];
    const dot = clean.lastIndexOf(".");
    if (dot !== -1 && clean.length - dot <= 6) {
      const ext = clean.slice(dot + 1).toLowerCase();
      if (KNOWN_MEDIA_EXTS.has(ext)) return ext;
    }
  } catch {
    // Fallback to default extension below
  }
  return isVideo ? "mp4" : "png";
}

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

function isMediaVideo(item, url = "") {
  if (!item && !url) return false;
  return Boolean(
    item?.isVideo ||
      item?.is_video ||
      item?.kind === "video" ||
      item?.type === "video" ||
      item?.asset_type === "video" ||
      item?.video ||
      /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url || "")
  );
}

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

function isWorkflowLiked(entry) {
  const wf = entry?.workflow;
  return Boolean(wf?.metadata?.favorited || wf?.favorited || wf?.is_liked);
}

function getUniqueName(usedNames, baseName, ext) {
  let finalName = ext ? `${baseName}.${ext}` : baseName;
  let counter = 1;
  while (usedNames.has(finalName)) {
    finalName = ext ? `${baseName}-${counter}.${ext}` : `${baseName}-${counter}`;
    counter += 1;
  }
  usedNames.add(finalName);
  return finalName;
}

function buildZipTimestamp() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join("-");
}

function collectWorkflowDownloadFiles(wf, fallbackMediaUrl, mediaByWorkflow) {
  const files = [];
  const seen = new Set();

  const pushItem = (item) => {
    if (!item) return;
    if (item.status === "failed" || item.status === "rejected") return;
    const url = extractMediaUrl(item);
    if (!url) return;
    const dedupeKey = item.id || item.name || url;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const isVideo = isMediaVideo(item, url);
    const wfName =
      wf?.display_name || wf?.title || wf?.name || wf?.metadata?.displayName;
    const baseName = sanitizeFilename(
      wfName ||
        item.name ||
        item.id ||
        (wf?.prompt ? wf.prompt.slice(0, 30) : null) ||
        "media"
    );
    files.push({
      url,
      isVideo,
      baseName,
      ext: getExtensionFromUrl(url, isVideo),
      id: item.id || wf?.id || null,
    });
  };

  const rawId = wf?.id || wf?.name || "";
  const cleanId = cleanWorkflowId(rawId);
  const wfItems =
    (Array.isArray(wf?.items) && wf.items.length > 0 ? wf.items : null) ||
    (Array.isArray(wf?.media) && wf.media.length > 0 ? wf.media : null) ||
    (Array.isArray(wf?.media_items) && wf.media_items.length > 0 ? wf.media_items : null) ||
    mediaByWorkflow[rawId] ||
    mediaByWorkflow[cleanId] ||
    [];

  if (wfItems.length > 0) {
    for (const item of wfItems) pushItem(item);
  } else if (wf?.primary_media) {
    pushItem(wf.primary_media);
  } else {
    const resolved = wf ? resolveMainMedia(wf) : null;
    const singleUrl = resolved?.url || extractMediaUrl(wf) || fallbackMediaUrl || null;
    if (singleUrl) {
      pushItem({
        id: resolved?.id || wf?.id || null,
        url: singleUrl,
        isVideo: resolved?.kind === "video" || isMediaVideo(wf, singleUrl),
      });
    }
  }

  return files;
}

function readCachedProjectContext(queryClient, projectId) {
  if (!queryClient || !projectId) {
    return { workflows: [], media: [], folders: [], mediaByWorkflow: {} };
  }

  const cachedProject = queryClient.getQueryData(queryKeys.projectData.byProject(projectId));
  const projectContents = cachedProject?.projectContents || {};

  const cachedFoldersQuery = queryClient.getQueryData(queryKeys.folders.byProject(projectId));
  let folders = [];
  if (Array.isArray(cachedFoldersQuery)) {
    folders = cachedFoldersQuery;
  } else if (Array.isArray(cachedFoldersQuery?.items)) {
    folders = cachedFoldersQuery.items;
  } else if (Array.isArray(projectContents.collections)) {
    folders = projectContents.collections;
  } else if (Array.isArray(projectContents.folders)) {
    folders = projectContents.folders;
  }

  const workflows = Array.isArray(projectContents.workflows) ? projectContents.workflows : [];
  const media = Array.isArray(projectContents.media) ? projectContents.media : [];

  const mediaByWorkflow = {};
  for (const m of media) {
    const wfId = m?.workflowId || m?.workflow_id || m?.workflowName;
    if (!wfId) continue;
    const strId = String(wfId);
    (mediaByWorkflow[strId] ??= []).push(m);
    const cleaned = cleanWorkflowId(strId);
    if (cleaned !== strId) {
      (mediaByWorkflow[cleaned] ??= []).push(m);
    }
  }

  return { workflows, media, folders, mediaByWorkflow };
}

/**
 * Classify selected studio entries into the 4 arrays accepted by POST /workspace/bulk-delete.
 * Workflow-backed characters and elements stay in `workflow_ids`; only orphan records
 * (`workflow_id === null` / explicit `itemType`) go into `character_ids` or `element_ids`.
 */
export function classifyWorkspaceDeleteEntries(selectedEntries = [], scope = "assets") {
  const folder_ids = [];
  const workflow_ids = [];
  const character_ids = [];
  const element_ids = [];

  for (const entry of selectedEntries) {
    if (!entry) continue;

    if (entry.itemType === "collection") {
      if (entry.id) folder_ids.push(String(entry.id));
      continue;
    }

    if (entry.itemType === "character") {
      const charId = entry.character?.id || entry.id;
      if (charId) character_ids.push(String(charId));
      continue;
    }

    if (entry.itemType === "element") {
      const elemId = entry.element?.id || entry.id;
      if (elemId) element_ids.push(String(elemId));
      continue;
    }

    if (entry.itemType === "workflow") {
      const wf = entry.workflow;
      const isOrphan = Boolean(
        wf &&
          (("workflow_id" in wf && wf.workflow_id === null) ||
            ("workflowId" in wf && wf.workflowId === null) ||
            wf.isOrphan === true)
      );

      if (isOrphan) {
        const isChar =
          wf.category === "character" ||
          wf.type === "character" ||
          scope === "characters" ||
          Boolean(wf.character_info || wf.character);
        const isElem =
          wf.category === "element" ||
          wf.type === "element" ||
          scope === "elements" ||
          Boolean(wf.element_type || wf.element);

        if (isChar) {
          const charId = wf.character?.id || wf.id || entry.id;
          if (charId) character_ids.push(String(charId));
          continue;
        }
        if (isElem) {
          const elemId = wf.element?.id || wf.id || entry.id;
          if (elemId) element_ids.push(String(elemId));
          continue;
        }
      }

      const wfId = cleanWorkflowId(entry.id);
      if (wfId) workflow_ids.push(wfId);
    }
  }

  return { folder_ids, workflow_ids, character_ids, element_ids };
}

/**
 * Bulk actions controller for Cinema Studio multi-select.
 *
 * @param {Object} params
 * @param {string|null} params.projectId
 * @param {"assets"|"collection"|"elements"|"characters"|"trash"} params.scope
 * @param {Array<{ key: string, itemType: "workflow"|"collection"|"character"|"element", id: string, workflow?: Object, collection?: Object, thumbUrl?: string|null, mediaUrl?: string|null }>} [params.selectedEntries]
 * @param {Function} [params.clearSelection]
 * @param {string|null} [params.currentFolderId]
 * @param {(deletedFolderIds: string[]) => void} [params.onNavigateUp]
 * @param {boolean} [params.allTrashSelected]
 */
export function useStudioBulkActions({
  projectId,
  scope,
  selectedEntries = [],
  clearSelection,
  currentFolderId = null,
  onNavigateUp,
  allTrashSelected = false,
} = {}) {
  const queryClient = useQueryClient();
  const [busyAction, setBusyAction] = useState(null);

  const { mutateAsync: toggleWorkflowLike } = useToggleWorkflowLike();
  const { mutateAsync: workspaceBulkDelete } = useWorkspaceBulkDelete();
  const { mutateAsync: trashDelete } = useTrashDelete();
  const { mutateAsync: moveAssetToFolder } = useMoveAssetToFolder();
  const { mutateAsync: updateFolder } = useUpdateFolder();
  const { mutateAsync: restoreWorkflow } = useRestoreWorkflow();

  const workflowEntries = useMemo(
    () => selectedEntries.filter((e) => e?.itemType === "workflow"),
    [selectedEntries]
  );
  const collectionEntries = useMemo(
    () => selectedEntries.filter((e) => e?.itemType === "collection"),
    [selectedEntries]
  );

  const workflowCount = workflowEntries.length;
  const collectionCount = collectionEntries.length;
  const hasWorkflows = workflowCount > 0;
  const hasCollections = collectionCount > 0;
  const {
    actionableWorkflowEntries,
    hasActionableWorkflows,
    canDownload,
    canMove,
    canLike,
    canAddToPrompt,
  } = useMemo(
    () =>
      resolveBulkActionRules({
        scope,
        workflowEntries,
        collectionEntries,
      }),
    [scope, workflowEntries, collectionEntries]
  );
  const isAllLiked =
    hasActionableWorkflows && actionableWorkflowEntries.every(isWorkflowLiked);
  const needsDeleteConfirm = true;

  const bulkDownload = useCallback(async () => {
    if (!canDownload || busyAction) return;
    setBusyAction("download");

    try {
      const { workflows: cachedWorkflows, media: cachedMedia, folders: cachedFolders, mediaByWorkflow } =
        readCachedProjectContext(queryClient, projectId);

      // Fast path: 1 actionable workflow with a single media URL -> direct download
      if (actionableWorkflowEntries.length === 1 && collectionEntries.length === 0) {
        const entry = actionableWorkflowEntries[0];
        const files = collectWorkflowDownloadFiles(
          entry.workflow || { id: entry.id },
          entry.mediaUrl,
          mediaByWorkflow
        );

        if (files.length === 0) {
          toast.info("No downloadable media in selected item.");
          return;
        }

        if (files.length === 1) {
          const file = files[0];
          const filename = `${file.baseName}.${file.ext}`;
          await downloadMediaItem(file.url, filename);
          toast.success(`Downloaded "${filename}"`);
          return;
        }
      }

      // Multi-item or collection selection -> client-side ZIP
      const zip = new JSZip();
      const rootUsedNames = new Set();
      let totalFiles = 0;

      const writeFilesToZipFolder = async (files, targetZipFolder, usedNames) => {
        for (const file of files) {
          try {
            const blob = await api.getBlob(file.url);
            const finalName = getUniqueName(usedNames, file.baseName, file.ext);
            targetZipFolder.file(finalName, blob);
            totalFiles += 1;
          } catch (err) {
            logger.warn("bulk_download_media_failed", {
              mediaId: file.id || "unknown",
              error: err?.message,
            });
          }
        }
      };

      const toastId = toast.loading("Preparing download archive...");

      try {
        // 1. Selected standalone actionable workflows at archive root
        for (const entry of actionableWorkflowEntries) {
          const wf = entry.workflow || { id: entry.id };
          const files = collectWorkflowDownloadFiles(wf, entry.mediaUrl, mediaByWorkflow);
          await writeFilesToZipFolder(files, zip, rootUsedNames);
        }

        // 2. Selected collections recursively
        const visitedFolders = new Set();
        const collectFolderRecursive = async (folderId, zipFolder) => {
          const folderKey = String(folderId);
          if (visitedFolders.has(folderKey)) return;
          visitedFolders.add(folderKey);

          const usedNames = new Set();
          const folderWorkflows = cachedWorkflows.filter((w) => isItemInFolder(w, folderKey));
          const files = [];
          const seenUrls = new Set();

          for (const wf of folderWorkflows) {
            for (const f of collectWorkflowDownloadFiles(wf, null, mediaByWorkflow)) {
              if (!seenUrls.has(f.url)) {
                seenUrls.add(f.url);
                files.push(f);
              }
            }
          }

          for (const m of cachedMedia) {
            if (!isItemInFolder(m, folderKey)) continue;
            const url = extractMediaUrl(m);
            if (!url || seenUrls.has(url)) continue;
            seenUrls.add(url);
            const isVideo = isMediaVideo(m, url);
            files.push({
              url,
              isVideo,
              baseName: sanitizeFilename(m.name || m.id || "media"),
              ext: getExtensionFromUrl(url, isVideo),
              id: m.id || null,
            });
          }

          await writeFilesToZipFolder(files, zipFolder, usedNames);

          const childFolders = cachedFolders.filter((f) => {
            const parentId = f.parentId ?? f.parent_id;
            return parentId != null && String(parentId) === folderKey;
          });
          for (const child of childFolders) {
            const childName = getUniqueName(
              usedNames,
              sanitizeFilename(child.name || child.display_name || "Untitled section"),
              null
            );
            await collectFolderRecursive(child.id, zipFolder.folder(childName));
          }
        };

        for (const entry of collectionEntries) {
          const col = entry.collection || cachedFolders.find((f) => String(f.id) === String(entry.id));
          const colName = getUniqueName(
            rootUsedNames,
            sanitizeFilename(col?.name || col?.display_name || "Untitled collection"),
            null
          );
          await collectFolderRecursive(entry.id, zip.folder(colName));
        }

        if (totalFiles === 0) {
          toast.info("No downloadable media found in selection.", { id: toastId });
          return;
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFilename =
          collectionEntries.length === 1 && actionableWorkflowEntries.length === 0
            ? `${sanitizeFilename(collectionEntries[0].collection?.name || "collection")}.zip`
            : `studio-selection-${buildZipTimestamp()}.zip`;

        downloadBlob(zipBlob, zipFilename);
        toast.success(`Downloaded "${zipFilename}" (${totalFiles} ${totalFiles === 1 ? "file" : "files"})`, {
          id: toastId,
        });
      } catch (err) {
        logger.error("bulk_download_zip_failed", { error: err?.message });
        toast.error("Failed to prepare download archive.", { id: toastId });
      }
    } finally {
      setBusyAction(null);
    }
  }, [actionableWorkflowEntries, busyAction, canDownload, collectionEntries, projectId, queryClient]);

  const bulkToggleLike = useCallback(async () => {
    if (!canLike || busyAction) return;
    const workflowIds = actionableWorkflowEntries.map((e) => cleanWorkflowId(e.id)).filter(Boolean);
    if (workflowIds.length === 0) return;

    const nextFavorited = !isAllLiked;
    setBusyAction("like");
    try {
      await toggleWorkflowLike({
        workflowIds,
        favorited: nextFavorited,
        projectId,
      });
      const label = workflowIds.length === 1 ? "item" : "items";
      toast.success(
        nextFavorited
          ? `Added ${workflowIds.length} ${label} to favorites`
          : `Removed ${workflowIds.length} ${label} from favorites`
      );
    } catch {
      // Error toast is already surfaced by useOptimisticMutation
    } finally {
      setBusyAction(null);
    }
  }, [actionableWorkflowEntries, busyAction, canLike, isAllLiked, projectId, toggleWorkflowLike]);

  const bulkMoveToFolder = useCallback(
    async (targetFolderId = null) => {
      if (!canMove || busyAction) return;
      const normalizedTargetId = targetFolderId || null;
      const { folders: cachedFolders } = readCachedProjectContext(queryClient, projectId);

      const tasks = [];

      for (const entry of actionableWorkflowEntries) {
        const assetId = cleanWorkflowId(entry.id);
        if (!assetId) continue;
        tasks.push(
          moveAssetToFolder({
            assetId,
            folderId: normalizedTargetId,
            projectId,
          })
        );
      }

      for (const entry of collectionEntries) {
        const folderId = entry.id;
        if (!folderId) continue;
        // Skip moving a folder into itself or one of its own descendants
        if (
          normalizedTargetId &&
          (String(folderId) === String(normalizedTargetId) ||
            isFolderDescendant(cachedFolders, folderId, normalizedTargetId))
        ) {
          continue;
        }
        tasks.push(
          updateFolder({
            folderId,
            patch: { parentId: normalizedTargetId },
            projectId,
          })
        );
      }

      if (tasks.length === 0) {
        toast.info("Nothing to move.");
        return;
      }

      setBusyAction("move");
      try {
        const results = await Promise.allSettled(tasks);
        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.length - succeeded;

        if (failed === 0) {
          toast.success(`Moved ${succeeded} ${succeeded === 1 ? "item" : "items"}`);
          clearSelection?.();
        } else if (succeeded > 0) {
          toast.warning(`Moved ${succeeded} ${succeeded === 1 ? "item" : "items"}; ${failed} failed`);
          clearSelection?.();
        }
      } finally {
        setBusyAction(null);
      }
    },
    [
      actionableWorkflowEntries,
      busyAction,
      canMove,
      clearSelection,
      collectionEntries,
      moveAssetToFolder,
      projectId,
      queryClient,
      updateFolder,
    ]
  );

  const bulkDelete = useCallback(async () => {
    if (selectedEntries.length === 0 || busyAction) return;
    setBusyAction("delete");

    try {
      if (scope === "trash") {
        const workflowIds = workflowEntries.map((e) => cleanWorkflowId(e.id)).filter(Boolean);
        if (workflowIds.length === 0 && !allTrashSelected) return;

        try {
          const useEmptyAll = allTrashSelected && workflowIds.length > 100;
          const result = useEmptyAll
            ? await trashDelete({ projectId, all: true })
            : await trashDelete({ projectId, workflowIds });

          const deletedCount =
            typeof result?.count === "number"
              ? result.count
              : result?.deleted_workflow_ids?.length || workflowIds.length;

          toast.success(
            `Permanently deleted ${deletedCount} ${deletedCount === 1 ? "item" : "items"}`
          );
          clearSelection?.();
        } catch {
          // Error toast is already surfaced by useTrashDelete
        }
        return;
      }

      const { folder_ids, workflow_ids, character_ids, element_ids } =
        classifyWorkspaceDeleteEntries(selectedEntries, scope);

      if (
        folder_ids.length === 0 &&
        workflow_ids.length === 0 &&
        character_ids.length === 0 &&
        element_ids.length === 0
      ) {
        return;
      }

      const cachedProject = projectId
        ? queryClient.getQueryData(queryKeys.projectData.byProject(projectId))
        : null;
      const { folders: cachedFolders, mediaByWorkflow } = readCachedProjectContext(
        queryClient,
        projectId
      );

      if (
        hasInFlightWorkspaceDeleteTargets({
          selectedEntries,
          workflowIds: workflow_ids,
          folderIds: folder_ids,
          projectData: cachedProject,
          folders: cachedFolders,
        })
      ) {
        toast.error(MEDIA_PROCESSING_DEFAULT_MESSAGE);
        return;
      }

      try {
        const result = await workspaceBulkDelete({
          projectId,
          folder_ids,
          workflow_ids,
          character_ids,
          element_ids,
        });

        const deletedFolderIds = result?.deleted_folder_ids || [];
        if (
          currentFolderId &&
          deletedFolderIds.some((id) => String(id) === String(currentFolderId))
        ) {
          onNavigateUp?.(deletedFolderIds);
        }

        const deletedFolderCount = deletedFolderIds.length;
        const trashedCount = (result?.trashed_workflow_ids || []).length;
        const deletedWfCount = (result?.deleted_workflow_ids || []).length;
        const orphanCount =
          (result?.deleted_orphan_character_ids || []).length +
          (result?.deleted_orphan_element_ids || []).length;
        const allSelectedFailedOnly =
          workflowEntries.length > 0 &&
          collectionEntries.length === 0 &&
          workflowEntries.every((e) => {
            const cleanId = cleanWorkflowId(e.id || e.workflow?.id || e.workflow?.name);
            return areAllWorkflowMediaFailed(e.workflow, mediaByWorkflow[cleanId]);
          });

        if (
          deletedFolderCount === 0 &&
          trashedCount === 0 &&
          orphanCount === 0 &&
          (deletedWfCount > 0 || allSelectedFailedOnly)
        ) {
          toast.success("Deleted permanently");
        } else if (deletedFolderCount > 0 && trashedCount > 0) {
          toast.success(
            `Deleted ${deletedFolderCount} ${deletedFolderCount === 1 ? "folder" : "folders"} and moved ${trashedCount} ${trashedCount === 1 ? "item" : "items"} to Trash`
          );
        } else if (deletedFolderCount > 0 && (orphanCount > 0 || deletedWfCount > 0)) {
          const permCount = orphanCount + deletedWfCount;
          toast.success(
            `Deleted ${deletedFolderCount} ${deletedFolderCount === 1 ? "folder" : "folders"} and ${permCount} ${permCount === 1 ? "item" : "items"}`
          );
        } else if (deletedFolderCount > 0) {
          toast.success(
            `Deleted ${deletedFolderCount} ${deletedFolderCount === 1 ? "folder" : "folders"}`
          );
        } else if (trashedCount > 0 && deletedWfCount > 0) {
          toast.success(
            `Moved to Trash and deleted ${deletedWfCount} ${deletedWfCount === 1 ? "item" : "items"} permanently`
          );
        } else if (trashedCount > 0) {
          toast.success("Moved to Trash");
        } else if (orphanCount > 0) {
          toast.success(`Deleted ${orphanCount} ${orphanCount === 1 ? "item" : "items"}`);
        } else if ((result?.already_trashed_workflow_ids || []).length > 0) {
          toast.info("Selected items are already in Trash");
        }

        clearSelection?.();
      } catch {
        // Error toast is already surfaced by useWorkspaceBulkDelete
      }
    } finally {
      setBusyAction(null);
    }
  }, [
    allTrashSelected,
    busyAction,
    clearSelection,
    collectionEntries,
    currentFolderId,
    onNavigateUp,
    projectId,
    queryClient,
    scope,
    selectedEntries,
    trashDelete,
    workflowEntries,
    workspaceBulkDelete,
  ]);

  const bulkRestore = useCallback(async () => {
    if (scope !== "trash" || workflowEntries.length === 0 || busyAction) return;
    setBusyAction("restore");

    try {
      const results = await Promise.allSettled(
        workflowEntries.map((entry) =>
          restoreWorkflow({
            workflowId: cleanWorkflowId(entry.id),
            projectId,
          })
        )
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;

      if (failed === 0) {
        toast.success(`Restored ${succeeded} ${succeeded === 1 ? "item" : "items"}`);
        clearSelection?.();
      } else if (succeeded > 0) {
        toast.warning(`Restored ${succeeded} ${succeeded === 1 ? "item" : "items"}; ${failed} failed`);
        clearSelection?.();
      } else {
        toast.error("Failed to restore selected items.");
      }
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, clearSelection, projectId, restoreWorkflow, scope, workflowEntries]);

  const bulkAddToPrompt = useCallback(() => {
    if (!canAddToPrompt || busyAction) return;
    setBusyAction("prompt");

    try {
      const service = promptBarService({
        templateId: "generated-media",
        projectId: projectId || "global",
      });

      let addedCount = 0;
      let skippedCount = 0;
      let limitReached = false;
      let anyMountedSuccess = false;

      for (const entry of workflowEntries) {
        const wf = entry.workflow;
        const resolved = wf ? resolveMainMedia(wf) : null;
        const targetItem = resolved ? resolved.raw || resolved : null;
        const meta = targetItem
          ? getItemMetadata(targetItem, wf)
          : {
              status: wf?.status || (entry.mediaUrl ? "completed" : "processing"),
              url: entry.mediaUrl || null,
              isVideo: isMediaVideo(wf, entry.mediaUrl),
            };

        const url = meta?.url || resolved?.url || entry.mediaUrl || null;
        const isVideo = Boolean(
          meta?.isVideo || resolved?.kind === "video" || isMediaVideo(targetItem || wf, url)
        );
        const status =
          meta?.status ||
          (resolved?.status === "ready" ? "completed" : resolved?.status) ||
          wf?.status;
        const entryRules = resolveStudioActions({
          workflow: wf,
          item: targetItem,
          status,
          isVideo,
          hasUrl: Boolean(url),
        });

        if (!entryRules.can.addToPrompt) {
          skippedCount += 1;
          continue;
        }

        const rawMedia = targetItem || wf || { id: entry.id };
        const promptMedia =
          wf && rawMedia !== wf
            ? {
                ...rawMedia,
                url: rawMedia.url || url,
                preview: rawMedia.preview || rawMedia.url || url,
                workflow_type: rawMedia.workflow_type || wf.workflow_type,
                workflow_id:
                  rawMedia.workflow_id || rawMedia.workflowId || wf.id || wf.name || entry.id,
                displayName:
                  rawMedia.displayName || wf.metadata?.displayName || wf.display_name,
              }
            : {
                ...rawMedia,
                url: rawMedia.url || url,
                preview: rawMedia.preview || rawMedia.url || url,
                workflow_id: rawMedia.workflow_id || rawMedia.workflowId || entry.id,
              };

        const res = service.addReference(promptMedia);
        if (res?.ok) {
          addedCount += 1;
          anyMountedSuccess = true;
        } else if (res?.reason === "NOT_MOUNTED") {
          addedCount += 1;
        } else if (res?.reason === "MAX_MEDIA_REACHED") {
          limitReached = true;
          break;
        } else {
          skippedCount += 1;
        }
      }

      if (addedCount > 0) {
        if (anyMountedSuccess) {
          service.focus();
        }
        const label = addedCount === 1 ? "item" : "items";
        if (limitReached) {
          toast.info(`Added ${addedCount} ${label} to prompt (reference limit reached)`);
        } else if (skippedCount > 0) {
          toast.success(`Added ${addedCount} ${label} to prompt (${skippedCount} skipped)`);
        } else {
          toast.success(`Added ${addedCount} ${label} to prompt`);
        }
        clearSelection?.();
      } else if (limitReached) {
        toast.info("Prompt reference limit reached.");
      } else {
        toast.info("No eligible images to add to prompt.");
      }
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, canAddToPrompt, clearSelection, projectId, workflowEntries]);

  return {
    busyAction,
    hasCollections,
    hasWorkflows,
    workflowCount,
    collectionCount,
    canDownload,
    canMove,
    canLike,
    canAddToPrompt,
    isAllLiked,
    needsDeleteConfirm,
    bulkDownload,
    bulkToggleLike,
    bulkMoveToFolder,
    bulkDelete,
    bulkRestore,
    bulkAddToPrompt,
  };
}

export default useStudioBulkActions;
