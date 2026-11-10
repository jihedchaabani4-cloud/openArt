// [FSD Layer: features/folders/model] — Unified 2-Layer Move Architecture.
// Layer 2: Move Logic & Resolution (determines target destination).
// Layer 1: Base Move Mutations (executes API, optimistic cache updates, rollback).
// Supports both workflows and collections/folders uniformly.

import * as React from "react";
import { useProjectFolders } from "../api/queries/useProjectFolders";
import { useMoveAssetToFolder } from "../api/mutations/useMoveAssetToFolder";
import { useUpdateFolder } from "../api/mutations/useUpdateFolder";

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
}/**
 * Returns true if targetId is the folder itself or any descendant of folderId.
 */
export function isFolderDescendant(folders, folderId, targetId) {
  if (!folderId || !targetId || !Array.isArray(folders)) return false;
  if (folderId === targetId) return true;

  let currentParentId = getParentFolderId(folders, targetId);
  while (currentParentId) {
    if (currentParentId === folderId) return true;
    currentParentId = getParentFolderId(folders, currentParentId);
  }
  return false;
}

/**
 * Pure helper to parse drag transfer data from either HTML5 DataTransfer, CustomEvent detail, or plain object.
 *
 * @param {Object} [source] - Event payload, CustomEvent detail, or DataTransfer instance
 * @param {Object} [fallbackDraggedItem] - Item from usePromptStore
 * @returns {{ itemType: "workflow"|"collection", itemId: string|null }}
 */
export function parseTransferPayload(source, fallbackDraggedItem = null) {
  if (!source && !fallbackDraggedItem) {
    return { itemType: "workflow", itemId: null };
  }

  // If source has getData (HTML5 DataTransfer)
  if (source && typeof source.getData === "function") {
    const rawType = source.getData("itemType") || fallbackDraggedItem?.type;
    const itemType = rawType === "collection" ? "collection" : "workflow";
    const itemId =
      fallbackDraggedItem?.id ||
      source.getData("itemId") ||
      source.getData("workflowId") ||
      source.getData("assetId") ||
      source.getData("collectionId") ||
      null;
    return { itemType, itemId };
  }

  // Plain object or CustomEvent detail
  const rawType = source?.itemType || fallbackDraggedItem?.type;
  const itemType = rawType === "collection" ? "collection" : "workflow";
  const itemId =
    source?.itemId ||
    source?.workflowId ||
    source?.assetId ||
    source?.collectionId ||
    fallbackDraggedItem?.id ||
    null;

  return { itemType, itemId };
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

  /**
   * Unified dispatcher for moving an item from a drag/drop payload (Move IN or Move OUT).
   */
  const executeMoveFromPayload = React.useCallback(
    async ({
      payload,
      fallbackDraggedItem = null,
      targetFolderId = null,
      currentFolderId = null,
      isMoveOut = false,
      projectId: overrideProjectId,
    }) => {
      const { itemType, itemId } = parseTransferPayload(payload, fallbackDraggedItem);
      if (!itemId) return null;

      // Prevent moving a collection into itself
      if (itemType === "collection" && targetFolderId && itemId === targetFolderId) {
        return null;
      }

      if (isMoveOut) {
        return moveItemOut({
          itemType,
          itemId,
          currentFolderId,
          projectId: overrideProjectId,
        });
      }

      return moveItem({
        itemType,
        itemId,
        targetFolderId,
        projectId: overrideProjectId,
      });
    },
    [moveItem, moveItemOut]
  );

  return {
    folders,
    moveItem,
    moveItemOut,
    executeMoveFromPayload,
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
