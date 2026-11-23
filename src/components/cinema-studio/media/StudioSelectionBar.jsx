"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/base/dropdown-menu";
import { MenuItemContent } from "@/components/base/menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/dialog";
import { ConfirmDeleteDialog } from "@/components/primitives/ConfirmDeleteDialog";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { useProjectFolders } from "@/features/folders/api/queries/useProjectFolders";
import { isFolderDescendant } from "@/features/folders/model/useFolderMove";
import { useWorkflowUiStore } from "@/features/workflows/model/useWorkflowUiStore";
import {
  useStudioSelectionStore,
  makeSelectionKey,
} from "@/features/workflows/model/useStudioSelectionStore";
import { useStudioBulkActions } from "@/features/workflows/model/useStudioBulkActions";
import { registerBulkMenuProvider } from "@/features/workflows/model/studioBulkMenuBridge";
import { resolveMediaUrl } from "@/features/workflows/core/toMediaItem";
import { resolveCachedWorkflowMediaItem } from "./SharedGalleryGrid";

const EMPTY_FOLDERS = [];
const DEPTH_PADDING_CLASSES = ["pl-2.5", "pl-6", "pl-10", "pl-14", "pl-16"];

function getFlatFolders(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  return EMPTY_FOLDERS;
}

function resolveSurvivingAncestorRoute(
  projectId,
  currentFolderId,
  deletedFolderIds,
  allFolders,
  parentFallbackMap
) {
  if (!projectId) return null;
  const rootRoute = `/cinema-studio/${projectId}/assets`;
  if (!currentFolderId) return rootRoute;

  const deletedSet = new Set(
    (Array.isArray(deletedFolderIds) ? deletedFolderIds : []).map(String)
  );
  const byId = new Map();
  for (const folder of allFolders) {
    if (folder?.id != null) {
      byId.set(String(folder.id), folder);
    }
  }

  const visited = new Set();
  let cursor = String(currentFolderId);

  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const node = byId.get(cursor);
    const parentId = node
      ? node.parentId ?? node.parent_id ?? null
      : parentFallbackMap?.get(cursor) ?? null;

    if (!parentId) return rootRoute;

    const nextId = String(parentId);
    if (!deletedSet.has(nextId) && (byId.size === 0 || byId.has(nextId))) {
      return `/cinema-studio/${projectId}/collection/${nextId}`;
    }
    cursor = nextId;
  }

  return rootRoute;
}

function buildFlattenedFolderTree(folders) {
  const byId = new Map();
  const roots = [];

  for (const folder of folders) {
    if (!folder?.id) continue;
    byId.set(folder.id, { ...folder, children: [] });
  }

  for (const folder of folders) {
    if (!folder?.id) continue;
    const node = byId.get(folder.id);
    const parentId = folder.parentId || folder.parent_id || null;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const ordered = [];
  const visit = (nodes, depth) => {
    for (const node of nodes) {
      ordered.push({ node, depth });
      if (node.children.length > 0) {
        visit(node.children, depth + 1);
      }
    }
  };
  visit(roots, 0);
  return ordered;
}

function resolveSelectableEntries(entries, workflows, showFolders = true) {
  const list = [];

  if (Array.isArray(entries)) {
    for (const entry of entries) {
      if (!entry) continue;
      if (entry.type === "collection") {
        if (!showFolders) continue;
        const col = entry.data;
        const id = col?.id || col?.folder_id || col?.folderId;
        if (!id) continue;
        list.push({
          key: makeSelectionKey("collection", id),
          itemType: "collection",
          id,
          collection: col,
          thumbUrl: entry.coverUrl || col?.coverUrl || null,
          mediaUrl: null,
          isVideo: false,
        });
        continue;
      }

      const wf = entry.type === "workflow" ? entry.data : entry;
      const id = wf?.id || wf?.name;
      if (!id) continue;
      const mediaItem = resolveCachedWorkflowMediaItem(wf);
      const mediaUrl = mediaItem?.url || resolveMediaUrl(wf) || null;
      const thumbUrl = mediaItem?.thumbUrl || mediaUrl;
      list.push({
        key: makeSelectionKey("workflow", id),
        itemType: "workflow",
        id,
        workflow: wf,
        thumbUrl,
        mediaUrl,
        isVideo: mediaItem?.kind === "video",
      });
    }
    return list;
  }

  if (Array.isArray(workflows)) {
    for (const wf of workflows) {
      const id = wf?.id || wf?.name;
      if (!id) continue;
      const mediaItem = resolveCachedWorkflowMediaItem(wf);
      const mediaUrl = mediaItem?.url || resolveMediaUrl(wf) || null;
      const thumbUrl = mediaItem?.thumbUrl || mediaUrl;
      list.push({
        key: makeSelectionKey("workflow", id),
        itemType: "workflow",
        id,
        workflow: wf,
        thumbUrl,
        mediaUrl,
        isVideo: mediaItem?.kind === "video",
      });
    }
  }

  return list;
}

export function BulkMoveFolderDialog({
  open,
  onOpenChange,
  projectId,
  currentFolderId = null,
  selectedFolderIds = EMPTY_FOLDERS,
  selectedCount = 0,
  isMoving = false,
  onConfirmMove,
}) {
  const { data: rawFolders = EMPTY_FOLDERS } = useProjectFolders(projectId);
  const allFolders = useMemo(() => getFlatFolders(rawFolders), [rawFolders]);

  const [targetFolderId, setTargetFolderId] = useState(undefined);

  useEffect(() => {
    if (open) {
      setTargetFolderId(undefined);
    }
  }, [open]);

  const availableFolders = useMemo(() => {
    const flattened = buildFlattenedFolderTree(allFolders);
    if (!selectedFolderIds || selectedFolderIds.length === 0) return flattened;
    return flattened.filter(
      ({ node }) =>
        !selectedFolderIds.some((selId) => isFolderDescendant(allFolders, selId, node.id))
    );
  }, [allFolders, selectedFolderIds]);

  const isRootCurrent = !currentFolderId;
  const isConfirmDisabled =
    isMoving ||
    targetFolderId === undefined ||
    (targetFolderId === null && isRootCurrent) ||
    (targetFolderId !== null && targetFolderId === currentFolderId);

  const handleConfirm = async () => {
    if (isConfirmDisabled) return;
    await onConfirmMove?.(targetFolderId);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="folder"
        showCloseButton={true}
        className="flex flex-col gap-4 max-h-[75vh]"
      >
        <DialogHeader>
          <DialogTitle>Move {selectedCount} {selectedCount === 1 ? "item" : "items"}</DialogTitle>
          <DialogDescription>
            Choose a destination folder for the selected items.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto custom-scrollbar pr-1">
          <Button
            type="button"
            variant="ghost"
            disabled={isRootCurrent || isMoving}
            onClick={() => setTargetFolderId(null)}
            aria-pressed={targetFolderId === null}
            className={cn(
              "w-full justify-start h-9 px-2.5 gap-2 text-left",
              targetFolderId === null
                ? "bg-surface-tonal text-text-primary"
                : "text-text-body-muted hover:text-text-primary"
            )}
          >
            <HugeIcon name="folder-01" />
            <span className="truncate flex-1">Root (All assets)</span>
            {isRootCurrent && (
              <span className="ds-text-caption-s text-text-secondary shrink-0">Current</span>
            )}
          </Button>

          {availableFolders.map(({ node, depth }) => {
            const label = node.name || node.folder_name || "Untitled folder";
            const isCurrent = currentFolderId === node.id;
            const isChosen = targetFolderId === node.id;
            const paddingClass =
              DEPTH_PADDING_CLASSES[Math.min(depth, DEPTH_PADDING_CLASSES.length - 1)];

            return (
              <Button
                key={node.id}
                type="button"
                variant="ghost"
                disabled={isCurrent || isMoving}
                onClick={() => setTargetFolderId(node.id)}
                aria-pressed={isChosen}
                className={cn(
                  "w-full justify-start h-9 pr-2.5 gap-2 text-left",
                  paddingClass,
                  isChosen
                    ? "bg-surface-tonal text-text-primary"
                    : "text-text-body-muted hover:text-text-primary"
                )}
              >
                <HugeIcon name="folder-01" />
                <span className="truncate flex-1">{label}</span>
                {isCurrent && (
                  <span className="ds-text-caption-s text-text-secondary shrink-0">Current</span>
                )}
              </Button>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isMoving}
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
          >
            {isMoving ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudioSelectionBarContent({
  projectId,
  scope = "assets",
  entries = null,
  workflows = null,
  currentFolderId = null,
  showFolders: propShowFolders = undefined,
}) {
  const router = useRouter();
  const { data: rawFolders = EMPTY_FOLDERS } =
    useProjectFolders(currentFolderId ? projectId : null) || {};
  const allFolders = useMemo(() => getFlatFolders(rawFolders), [rawFolders]);

  const folderParentByIdRef = useRef(new Map());
  useEffect(() => {
    folderParentByIdRef.current = new Map();
  }, [projectId]);

  useEffect(() => {
    for (const folder of allFolders) {
      if (folder?.id != null) {
        folderParentByIdRef.current.set(
          String(folder.id),
          folder.parentId ?? folder.parent_id ?? null
        );
      }
    }
  }, [allFolders]);

  const handleNavigateUp = useCallback(
    (deletedFolderIds) => {
      const target = resolveSurvivingAncestorRoute(
        projectId,
        currentFolderId,
        deletedFolderIds,
        allFolders,
        folderParentByIdRef.current
      );
      if (target) {
        router.replace(target);
      }
    },
    [projectId, currentFolderId, allFolders, router]
  );

  const storeShowFolders = useWorkflowUiStore((s) => s.showFolders);
  const showFolders = propShowFolders ?? (storeShowFolders !== false);

  const selectedKeys = useStudioSelectionStore((s) => s.selectedKeys);
  const lastSelectedKey = useStudioSelectionStore((s) => s.lastSelectedKey);
  const clearSelection = useStudioSelectionStore((s) => s.clearSelection);
  const selectAll = useStudioSelectionStore((s) => s.selectAll);
  const pruneToVisible = useStudioSelectionStore((s) => s.pruneToVisible);

  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const allEntries = useMemo(
    () => resolveSelectableEntries(entries, workflows, showFolders),
    [entries, workflows, showFolders]
  );

  const allKeys = useMemo(
    () => allEntries.map((entry) => entry.key).filter(Boolean),
    [allEntries]
  );

  useEffect(() => {
    if (useStudioSelectionStore.getState().selectedKeys.length > 0) {
      pruneToVisible(allKeys);
    }
  }, [allKeys, pruneToVisible]);

  const entryByKey = useMemo(
    () => new Map(allEntries.map((entry) => [entry.key, entry])),
    [allEntries]
  );

  const selectedEntries = useMemo(() => {
    if (selectedKeys.length === 0) return [];
    const resolved = [];
    for (const key of selectedKeys) {
      const match = entryByKey.get(key);
      if (match) resolved.push(match);
    }
    return resolved;
  }, [entryByKey, selectedKeys]);

  const lastSelectedEntry = useMemo(() => {
    if (selectedEntries.length === 0) return null;
    if (lastSelectedKey) {
      const match = selectedEntries.find((entry) => entry.key === lastSelectedKey);
      if (match) return match;
    }
    return selectedEntries[selectedEntries.length - 1];
  }, [selectedEntries, lastSelectedKey]);

  const selectedFolderIds = useMemo(
    () =>
      selectedEntries
        .filter((entry) => entry.itemType === "collection")
        .map((entry) => entry.id)
        .filter(Boolean),
    [selectedEntries]
  );

  const {
    busyAction,
    hasCollections,
    collectionCount,
    canDownload,
    canMove,
    canLike,
    canAddToPrompt,
    isAllLiked,
    bulkDownload,
    bulkToggleLike,
    bulkMoveToFolder,
    bulkDelete,
    bulkRestore,
    bulkAddToPrompt,
  } = useStudioBulkActions({
    projectId,
    scope,
    selectedEntries,
    clearSelection,
    currentFolderId,
    onNavigateUp: handleNavigateUp,
  });

  const count = selectedEntries.length;
  const isBusy = Boolean(busyAction);
  const isTrashScope = scope === "trash";
  const hasSelectedCollections = Boolean(
    hasCollections || collectionCount > 0 || selectedFolderIds.length > 0
  );

  const openMoveDialog = useCallback(() => {
    setIsMoveDialogOpen(true);
  }, []);

  const openDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (allKeys.length > 0) {
      selectAll(allKeys);
    }
  }, [allKeys, selectAll]);

  const bulkMenuSnapshotRef = useRef(null);
  bulkMenuSnapshotRef.current =
    count > 0
      ? {
          count,
          scope,
          isBusy,
          canDownload,
          canMove,
          canLike,
          canAddToPrompt,
          isAllLiked,
          hasAllKeys: allKeys.length > 0,
          bulkDownload,
          openMoveDialog,
          bulkToggleLike,
          openDeleteConfirm,
          bulkRestore,
          bulkAddToPrompt,
          selectAll: handleSelectAll,
          clearSelection,
        }
      : null;

  useEffect(() => {
    return registerBulkMenuProvider(() => bulkMenuSnapshotRef.current);
  }, []);

  if (count === 0) return null;

  const deleteConfirmTitle = isTrashScope
    ? "Permanently delete items"
    : hasSelectedCollections
      ? "Delete folders and move items to Trash"
      : "Move items to Trash";

  const deleteConfirmDescription = isTrashScope
    ? `Permanently delete ${count} ${count === 1 ? "item" : "items"}? This cannot be undone.`
    : hasSelectedCollections
      ? "Selected folders (and their subfolders) will be permanently deleted. All selected items and items inside those folders will be moved to Trash."
      : `Move ${count} selected ${count === 1 ? "item" : "items"} to Trash?`;

  const deleteConfirmLabel = isTrashScope
    ? "Delete permanently"
    : hasSelectedCollections
      ? "Delete & Move to Trash"
      : "Move to Trash";

  return (
    <>
      <div
        role="toolbar"
        aria-label="Selection actions"
        data-slot="studio-selection-bar"
        data-selection-bar="true"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 surface-glass bg-surface-menu-glass rounded-2xl px-2.5 py-2 flex items-center gap-1.5 max-w-[calc(100%-2rem)]"
      >
        {/* Left selection count pill */}
        <div className="flex items-center gap-1.5 pr-0.5">
          <div className="size-6 rounded-md overflow-hidden bg-surface-tonal flex items-center justify-center shrink-0">
            {lastSelectedEntry?.itemType === "collection" ? (
              <HugeIcon name="folder-01" size="xs" className="text-text-primary" />
            ) : lastSelectedEntry?.thumbUrl && !lastSelectedEntry?.isVideo ? (
              <img
                src={lastSelectedEntry.thumbUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : lastSelectedEntry?.isVideo ? (
              <HugeIcon name="video-01" size="xs" className="text-text-primary" />
            ) : (
              <HugeIcon name="image-02" size="xs" className="text-text-secondary" />
            )}
          </div>

          <span className="ds-text-caption-m font-medium text-text-primary whitespace-nowrap px-1">
            {count} selected
          </span>

          <IconButton
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            disabled={isBusy}
            aria-label="Clear selection"
            title="Clear selection"
            className="rounded-control"
          >
            <HugeIcon name="cancel-01" />
          </IconButton>
        </div>

        <div className="h-5 w-px bg-border-strong mx-0.5 shrink-0" aria-hidden="true" />

        {isTrashScope ? (
          <>
            <Button
              type="button"
              variant="tonal"
              size="sm"
              onClick={bulkRestore}
              disabled={isBusy}
              className="rounded-control"
            >
              <HugeIcon name="restore-bin" />
              <span>{busyAction === "restore" ? "Restoring..." : "Restore"}</span>
            </Button>

            <Button
              type="button"
              variant="tonal"
              size="sm"
              onClick={openDeleteConfirm}
              disabled={isBusy}
              className="rounded-control text-destructive"
            >
              <HugeIcon name="delete-02" />
              <span>{busyAction === "delete" ? "Deleting..." : "Delete permanently"}</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              disabled={isBusy || allKeys.length === 0}
              className="rounded-control"
            >
              <span>Select all</span>
            </Button>
          </>
        ) : (
          <>
            {canDownload && (
              <Button
                type="button"
                variant="tonal"
                size="sm"
                onClick={bulkDownload}
                disabled={isBusy}
                className="rounded-control"
              >
                <HugeIcon name="download-04" />
                <span>{busyAction === "download" ? "Downloading..." : "Download"}</span>
              </Button>
            )}

            {canMove && (
              <Button
                type="button"
                variant="tonal"
                size="sm"
                onClick={openMoveDialog}
                disabled={isBusy}
                className="rounded-control"
              >
                <HugeIcon name="folder-transfer" />
                <span>{busyAction === "move" ? "Moving..." : "Move to"}</span>
              </Button>
            )}

            {canLike && (
              <IconButton
                variant="tonal"
                size="sm"
                onClick={bulkToggleLike}
                disabled={isBusy}
                aria-label={isAllLiked ? "Unlike selected" : "Like selected"}
                title={isAllLiked ? "Unlike selected" : "Like selected"}
                className="rounded-control"
              >
                <HugeIcon name="favourite" filled={isAllLiked} />
              </IconButton>
            )}

            <IconButton
              variant="tonal"
              size="sm"
              onClick={openDeleteConfirm}
              disabled={isBusy}
              aria-label="Delete selected"
              title="Delete selected"
              className="rounded-control"
            >
              <HugeIcon name="delete-02" />
            </IconButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton
                  variant="tonal"
                  size="sm"
                  disabled={isBusy}
                  aria-label="More selection actions"
                  title="More actions"
                  className="rounded-control"
                >
                  <HugeIcon name="more-horizontal" />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end">
                {canAddToPrompt && (
                  <DropdownMenuItem onSelect={() => bulkAddToPrompt()}>
                    <MenuItemContent icon="image-add-02">Add to Prompt</MenuItemContent>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={handleSelectAll}
                  disabled={allKeys.length === 0}
                >
                  <MenuItemContent icon="select-01">Select all</MenuItemContent>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {canMove && (
        <BulkMoveFolderDialog
          open={isMoveDialogOpen}
          onOpenChange={setIsMoveDialogOpen}
          projectId={projectId}
          currentFolderId={currentFolderId}
          selectedFolderIds={selectedFolderIds}
          selectedCount={count}
          isMoving={busyAction === "move"}
          onConfirmMove={bulkMoveToFolder}
        />
      )}

      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={deleteConfirmTitle}
        description={deleteConfirmDescription}
        confirmLabel={deleteConfirmLabel}
        cancelLabel="Cancel"
        loading={busyAction === "delete"}
        onConfirm={bulkDelete}
      />
    </>
  );
}

export function StudioSelectionBar(props) {
  const hasSelection = useStudioSelectionStore((s) => s.selectedKeys.length > 0);
  if (!hasSelection) return null;
  return <StudioSelectionBarContent {...props} />;
}

export default StudioSelectionBar;
