// [FSD Layer: features/studio/model] — Centralized drop executor for single & multi-item studio drag-to-folder.
"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/shared/api/queryKeys";
import { useMoveAssetToFolder } from "@/features/folders/api/mutations/useMoveAssetToFolder";
import { useUpdateFolder } from "@/features/folders/api/mutations/useUpdateFolder";
import { getParentFolderId, isFolderDescendant } from "@/features/folders/model/useFolderMove";
import { useWorkspaceBulkDelete } from "@/features/workflows/api/mutations/useWorkspaceBulkDelete";
import { useWorkflowUiStore } from "@/features/workflows/model/useWorkflowUiStore";
import {
  useStudioSelectionStore,
  makeSelectionKey,
  hasSelectedKey,
} from "@/features/workflows/model/useStudioSelectionStore";
import { stripWorkflowPrefix } from "@/features/workflows/lib/cacheHelpers";
import {
  hasInFlightMedia,
  hasInFlightWorkspaceDeleteTargets,
  MEDIA_PROCESSING_DEFAULT_MESSAGE,
} from "@/features/workflows/lib/mediaStatusHelpers";

function readCachedFolders(queryClient, projectId) {
  if (!queryClient || !projectId) return [];

  const cachedFolders = queryClient.getQueryData(queryKeys.folders.byProject(projectId));
  if (Array.isArray(cachedFolders)) return cachedFolders;
  if (Array.isArray(cachedFolders?.items)) return cachedFolders.items;

  const cachedProject = queryClient.getQueryData(queryKeys.projectData.byProject(projectId));
  const projectContents = cachedProject?.projectContents || {};
  if (Array.isArray(projectContents.collections)) return projectContents.collections;
  if (Array.isArray(projectContents.folders)) return projectContents.folders;
  return [];
}

/**
 * Normalizes and deduplicates drop event payload items into `{ itemType, id }[]`.
 *
 * @param {Object|null|undefined} detail - CustomEvent detail payload
 * @returns {Array<{ itemType: "workflow"|"collection", id: string }>}
 */
export function resolveDropItems(detail) {
  if (!detail || typeof detail !== "object") return [];

  let rawItems = [];
  if (Array.isArray(detail.items) && detail.items.length > 0) {
    rawItems = detail.items;
  } else {
    const id = detail.itemId || detail.workflowId || detail.assetId || detail.collectionId;
    if (id) {
      const rawType =
        detail.itemType ||
        (detail.collectionId && !detail.workflowId && !detail.assetId ? "collection" : "workflow");
      rawItems = [{ itemType: rawType, id }];
    }
  }

  const seen = new Set();
  const resolved = [];
  for (const entry of rawItems) {
    if (!entry || entry.id == null || entry.id === "") continue;
    const itemType = entry.itemType === "collection" ? "collection" : "workflow";
    const rawId = String(entry.id);
    const id = itemType === "workflow" ? stripWorkflowPrefix(rawId) : rawId;
    if (!id) continue;
    const key = `${itemType}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    resolved.push({ itemType, id });
  }
  return resolved;
}

function isAnyItemSelected(selectionState, items) {
  if (!selectionState || selectionState.selectedKeys.length === 0) return false;
  return items.some(({ itemType, id }) => {
    if (hasSelectedKey(selectionState, makeSelectionKey(itemType, id))) return true;
    if (itemType === "workflow") {
      return hasSelectedKey(selectionState, makeSelectionKey("workflow", `workflows/${id}`));
    }
    return false;
  });
}

/**
 * Mounted ONCE in StudioLayout. Listens to window drop events
 * (`studio:drop-to-collection`, `studio:drop-to-project-root`, `studio:drop-to-back`),
 * executes single or multi-item moves safely, invalidates project caches once,
 * displays one summary toast, and clears multi-selection when applicable.
 *
 * @param {string|null|undefined} projectId
 */
export function useStudioDropExecutor(projectId) {
  const queryClient = useQueryClient();
  const { mutateAsync: moveAsset } = useMoveAssetToFolder();
  const { mutateAsync: updateFolder } = useUpdateFolder();
  const { mutateAsync: bulkDelete } = useWorkspaceBulkDelete();

  const moveAssetRef = useRef(moveAsset);
  moveAssetRef.current = moveAsset;
  const updateFolderRef = useRef(updateFolder);
  updateFolderRef.current = updateFolder;
  const bulkDeleteRef = useRef(bulkDelete);
  bulkDeleteRef.current = bulkDelete;

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return undefined;

    const executeDrop = async (detail, targetFolderId) => {
      const items = resolveDropItems(detail);
      if (items.length === 0) return;

      const normalizedTargetId = targetFolderId || null;
      const folders = readCachedFolders(queryClient, projectId);
      const selectionState = useStudioSelectionStore.getState();
      const shouldClearSelection =
        items.length > 1 || isAnyItemSelected(selectionState, items);

      const tasks = [];
      for (const item of items) {
        if (item.itemType === "collection") {
          if (
            normalizedTargetId &&
            (String(item.id) === String(normalizedTargetId) ||
              isFolderDescendant(folders, item.id, normalizedTargetId))
          ) {
            continue;
          }
          tasks.push(
            updateFolderRef.current({
              folderId: item.id,
              patch: { parentId: normalizedTargetId },
              projectId,
            })
          );
        } else {
          tasks.push(
            moveAssetRef.current({
              assetId: item.id,
              folderId: normalizedTargetId,
              projectId,
            })
          );
        }
      }

      if (tasks.length === 0) return;

      const results = await Promise.allSettled(tasks);
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;

      if (succeeded > 0 && shouldClearSelection) {
        useStudioSelectionStore.getState().clearSelection();
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(projectId) }),
      ]);

      if (failed === 0) {
        const targetFolder = normalizedTargetId
          ? folders.find((f) => String(f.id || f.folderId || f._id) === String(normalizedTargetId))
          : null;
        const destination = targetFolder?.name
          ? ` to "${targetFolder.name}"`
          : normalizedTargetId === null
            ? " to All assets"
            : "";
        toast.success(`Moved ${succeeded} ${succeeded === 1 ? "item" : "items"}${destination}`);
      } else if (succeeded > 0) {
        toast.warning(`Moved ${succeeded} ${succeeded === 1 ? "item" : "items"}; ${failed} failed`);
      } else {
        toast.error(`Failed to move ${failed === 1 ? "item" : `${failed} items`}.`);
      }
    };

    const onDropToCollection = (e) => {
      const targetFolderId = e.detail?.targetFolderId;
      if (!targetFolderId) return;
      executeDrop(e.detail, targetFolderId);
    };

    const onDropToProjectRoot = (e) => {
      executeDrop(e.detail, null);
    };

    const onDropToBack = (e) => {
      const folders = readCachedFolders(queryClient, projectId);
      const currentFolderId =
        e.detail?.currentFolderId ?? useWorkflowUiStore.getState().activeCollectionId;
      const parentFolderId = getParentFolderId(folders, currentFolderId);
      executeDrop(e.detail, parentFolderId);
    };

    const onDropToTrash = async (e) => {
      if (useWorkflowUiStore.getState().activeStudioTab === "trash") return;
      const items = resolveDropItems(e.detail);
      if (items.length === 0) return;

      const workflow_ids = [];
      const folder_ids = [];
      for (const item of items) {
        if (item.itemType === "collection") {
          folder_ids.push(item.id);
        } else {
          workflow_ids.push(item.id);
        }
      }
      if (workflow_ids.length === 0 && folder_ids.length === 0) return;

      const cachedProject = queryClient.getQueryData(
        queryKeys.projectData.byProject(projectId)
      );
      const folders = readCachedFolders(queryClient, projectId);
      const explicitWorkflow = e.detail?.workflow || e.detail?.item || null;

      if (
        hasInFlightMedia(explicitWorkflow) ||
        hasInFlightWorkspaceDeleteTargets({
          workflowIds: workflow_ids,
          folderIds: folder_ids,
          projectData: cachedProject,
          folders,
        })
      ) {
        toast.error(MEDIA_PROCESSING_DEFAULT_MESSAGE);
        return;
      }

      const selectionState = useStudioSelectionStore.getState();
      const shouldClearSelection =
        items.length > 1 || isAnyItemSelected(selectionState, items);

      try {
        const result = await bulkDeleteRef.current({
          projectId,
          workflow_ids,
          folder_ids,
        });
        if (shouldClearSelection) {
          useStudioSelectionStore.getState().clearSelection();
        }
        const trashedCount = (result?.trashed_workflow_ids || []).length;
        const deletedWfCount = (result?.deleted_workflow_ids || []).length;
        const deletedFolderCount = (result?.deleted_folder_ids || []).length;
        if (deletedWfCount > 0 && trashedCount === 0 && deletedFolderCount === 0) {
          toast.success("Deleted permanently");
        } else {
          const total = workflow_ids.length + folder_ids.length;
          toast.success(`Moved ${total} ${total === 1 ? "item" : "items"} to Trash`);
        }
      } catch {
        // Error toast & cache re-sync already handled by useWorkspaceBulkDelete.onError
      }
    };

    window.addEventListener("studio:drop-to-collection", onDropToCollection);
    window.addEventListener("studio:drop-to-project-root", onDropToProjectRoot);
    window.addEventListener("studio:drop-to-back", onDropToBack);
    window.addEventListener("studio:drop-to-trash", onDropToTrash);

    return () => {
      window.removeEventListener("studio:drop-to-collection", onDropToCollection);
      window.removeEventListener("studio:drop-to-project-root", onDropToProjectRoot);
      window.removeEventListener("studio:drop-to-back", onDropToBack);
      window.removeEventListener("studio:drop-to-trash", onDropToTrash);
    };
  }, [projectId, queryClient]);
}

export default useStudioDropExecutor;
