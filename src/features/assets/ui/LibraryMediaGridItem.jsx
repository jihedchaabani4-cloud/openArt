"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Heart, Play, Trash2 } from "lucide-react";

import { useRemoveWorkflow, useToggleWorkflowLike } from "@/features/workflows/api/workflowsApi";
import { ImageStatusView } from "@/features/workflows/ui/ImageStatusView";
import { cn } from "@/shared/lib/utils";
import { ButtonGroup } from "@/shared/ui/button-group";
import { Button } from "@/shared/ui/button";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { ActionBtn } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn";
import { resolveLibraryEntryMedia } from "../model/assetsLibrary";

function isVideoUrl(url = "") {
  return /\.(mp4|webm|mov)$/i.test(url);
}

function normalizeMediaStatus(status, url) {
  const value = (status || "").toString().toLowerCase();

  if (value === "success" || value === "completed" || value === "ready") return "completed";
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
  const media = useMemo(() => resolveLibraryEntryMedia(entry), [entry]);

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
          "group relative cursor-pointer overflow-hidden rounded-lg bg-surface-card border border-white/10 shadow-none transition-all duration-300 hover:border-white/20",
          isSelected && "ring-2 ring-white shadow-none",
          className
        )}
        style={style}
      >
        <div className="relative h-full w-full">
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.();
            }}
            className={cn(
              "absolute left-3 top-3 z-30 flex h-6 w-6 items-center justify-center rounded-sm border transition p-0",
              isSelected
                ? "border-white bg-white text-black hover:bg-white/90"
                : "border-white/20 bg-black/50 backdrop-blur-sm text-transparent hover:border-white/40 hover:text-white/70"
            )}
            aria-label="Select media"
          >
            <Check strokeWidth={2} className="h-3.5 w-3.5" />
          </Button>

            <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1">
            {isVideo && (
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white border border-white/10">
                <Play className="h-3 w-3 fill-white text-white" />
              </div>
            )}
            {isLiked && (
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white border border-white/10">
                <Heart className="h-3 w-3 fill-white text-white" />
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
              <ButtonGroup className="pointer-events-auto bg-black/50 backdrop-blur-md border border-white/15 rounded-lg p-0.5 shadow-none">
                <ActionBtn
                  className="text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike({ workflowId: workflow.id });
                  }}
                  title={isLiked ? "Unlike" : "Like"}
                  aria-label={isLiked ? "Unlike" : "Like"}
                >
                  <Heart strokeWidth={1.5} className={cn("size-4", isLiked && "fill-accent text-accent")} />
                </ActionBtn>
                <ActionBtn
                  className="text-white hover:bg-white/10 hover:text-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteConfirmOpen(true);
                  }}
                  title="Delete"
                  aria-label="Delete"
                >
                  <Trash2 strokeWidth={1.5} className="size-4" />
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
