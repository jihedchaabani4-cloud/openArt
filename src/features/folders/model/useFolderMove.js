// [FSD Layer: features/folders/model] — Unified 2-Layer Move Architecture.
// Layer 2: Move Logic & Resolution (determines target destination).
// Layer 1: Base Move Mutations (executes API, optimistic cache updates, rollback).
// Supports both workflows and collections/folders uniformly.

import * as React from "react";
import { useProjectFolders } from "../queries/useProjectFolders";
import { useMoveAssetToFolder } from "../mutations/useMoveAssetToFolder";
import { useUpdateFolder } from "../mutations/useUpdateFolder";

/**
 * Pure helper to find the parent folder id of a given folder.
 * Returns null if the folder has no parent (it's at root), or if not found.
 *
 * @param {Array} folders - List of project folders
 * @param {string|null|undefined} folderId - ID of the folder to inspect
 * @returns {string|null} - Parent folder ID or null
 */
export function getParentFolderId(folders, folderId) {
  if (!folderId || !Array.isArray(folders) || folders.length === 0) return null;
  const current = folders.find((f) => (f.id || f.folderId || f._id) === folderId);
  if (!current) return null;
  return current.parentId || current.parent_id || null;
}

/**
 * Pure helper to resolve the destination folder when moving an item OUT.
 *
 * Rule:
 * - If currentFolderId is provided: the target is that folder's parent.
 * - If that folder is top-level (no parent): target is null (Root).
 *
 * @param {Object} params
 * @param {Array} params.folders
 * @param {string} [params.currentFolderId]
 * @param {string} [params.itemType]
 * @param {string} [params.itemId]
 * @param {Array} [params.workflows]
 * @returns {string|null} - Destination folder ID (null = Root)
 */
export function resolveMoveOutTarget({ folders = [], currentFolderId, itemType, itemId, workflows }) {
  if (currentFolderId) {
    return getParentFolderId(folders, currentFolderId);
  }

  if (itemType === "collection" && itemId && Array.isArray(folders)) {
    const itemFolder = folders.find((f) => (f.id || f.folderId || f._id) === itemId);
    const parentId = itemFolder?.parentId || itemFolder?.parent_id;
    return getParentFolderId(folders, parentId);
  }

  if (itemType === "workflow" && itemId && Array.isArray(workflows)) {
    const wf = workflows.find((w) => w.id === itemId || w.name === itemId);
    const folderId = wf?.folder_id || wf?.folderId;
    return getParentFolderId(folders, folderId);
  }

  return null;
}

/**
 * Unified hook for moving items (workflows and collections).
 * Encapsulates Layer 2 (Move logic) delegating execution to Layer 1 (Base mutations).
 *
 * @param {string} projectId - Current project ID
 */
export function useFolderMove(projectId) {
  const { data: rawFolders = [] } = useProjectFolders(projectId);
  const folders = React.useMemo(() => {
    if (Array.isArray(rawFolders)) return rawFolders;
    if (Array.isArray(rawFolders?.items)) return rawFolders.items;
    return [];
  }, [rawFolders]);

  const { mutateAsync: moveAsset, isPending: isMovingAsset } = useMoveAssetToFolder();
  const { mutateAsync: updateFolder, isPending: isUpdatingFolder } = useUpdateFolder();

  /**
   * Move an item directly into a target folder (Move IN).
   */
  const moveItem = React.useCallback(
    async ({ itemType, itemId, targetFolderId = null, projectId: overrideProjectId }) => {
      if (!itemId) throw new Error("Item ID is required to move");
      const projId = overrideProjectId || projectId;
      const normalizedFolderId = targetFolderId || null;

      if (itemType === "collection") {
        return updateFolder({
          folderId: itemId,
          patch: { parentId: normalizedFolderId },
          projectId: projId,
        });
      }

      // Default itemType: "workflow"
      return moveAsset({
        assetId: itemId,
        folderId: normalizedFolderId,
        projectId: projId,
      });
    },
    [projectId, moveAsset, updateFolder]
  );

  /**
   * Move an item OUT of its current container (Move OUT).
   * Automatically resolves parent collection or root (null).
   */
  const moveItemOut = React.useCallback(
    async ({ itemType, itemId, currentFolderId, projectId: overrideProjectId }) => {
      const destinationFolderId = resolveMoveOutTarget({
        folders,
        currentFolderId,
        itemType,
        itemId,
      });

      await moveItem({
        itemType,
        itemId,
        targetFolderId: destinationFolderId,
        projectId: overrideProjectId,
      });

      return {
        destinationFolderId,
        isRoot: destinationFolderId === null,
      };
    },
    [folders, moveItem]
  );

  return {
    folders,
    moveItem,
    moveItemOut,
    moveToFolder: moveItem,
    moveWorkflow: ({ workflowId, targetFolderId, projectId: pId }) =>
      moveItem({ itemType: "workflow", itemId: workflowId, targetFolderId, projectId: pId }),
    moveWorkflowOut: ({ workflowId, currentFolderId, projectId: pId }) =>
      moveItemOut({ itemType: "workflow", itemId: workflowId, currentFolderId, projectId: pId }),
    moveCollection: ({ collectionId, targetFolderId, projectId: pId }) =>
      moveItem({ itemType: "collection", itemId: collectionId, targetFolderId, projectId: pId }),
    moveCollectionOut: ({ collectionId, currentFolderId, projectId: pId }) =>
      moveItemOut({ itemType: "collection", itemId: collectionId, currentFolderId, projectId: pId }),
    isPending: isMovingAsset || isUpdatingFolder,
  };
}

export default useFolderMove;
