import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { useUpdateFolder, useDeleteFolder } from "@/features/folders";

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
  
  const { mutateAsync: updateWorkflow } = useUpdateWorkflow();
  const showTileDetails = useWorkflowsStore(s => s.showTileDetails);
  const setShowTileDetails = useWorkflowsStore(s => s.setShowTileDetails);
  
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
    e.dataTransfer.setData("assetId",    item.name || item.id);
    e.dataTransfer.setData("isVideo",    String(isVideo));
    e.dataTransfer.setData("workflowId", workflow?.name || workflow?.id || "");
    e.dataTransfer.effectAllowed = "all";
    e.dataTransfer.setDragImage(EMPTY_IMG, 0, 0);
    lastPos.current = { x: e.clientX, y: e.clientY };
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
    setIsDragging(true);
    usePromptStore.getState().setIsDraggingGalleryItem(true);
    usePromptStore.getState().setDraggedItem(item);
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
          "bg-[#0a0a0a] rounded-2xl outline-2 outline-transparent",
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
          className="fixed top-0 left-0 z-[99999] pointer-events-none rounded-[12px] overflow-hidden border-2 border-white/80 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
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
              x: mouseX, 
              y: mouseY,
              translateX: "-50%", 
              translateY: "-50%",
            };
          })()}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {isVideo
            ? <video src={url} className="w-full h-full object-cover" muted loop autoPlay playsInline />
            : <img   src={url} className="w-full h-full object-cover" alt="" />
          }
        </motion.div>,
        document.body
      )}
    </>
  );
});

const CollectionMediaGridItem = React.memo(function CollectionMediaGridItem({
  collection,
  workflow,
  className,
  onClick,
  width: albumWidth = null,
  height: albumHeight = null,
  aspect = null,
  projectId: propProjectId = null,
}) {
  const col = collection || workflow;
  const storeProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const projectId = propProjectId || storeProjectId;
  const setActiveCollectionId = useWorkflowsStore((s) => s.setActiveCollectionId);
  const activeCollectionId = useWorkflowsStore((s) => s.activeCollectionId);

  const [isLiked, setIsLiked] = useState(Boolean(col?.favorited || col?.is_liked));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [cardRect, setCardRect] = useState(null);

  const { mutateAsync: updateFolder } = useUpdateFolder();
  const { mutateAsync: deleteFolder, isPending: isDeleting } = useDeleteFolder();

  const cardRef = useRef(null);
  const canDismissRef = useRef(false);

  const collectionName = col?.name || "Untitled collection";

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

  const handleRename = async (newName) => {
    if (!col?.id || !projectId) return;
    await updateFolder({
      folderId: col.id,
      patch: { name: newName },
      projectId,
    });
  };

  const handleDelete = async () => {
    if (!col?.id || !projectId) return;
    try {
      await deleteFolder({
        folderId: col.id,
        projectId,
      });
      if (activeCollectionId === col.id) {
        setActiveCollectionId(null);
      }
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      alert(err.message || "Cannot delete collection with items inside");
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

  const menuItems = [
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
        height: albumHeight,
        aspectRatio: `${albumWidth} / ${albumHeight}`,
        transform: "translateZ(0)",
        contain: "paint layout",
        contentVisibility: "auto",
        containIntrinsicSize: `${Math.round(albumWidth)}px ${Math.round(albumHeight)}px`,
      }
    : {
        width: "100%",
        aspectRatio: aspect || "4/3",
        transform: "translateZ(0)",
        contain: "paint layout",
        contentVisibility: "auto",
      };

  return (
    <>
      <CoreMediaItemView
        fit="cover"
        showHoverOverlay={false}
        contextMenuItems={menuItems}
        onClick={(e) => {
          if (!isRenaming) {
            if (onClick) {
              onClick(col, e);
            } else if (col?.id) {
              setActiveCollectionId(col.id);
            }
          }
        }}
        className={cn(
          "bg-[#323438] hover:bg-[#383a3f] transition-colors border-0 cursor-pointer shadow-xl",
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
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLiked((v) => !v);
                }}
                title={isLiked ? "Unlike collection" : "Like collection"}
              >
                <GoogleIcon
                  iconName="favorite"
                  fill={isLiked}
                  className={cn("text-[13px]", isLiked ? "text-red-500" : "text-[#303031]")}
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
        bottomLeft={
          !isRenaming && (
            <div className="pointer-events-auto max-w-full">
              <h3
                title={collectionName}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startRename();
                }}
                className="text-[20px] sm:text-[22px] font-medium text-white/95 tracking-tight leading-snug line-clamp-2 px-1 select-none"
              >
                {collectionName}
              </h3>
            </div>
          )
        }
      >
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


