"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeIcon } from "@/components/primitives/HugeIcon";

import { useRemoveWorkflow, useToggleWorkflowLike } from "@/features/workflows/api/workflowsApi";
import { resolveStudioActions } from "@/features/workflows/lib/studioActionRules";
import { MediaView, WorkflowTypeBadge } from "@/features/media";
import { cn } from "@/shared/lib/utils";
import { ButtonGroup } from "@/components/primitives/button-group";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { ConfirmDeleteDialog } from "@/components/primitives/ConfirmDeleteDialog";
import { resolveLibraryEntryMedia } from "@/features/assets/model/assetsLibrary";

function isVideoUrl(url = "") {
  return /\.(mp4|webm|mov)$/i.test(url);
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
  const actionRules = resolveStudioActions({
    workflow,
    item: media,
    status: media.status || (media.url ? "completed" : "processing"),
    isVideo,
    hasUrl: Boolean(media.url),
  });

  return (
    <>
      <article
        onClick={() => {
          if (actionRules.can.navigate && workflow.id) router.push(`/assets/${workflow.id}`);
        }}
        onMouseEnter={() => {
          if (actionRules.isCompleted && isVideo && videoRef.current) {
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
          "group relative overflow-hidden rounded-xxxs bg-surface-card border border-white/10 shadow-none transition-none hover:border-white/20",
          actionRules.can.navigate ? "cursor-pointer" : "cursor-default",
          isSelected && actionRules.can.select && "ring-2 ring-white shadow-none",
          className
        )}
        style={style}
      >
        <div className="relative h-full w-full">
          {actionRules.can.select && (
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
              <HugeIcon name="tick-02" className="text-sm font-bold" />
            </Button>
          )}

          {isLiked && (
            <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white border border-white/10">
                <HugeIcon name="favourite" filled className="text-xs text-white" />
              </div>
            </div>
          )}

          <div className="absolute bottom-3 right-3 z-30 pointer-events-none">
            <WorkflowTypeBadge workflow={workflow} item={media} isVideo={isVideo} />
          </div>

          <MediaView
            item={media}
            src={media.url}
            isVideo={isVideo}
            status={actionRules.lifecycle}
            error={media.error_message}
            fit="cover"
            videoRef={videoRef}
            playOnHover={true}
            autoPlay={false}
            showLikedBadge={false}
            showVideoBadge={false}
            showHoverOverlay={false}
            className="w-full h-full rounded-none bg-transparent shadow-none border-0"
            mediaClassName="w-full h-full object-cover"
          />

          {(actionRules.can.like || actionRules.can.delete) && (
            <div className="absolute inset-0 z-10 flex flex-col justify-between p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="flex justify-end">
                <ButtonGroup variant="pill" className="pointer-events-auto">
                  {actionRules.can.like && (
                    <IconButton
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike({ workflowId: workflow.id });
                      }}
                      title={isLiked ? "Unlike" : "Like"}
                      aria-label={isLiked ? "Unlike" : "Like"}
                    >
                      <HugeIcon name="favourite" filled={isLiked} className={cn("text-base", isLiked ? "text-accent" : "text-white/80")} />
                    </IconButton>
                  )}
                  {actionRules.can.delete && (
                    <IconButton
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDeleteConfirmOpen(true);
                      }}
                      title="Delete"
                      aria-label="Delete"
                    >
                      <HugeIcon name="delete-02" className="text-base" />
                    </IconButton>
                  )}
                </ButtonGroup>
              </div>
            </div>
          )}

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
