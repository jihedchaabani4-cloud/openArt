import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { ButtonGroup } from "@/shared/ui/button-group";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { InlineRenamePill } from "@/shared/ui/InlineRenamePill";
import { useWorkflowActions } from "@/features/workflows/model/useMediaActions";
import { useUpdateWorkflow } from "@/features/workflows/api/workflowsApi";
import { usePromptStore } from "@/features/studio";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { ActionBtn } from "./ActionBtn";
import { StudioItemDropdownMenu } from "./StudioItemMenu";
import { getStudioMenuItems, getWorkflowEntityType } from "./studioMenuConfig";
import { CoreMediaItemView } from "@/widgets/CoreMediaItemView";
import { useUpdateFolder, useDeleteFolder, useFolderMove, useDownloadCollection } from "@/features/folders";

const EMPTY_IMG = typeof window !== 'undefined' ? (() => {
  const img = new Image();
  img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  return img;
})() : null;

const WorkflowMediaGridItem = React.memo(function WorkflowMediaGridItem({
  workflow,
  item: propItem = null,
  aspect: propAspect = null,
  className,
  onClick    = () => {},
  onDragStart = () => {},
  onDragEnd   = () => {},
  width:  albumWidth  = null,
  height: albumHeight = null,
  menuItems: propMenuItems = null,
}) {
  // ─────────────────────────────────────────────────────────────────────────
  // ALL HOOKS UNCONDITIONALLY AT THE TOP — React Rules of Hooks §1
  // No early returns, conditionals, or loops above this section.
  // ─────────────────────────────────────────────────────────────────────────

  const {
    handleLike, handleDelete, handleDownload,
    handleReuseSettings, handleAnimate, handleAddToPrompt,
    isVideo, url, isLiked, status, aspect, prompt, item, canDelete, canReuseSettings, canAddToPrompt,
  } = useWorkflowActions(workflow, propItem);

  // ── State ──────────────────────────────────────────────────────────────
  const [isDropdownOpen,      setIsDropdownOpen]      = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRenaming,          setIsRenaming]          = useState(false);
  const [isDragging,          setIsDragging]          = useState(false);
  const [cardRect,            setCardRect]            = useState(null);
  const [measuredWidth,       setMeasuredWidth]       = useState(albumWidth || 0);
  const [dragTarget,          setDragTarget]          = useState(null);
  
  const { mutateAsync: updateWorkflow } = useUpdateWorkflow();
  const showTileDetails = useWorkflowsStore(s => s.showTileDetails);
  const setShowTileDetails = useWorkflowsStore(s => s.setShowTileDetails);
  const isGalleryDragging = usePromptStore((s) => s.isDraggingGalleryItem);
  
  const toggleTileDetails = () => setShowTileDetails(!showTileDetails);


  // ── Motion values ──────────────────────────────────────────────────────
  const mouseX        = useMotionValue(-500);
  const mouseY        = useMotionValue(-500);
  const progress      = useMotionValue(0);
  const progressWidth = useTransform(progress, (v) => `${v}%`);

  // ── Refs ───────────────────────────────────────────────────────────────
  const videoRef  = useRef(null);
  const rafRef    = useRef(null);
  const lastPos   = useRef({ x: -500, y: -500 });
  const cardRef   = useRef(null);
  const canDismissRef = useRef(false);

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    usePromptStore.getState().setIsDraggingGalleryItem(false);
    usePromptStore.getState().setDraggedItem(null);
  }, []);

  // ── Block-cursor fix while dragging ───────────────────────────────────
  useEffect(() => {
    if (!isDragging) return;
    const hideBlockCursor = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
    window.addEventListener("dragover", hideBlockCursor);
    return () => window.removeEventListener("dragover", hideBlockCursor);
  }, [isDragging]);

  // ── Listen for drag target changes (collection hover / move-out hover) ──
  useEffect(() => {
    if (!isDragging) { setDragTarget(null); return; }
    const handler = (e) => setDragTarget(e.detail?.target ?? null);
    window.addEventListener("studio:drag-target-change", handler);
    return () => window.removeEventListener("studio:drag-target-change", handler);
  }, [isDragging]);

  // ── Throttled drag handler ─────────────────────────────────────────────
  const handleDrag = useCallback((e) => {
    if (e.clientX === 0 && e.clientY === 0) return;
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      mouseX.set(lastPos.current.x);
      mouseY.set(lastPos.current.y);
      rafRef.current = null;
    });
  }, [mouseX, mouseY]);

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

  // ─────────────────────────────────────────────────────────────────────────
  // SAFE EARLY RETURN — all hooks have already been called above
  // ─────────────────────────────────────────────────────────────────────────
  if (!item) return null;

  // ── Derived values (pure computation — no hooks) ───────────────────────
  const isDone   = status === "completed" && !!url;
  const isError  = ["rejected", "failed", "error"].includes(status);
  
  const isCharacter = entityType === "character";
  const isElement = entityType === "element";
  const isUploadType = entityType === "upload";
  const isGeneratedMedia = entityType === "generation";

  // Stricter check for generated content: must have generation config and strictly be generated media
  const hasConfig = !!(item?.generationConfig || workflow?.metadata?.generationConfig);
  const canReuse = hasConfig && isGeneratedMedia;
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

  // Responsively scale down text max length as the card gets smaller
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
    
    // Position directly UNDER the media card
    let top = cardRect.bottom + PADDING;
    if (spaceBelow < PILL_HEIGHT + 20) {
      // If close to bottom of screen, position inside bottom of card
      top = Math.max(12, cardRect.bottom - PILL_HEIGHT - PADDING);
    }
    
    // Align with left of the card, preventing offscreen overflow
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
      canAddToPrompt,
    },
  });

  const handleDragStart = (e) => {
    e.dataTransfer.setData("imageUrl",   url);
    e.dataTransfer.setData("assetId",    item?.name || item?.id || workflow?.id || "");
    e.dataTransfer.setData("isVideo",    String(isVideo));
    e.dataTransfer.setData("workflowId", workflow?.name || workflow?.id || "");
    e.dataTransfer.setData("itemType",   "workflow");
    e.dataTransfer.effectAllowed = "all";
    e.dataTransfer.setDragImage(EMPTY_IMG, 0, 0);
    lastPos.current = { x: e.clientX, y: e.clientY };
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
    setIsDragging(true);
    usePromptStore.getState().setIsDraggingGalleryItem(true);
    usePromptStore.getState().setDraggedItem({
      type: "workflow",
      id: workflow?.id || workflow?.name || item?.id,
      workflow,
      item,
      url,
    });
    onDragStart(e, { url, aspect, item });
  };

  const handleDragEnd = (e) => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setIsDragging(false);
    usePromptStore.getState().setIsDraggingGalleryItem(false);
    usePromptStore.getState().setDraggedItem(null);
    onDragEnd(e);
  };

  // Enable click if the current item is valid OR if the workflow has any other valid media
  const hasAnyValidMedia = workflow?.items?.some(i => ["completed", "processing"].includes(i.status));
  const canNavigate = isDone || status === "processing" || hasAnyValidMedia;

  const errorMsg = isError ? (
    item?.error ||
    workflow?.error ||
    "This prompt might violate our policies about generating sexual content. Please try a different prompt or send feedback."
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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <CoreMediaItemView
        workflow={workflow}
        item={item}
        src={url}
        isVideo={isVideo}
        status={status}
        aspect={propAspect || aspect}
        error={errorMsg}
        isLiked={isLiked}
        onLikeToggle={handleLike}
        progress={item?.progress ?? workflow?.progress}
        fit="cover"
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
        draggable={isDraggable && !isRenaming}
        onDragStart={isDraggable && !isRenaming ? handleDragStart : undefined}
        onDrag={isDraggable && !isRenaming ? handleDrag : undefined}
        onDragEnd={isDraggable && !isRenaming ? handleDragEnd : undefined}
        onClick={canNavigate && !isRenaming ? (e) => onClick(workflow, e) : undefined}
        showHoverOverlay={false}
        contextMenuItems={isDone ? menuItems : null}
        onRetry={(e) => {
          e?.stopPropagation();
          handleReuseSettings();
        }}
        onDelete={(e) => {
          e?.stopPropagation();
          setIsDeleteConfirmOpen(true);
        }}
        className={cn(
          "bg-[#0a0a0a] rounded-xl outline-2 outline-transparent transition-opacity duration-200",
          isGalleryDragging && "opacity-50",
          canNavigate && !isRenaming
            ? (isElementSheet ? "cursor-pointer shadow-lg hover:shadow-2xl" : "cursor-grab active:cursor-grabbing shadow-lg hover:shadow-2xl")
            : "cursor-default",
          className
        )}
        style={cardStyle}
        topRight={
          isDone && (
            <div className={cn(
              "transition-opacity duration-200 pointer-events-auto",
              isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg">
                <ActionBtn onClick={(e) => { e.stopPropagation(); handleLike(); }}>
                  <GoogleIcon 
                    iconName="favorite" 
                    fill={isLiked}
                    className="text-[13px] text-[#303031]" 
                  />
                </ActionBtn>
                {canReuse && (
                  <ActionBtn onClick={(e) => { e.stopPropagation(); handleReuseSettings(); }}>
                    <GoogleIcon iconName="history" className="text-[13px] text-[#303031]" />
                  </ActionBtn>
                )}
                <StudioItemDropdownMenu
                  open={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                  items={menuItems}
                />
              </ButtonGroup>
            </div>
          )
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
                className="text-white/90 truncate text-[11px] sm:text-[12px] font-semibold cursor-text select-none block"
              >
                {truncatedDisplayName}
              </span>
            </div>
          )
        }
        bottomRight={
          isDone && (isCharacter || isElement) && (
            <div
              className="flex items-center justify-center w-7 h-7 rounded-[7px] bg-white text-black shadow-lg shadow-black/40 pointer-events-none transition-all duration-200 group-hover:scale-105"
              title={isCharacter ? "Character" : "Element"}
            >
              <GoogleIcon
                iconName={isCharacter ? "accessibility_new" : "widgets"}
                fill
                weight={600}
                className="text-[16px] text-black"
              />
            </div>
          )
        }
        bottom={
          isDone && isVideo && (
            <div className="w-full h-0.5 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <motion.div
                className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                style={{ width: progressWidth }}
              />
            </div>
          )
        }
      >
        {/* DOM measurement anchor for rename popup */}
        <div ref={cardRef} className="absolute inset-0 pointer-events-none -z-10" />
      </CoreMediaItemView>

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

      {/* ── Dialog-like Rename Portal (Pill directly under media + full-screen dismissal backdrop) ── */}
      {isRenaming && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999]">
          {/* Layer 1 — Full-screen backdrop: blocks clicks to any other card, closes on click */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] cursor-default"
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

          {/* Layer 2 — Floating Pill positioned directly under the media card */}
          <div
            className="fixed z-[100000] pointer-events-auto"
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

      {/* ── Drag ghost portal ── */}
      {isDragging && createPortal(
        <motion.div
          className="fixed top-0 left-0 z-[99999] pointer-events-none flex flex-col items-center gap-2"
          style={(() => {
            let numericAspect = 1;
            if (typeof aspect === "number") {
              numericAspect = aspect;
            } else if (typeof aspect === "string" && aspect.includes("/")) {
              const [w, h] = aspect.split("/").map(Number);
              if (w && h) numericAspect = w / h;
            }
            return {
              x: mouseX,
              y: mouseY,
              translateX: "-50%",
              translateY: "-50%",
              width: numericAspect > 1 ? 120 : 120 * numericAspect,
            };
          })()}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <div
            className="rounded-[12px] overflow-hidden border-2 border-white/80 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
            style={(() => {
              let numericAspect = 1;
              if (typeof aspect === "number") {
                numericAspect = aspect;
              } else if (typeof aspect === "string" && aspect.includes("/")) {
                const [w, h] = aspect.split("/").map(Number);
                if (w && h) numericAspect = w / h;
              }
              return {
                width: numericAspect > 1 ? 120 : 120 * numericAspect,
                height: numericAspect > 1 ? 120 / numericAspect : 120,
              };
            })()}
          >
            {isVideo
              ? <video src={url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              : <img   src={url} className="w-full h-full object-cover" alt="" />
            }
          </div>
          {(dragTarget === "add-to-collection" || dragTarget === "move-out") && (
            <motion.div
              key={dragTarget}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium whitespace-nowrap shadow-lg"
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

const CollectionMediaGridItem = React.memo(function CollectionMediaGridItem({
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
  const { moveItem } = useFolderMove(projectId);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingThis, setIsDraggingThis] = useState(false);
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const lastPos = useRef({ x: -500, y: -500 });
  const rafRef = useRef(null);

  const cardRef = useRef(null);
  const canDismissRef = useRef(false);

  const collectionName = col?.name || "Untitled collection";
  const collectionTileOverlay = (
    <div className="collection-tile-scrim" />
  );

  const handleDragStart = (e) => {
    if (isRenaming) return;
    setIsDraggingThis(true);
    e.dataTransfer.setData("collectionId", col?.id || "");
    e.dataTransfer.setData("itemType", "collection");
    e.dataTransfer.effectAllowed = "all";
    e.dataTransfer.setDragImage(EMPTY_IMG, 0, 0);

    lastPos.current = { x: e.clientX, y: e.clientY };
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);

    usePromptStore.getState().setIsDraggingGalleryItem(true);
    usePromptStore.getState().setDraggedItem({
      type: "collection",
      id: col?.id,
      collection: col,
    });
  };

  const handleDrag = useCallback((e) => {
    if (e.clientX === 0 && e.clientY === 0) return;
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      mouseX.set(lastPos.current.x);
      mouseY.set(lastPos.current.y);
      rafRef.current = null;
    });
  }, [mouseX, mouseY]);

  const handleDragEnd = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setIsDraggingThis(false);
    usePromptStore.getState().setIsDraggingGalleryItem(false);
    usePromptStore.getState().setDraggedItem(null);
  };

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

    const currentDragged = usePromptStore.getState().draggedItem;
    const itemType = e.dataTransfer.getData("itemType") || currentDragged?.type;
    const targetFolderId = col?.id;

    if (!targetFolderId) return;

    if (itemType === "workflow" || currentDragged?.type === "workflow") {
      const itemId = e.dataTransfer.getData("workflowId") ||
                     currentDragged?.id ||
                     e.dataTransfer.getData("assetId");
      if (!itemId) return;

      moveItem({
        itemType: "workflow",
        itemId,
        targetFolderId,
        projectId,
      });
    } else if (itemType === "collection" || currentDragged?.type === "collection") {
      const draggedFolderId = e.dataTransfer.getData("collectionId") || currentDragged?.id;
      if (!draggedFolderId || draggedFolderId === targetFolderId) return;

      moveItem({
        itemType: "collection",
        itemId: draggedFolderId,
        targetFolderId,
        projectId,
      });
    }
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

  const handleDelete = () => {
    if (!col?.id || !projectId) return;
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
    deleteFolder({
      folderId: col.id,
      projectId,
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

  const menuItems = [
    {
      key: "like",
      label: isLiked ? "Unlike collection" : "Like collection",
      icon: "favorite",
      fill: isLiked,
      iconClassName: isLiked ? "text-red-400 fill-red-400" : undefined,
      onClick: handleToggleLike,
    },
    {
      key: "download",
      label: isDownloading ? "Downloading..." : "Download collection",
      icon: "download",
      disabled: isDownloading,
      onClick: handleDownload,
    },
    {
      key: "rename",
      label: "Rename",
      icon: "edit",
      onClick: startRename,
    },
    {
      key: "delete",
      label: "Delete",
      icon: "delete",
      variant: "destructive",
      onClick: () => setIsDeleteConfirmOpen(true),
    },
  ];

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
      if (isRenaming) return;
      const targetCol = col || collection || workflow;
      const targetId = targetCol?.id || targetCol?.name;
      if (onClick) {
        onClick(targetCol, e);
      } else if (targetId && projectId) {
        router.push(`/cinema-studio/${projectId}/collection/${targetId}`);
      }
    },
    [isRenaming, col, collection, workflow, onClick, projectId, router]
  );

  return (
    <>
      <CoreMediaItemView
        fit="cover"
        showHoverOverlay={false}
        contextMenuItems={menuItems}
        onClick={handleNavigate}
        isLiked={isLiked}
        onLikeToggle={handleToggleLike}
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "collection-tile",
          !coverUrl && "collection-tile-empty",
          isDragOver && "outline outline-2 outline-white",
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
            <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg">
              <ActionBtn
                onClick={handleToggleLike}
                title={isLiked ? "Unlike collection" : "Like collection"}
              >
                <GoogleIcon
                  iconName="favorite"
                  fill={isLiked}
                  className="text-[13px] text-[#303031]"
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
            <div className="title">
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
      </CoreMediaItemView>

      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete collection?"
        description={`Are you sure you want to delete collection "${collectionName}"?`}
        onConfirm={handleDelete}
        loading={isDeleting}
      />

      {isRenaming && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999]">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] cursor-default"
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
            className="fixed z-[100000] pointer-events-auto"
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
          className="fixed top-0 left-0 z-[99999] pointer-events-none overflow-hidden rounded-[18px] border border-white/70 bg-[#505050] shadow-[0_22px_70px_rgba(0,0,0,0.62)]"
          style={{
            x: mouseX,
            y: mouseY,
            translateX: "-50%",
            translateY: "-50%",
            width: "clamp(96px, 9vw, 132px)",
            aspectRatio: "1 / 1",
          }}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0)_50%,rgba(0,0,0,0.46)_100%)]" />
          <div className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-between gap-2">
            <h3 className="min-w-0 truncate text-[12px] font-medium leading-tight tracking-tight text-white/92">
              {collectionName}
            </h3>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-white/10 bg-[#343434]/95 text-white/90 shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
              <GoogleIcon iconName="folder" className="text-[16px]" />
            </div>
          </div>
        </motion.div>,
        document.body
      )}
    </>
  );
});

export const MediaGridItem = React.memo(function MediaGridItem(props) {
  if (
    props.itemType === "collection" ||
    props.collection ||
    props.workflow?.type === "collection" ||
    props.workflow?.isCollection
  ) {
    return <CollectionMediaGridItem {...props} />;
  }
  return <WorkflowMediaGridItem {...props} />;
});

export { CollectionMediaGridItem, CollectionMediaGridItem as CollectionGridItem };


