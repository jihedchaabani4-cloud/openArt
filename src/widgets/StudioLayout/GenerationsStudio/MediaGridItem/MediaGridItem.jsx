import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { ImageStatusView } from "@/features/workflows/ui/ImageStatusView";
import { ButtonGroup } from "@/shared/ui/button-group";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuTrigger,
} from "@/shared/ui/context-menu";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { useWorkflowActions } from "@/features/workflows/model/useMediaActions";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { ActionBtn } from "./ActionBtn";
import { springGentle, iconCls } from "./constants";

const EMPTY_IMG = typeof window !== 'undefined' ? (() => {
  const img = new Image();
  img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  return img;
})() : null;

export function MediaGridItem({
  workflow,
  item: propItem = null,
  className,
  onClick    = () => {},
  onDragStart = () => {},
  onDragEnd   = () => {},
  width:  albumWidth  = null,
  height: albumHeight = null,
  disableLayoutAnimation = false,
}) {
  // ─────────────────────────────────────────────────────────────────────────
  // ALL HOOKS UNCONDITIONALLY AT THE TOP — React Rules of Hooks §1
  // No early returns, conditionals, or loops above this section.
  // ─────────────────────────────────────────────────────────────────────────

  const {
    handleLike, handleDelete, handleDownload,
    handleReuseSettings, handleEdit, handleAnimate, handleAddToPrompt,
    handleSetParameters,
    isVideo, url, isLiked, status, aspect, prompt, item, canDelete, canReuseSettings,
  } = useWorkflowActions(workflow, propItem);

  // ── State ──────────────────────────────────────────────────────────────
  const [isDropdownOpen,      setIsDropdownOpen]      = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDragging,          setIsDragging]          = useState(false);
  
  const showTileDetails = useWorkflowsStore(s => s.showTileDetails);
  const setShowTileDetails = useWorkflowsStore(s => s.setShowTileDetails);
  
  const toggleTileDetails = () => setShowTileDetails(!showTileDetails);


  // ── Motion values ──────────────────────────────────────────────────────
  const mouseX        = useMotionValue(-500);
  const mouseY        = useMotionValue(-500);
  const progress      = useMotionValue(0);
  const progressWidth = useTransform(progress, (v) => `${v}%`);

  // ── Refs ───────────────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const rafRef   = useRef(null);
  const lastPos  = useRef({ x: -500, y: -500 });

  // ── Video scrub rAF loop ───────────────────────────────────────────────
  useEffect(() => {
    let frame;
    const tick = () => {
      const v = videoRef.current;
      if (v && !v.paused && v.duration)
        progress.set((v.currentTime / v.duration) * 100);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [progress]);

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

  // ─────────────────────────────────────────────────────────────────────────
  // SAFE EARLY RETURN — all hooks have already been called above
  // ─────────────────────────────────────────────────────────────────────────
  if (!item) return null;

  // ── Derived values (pure computation — no hooks) ───────────────────────
  const isDone   = status === "completed" && !!url;
  const isError  = ["rejected", "failed", "error"].includes(status);
  
  // Stricter check for generated content: must have generation config and not be an upload type
  const hasConfig = !!(item?.generationConfig || workflow?.metadata?.generationConfig);
  const isUploadType = workflow?.workflow_type === "UPLOAD" || workflow?.feed_type === "upload";
  const canReuse = hasConfig && !isUploadType;
  const isElementSheet = workflow?.workflow_type === "ELEMENT_SHEET";
  const isDraggable = isDone && !isElementSheet;

  const displayName = workflow?.metadata?.displayName || null;

  let menuItems = [
    { key: "add",      icon: "add",     label: "Add to prompt",            onClick: handleAddToPrompt },
    { key: "like",     icon: "favorite",    label: isLiked ? "Unlike" : "Like", iconClassName: cn(isLiked && "fill-white"), onClick: handleLike },
    ...(canReuse ? [
      { key: "reuse",  icon: "history",    label: "Reuse Settings",           onClick: handleReuseSettings },
    ] : []),
    { key: "download", icon: "download", label: "Download",                  onClick: handleDownload },
    { key: "separator" },
    { key: "tileDetails", icon: showTileDetails ? "visibility_off" : "visibility", label: showTileDetails ? "Hide tile details" : "Show tile details", onClick: toggleTileDetails },
    { key: "delete",   icon: "delete",   label: "Delete", disabled: !canDelete, onClick: () => setIsDeleteConfirmOpen(true) },
  ];

  if (isElementSheet) {
    menuItems = [
      { key: "reuse", icon: "history", label: "Reuse Settings", onClick: handleSetParameters },
      { key: "like",     icon: "favorite",    label: isLiked ? "Unlike" : "Like", iconClassName: cn(isLiked && "fill-white"), onClick: handleLike },
      { key: "download", icon: "download", label: "Download",                  onClick: handleDownload },
      { key: "separator" },
      { key: "tileDetails", icon: showTileDetails ? "visibility_off" : "visibility", label: showTileDetails ? "Hide tile details" : "Show tile details", onClick: toggleTileDetails },
      { key: "delete",   icon: "delete",   label: "Delete", disabled: !canDelete, onClick: () => setIsDeleteConfirmOpen(true) },
    ];
  }

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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            draggable={isDraggable}
            onDragStart={isDraggable ? handleDragStart : undefined}
            onDrag={isDraggable ? handleDrag : undefined}
            onDragEnd={isDraggable ? handleDragEnd : undefined}
            onClick={canNavigate ? onClick : undefined}
            className={cn(
              "group relative overflow-hidden bg-[#0a0a0a] rounded-2xl",
              "outline-2 outline-transparent",
              canNavigate
                ? (isElementSheet ? "cursor-pointer shadow-lg hover:shadow-2xl" : "cursor-grab active:cursor-grabbing shadow-lg hover:shadow-2xl")
                : "cursor-default",
              className
            )}
            style={
              albumWidth && albumHeight
                ? {
                    width: albumWidth,
                    height: albumHeight,
                    willChange: "auto",
                  }
                : {
                    width: "100%",
                    aspectRatio: aspect,
                    willChange: "auto",
                  }
            }
          >
            {/* ── Media ── */}
            <ImageStatusView
              status={status}
              src={url}
              alt={prompt}
              aspect={aspect}
              error={item.error}
              showOverlay
              className="w-full h-full object-cover relative z-0"
            >
              {isDone && isVideo && (
                <video
                  ref={videoRef}
                  src={url}
                  className="w-full h-full object-cover"
                  onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                    progress.set(0);
                  }}
                  muted loop
                />
              )}
            </ImageStatusView>

            {/* ── Video scrub bar ── */}
            {isDone && isVideo && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/20 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <motion.div
                  className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  style={{ width: progressWidth }}
                />
              </div>
            )}

            {/* ── Hover overlay ── */}
            {isDone && (
              <div className={cn(
                "absolute inset-0 transition-opacity duration-200 flex flex-col justify-between z-10 pointer-events-none p-2",
                isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}>
                <div className="flex justify-end pointer-events-auto">
                  <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg">
                    <ActionBtn onClick={(e) => { e.stopPropagation(); handleLike(); }}>
                      <GoogleIcon 
                        iconName={isLiked ? "favorite" : "favorite"} 
                        fill={isLiked}
                        className={cn("text-[13px]", isLiked ? "text-[#303031]" : "text-[#303031]")} 
                      />
                    </ActionBtn>
                    {canReuse && !isElementSheet && (
                      <ActionBtn onClick={(e) => { e.stopPropagation(); handleReuseSettings(); }}>
                        <GoogleIcon iconName="history" className="text-[13px] text-[#303031]" />
                      </ActionBtn>
                    )}
                    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <ActionBtn onClick={(e) => e.stopPropagation()}>
                          <GoogleIcon iconName="more_vert" className="text-[13px] text-[#303031]" />
                        </ActionBtn>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {menuItems.map((m, i) =>
                          m.key === "separator"
                            ? <DropdownMenuSeparator key={i} />
                            : (
                              <DropdownMenuItem
                                key={m.key}
                                variant={m.variant}
                                disabled={m.disabled}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (m.disabled) return;
                                  setIsDropdownOpen(false);
                                  m.onClick();
                                }}
                              >
                                <GoogleIcon 
                                    iconName={m.icon} 
                                    className={cn("text-[13px] mr-2", m.iconClassName)} 
                                    fill={m.key === "like" && isLiked}
                                /> 
                                {m.label}
                              </DropdownMenuItem>
                            )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ButtonGroup>
                </div>
              </div>
            )}

            {/* ── Error quick-actions ── */}
            {isError && !isDone && (
              <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
                <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg">
                  {canReuse && (
                    <ActionBtn onClick={(e) => { e.stopPropagation(); handleReuseSettings(); }} title="Reuse Settings">
                      <GoogleIcon iconName="history" className="text-[13px] text-[#303031]" />
                    </ActionBtn>
                  )}
                  <ActionBtn
                    onClick={(e) => { e.stopPropagation(); if (canDelete) setIsDeleteConfirmOpen(true); }}
                    disabled={!canDelete}
                    title={canDelete ? "Delete" : "Cannot delete while processing"}
                  >
                    <GoogleIcon iconName="delete" className="text-[13px] text-[#303031]" />
                  </ActionBtn>
                </ButtonGroup>
              </div>
            )}

            {/* ── Corner badges ── */}
            {isDone && (isLiked || isVideo || workflow.isMultiMedia) && (
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none drop-shadow-md">
                {workflow.isMultiMedia && (
                  <GoogleIcon iconName="layers" className="text-[12px] text-white" />
                )}
                {isLiked && (
                  <GoogleIcon iconName="favorite" fill className="text-[12px] text-white" />
                )}
                {isVideo && (
                  <GoogleIcon iconName="play_arrow" fill className="text-[12px] text-white" />
                )}
              </div>
            )}

            {/* ── Display name label ── */}
            {displayName && (
              <div className={cn(
                "absolute bottom-0 left-0 right-0 z-20 pointer-events-none transition-opacity duration-200",
                showTileDetails ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}>
                <div className="px-2 py-1.5 flex items-center gap-1.5">
                  {isElementSheet
                    ? <GoogleIcon iconName="layers" className="text-[12px] text-white shrink-0" />
                    : isVideo
                      ? <GoogleIcon iconName="play_arrow" fill className="text-[12px] text-white shrink-0" />
                      : <GoogleIcon iconName="image" className="text-[12px] text-white shrink-0" />
                  }
                  <span
                    className="text-white/90 truncate text-[12px] font-semibold max-w-[80%]"
                  >
                    {displayName}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </ContextMenuTrigger>

        {isDone && (
          <ContextMenuContent className="w-48">
            {menuItems.map((m, i) =>
              m.key === "separator"
                ? <ContextMenuSeparator key={i} />
                : (
                  <ContextMenuItem key={m.key} variant={m.variant} onClick={(e) => { e.stopPropagation(); m.onClick(); }}>
                    <GoogleIcon 
                        iconName={m.icon} 
                        className={cn("text-[14px] mr-2", m.iconClassName)} 
                        fill={m.key === "like" && isLiked}
                    /> 
                    {m.label}
                  </ContextMenuItem>
                )
            )}
          </ContextMenuContent>
        )}
      </ContextMenu>

      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={isVideo ? "Supprimer la vidéo ?" : "Supprimer l'image ?"}
        description="Cette action est irréversible."
        onConfirm={handleDelete}
      />

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
}
