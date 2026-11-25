import React, { useState, useRef, useEffect, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { QueryClientContext } from "@tanstack/react-query";
import { motion, useMotionValue } from "framer-motion";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";
import { queryKeys } from "@/shared/api/queryKeys";
import { ConfirmDeleteDialog } from "@/components/primitives/ConfirmDeleteDialog";
import { CreateFolderDialog } from "@/components/cinema-studio/collections/CreateFolderDialog";
import { MoveToDialog } from "@/components/cinema-studio/collections/MoveToDialog";
import { IconButton } from "@/components/base/icon-button";
import { StudioItemDropdownMenu } from "@/components/cinema-studio/media/StudioItemMenu";
import { getStudioMenuItems } from "@/components/cinema-studio/media/studioMenuConfig";
import { MediaView } from "@/features/media";
import { useUpdateFolder, useDeleteFolder, useFolderMove, useDownloadCollection } from "@/features/folders";
import { isFolderDescendant } from "@/features/folders/model/useFolderMove";
import { usePromptStore, useStudioItemDrag } from "@/features/studio";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import {
  useStudioSelectionStore,
  parseSelectionKey,
} from "@/features/workflows/model/useStudioSelectionStore";
import { stripWorkflowPrefix } from "@/features/workflows/lib/cacheHelpers";

const DRAG_TARGET_LABELS = {
  "add-to-collection": "Move to folder",
  "move-to-root": "Move to root",
  "move-to-trash": "Move to trash",
  "move-out": "Move out",
};

function getDragTargetType(dragTarget) {
  if (!dragTarget) return null;
  if (typeof dragTarget === "string") return dragTarget;
  return dragTarget.target || null;
}

export const CollectionMediaGridItem = React.memo(function CollectionMediaGridItem({
  collection,
  workflow,
  coverUrl = null,
  coverIsVideo = false,
  itemCount = null,
  className,
  onClick,
  width: albumWidth = null,
  height: albumHeight = null,
  projectId: propProjectId = null,
  isSelected = false,
  isSelectionMode = false,
  selectionEnabled = false,
  onToggleSelect = null,
}) {
  const col = collection || workflow;
  const router = useRouter();
  const storeProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const projectId = propProjectId || storeProjectId;
  const setActiveCollectionId = useWorkflowsStore((s) => s.setActiveCollectionId);
  const activeCollectionId = useWorkflowsStore((s) => s.activeCollectionId);

  const favoriteFolderIds = useWorkflowsStore((s) => s.favoriteFolderIds || {});
  const toggleFavoriteFolder = useWorkflowsStore((s) => s.toggleFavoriteFolder);
  const folderId = col?.id;
  const isLiked = Boolean(favoriteFolderIds[folderId] ?? col?.favorited ?? col?.is_liked);
  const { downloadCollection, isDownloading } = useDownloadCollection();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [createSubfolderParentId, setCreateSubfolderParentId] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [movingFolder, setMovingFolder] = useState(null);

  const queryClient = useContext(QueryClientContext);
  const { mutateAsync: updateFolder } = useUpdateFolder();
  const { mutateAsync: deleteFolder, isPending: isDeleting } = useDeleteFolder();
  const { executeMoveFromPayload } = useFolderMove(projectId);

  const [isDragOver, setIsDragOver] = useState(false);
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const lastPos = useRef({ x: -500, y: -500 });

  const ghostMotionStyle = {
    x: mouseX,
    y: mouseY,
    translateX: "-50%",
    translateY: "-50%",
    width: "clamp(96px, 9vw, 132px)",
    aspectRatio: "1 / 1",
  };

  const collectionName = col?.name || "Untitled collection";
  const collectionColor = col?.color || null;
  const collectionDescription = col?.description || null;
  const directItemCount =
    typeof itemCount === "number"
      ? itemCount
      : typeof col?.assetCount === "number"
        ? col.assetCount
        : 0;

  useEffect(() => {
    const handlePointerHover = (e) => {
      if (e.detail?.target === "add-to-collection" && e.detail?.collectionId === col?.id) {
        setIsDragOver(true);
      } else {
        setIsDragOver(false);
      }
    };
    window.addEventListener("studio:pointer-hover-target", handlePointerHover);
    return () => {
      window.removeEventListener("studio:pointer-hover-target", handlePointerHover);
    };
  }, [col?.id]);

  const canDrag = !isSelectionMode || isSelected;

  const getDragItems = useCallback(() => {
    if (isSelected) {
      const selectedKeys = useStudioSelectionStore.getState().selectedKeys;
      if (selectedKeys.length > 1) {
        const parsed = selectedKeys
          .map(parseSelectionKey)
          .filter((entry) => entry.itemType && entry.id)
          .map((entry) =>
            entry.itemType === "workflow"
              ? { itemType: "workflow", id: stripWorkflowPrefix(entry.id) }
              : entry
          );
        if (parsed.length > 0) return parsed;
      }
    }
    return folderId ? [{ itemType: "collection", id: folderId }] : [];
  }, [isSelected, folderId]);

  const getInvalidDropFolderIds = useCallback(() => {
    const invalid = new Set();
    const dragItems = getDragItems();
    const folderIds = new Set();
    if (folderId) folderIds.add(folderId);
    for (const entry of dragItems) {
      if (entry.itemType === "collection" && entry.id) {
        folderIds.add(entry.id);
      }
    }
    if (folderIds.size === 0) return invalid;

    const rawFolders = projectId && queryClient
      ? queryClient.getQueryData(queryKeys.folders.byProject(projectId))
      : null;
    const folders = Array.isArray(rawFolders)
      ? rawFolders
      : Array.isArray(rawFolders?.items)
        ? rawFolders.items
        : [];

    for (const selectedFolderId of folderIds) {
      invalid.add(selectedFolderId);
      for (const folder of folders) {
        const candidateId = folder?.id || folder?.folderId || folder?._id;
        if (candidateId && isFolderDescendant(folders, selectedFolderId, candidateId)) {
          invalid.add(candidateId);
        }
      }
    }
    return invalid;
  }, [folderId, getDragItems, projectId, queryClient]);

  const {
    handlePointerDown,
    isDragging: isDraggingThis,
    dragTarget,
    dragCount = 1,
    justDraggedRef,
  } = useStudioItemDrag({
    itemType: "collection",
    item: col,
    itemId: col?.id,
    isDraggable: canDrag,
    isRenaming: false,
    getDragItems,
    getInvalidDropFolderIds,
    mouseX,
    mouseY,
    lastPos,
  });

  const dragTargetType = getDragTargetType(dragTarget);
  const dragTargetLabel = dragTargetType ? DRAG_TARGET_LABELS[dragTargetType] || null : null;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentDragged = usePromptStore.getState().draggedItem;
    if (currentDragged?.type === "collection" && currentDragged?.id === col?.id) {
      e.dataTransfer.dropEffect = "none";
      return;
    }
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) {
      setIsDragOver(true);
      window.dispatchEvent(new CustomEvent("studio:drag-target-change", { detail: { target: "add-to-collection" } }));
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentDragged = usePromptStore.getState().draggedItem;
    if (currentDragged?.type === "collection" && currentDragged?.id === col?.id) {
      return;
    }
    setIsDragOver(true);
    window.dispatchEvent(new CustomEvent("studio:drag-target-change", { detail: { target: "add-to-collection" } }));
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
      window.dispatchEvent(new CustomEvent("studio:drag-target-change", { detail: { target: null } }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    window.dispatchEvent(new CustomEvent("studio:drag-target-change", { detail: { target: null } }));

    if (!col?.id) return;
    executeMoveFromPayload({
      payload: e.dataTransfer,
      fallbackDraggedItem: usePromptStore.getState().draggedItem,
      targetFolderId: col.id,
      projectId,
    });
  };

  const handleOpenInNewTab = () => {
    if (folderId && projectId && typeof window !== "undefined") {
      window.open(
        `/cinema-studio/${projectId}/collection/${folderId}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleSetColor = async (colorHex) => {
    if (!folderId || !projectId) return;
    try {
      await updateFolder({
        folderId,
        patch: { color: colorHex },
        projectId,
      });
    } catch {
      // handled
    }
  };

  const handleDelete = async () => {
    if (!col?.id || !projectId || isDeleting) return;
    try {
      await deleteFolder({
        folderId: col.id,
        projectId,
      });
      setIsDeleteConfirmOpen(false);
      if (activeCollectionId === col.id) {
        setActiveCollectionId(null);
        const parentId = col?.parent_id || col?.parentId || null;
        router.push(
          parentId
            ? `/cinema-studio/${projectId}/collection/${parentId}`
            : `/cinema-studio/${projectId}/assets`
        );
      }
    } catch (err) {
      // Re-throw so ConfirmDeleteDialog retains open dialog state and feedback
      throw err;
    }
  };

  const handleToggleLike = (e) => {
    e?.stopPropagation?.();
    if (folderId) toggleFavoriteFolder?.(folderId);
  };

  const handleDownload = (e) => {
    e?.stopPropagation?.();
    if (folderId) {
      downloadCollection({
        collectionId: folderId,
        collectionName,
        projectId,
      });
    }
  };

  const menuItems = getStudioMenuItems({
    type: "collection",
    item: col,
    actions: {
      handleOpenInNewTab,
      handleCreateSubfolder: () => setCreateSubfolderParentId(folderId),
      handleEdit: () => setEditingFolder(col),
      handleMoveTo: () => setMovingFolder(col),
      handleLike: handleToggleLike,
      handleDownload,
      handleSetColor,
      onDelete: () => setIsDeleteConfirmOpen(true),
    },
    state: {
      isLiked,
      isDownloading,
      folderColor: collectionColor,
    },
  });

  const cardStyle = albumWidth && albumHeight
    ? {
        width: albumWidth,
        height: albumHeight,
        aspectRatio: `${albumWidth} / ${albumHeight}`,
        transform: "translateZ(0)",
        contain: "paint layout",
        contentVisibility: "auto",
        containIntrinsicSize: `${Math.round(albumWidth)}px ${Math.round(albumHeight)}px`,
      }
    : {
        width: "100%",
        aspectRatio: "1 / 1",
        transform: "translateZ(0)",
        contain: "paint layout",
        contentVisibility: "auto",
      };

  const handleNavigate = useCallback(
    (e) => {
      if (justDraggedRef.current) return;
      if (isSelectionMode && onToggleSelect) {
        onToggleSelect(e);
        return;
      }
      const targetCol = col || collection || workflow;
      const targetId = targetCol?.id || targetCol?.name;
      if (onClick) {
        onClick(targetCol, e);
      } else if (targetId && projectId) {
        router.push(`/cinema-studio/${projectId}/collection/${targetId}`);
      }
    },
    [isSelectionMode, onToggleSelect, justDraggedRef, col, collection, workflow, onClick, projectId, router]
  );

  const collectionTitleTooltip = collectionDescription
    ? `${collectionName} — ${collectionDescription}`
    : collectionName;
  const collectionColorStyle = collectionColor
    ? { backgroundColor: collectionColor }
    : undefined;

  const renderFolderFooter = (interactive) => (
    <div
      data-slot="folder-bottom-bar"
      className="ds-folder-bottom-bar flex w-full items-end justify-between gap-2.5"
    >
      <div className="flex min-w-0 items-center gap-2">
        {collectionColor && (
          <span
            className="size-2 rounded-full shrink-0"
            style={collectionColorStyle}
          />
        )}
        <span
          data-slot="folder-title"
          className="ds-folder-title text-text-primary truncate"
          title={collectionTitleTooltip}
          onDoubleClick={
            interactive
              ? (e) => {
                  e.stopPropagation();
                  setEditingFolder(col);
                }
              : undefined
          }
        >
          {collectionName}
        </span>
      </div>
      <span
        data-slot="folder-item-count"
        aria-label={`${directItemCount} ${directItemCount === 1 ? "item" : "items"}`}
        className="ds-folder-count flex shrink-0 items-center gap-1 pb-0.5 text-text-primary/90 tabular-nums"
      >
        <HugeIcon
          name="image-02"
          className="text-text-primary/85 shrink-0"
        />
        <span>{directItemCount}</span>
      </span>
    </div>
  );

  return (
    <>
      <MediaView
        fit="cover"
        surface="card"
        showHoverOverlay={false}
        contextMenuItems={menuItems}
        onClick={handleNavigate}
        isLiked={isLiked}
        showLikedBadge={false}
        onLikeToggle={handleToggleLike}
        draggable={false}
        isSelected={isSelected}
        isSelectionMode={isSelectionMode}
        selectionEnabled={selectionEnabled}
        onToggleSelect={onToggleSelect}
        outlineClassName="rounded-comfortable"
        data-collection-drop-id={col?.id}
        data-draggable-card={canDrag ? "true" : undefined}
        onPointerDown={canDrag ? handlePointerDown : undefined}
        onDragOver={isSelectionMode ? undefined : handleDragOver}
        onDragEnter={isSelectionMode ? undefined : handleDragEnter}
        onDragLeave={isSelectionMode ? undefined : handleDragLeave}
        onDrop={isSelectionMode ? undefined : handleDrop}
        className={cn(
          "shrink-0 rounded-comfortable",
          canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
          !coverUrl && "border border-border-subtle",
          isDragOver && "ring-2 ring-text-primary",
          className
        )}
        style={cardStyle}
        topRight={
          isSelectionMode ? null : (
            <div
              className="flex flex-col items-center gap-1.5 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={cn(
                  "transition-opacity duration-200",
                  isLiked || isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <IconButton
                  variant="overlay"
                  onClick={handleToggleLike}
                  aria-label={isLiked ? "Unlike collection" : "Like collection"}
                  title={isLiked ? "Unlike collection" : "Like collection"}
                >
                  <HugeIcon
                    name="favourite"
                    filled={isLiked}
                    className="text-text-primary"
                  />
                </IconButton>
              </div>
              <div
                className={cn(
                  "transition-opacity duration-200",
                  isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <StudioItemDropdownMenu
                  open={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                  items={menuItems}
                />
              </div>
            </div>
          )
        }
        bottom={isSelectionMode ? null : renderFolderFooter(true)}
      >
        {coverUrl ? (
          <div className="absolute inset-0">
            {coverIsVideo ? (
              <video src={coverUrl} className="h-full w-full object-cover" muted loop playsInline />
            ) : (
              <img src={coverUrl} draggable={false} className="h-full w-full object-cover" alt="" />
            )}
          </div>
        ) : (
          <div
            data-slot="folder-empty-fallback"
            className="absolute inset-0 flex items-center justify-center pb-8"
          >
            <HugeIcon
              name="folder-01"
              size="xl"
              className="text-text-disabled"
            />
          </div>
        )}
        <div
          data-slot="folder-bottom-blur"
          aria-hidden="true"
          className="ds-folder-bottom-blur"
        />
        {isSelectionMode && (
          <div className="absolute bottom-0 inset-x-0 pointer-events-none">
            {renderFolderFooter(false)}
          </div>
        )}
      </MediaView>

      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete collection?"
        description={`Are you sure you want to delete collection "${collectionName}"?`}
        onConfirm={handleDelete}
        loading={isDeleting}
      />

      {createSubfolderParentId && (
        <CreateFolderDialog
          open={Boolean(createSubfolderParentId)}
          onOpenChange={(open) => {
            if (!open) setCreateSubfolderParentId(null);
          }}
          parentId={createSubfolderParentId}
          projectId={projectId}
          title="Nouveau sous-dossier"
        />
      )}

      {editingFolder && (
        <CreateFolderDialog
          open={Boolean(editingFolder)}
          onOpenChange={(open) => {
            if (!open) setEditingFolder(null);
          }}
          folder={editingFolder}
          projectId={projectId}
          title="Edit folder"
        />
      )}

      {movingFolder && (
        <MoveToDialog
          open={Boolean(movingFolder)}
          onOpenChange={(open) => {
            if (!open) setMovingFolder(null);
          }}
          projectId={projectId}
          itemType="collection"
          item={movingFolder}
        />
      )}

      {/* ── Collection drag ghost portal ── */}
      {isDraggingThis && typeof window !== "undefined" && createPortal(
        <motion.div
          className="fixed top-0 left-0 z-50 pointer-events-none"
          style={ghostMotionStyle}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {dragCount > 1 && (
            <div
              aria-hidden="true"
              data-slot="drag-stack-back"
              className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-3 rounded-comfortable bg-surface-card border border-border-subtle"
            />
          )}
          <div className="relative h-full w-full overflow-hidden rounded-comfortable border border-border-heavy bg-surface-secondary">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/50" />
            <div className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-between gap-2">
              <h3 className="min-w-0 truncate ds-type-caption-label text-text-primary">
                {collectionName}
              </h3>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-subtle border border-border-subtle bg-surface-secondary text-text-primary">
                <HugeIcon name="folder-01" size="md" />
              </div>
            </div>
          </div>
          {dragCount > 1 && (
            <span
              data-slot="drag-count-badge"
              className="absolute -top-2 -right-2 z-10 min-w-5 text-center bg-text-primary text-text-inverse rounded-sharp px-2 py-0.5 ds-type-micro-tag tabular-nums"
            >
              {dragCount}
            </span>
          )}
          {dragTargetLabel && (
            <motion.div
              key={dragTargetType}
              data-slot="drag-target-label"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute left-1/2 top-full mt-2 -translate-x-1/2 surface-glass border border-border-subtle text-text-primary rounded-subtle px-2.5 py-1 ds-type-small whitespace-nowrap"
            >
              {dragTargetLabel}
            </motion.div>
          )}
        </motion.div>,
        document.body
      )}
    </>
  );
});

export { CollectionMediaGridItem as CollectionGridItem };
export default CollectionMediaGridItem;
