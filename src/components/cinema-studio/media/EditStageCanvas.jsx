"use client";

import * as React from "react";
import { EditMediaView } from "@/components/cinema-studio/media/EditMediaView";
import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 0.25;

/**
 * EditStageCanvas
 * Zoomable center preview canvas for the Asset Edit Page.
 * Owns zoom state (0.5x–4x in 0.25x steps), resets zoom on workflow change,
 * and hides floating zoom controls for video workflows.
 */
export function EditStageCanvas({
  workflow,
  activeItem,
  workflowId,
  isVideoWorkflow = false,
  className,
}) {
  const [zoomLevel, setZoomLevel] = React.useState(1);

  React.useEffect(() => {
    setZoomLevel(1);
  }, [workflowId]);

  const handleZoomOut = React.useCallback(() => {
    setZoomLevel((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))));
  }, []);

  const handleResetZoom = React.useCallback(() => {
    setZoomLevel(1);
  }, []);

  const handleZoomIn = React.useCallback(() => {
    setZoomLevel((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))));
  }, []);

  return (
    <main
      className={cn(
        "flex-1 relative flex items-center justify-center overflow-hidden px-6 pb-12 pt-2 min-h-0",
        className
      )}
    >
      <div
        data-slot="edit-stage-zoom-wrapper"
        className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out"
        style={!isVideoWorkflow && zoomLevel !== 1 ? { transform: `scale(${zoomLevel})` } : undefined}
      >
        <EditMediaView workflow={workflow} item={activeItem} />
      </div>

      {/* Bottom-Right Floating Zoom Controls (- / Fit / +) */}
      {!isVideoWorkflow && (
        <div
          role="group"
          aria-label="Preview zoom controls"
          className="absolute bottom-4 right-4 z-10 flex items-center gap-0.5 rounded-comfortable bg-omni-bg border border-border-subtle p-1"
        >
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            disabled={zoomLevel <= MIN_ZOOM}
            aria-label="Zoom out"
            onClick={handleZoomOut}
          >
            <HugeIcon name="minus-sign" size="xs" />
          </IconButton>

          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Reset zoom"
            title={`${Math.round(zoomLevel * 100)}%`}
            onClick={handleResetZoom}
          >
            <HugeIcon name="full-screen" size="xs" />
          </IconButton>

          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            disabled={zoomLevel >= MAX_ZOOM}
            aria-label="Zoom in"
            onClick={handleZoomIn}
          >
            <HugeIcon name="add-01" size="xs" />
          </IconButton>
        </div>
      )}
    </main>
  );
}

export default EditStageCanvas;
