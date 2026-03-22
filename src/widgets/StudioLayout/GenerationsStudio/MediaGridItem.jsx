import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Heart, Trash2, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import ImageStatusView from "@/features/generations/ui/ImageStatusView";
import { ImageInfoSidebar } from "@/widgets/dialogs/ImageInfoSidebar";
import { getItemMetadata } from "@/shared/lib/generationUtils";
import {
  useRemoveGenerationItem,
  useToggleLike,
  useRetryGeneration,
} from "@/features/generations/api/generationsApi";
import { Button } from "@/shared/ui/button";

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
  ease: [0.32, 0.72, 0, 1], // custom expo-out feel
};

// ── Component ──────────────────────────────────────────────────────────────
export function MediaGridItem({
  item,
  group,
  showPrompt = false,
  className,
  projectId,
  activeSessionId,
}) {
  const { mutate: removeItem } = useRemoveGenerationItem();
  const { mutate: toggleLike } = useToggleLike();
  const { mutate: retryGeneration } = useRetryGeneration();

  const [isOpen, setIsOpen] = useState(false);

  const { isVideo, url, aspect, status } = getItemMetadata(item, group);
  const prompt =
    group?.params?.prompt ||
    item.prompt ||
    group?.items?.[0]?.asset?.prompt ||
    "Generated Asset";

  const isDone = status === "completed" && !!url;
  const isError = ["rejected", "failed", "error"].includes(status);

  const handleDelete = (e) => {
    e?.stopPropagation();
    removeItem({ itemId: item.id });
  };

  const handleRetry = (e) => {
    e?.stopPropagation();
    const isVideo =
      group?.type === "video" || group?.section === "video_generator";
    retryGeneration({
      endpoint: isVideo ? "/video/generated" : "/images/generated",
      payload: {
        ...group?.params,
        prompt,
        project_id: projectId,
        session_id: activeSessionId,
      },
    });
  };

  return (
    <>
      {/* ── Grid Card ── */}
      <motion.div
        layoutId={`media-card-${item.id}`}
        // Use spring for layout transitions so the card "pops" into the expanded
        // position instead of sliding mechanically
        transition={spring}
        draggable={isDone}
        onDragStart={(e) => {
          if (!isDone) return;
          e.dataTransfer.setData("imageUrl", url);
          if (item.asset_id) e.dataTransfer.setData("assetId", item.asset_id);
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() => isDone && setIsOpen(true)}
        className={cn(
          "group relative rounded-xl overflow-hidden bg-[#0a0a0a]",
          "outline-2 outline-transparent hover:outline-white/60 transition-[outline-color] duration-200",
          "cursor-grab active:cursor-grabbing",
          className
        )}
        style={{ aspectRatio: aspect }}
      >
        <ImageStatusView
          status={status}
          src={url}
          alt={prompt}
          aspect={aspect}
          error={item.error}
          showOverlay
          onCancel={isError ? handleDelete : undefined}
          onRetry={["failed", "error"].includes(status) ? handleRetry : undefined}
          className="w-full h-full object-cover"
        >
          {isDone && isVideo && (
            <video
              src={url}
              style={{ aspectRatio: aspect }}
              className="w-full h-full object-cover"
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
              muted
              loop
            />
          )}
        </ImageStatusView>

        {/* Hover overlay — animate-in with a short fade */}
        {isDone && (
          <motion.div
            initial={false}
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 p-2 flex flex-col justify-between z-10 pointer-events-none"
          >
            <div className="flex justify-end pointer-events-auto">
              <ActionBtn
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike({ itemId: item.id });
                }}
              >
                <Heart
                  className={cn(
                    "size-3.5",
                    item.is_liked && "fill-[#D4FF00] text-[#D4FF00]"
                  )}
                />
              </ActionBtn>
            </div>
            {showPrompt && (
              <div className="flex items-center justify-between gap-2 pointer-events-auto">
                <p className="text-[10px] text-white/70 line-clamp-1 italic flex-1">
                  {prompt}
                </p>
                <ActionBtn onClick={handleDelete}>
                  <Trash2 className="size-3.5 hover:text-red-400" />
                </ActionBtn>
              </div>
            )}
          </motion.div>
        )}

        {/* Video badge */}
        {isDone && isVideo && (
          <div className="absolute top-2 left-2 p-1 rounded-full bg-white z-20 pointer-events-none">
            <Play className="size-3 fill-black text-black" />
          </div>
        )}
      </motion.div>

      {/* ── Expanded View ── */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Backdrop — soft fade */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeEase}
              className="fixed inset-0 z-5 "
              onClick={() => setIsOpen(false)}
            />

            {/* Blurred bg image */}
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

            {/* Expanded card — layoutId drives the hero morph, spring makes it fluid */}
            <motion.div
              key="expanded"
              layoutId={`media-card-${item.id}`}
              transition={spring}
              className="fixed inset-0 z-50 flex"
            >
              {/* ── Media (Left) ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1 flex items-center justify-center p-6 min-w-0 "
              >
                {isVideo ? (
                  <video
                    src={url}
                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                    controls
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={url}
                    alt={prompt}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                )}
              </motion.div>

              {/* ── Sidebar (Right) ── */}
              <motion.div
                initial={{ opacity: 0, x: 32, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 24, filter: "blur(2px)" }}
                transition={{
                  ...slideEase,
                  delay: 0.1,
                  filter: { duration: 0.2, ease: "easeOut" },
                }}
                className="w-[320px] shrink-0 h-full flex flex-col"
              >
                <ImageInfoSidebar
                  item={item}
                  group={group}
                  onClose={() => setIsOpen(false)}
                />
              </motion.div>
            </motion.div>

            {/* ── Close Button ── */}
            <motion.button
              key="close-btn"
              initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: -15 }}
              transition={{ ...springGentle, delay: 0.12 }}
              onClick={() => setIsOpen(false)}
              className="fixed top-4 right-4 z-[60] p-2 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/50 hover:text-white backdrop-blur-md transition-colors"
            >
              <X className="size-5" />
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ActionBtn({ onClick, children }) {
  return (
    <Button onClick={onClick} className="p-1.5 rounded-lg transition-all">
      {children}
    </Button>
  );
}