import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Play, Heart, Trash2, X, Download, Wand2, Undo2, Plus, MoreVertical, Layers } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ImageStatusView } from "@/features/workflows/ui/ImageStatusView";
import { ButtonGroup } from "@/shared/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/shared/ui/context-menu";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { useWorkflowActions } from "@/features/workflows/model/useMediaActions";

import { ActionBtn } from "./ActionBtn";
import { spring, springGentle, fadeEase, slideEase, iconCls } from "./constants";

// ── Component ──────────────────────────────────────────────────────────────
export function MediaGridItem({
  workflow,
  item: propItem = null,
  className,
  onClick = () => {},
  onDragStart = () => {},
  onDragEnd = () => {},
}) {
  const {
    handleLike,
    handleDelete,
    handleDownload,
    handleReuseSettings,
    handleEdit,
    handleAnimate,
    handleAddToPrompt,
    isVideo,
    url,
    isLiked,
    status,
    aspect,
    prompt,
    item,
    canDelete,
  } = useWorkflowActions(workflow, propItem);

  if (!item) return null;

  const itemId = item.name ?? item.id;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const progress = useMotionValue(0);
  const progressWidth = useTransform(progress, (v) => `${v}%`);
  const videoRef = useRef(null);

  useEffect(() => {
    let frame;
    const update = () => {
      if (videoRef.current && !videoRef.current.paused && videoRef.current.duration) {
        const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        progress.set(p);
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [progress]);

  const isDone = status === "completed" && !!url;
  const isError = ["rejected", "failed", "error"].includes(status);
  const overlayPadding = "p-2";
  const canReuse = item?.workflowStepId === "CAE";
  const menuItems = [
    { key: "add", icon: Plus, label: "Add to prompt", onClick: handleAddToPrompt },
    { key: "like", icon: Heart, label: isLiked ? "Unlike" : "Like", iconClassName: cn(isLiked && "fill-white"), onClick: handleLike },
    ...(canReuse ? [
      { key: "edit", icon: Wand2, label: "Edit Image", onClick: handleEdit },
      { key: "reuse", icon: Undo2, label: "Reuse Settings", onClick: handleReuseSettings }
    ] : []),
    { key: "download", icon: Download, label: "Download", onClick: handleDownload },
    ...(!isVideo ? [{ key: "animate", icon: Wand2, label: "Animate Image", onClick: handleAnimate }] : []),
    { key: "delete", icon: Trash2, label: "Delete", disabled: !canDelete, onClick: () => setIsDeleteConfirmOpen(true) },
  ];

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            layoutId={`media-card-${itemId}`}
            transition={spring}
            draggable={isDone}
            onDragStart={(e) => {
              e.dataTransfer.setData("imageUrl", url);
              e.dataTransfer.setData("assetId", item.name || item.id);
              e.dataTransfer.setData("isVideo", String(isVideo));
              e.dataTransfer.effectAllowed = "copy";

              // Create a custom mini thumbnail for the drag ghost
              const dragDiv = document.createElement("div");
              dragDiv.style.position = "absolute";
              dragDiv.style.top = "-1000px";
              dragDiv.style.width = "80px";
              dragDiv.style.height = "80px";
              dragDiv.style.borderRadius = "12px";
              dragDiv.style.overflow = "hidden";
              dragDiv.style.border = "2px solid rgba(255, 255, 255, 0.5)";
              dragDiv.style.boxShadow = "0 8px 16px rgba(0,0,0,0.5)";
              
              const img = document.createElement("img");
              img.src = url;
              img.style.width = "100%";
              img.style.height = "100%";
              img.style.objectFit = "cover";
              
              dragDiv.appendChild(img);
              document.body.appendChild(dragDiv);
              
              // Center the thumbnail on the cursor
              e.dataTransfer.setDragImage(dragDiv, 40, 40);
              
              // Cleanup the temporary element from DOM
              setTimeout(() => {
                if (document.body.contains(dragDiv)) {
                  document.body.removeChild(dragDiv);
                }
              }, 100);

              onDragStart(e, { url, aspect, item });
            }}
            onDragEnd={onDragEnd}
            onClick={isDone ? onClick : undefined}
              className={cn(
                "group relative overflow-hidden bg-[#0a0a0a] rounded-2xl",
                "outline-2 outline-transparent transition-all duration-300",
                isDone ? "cursor-pointer active:cursor-grabbing shadow-lg hover:shadow-2xl" : "cursor-default",
                className
              )}
            style={{ width: "100%" }}
          >
            <ImageStatusView
              status={status}
              src={url}
              alt={prompt}
              aspect={aspect}
              error={item.error}
              showOverlay
              className="w-full h-full object-cover"
            >
              {isDone && isVideo && (
                <video
                  ref={videoRef}
                  src={url}
                  className="w-full h-full object-cover"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => { 
                    e.currentTarget.pause(); 
                    e.currentTarget.currentTime = 0;
                    progress.set(0);
                  }}
                  muted
                  loop
                />
              )}
            </ImageStatusView>

            {isDone && isVideo && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/20 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <motion.div className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ width: progressWidth }} />
              </div>
            )}

            {isDone && (
              <motion.div
                initial={false}
                className={cn(
                  "absolute inset-0 transition-opacity duration-200 flex flex-col justify-between z-10 pointer-events-none",
                  isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  overlayPadding
                )}
              >
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
                        {menuItems.map((m, i) => m.key === "separator" ? <DropdownMenuSeparator key={i} /> : (
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
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ButtonGroup>
                </div>
              </motion.div>
            )}

            {/* Bottom-right quick delete: only show when FAILED/REJECTED */}
            {isError && !isDone && (
              <div className={cn("absolute bottom-2 right-2 z-30 pointer-events-auto")}>
                <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg">
                  <ActionBtn
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!canDelete) return;
                      setIsDeleteConfirmOpen(true);
                    }}
                    disabled={!canDelete}
                    title={canDelete ? "Delete" : "Cannot delete while processing"}
                  >
                    <Trash2 className={iconCls} />
                  </ActionBtn>
                </ButtonGroup>
              </div>
            )}

            {isDone && (isVideo || item.is_liked || workflow.isMultiMedia) && (
              <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-none drop-shadow-md">
                {workflow.isMultiMedia && <Layers className="size-5 text-white drop-shadow-md" />}
                {workflow.is_liked && <Heart className="size-5 fill-white text-white drop-shadow-md" />}
                {isVideo && <div className="p-1 rounded-full bg-white shadow-md w-fit"><Play className="size-1.5 fill-black text-black" /></div>}
              </div>
            )}
          </motion.div>
        </ContextMenuTrigger>

        {isDone && (
          <ContextMenuContent className="w-48">
            {menuItems.map((m, i) => m.key === "separator" ? <ContextMenuSeparator key={i} /> : (
              <ContextMenuItem key={m.key} variant={m.variant} onClick={(e) => { e.stopPropagation(); m.onClick(); }}>
                <m.icon className={m.iconClassName} /> {m.label}
              </ContextMenuItem>
            ))}
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
    </>
  );
}

