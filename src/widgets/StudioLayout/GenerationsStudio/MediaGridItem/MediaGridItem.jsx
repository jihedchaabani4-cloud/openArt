import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Play, Heart, Trash2, Download, Wand2, Undo2, Plus, MoreVertical, Layers } from "lucide-react";
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
import { ActionBtn } from "./ActionBtn";
import { spring, iconCls } from "./constants";

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
}) {
  const {
    handleLike, handleDelete, handleDownload,
    handleReuseSettings, handleEdit, handleAnimate, handleAddToPrompt,
    isVideo, url, isLiked, status, aspect, prompt, item, canDelete,
  } = useWorkflowActions(workflow, propItem);

  if (!item) return null;

  const itemId = item.name ?? item.id;

  const [isDropdownOpen,      setIsDropdownOpen]      = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDragging,          setIsDragging]          = useState(false);

  const mouseX        = useMotionValue(-500);
  const mouseY        = useMotionValue(-500);
  const progress      = useMotionValue(0);
  const progressWidth = useTransform(progress, (v) => `${v}%`);
  const videoRef      = useRef(null);

  // rAF ref — avoid scheduling multiple frames
  const rafRef     = useRef(null);
  // last known good position — never overwrite with (0,0)
  const lastPos    = useRef({ x: -500, y: -500 });

  // ── video scrub ────────────────────────────────────────────────────────
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

  const isDone  = status === "completed" && !!url;
  const isError = ["rejected", "failed", "error"].includes(status);
  const canReuse = item?.workflowStepId === "CAE";

  const menuItems = [
    { key: "add",      icon: Plus,     label: "Add to prompt",   onClick: handleAddToPrompt },
    { key: "like",     icon: Heart,    label: isLiked ? "Unlike" : "Like", iconClassName: cn(isLiked && "fill-white"), onClick: handleLike },
    ...(canReuse ? [
      { key: "edit",   icon: Wand2,    label: "Edit Image",      onClick: handleEdit },
      { key: "reuse",  icon: Undo2,    label: "Reuse Settings",  onClick: handleReuseSettings },
    ] : []),
    { key: "download", icon: Download, label: "Download",        onClick: handleDownload },
    ...(!isVideo ? [{ key: "animate", icon: Wand2, label: "Animate Image", onClick: handleAnimate }] : []),
    { key: "delete",   icon: Trash2,   label: "Delete", disabled: !canDelete, onClick: () => setIsDeleteConfirmOpen(true) },
  ];

  // ── drag handlers ──────────────────────────────────────────────────────
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

  const handleDrag = useCallback((e) => {
    // Chrome fires (0,0) right before dragend — ignore it
    if (e.clientX === 0 && e.clientY === 0) return;

    lastPos.current = { x: e.clientX, y: e.clientY };

    // throttle to one DOM write per animation frame
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      mouseX.set(lastPos.current.x);
      mouseY.set(lastPos.current.y);
      rafRef.current = null;
    });
  }, [mouseX, mouseY]);

  const handleDragEnd = (e) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsDragging(false);
    usePromptStore.getState().setIsDraggingGalleryItem(false);
    usePromptStore.getState().setDraggedItem(null);
    onDragEnd(e);
  };

  // cleanup on unmount
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // Safety check: ensure we don't leave the UI in a dragging state
    usePromptStore.getState().setIsDraggingGalleryItem(false);
    usePromptStore.getState().setDraggedItem(null);
  }, []);

  // ── Global block-cursor fix ────────────────────────────────────────────
  // HTML5 drag forces a 🚫 cursor if hovering over non-drop zones.
  // This cleanly neutralizes it globally only while dragging.
  useEffect(() => {
    if (!isDragging) return;
    const hideBlockCursor = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
    window.addEventListener("dragover", hideBlockCursor);
    return () => window.removeEventListener("dragover", hideBlockCursor);
  }, [isDragging]);

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            layoutId={`media-card-${itemId}`}
            transition={spring}
            draggable={isDone}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onClick={(isDone || status === "processing") ? onClick : undefined}
            className={cn(
              "group relative overflow-hidden bg-[#0a0a0a] rounded-2xl",
              "outline-2 outline-transparent transition-all duration-300",
              (isDone || status === "processing")
                ? "cursor-grab active:cursor-grabbing shadow-lg hover:shadow-2xl"
                : "cursor-default",
              className
            )}
            style={
              albumWidth && albumHeight
                ? { width: albumWidth, height: albumHeight }
                : { width: "100%", aspectRatio: aspect }
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
                      <Heart className={cn(iconCls, isLiked && "fill-[#303031] text-[#303031]")} />
                    </ActionBtn>
                    {canReuse && (
                      <ActionBtn onClick={(e) => { e.stopPropagation(); handleReuseSettings(); }}>
                        <Undo2 className={iconCls} />
                      </ActionBtn>
                    )}
                    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <ActionBtn onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className={iconCls} />
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
                                <m.icon className={m.iconClassName} /> {m.label}
                              </DropdownMenuItem>
                            )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ButtonGroup>
                </div>
              </div>
            )}

            {/* ── Error quick-delete ── */}
            {isError && !isDone && (
              <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
                <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg">
                  <ActionBtn
                    onClick={(e) => { e.stopPropagation(); if (canDelete) setIsDeleteConfirmOpen(true); }}
                    disabled={!canDelete}
                    title={canDelete ? "Delete" : "Cannot delete while processing"}
                  >
                    <Trash2 className={iconCls} />
                  </ActionBtn>
                </ButtonGroup>
              </div>
            )}

            {/* ── Corner badges ── */}
            {isDone && (isVideo || item.is_liked || workflow.isMultiMedia) && (
              <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-none drop-shadow-md">
                {workflow.isMultiMedia && <Layers className="size-5 text-white drop-shadow-md" />}
                {workflow.is_liked     && <Heart  className="size-5 fill-white text-white drop-shadow-md" />}
                {isVideo && (
                  <div className="p-1 rounded-full bg-white shadow-md w-fit">
                    <Play className="size-1.5 fill-black text-black" />
                  </div>
                )}
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
                    <m.icon className={m.iconClassName} /> {m.label}
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

      {/* ── Drag ghost ── */}
      {isDragging && createPortal(
        <motion.div
          className="fixed top-0 left-0 z-[99999] pointer-events-none rounded-[12px] overflow-hidden border-2 border-white/80 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          style={{
            width: aspect > 1 ? 120 : 120 * (aspect || 1),
            height: aspect > 1 ? 120 / (aspect || 1) : 120,
            x: mouseX, y: mouseY,
            translateX: "-50%", translateY: "-50%",
          }}
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