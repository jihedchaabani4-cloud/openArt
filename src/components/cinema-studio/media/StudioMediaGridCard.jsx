import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from "react";
import { createPortal } from "react-dom";
import { QueryClientContext } from "@tanstack/react-query";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";
import { queryKeys } from "@/shared/api/queryKeys";
import { ConfirmDeleteDialog } from "@/components/primitives/ConfirmDeleteDialog";
import { InlineRenamePill } from "@/components/primitives/InlineRenamePill";
import { useWorkflowActions } from "@/features/workflows/model/useMediaActions";
import { useUpdateWorkflow } from "@/features/workflows/api/workflowsApi";
import {
  useStudioSelectionStore,
  parseSelectionKey,
} from "@/features/workflows/model/useStudioSelectionStore";
import { stripWorkflowPrefix } from "@/features/workflows/lib/cacheHelpers";
import {
  getWorkflowEntityType,
  resolveStudioActions,
} from "@/features/workflows/lib/studioActionRules";
import { isFolderDescendant } from "@/features/folders/model/useFolderMove";
import { usePromptStore, useStudioItemDrag } from "@/features/studio";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { StudioItemDropdownMenu } from "./StudioItemMenu";
import { getStudioMenuItems } from "./studioMenuConfig";
import { MediaView } from "@/features/media";

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

export const StudioMediaGridCard = React.memo(function StudioMediaGridCard({
  workflow,
  item: propItem = null,
  mediaId = null,
  aspect: propAspect = null,
  className,
  onClick = () => {},
  onDragStart: _onDragStart = () => {},
  onDragEnd: _onDragEnd = () => {},
  width: albumWidth = null,
  height: albumHeight = null,
  menuItems: propMenuItems = null,
  topLeft = null,
  topRight: customTopRight = null,
  projectId: propProjectId = null,
  isSelected = false,
  isSelectionMode = false,
  selectionEnabled = false,
  onToggleSelect = null,
  ..._props
}) {
  const effectiveMediaId = mediaId || (typeof propItem === "string" ? propItem : null);
  const resolvedItem = (typeof propItem === "object" && propItem !== null)
    ? propItem
    : (workflow?.items?.find((i) => (i.id || i.name || i.asset_id) === effectiveMediaId) || (effectiveMediaId ? { id: effectiveMediaId } : null));

  const effectiveProjectId = propProjectId || workflow?.projectId || workflow?.project_id || null;

  const {
    handleLike, handleDelete, handleDownload,
    handleReuseSettings, handleAnimate, handleAddToPrompt,
    handleAddStartFrame, handleAddEndFrame, isFrameMode,
    isVideo, url, isLiked, status, aspect, prompt, item, canDelete, canReuseSettings, showReuseSettings, canAddToPrompt,
  } = useWorkflowActions(workflow, resolvedItem, { projectId: effectiveProjectId });

  // ── State ──────────────────────────────────────────────────────────────
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [cardRect, setCardRect] = useState(null);
  const [measuredWidth, setMeasuredWidth] = useState(albumWidth || 0);

  const queryClient = useContext(QueryClientContext);
  const { mutateAsync: updateWorkflow } = useUpdateWorkflow();
  const showTileDetails = useWorkflowsStore((s) => s.showTileDetails);
  const setShowTileDetails = useWorkflowsStore((s) => s.setShowTileDetails);
  const isGalleryDragging = usePromptStore((s) => s.isDraggingGalleryItem);

  const toggleTileDetails = () => setShowTileDetails(!showTileDetails);

  // ── Motion values ──────────────────────────────────────────────────────
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const progress = useMotionValue(0);
  const progressWidth = useTransform(progress, (v) => `${v}%`);
  const progressBarStyle = useMemo(() => ({ width: progressWidth }), [progressWidth]);

  // ── Refs ───────────────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const lastPos = useRef({ x: -500, y: -500 });
  const cardRef = useRef(null);
  const canDismissRef = useRef(false);
  const isDraggingRef = useRef(false);

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (isDraggingRef.current) {
      usePromptStore.getState().setIsDraggingGalleryItem(false);
      usePromptStore.getState().setDraggedItem(null);
    }
  }, []);

  // ── Dynamically track card position while rename is open ─────────────
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

  // ── Track card width dynamically for responsive text truncation ──────
  useEffect(() => {
    if (albumWidth) {
      setMeasuredWidth(albumWidth);
      return;
    }
    if (!cardRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect?.width;
        if (w) setMeasuredWidth(w);
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [albumWidth]);

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

  const entityType = getWorkflowEntityType(workflow);

  // ── Derived values (pure computation — no hooks) ───────────────────────
  const actionRules = resolveStudioActions({
    entityType,
    workflow,
    item,
    status,
    isVideo,
    isFrameMode,
    hasUrl: Boolean(url),
    hasReusablePrompt: canReuseSettings,
    showReuse: showReuseSettings,
    canModelAcceptEntity: canAddToPrompt,
    isSelectionMode,
    isSelected,
  });
  const isDone = actionRules.isCompleted && Boolean(url);
  const isError = actionRules.isFailed;
  const isInFlight = actionRules.isInFlight;
  const canDrag = actionRules.can.drag && canDelete;

  const displayName = workflow?.display_name
                   || workflow?.metadata?.displayName
                   || workflow?.character?.name
                   || workflow?.character?.title
                   || workflow?.element?.name
                   || workflow?.title
                   || null;

  const effectiveWidth = albumWidth || measuredWidth;

  const maxChars = (() => {
    if (!effectiveWidth) return 20;
    if (effectiveWidth < 160) return 10;
    if (effectiveWidth < 200) return 14;
    if (effectiveWidth < 250) return 18;
    if (effectiveWidth < 300) return 24;
    if (effectiveWidth < 380) return 32;
    if (effectiveWidth < 460) return 42;
    return 55;
  })();

  const truncatedDisplayName = (() => {
    if (!displayName) return null;
    if (displayName.length <= maxChars) return displayName;
    return displayName.slice(0, maxChars).trimEnd() + "...";
  })();

  const handleRename = async (newName) => {
    const wfId = workflow?.name || workflow?.id || item?.workflow_id || item?.workflowId || item?.name || item?.id;
    if (!wfId) return;
    await updateWorkflow({
      workflowId: wfId,
      workflowData: { display_name: newName },
    });
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

  const menuItems = propMenuItems || getStudioMenuItems({
    type: entityType,
    workflow,
    item,
    actions: {
      handleAddToPrompt,
      handleAddStartFrame,
      handleAddEndFrame,
      handleAnimate,
      handleLike,
      handleReuseSettings,
      handleDownload,
      handleCopy: () => {
        if (url && typeof navigator !== "undefined") {
          navigator.clipboard?.writeText?.(url);
        }
      },
      handleShare: () => {
        if (typeof navigator !== "undefined") {
          if (navigator.share && url) {
            navigator.share({ title: prompt || "Media", url }).catch(() => {});
          } else if (url) {
            navigator.clipboard?.writeText?.(url);
          }
        }
      },
      onDelete: () => setIsDeleteConfirmOpen(true),
      toggleTileDetails,
      onRename: startRename,
    },
    state: {
      status,
      isLiked,
      isVideo,
      showTileDetails,
      canDelete,
      canReuse: canReuseSettings,
      showReuse: showReuseSettings,
      canAddToPrompt,
      isFrameMode,
    },
  });

  const rawWfId = workflow?.id || workflow?.name || item?.workflow_id || item?.workflowId || item?.id;
  const wfId = rawWfId ? stripWorkflowPrefix(rawWfId) : null;

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
    return wfId ? [{ itemType: "workflow", id: wfId }] : [];
  }, [isSelected, wfId]);

  const getInvalidDropFolderIds = useCallback(() => {
    const invalid = new Set();
    const dragItems = getDragItems();
    const folderIds = dragItems
      .filter((entry) => entry.itemType === "collection" && entry.id)
      .map((entry) => entry.id);

    if (folderIds.length === 0) return invalid;

    const pid = effectiveProjectId || useWorkflowsStore.getState?.()?.selectedProjectId || null;
    const rawFolders = pid && queryClient
      ? queryClient.getQueryData(queryKeys.folders.byProject(pid))
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
  }, [effectiveProjectId, getDragItems, queryClient]);

  const handleDragStateChange = useCallback((dragging) => {
    isDraggingRef.current = dragging;
  }, []);

  const {
    handlePointerDown,
    isDragging,
    dragTarget,
    dragCount = 1,
    justDraggedRef,
  } = useStudioItemDrag({
    itemType: "workflow",
    item: workflow || item,
    itemId: wfId,
    url,
    isDraggable: canDrag,
    isRenaming,
    getDragItems,
    getInvalidDropFolderIds,
    onDragStateChange: handleDragStateChange,
    mouseX,
    mouseY,
    lastPos,
  });

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  if (!item) return null;

  const dragTargetType = getDragTargetType(dragTarget);
  const dragTargetLabel = dragTargetType ? DRAG_TARGET_LABELS[dragTargetType] || null : null;

  const hasAnyCompletedMedia = workflow?.items?.some((i) =>
    ["completed", "success", "ready"].includes(String(i?.status || "").toLowerCase())
  );
  const canNavigate = actionRules.can.navigate && (isDone || hasAnyCompletedMedia);

  const errorMsg = isError ? (
    item?.error ||
    workflow?.error ||
    item?.error_message ||
    workflow?.error_message ||
    "Generation failed. Please try a different prompt or retry."
  ) : null;

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
        aspectRatio: propAspect || aspect,
        transform: "translateZ(0)",
        contain: "paint layout",
        contentVisibility: "auto",
      };

  const dragGhostStyle = {
    x: mouseX,
    y: mouseY,
    translateX: "-50%",
    translateY: "-50%",
    width: "clamp(96px, 9vw, 132px)",
    aspectRatio: aspect || "1 / 1",
  };

  return (
    <>
      <MediaView
        workflow={workflow}
        item={item}
        mediaId={effectiveMediaId}
        src={url}
        isVideo={isVideo}
        status={status}
        aspect={propAspect || aspect}
        error={errorMsg}
        isLiked={isLiked}
        showLikedBadge={false}
        onLikeToggle={handleLike}
        progress={item?.progress ?? workflow?.progress}
        prompt={prompt}
        fit="cover"
        surface="card"
        videoRef={videoRef}
        playOnHover={!isSelectionMode}
        autoPlay={false}
        onVideoTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration) progress.set((v.currentTime / v.duration) * 100);
        }}
        onMouseLeave={() => {
          progress.set(0);
        }}
        draggable={false}
        isSelected={actionRules.can.select && isSelected}
        isSelectionMode={isSelectionMode}
        selectionEnabled={selectionEnabled && actionRules.can.select}
        onToggleSelect={actionRules.can.select ? onToggleSelect : null}
        data-draggable-card={canDrag ? "true" : undefined}
        onPointerDown={canDrag && !isRenaming ? handlePointerDown : undefined}
        onDragStartCapture={canDrag ? (e) => e.preventDefault() : undefined}
        onClick={isInFlight ? undefined : (!isRenaming || isSelectionMode ? (e) => {
          if (justDraggedRef.current) return;
          if (isSelectionMode && actionRules.can.select && onToggleSelect) {
            onToggleSelect(e);
            return;
          }
          if (!canNavigate) return;
          onClick(workflow, e);
        } : undefined)}
        showHoverOverlay={false}
        contextMenuItems={!isSelectionMode && actionRules.can.openMenu && (isDone || isError) ? menuItems : null}
        onRetry={actionRules.can.reusePrompt ? (e) => {
          e?.stopPropagation();
          handleReuseSettings();
        } : undefined}
        canReusePrompt={actionRules.can.reusePrompt}
        onDelete={actionRules.can.delete && canDelete ? (e) => {
          e?.stopPropagation();
          setIsDeleteConfirmOpen(true);
        } : undefined}
        className={cn(
          "shrink-0",
          isGalleryDragging && "opacity-50",
          canDrag && !isRenaming
            ? "cursor-grab active:cursor-grabbing"
            : (isSelectionMode && actionRules.can.select) || (canNavigate && !isRenaming)
              ? "cursor-pointer"
              : "cursor-default",
          className
        )}
        style={cardStyle}
        topLeft={isSelectionMode ? null : topLeft}
        topRight={
          isSelectionMode
            ? null
            : customTopRight !== null
            ? customTopRight
            : (actionRules.can.like && isDone && (
              <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
                <div className={cn(
                  "transition-opacity duration-200",
                  isLiked || isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <IconButton
                    variant="overlay"
                    onClick={(e) => { e.stopPropagation(); handleLike(); }}
                    aria-label={isLiked ? "Unlike generation" : "Like generation"}
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    <HugeIcon
                      name="favourite"
                      filled={isLiked}
                      className="text-white"
                    />
                  </IconButton>
                </div>
                <div className={cn(
                  "transition-opacity duration-200",
                  isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <StudioItemDropdownMenu
                    open={isDropdownOpen}
                    onOpenChange={setIsDropdownOpen}
                    items={menuItems}
                  />
                </div>
              </div>
            ))
        }
        bottomLeft={
          actionRules.can.rename && displayName && !isRenaming && (
            <div className={cn(
              "transition-opacity duration-200 pointer-events-auto",
              isError ? "max-w-[calc(100%-80px)]" : "max-w-[calc(100%-40px)]",
              showTileDetails ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <span
                title={displayName}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startRename();
                }}
                className="ds-type-small text-white/90 truncate cursor-text select-none block"
              >
                {truncatedDisplayName}
              </span>
            </div>
          )
        }
        bottom={
          !isSelectionMode && isDone && isVideo && (
            <div className="w-full h-0.5 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <motion.div
                className="h-full bg-white shadow-none"
                style={progressBarStyle}
              />
            </div>
          )
        }
      >
        <div ref={cardRef} className="absolute inset-0 pointer-events-none -z-10" />
      </MediaView>

      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={
          isError
            ? "Delete generation?"
            : entityType === "character"
              ? "Delete Character?"
              : entityType === "element"
                ? "Delete Element?"
                : isVideo
                  ? "Delete video?"
                  : "Delete image?"
        }
        description={
          isError
            ? "Are you sure you want to delete this failed generation?"
            : "This action cannot be undone."
        }
        onConfirm={handleDelete}
      />

      {isRenaming && !isSelectionMode && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-default"
            onPointerDown={(e) => {
              e.stopPropagation();
              if (canDismissRef.current) {
                setIsRenaming(false);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (canDismissRef.current) {
                setIsRenaming(false);
              }
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
              initialName={displayName || ""}
              onSave={handleRename}
              onCancel={() => setIsRenaming(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {isDragging && typeof window !== "undefined" && createPortal(
        <motion.div
          className="fixed top-0 left-0 z-50 pointer-events-none"
          style={dragGhostStyle}
        >
          {dragCount > 1 && (
            <div
              aria-hidden="true"
              data-slot="drag-stack-back"
              className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-3 rounded-comfortable bg-surface-card border border-border-subtle"
            />
          )}
          <div className="relative w-full h-full rounded-comfortable overflow-hidden border border-border-heavy bg-surface-secondary">
            {isVideo
              ? <video src={url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              : <img src={url} className="w-full h-full object-cover" alt="" />
            }
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

export default StudioMediaGridCard;
