import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, useMotionValue } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { ButtonGroup } from "@/shared/ui/button-group";
import { ConfirmDeleteDialog } from "@/shared/ui/ConfirmDeleteDialog";
import { InlineRenamePill } from "@/shared/ui/InlineRenamePill";
import { ActionBtn } from "@/shared/ui/action-button";
import { StudioItemDropdownMenu } from "./StudioItemMenu";
import { getStudioMenuItems } from "./studioMenuConfig";
import { MediaView } from "@/features/media";
import { useUpdateFolder, useDeleteFolder, useFolderMove, useDownloadCollection } from "@/features/folders";
import { usePromptStore, useStudioItemDrag } from "@/features/studio";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";

export const CollectionMediaGridItem = React.memo(function CollectionMediaGridItem({
  collection,
  workflow,
  coverUrl = null,
  coverIsVideo = false,
  className,
  onClick,
  width: albumWidth = null,
  height: albumHeight = null,
  projectId: propProjectId = null,
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
  const [isRenaming, setIsRenaming] = useState(false);
  const [cardRect, setCardRect] = useState(null);

  const { mutateAsync: updateFolder } = useUpdateFolder();
  const { mutateAsync: deleteFolder, isPending: isDeleting } = useDeleteFolder();
  const { executeMoveFromPayload } = useFolderMove(projectId);

  const [isDragOver, setIsDragOver] = useState(false);
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const lastPos = useRef({ x: -500, y: -500 });

  const cardRef = useRef(null);
  const canDismissRef = useRef(false);

  const ghostMotionStyle = {
    x: mouseX,
    y: mouseY,
    translateX: "-50%",
    translateY: "-50%",
    width: "clamp(96px, 9vw, 132px)",
    aspectRatio: "1 / 1",
  };

  const collectionName = col?.name || "Untitled collection";
  const collectionTileOverlay = (
    <div className="collection-tile-scrim" />
  );

  useEffect(() => {
    const handlePointerHover = (e) => {
      if (e.detail?.target === "add-to-collection" && e.detail?.collectionId === col?.id) {
        setIsDragOver(true);
      } else if (!e.detail?.target || e.detail?.collectionId !== col?.id) {
        setIsDragOver(false);
      }
    };
    const handlePointerDrop = (e) => {
      if (e.detail?.targetFolderId === col?.id && projectId) {
        executeMoveFromPayload({
          payload: e.detail,
          targetFolderId: col.id,
          projectId,
        });
      }
    };
    window.addEventListener("studio:pointer-hover-target", handlePointerHover);
    window.addEventListener("studio:drop-to-collection", handlePointerDrop);
    return () => {
      window.removeEventListener("studio:pointer-hover-target", handlePointerHover);
      window.removeEventListener("studio:drop-to-collection", handlePointerDrop);
    };
  }, [col?.id, projectId, executeMoveFromPayload]);

  const {
    handlePointerDown,
    isDragging: isDraggingThis,
    justDraggedRef,
  } = useStudioItemDrag({
    itemType: "collection",
    item: col,
    itemId: col?.id,
    isDraggable: true,
    isRenaming,
    mouseX,
    mouseY,
    lastPos,
  });

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

  // Dynamically track card position while rename is open
  useEffect(() => {
    if (!isRenaming) {
      setCardRect(null);
      return;
    }
    const updateRect = () => {
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect();
        setCardRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          bottom: r.bottom,
          right: r.right,
        });
      }
    };
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [isRenaming]);

  const startRename = useCallback(() => {
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      setCardRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
        right: r.right,
      });
    }
    canDismissRef.current = false;
    setIsRenaming(true);
    setTimeout(() => {
      canDismissRef.current = true;
    }, 150);
  }, []);

  const handleRename = (newName) => {
    if (!col?.id || !projectId) return;
    updateFolder({
      folderId: col.id,
      patch: { name: newName },
      projectId,
    });
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

  const getPillPosition = () => {
    if (!cardRect || typeof window === "undefined" || !cardRect.width) {
      return { bottom: "32px", left: "50%", transform: "translateX(-50%)" };
    }
    const PADDING = 10;
    const PILL_HEIGHT = 56;
    const spaceBelow = window.innerHeight - cardRect.bottom;
    let top = cardRect.bottom + PADDING;
    if (spaceBelow < PILL_HEIGHT + 20) {
      top = Math.max(12, cardRect.bottom - PILL_HEIGHT - PADDING);
    }
    const left = Math.max(12, Math.min(cardRect.left, window.innerWidth - 580));
    return { top: `${top}px`, left: `${left}px` };
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
      handleLike: handleToggleLike,
      handleDownload,
      onRename: startRename,
      onDelete: () => setIsDeleteConfirmOpen(true),
    },
    state: {
      isLiked,
      isDownloading,
    },
  });

  const cardStyle = albumWidth && albumHeight
    ? {
        width: albumWidth,
        height: albumWidth,
        aspectRatio: "1 / 1",
        transform: "translateZ(0)",
        contain: "paint layout",
        contentVisibility: "auto",
        containIntrinsicSize: `${Math.round(albumWidth)}px ${Math.round(albumWidth)}px`,
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
      if (isRenaming || justDraggedRef.current) return;
      const targetCol = col || collection || workflow;
      const targetId = targetCol?.id || targetCol?.name;
      if (onClick) {
        onClick(targetCol, e);
      } else if (targetId && projectId) {
        router.push(`/cinema-studio/${projectId}/collection/${targetId}`);
      }
    },
    [isRenaming, justDraggedRef, col, collection, workflow, onClick, projectId, router]
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
        onLikeToggle={handleToggleLike}
        draggable={false}
        data-collection-drop-id={col?.id}
        onPointerDown={!isRenaming ? handlePointerDown : undefined}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "cursor-pointer",
          !coverUrl && "collection-tile-empty",
          isDragOver && "ring-2 ring-white",
          className
        )}
        style={cardStyle}
        topRight={
          <div
            className={cn(
              "transition-opacity duration-200 pointer-events-auto",
              isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <ButtonGroup variant="pill">
              <ActionBtn
                onClick={handleToggleLike}
                aria-label={isLiked ? "Unlike collection" : "Like collection"}
                title={isLiked ? "Unlike collection" : "Like collection"}
              >
                <GoogleIcon
                  iconName="favorite"
                  fill={isLiked}
                  className="text-xs text-neutral-800"
                />
              </ActionBtn>
              <StudioItemDropdownMenu
                open={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
                items={menuItems}
              />
            </ButtonGroup>
          </div>
        }
        bottom={
          !isRenaming && (
            <div className="collection-title-container">
              <span
                className="title-text"
                title={collectionName}
                onClick={handleNavigate}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startRename();
                }}
              >
                {collectionName}
              </span>
            </div>
          )
        }
      >
        {coverUrl && (
          <div className="absolute inset-0">
            {coverIsVideo ? (
              <video src={coverUrl} className="h-full w-full object-cover" muted loop playsInline />
            ) : (
              <img src={coverUrl} className="h-full w-full object-cover" alt="" />
            )}
          </div>
        )}
        {collectionTileOverlay}
        <div ref={cardRef} className="absolute inset-0 pointer-events-none -z-10" />
      </MediaView>

      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete collection?"
        description={`Are you sure you want to delete collection "${collectionName}"?`}
        onConfirm={handleDelete}
        loading={isDeleting}
      />

      {isRenaming && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-default"
            onPointerDown={(e) => {
              e.stopPropagation();
              if (canDismissRef.current) setIsRenaming(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (canDismissRef.current) setIsRenaming(false);
            }}
          />
          <div
            className="fixed z-50 pointer-events-auto"
            style={getPillPosition()}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <InlineRenamePill
              initialName={collectionName}
              onSave={handleRename}
              onCancel={() => setIsRenaming(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ── Collection drag ghost portal ── */}
      {isDraggingThis && typeof window !== "undefined" && createPortal(
        <motion.div
          className="fixed top-0 left-0 z-50 pointer-events-none overflow-hidden rounded-xxxs border border-white/70 bg-neutral-700 shadow-none"
          style={ghostMotionStyle}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/50" />
          <div className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-between gap-2">
            <h3 className="min-w-0 truncate text-xs font-medium leading-tight tracking-tight text-white/92">
              {collectionName}
            </h3>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-neutral-800/95 text-white/90 shadow-none">
              <GoogleIcon iconName="folder" className="text-base" />
            </div>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
});

export { CollectionMediaGridItem as CollectionGridItem };
export default CollectionMediaGridItem;
