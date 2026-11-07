import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { ButtonGroup } from "@/shared/ui/button-group";
import { ConfirmDeleteDialog } from "@/shared/ui/ConfirmDeleteDialog";
import { InlineRenamePill } from "@/shared/ui/InlineRenamePill";
import { useWorkflowActions } from "@/features/workflows/model/useMediaActions";
import { useUpdateWorkflow } from "@/features/workflows/api/workflowsApi";
import { usePromptStore, useStudioItemDrag } from "@/features/studio";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { ActionBtn } from "./ActionBtn";
import { StudioItemDropdownMenu } from "./StudioItemMenu";
import { getStudioMenuItems, getWorkflowEntityType } from "./studioMenuConfig";
import { MediaView } from "@/features/media";

export const StudioMediaGridCard = React.memo(function StudioMediaGridCard({
  workflow,
  item: propItem = null,
  mediaId = null,
  aspect: propAspect = null,
  className,
  onClick = () => {},
  onDragStart = () => {},
  onDragEnd = () => {},
  width: albumWidth = null,
  height: albumHeight = null,
  menuItems: propMenuItems = null,
  topLeft = null,
  topRight: customTopRight = null,
  projectId: propProjectId = null,
  ...props
}) {
  const effectiveMediaId = mediaId || (typeof propItem === "string" ? propItem : null);
  const resolvedItem = (typeof propItem === "object" && propItem !== null)
    ? propItem
    : (workflow?.items?.find((i) => (i.id || i.name || i.asset_id) === effectiveMediaId) || (effectiveMediaId ? { id: effectiveMediaId } : null));

  const effectiveProjectId = propProjectId || workflow?.projectId || workflow?.project_id || null;

  const {
    handleLike, handleDelete, handleDownload,
    handleReuseSettings, handleAnimate, handleAddToPrompt,
    isVideo, url, isLiked, status, aspect, prompt, item, canDelete, canReuseSettings, showReuseSettings, canAddToPrompt,
  } = useWorkflowActions(workflow, resolvedItem, { projectId: effectiveProjectId });

  // ── State ──────────────────────────────────────────────────────────────
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [cardRect, setCardRect] = useState(null);
  const [measuredWidth, setMeasuredWidth] = useState(albumWidth || 0);

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

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    usePromptStore.getState().setIsDraggingGalleryItem(false);
    usePromptStore.getState().setDraggedItem(null);
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
  const isDone = status === "completed" && !!url;
  const isError = ["rejected", "failed", "error"].includes(status);

  const isCharacter = entityType === "character";
  const isElement = entityType === "element";

  const canReuse = canReuseSettings;
  const isElementSheet = isElement;
  const isDraggable = isDone && !isElementSheet && !isCharacter;

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
      isLiked,
      isVideo,
      showTileDetails,
      canDelete,
      canReuse,
      showReuse: showReuseSettings,
      canAddToPrompt,
    },
  });

  const wfId = workflow?.name || workflow?.id || item?.workflow_id || item?.id;
  const {
    handlePointerDown,
    isDragging,
    dragTarget,
    justDraggedRef,
  } = useStudioItemDrag({
    itemType: "workflow",
    item: workflow || item,
    itemId: wfId,
    url,
    isDraggable,
    isRenaming,
    mouseX,
    mouseY,
    lastPos,
  });

  if (!item) return null;

  const hasAnyValidMedia = workflow?.items?.some((i) => ["completed", "processing"].includes(i.status));
  const canNavigate = isDone || status === "processing" || hasAnyValidMedia;

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
        onLikeToggle={handleLike}
        progress={item?.progress ?? workflow?.progress}
        fit="cover"
        surface="card"
        videoRef={videoRef}
        playOnHover={true}
        autoPlay={false}
        onVideoTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration) progress.set((v.currentTime / v.duration) * 100);
        }}
        onMouseLeave={() => {
          progress.set(0);
        }}
        draggable={false}
        onPointerDown={isDraggable && !isRenaming ? handlePointerDown : undefined}
        onClick={canNavigate && !isRenaming ? (e) => {
          if (justDraggedRef.current) return;
          onClick(workflow, e);
        } : undefined}
        showHoverOverlay={false}
        contextMenuItems={isDone || isError ? menuItems : null}
        onRetry={(e) => {
          e?.stopPropagation();
          handleReuseSettings();
        }}
        canReusePrompt={canReuse}
        onDelete={(e) => {
          e?.stopPropagation();
          setIsDeleteConfirmOpen(true);
        }}
        className={cn(
          isGalleryDragging && "opacity-50",
          canNavigate && !isRenaming
            ? (isElementSheet ? "cursor-pointer" : "cursor-grab active:cursor-grabbing")
            : "cursor-default",
          className
        )}
        style={cardStyle}
        topLeft={topLeft}
        topRight={
          customTopRight !== null
            ? customTopRight
            : (isDone && (
              <div className={cn(
                "transition-opacity duration-200 pointer-events-auto",
                isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}>
                <ButtonGroup variant="pill">
                  <ActionBtn
                    onClick={(e) => { e.stopPropagation(); handleLike(); }}
                    aria-label={isLiked ? "Unlike generation" : "Like generation"}
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    <GoogleIcon
                      iconName="favorite"
                      fill={isLiked}
                      className="text-xs text-neutral-800"
                    />
                  </ActionBtn>
                  {showReuseSettings && canReuse && (
                    <ActionBtn
                      onClick={(e) => { e.stopPropagation(); handleReuseSettings(); }}
                      aria-label="Reuse generation prompt settings"
                      title="Reuse settings"
                    >
                      <GoogleIcon iconName="history" className="text-xs text-neutral-800" />
                    </ActionBtn>
                  )}
                  <StudioItemDropdownMenu
                    open={isDropdownOpen}
                    onOpenChange={setIsDropdownOpen}
                    items={menuItems}
                  />
                </ButtonGroup>
              </div>
            ))
        }
        bottomLeft={
          displayName && !isRenaming && (
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
                className="text-white/90 truncate text-xs font-semibold cursor-text select-none block"
              >
                {truncatedDisplayName}
              </span>
            </div>
          )
        }
        bottomRight={
          isDone && (isCharacter || isElement) && (
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white text-black shadow-none pointer-events-none transition-all duration-200 group-hover:scale-105"
              title={isCharacter ? "Character" : "Element"}
            >
              <GoogleIcon
                iconName={isCharacter ? "accessibility_new" : "widgets"}
                fill
                weight={600}
                className="text-base text-black"
              />
            </div>
          )
        }
        bottom={
          isDone && isVideo && (
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

      {isRenaming && typeof window !== "undefined" && createPortal(
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
          className="fixed top-0 left-0 z-50 pointer-events-none flex items-center gap-2"
          style={dragGhostStyle}
        >
          <div className="w-full h-full rounded-xxxs overflow-hidden border border-white/70 shadow-none bg-neutral-700">
            {isVideo
              ? <video src={url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              : <img src={url} className="w-full h-full object-cover" alt="" />
            }
          </div>
          {(dragTarget === "add-to-collection" || dragTarget === "move-out") && (
            <motion.div
              key={dragTarget}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              className="px-3 py-1.5 rounded-sm bg-surface-elevated border border-white/20 text-white text-xs font-medium whitespace-nowrap shadow-none"
            >
              {dragTarget === "add-to-collection" ? "Add to collection" : "Move out of collection"}
            </motion.div>
          )}
        </motion.div>,
        document.body
      )}
    </>
  );
});

export default StudioMediaGridCard;
