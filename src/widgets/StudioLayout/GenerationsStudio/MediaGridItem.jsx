import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Play, Heart, Trash2, X, Download, Wand2, Undo2, Plus, MoreVertical, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import ImageStatusView from "@/features/generations/ui/ImageStatusView";
import { ImageInfoSidebar } from "@/widgets/dialogs/ImageInfoSidebar";
import { getItemMetadata } from "@/shared/lib/generationUtils";
import { useMediaActions } from "@/features/generations/model/useMediaActions";
import { Button } from "@/shared/ui/button";
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

// ── Shared transition presets ──────────────────────────────────────────────
const spring = {
  type: "spring",
  stiffness: 380,
  damping: 38,
  mass: 0.8,
};

const springGentle = {
  type: "spring",
  stiffness: 260,
  damping: 32,
  mass: 0.9,
};

const fadeEase = {
  duration: 0.22,
  ease: [0.25, 0.1, 0.25, 1],
};

const slideEase = {
  duration: 0.28,
  ease: [0.32, 0.72, 0, 1],
};

// ── Shared icon class ──────────────────────────────────────────────────────
const iconCls = "size-4";

// ── Shared menu item data ──────────────────────────────────────────────────
function useMenuItems(item, isVideo, actions, onDeleteClick) {
  return [
    {
      key: "add",
      icon: Plus,
      label: "Add to prompt",
      onClick: actions.handleAddToPrompt,
    },
    {
      key: "like",
      icon: Heart,
      label: item.is_liked ? "Unlike" : "Like",
      iconClassName: cn(item.is_liked && "fill-white"),
      onClick: actions.handleLike,
    },
    {
      key: "reuse",
      icon: Undo2,
      label: "Reuse Settings",
      onClick: actions.handleReuseSettings,
    },
    {
      key: "download",
      icon: Download,
      label: "Download",
      onClick: actions.handleDownload,
    },
    ...(!isVideo ? [{
      key: "animate",
      icon: Wand2,
      label: "Animate Image",
      onClick: actions.handleAnimate,
    }] : []),
    { key: "separator" },
    {
      key: "delete",
      icon: Trash2,
      label: "Delete",
      variant: "destructive",
      onClick: onDeleteClick,
    },
  ];
}

// ── Component ──────────────────────────────────────────────────────────────
export function MediaGridItem({
  item,
  group,
  showPrompt = false,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
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

  const actions = useMediaActions(item, group);
  const { isVideo, url, aspect, status } = getItemMetadata(item, group);
  const prompt = actions.config.prompt;

  const isDone = status === "completed" && !!url;
  const isError = ["rejected", "failed", "error"].includes(status);

  const isSmallGrid = className?.includes("h-[250px]");
  const overlayPadding = isSmallGrid ? "p-3" : "p-2";

  const menuItems = useMenuItems(item, isVideo, actions, () => setIsDeleteConfirmOpen(true));

  // ── Dropdown version ──
  const dropdownMenuItems = (
    <>
      {menuItems.map((m) =>
        m.key === "separator" ? (
          <DropdownMenuSeparator key="sep" />
        ) : (
          <DropdownMenuItem
            key={m.key}
            variant={m.variant}
            onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); m.onClick(); }}
          >
            <m.icon className={m.iconClassName} />
            {m.label}
          </DropdownMenuItem>
        )
      )}
    </>
  );

  // ── Context menu version ──
  const contextMenuItems = (
    <>
      {menuItems.map((m) =>
        m.key === "separator" ? (
          <ContextMenuSeparator key="sep" />
        ) : (
          <ContextMenuItem
            key={m.key}
            variant={m.variant}
            onClick={(e) => { e.stopPropagation(); m.onClick(); }}
          >
            <m.icon className={m.iconClassName} />
            {m.label}
          </ContextMenuItem>
        )
      )}
    </>
  );

  return (
    <>
      {/* ── Grid Card ── */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            layoutId={`media-card-${item.id}`}
            transition={spring}
            draggable={isDone}
            onDragStart={(e) => {
              if (!isDone) return;
              e.dataTransfer.setData("imageUrl", url);
              if (item.asset_id) e.dataTransfer.setData("assetId", item.asset_id);
              e.dataTransfer.effectAllowed = "copy";

              import("@/features/generations/model/useGenerationsStore").then(({ useGenerationsStore }) => {
                useGenerationsStore.getState().setDraggedImage({ url, aspect, x: e.clientX, y: e.clientY });
              });

              const dragImg = new Image();
              dragImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
              e.dataTransfer.setDragImage(dragImg, 0, 0);
            }}
            onDragEnd={() => {
              import("@/features/generations/model/useGenerationsStore").then(({ useGenerationsStore }) => {
                useGenerationsStore.getState().clearDraggedImage();
              });
            }}
            onClick={() => { if (isDone) setIsOpen(true); }}
            className={cn(
              "group relative overflow-hidden bg-[#0a0a0a]",
              "outline-2 outline-transparent transition-[outline-color] duration-200",
              "cursor-grab active:cursor-grabbing",
              className
            )}
            style={{ width: "100%", height: "100%" }}
          >
            <ImageStatusView
              status={status}
              src={url}
              alt={prompt}
              aspect={aspect}
              error={item.error}
              showOverlay
              onCancel={isError ? actions.handleDelete : undefined}
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
                <motion.div 
                  className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  style={{ width: progressWidth }}
                />
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
                    <ActionBtn onClick={(e) => { e.stopPropagation(); actions.handleLike(); }}>
                      <Heart className={cn(iconCls, item.is_liked && "fill-[#303031] text-[#303031]")} />
                    </ActionBtn>

                    <ActionBtn onClick={(e) => { e.stopPropagation(); actions.handleReuseSettings(); }}>
                      <Undo2 className={iconCls} />
                    </ActionBtn>

                    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <ActionBtn onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className={iconCls} />
                        </ActionBtn>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {dropdownMenuItems}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ButtonGroup>
                </div>

              </motion.div>
            )}

            {isDone && (isVideo || item.is_liked) && (
              <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-none drop-shadow-md">
                {item.is_liked && (
                  <Heart className="size-4 fill-white text-white drop-shadow-md" />
                )}
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
            {contextMenuItems}
          </ContextMenuContent>
        )}
      </ContextMenu>

      {/* ── Expanded View ── */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeEase}
              className="fixed inset-0 z-5"
              onClick={() => setIsOpen(false)}
            />

            {!isVideo && (
              <motion.div
                key="blur-bg"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed inset-0 z-50 blur-xl bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url(${url})` }}
              />
            )}

            <motion.div
              key="expanded"
              layoutId={`media-card-${item.id}`}
              transition={spring}
              className="fixed inset-0 z-50 flex"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1 flex items-center justify-center p-6 min-w-0"
                onClick={() => setIsOpen(false)}
              >
                {isVideo ? (
                  <video
                    src={url}
                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                    controls
                    autoPlay
                    loop
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    src={url}
                    alt={prompt}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 32, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 24, filter: "blur(2px)" }}
                transition={{ ...slideEase, delay: 0.1, filter: { duration: 0.2, ease: "easeOut" } }}
                className="w-[320px] shrink-0 h-full flex flex-col"
              >
                <ImageInfoSidebar item={item} group={group} onClose={() => setIsOpen(false)} />
              </motion.div>
            </motion.div>

            <motion.button
              key="close-btn"
              initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: -15 }}
              transition={{ ...springGentle, delay: 0.12 }}
              onClick={() => setIsOpen(false)}
              className="fixed top-4 right-4 z-[60] p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/50 hover:text-white backdrop-blur-md transition-colors"
            >
              <X className="size-4" />
            </motion.button>
          </>
        )}
      </AnimatePresence>
      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={isVideo ? "Supprimer la vidéo ?" : "Supprimer l'image ?"}
        description="Cette action est irréversible. Le média sera supprimé de votre bibliothèque."
        onConfirm={actions.handleDelete}
      />
    </>
  );
}

const ActionBtn = React.forwardRef(({ onClick, children, className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="groupBtn"
    size="icon"
    className={cn("h-7 w-7 transition-all text-[#303031] hover:bg-white/90 rounded-md", className)}
    onClick={onClick}
    {...props}
  >
    {children}
  </Button>
));
ActionBtn.displayName = "ActionBtn";