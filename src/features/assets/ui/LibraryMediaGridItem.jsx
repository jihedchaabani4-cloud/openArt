"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, Play, Trash2 } from "lucide-react";

import { useRemoveWorkflow, useToggleWorkflowLike } from "@/features/workflows/api/workflowsApi";
import { ImageStatusView } from "@/features/workflows/ui/ImageStatusView";
import { cn } from "@/shared/lib/utils";
import { ButtonGroup } from "@/shared/ui/button-group";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { ActionBtn } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn";

function isVideoUrl(url = "") {
  return /\.(mp4|webm|mov)$/i.test(url);
}

function normalizeMediaStatus(status, url) {
  const value = (status || "").toString().toLowerCase();

  if (value === "success" || value === "completed") return "completed";
  if (["processing", "pending", "uploading", "queued", "in_progress", "starting"].includes(value)) {
    return "processing";
  }
  if (value === "rejected") return "rejected";
  if (value === "failed" || value === "error") return "failed";

  return url ? "completed" : "processing";
}

export function LibraryMediaGridItem({
  entry,
  isSelected = false,
  onToggleSelect,
  className,
  style,
}) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const videoRef = useRef(null);
  const router = useRouter();
  const { mutate: toggleLike } = useToggleWorkflowLike();
  const { mutate: removeWorkflow } = useRemoveWorkflow();

  const workflow = entry?.workflow || {};
  const media = entry?.primary_media || {};

  const isVideo = useMemo(() => isVideoUrl(media.url), [media.url]);
  const isLiked = !!workflow.favorited;
  const status = normalizeMediaStatus(media.status, media.url);

  return (
    <>
      <article
        onClick={() => {
          if (workflow.id) router.push(`/assets/${workflow.id}`);
        }}
        onMouseEnter={() => {
          if (isVideo && videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }}
        onMouseLeave={() => {
          if (isVideo && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        }}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-[14px] bg-[#0a0a0a] shadow-lg transition-all duration-300 hover:shadow-2xl",
          isSelected && "ring-2 ring-white shadow-[0_0_0_1px_rgba(255,255,255,0.9)]",
          className
        )}
        style={style}
      >
        <div className="relative h-full w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.();
            }}
            className={cn(
              "absolute left-3 top-3 z-30 flex h-6 w-6 items-center justify-center rounded-md border transition",
              isSelected
                ? "border-white bg-white text-[#050505]"
                : "border-white/16 bg-black/40 text-transparent backdrop-blur-md hover:border-white/28 hover:text-white/70"
            )}
            aria-label="Select media"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </button>

            <div className="absolute bottom-3 left-3 z-30 flex  items-center ">
            {isVideo && (
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white ">
                <Play className="h-3.5 w-3.5 fill-white text-white" />
              </div>
            )}
            {isLiked && (
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full  text-white ">
                <Heart className="h-3.5 w-3.5 fill-white text-white" />
              </div>
            )}
          </div>

          <ImageStatusView
            status={status}
            src={media.url}
            alt={workflow.display_name || "Library media"}
            aspect="auto"
            error={media.error_message}
            showOverlay
            className="h-full w-full object-cover"
          >
            {isVideo && media.url ? (
              <video
                ref={videoRef}
                src={media.url}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
              />
            ) : null}
          </ImageStatusView>

          <div className="absolute inset-0 z-10 flex flex-col justify-between p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex justify-end">
              <ButtonGroup className="pointer-events-auto bg-white/60 backdrop-blur-md rounded-lg">
                <ActionBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike({ workflowId: workflow.id });
                  }}
                >
                  <Heart className={cn("size-4", isLiked && "fill-[#303031] text-[#303031]")} />
                </ActionBtn>
                <ActionBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="size-4" />
                </ActionBtn>
              </ButtonGroup>
            </div>
          </div>

        </div>
      </article>

      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={isVideo ? "Delete video?" : "Delete image?"}
        description="This workflow will be deleted permanently."
        onConfirm={() => removeWorkflow(workflow.id)}
      />
    </>
  );
}
