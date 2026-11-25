"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EditToolsSidebar } from "@/components/cinema-studio/media/EditToolsSidebar";
import { AnglesPanel } from "@/components/cinema-studio/media/AnglesPanel";
import { RelightPanel } from "@/components/cinema-studio/media/RelightPanel";
import { RemoveBackgroundPanel } from "@/components/cinema-studio/media/RemoveBackgroundPanel";
import { cn } from "@/shared/lib/utils";

const PANEL_TRANSITION = { duration: 0.16, ease: [0.22, 1, 0.36, 1] };

/**
 * EditInspectorRail
 * Right docked full-height inspector rail on the Asset Edit Page.
 * Swaps smoothly between the tool launcher (EditToolsSidebar) and active
 * docked tool panels (AnglesPanel, RelightPanel, RemoveBackgroundPanel).
 */
export function EditInspectorRail({
  workflow,
  activeItem,
  displayTitle,
  editPreviewUrl,
  canEditImage,
  isPrimaryProcessing,
  isDownloading,
  activeEditTool,
  onSelectTool,
  removeBackgroundModels,
  isLoadingRemoveBgModels,
  submitting = {},
  onGenerateAngles,
  onGenerateRelight,
  onGenerateRemoveBackground,
  onSelectVersion,
  onDownload,
  onRenameWorkflow,
  onDeleteMedia,
  onDetachMedia,
  className,
}) {
  const handleCloseTool = React.useCallback(() => {
    onSelectTool?.(null);
  }, [onSelectTool]);

  return (
    <aside
      className={cn(
        "ds-edit-sidebar-rail shrink-0 h-full border-t sm:border-t-0 sm:border-l border-border-subtle bg-omni-bg overflow-hidden",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {canEditImage && activeEditTool === "angles" ? (
          <motion.div
            key="angles"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={PANEL_TRANSITION}
            className="h-full"
          >
            <AnglesPanel
              previewUrl={editPreviewUrl}
              isSubmitting={Boolean(submitting.angles)}
              isPrimaryProcessing={isPrimaryProcessing}
              onGenerate={onGenerateAngles}
              onBack={handleCloseTool}
              onClose={handleCloseTool}
              className="w-full rounded-none border-0"
            />
          </motion.div>
        ) : canEditImage && activeEditTool === "relight" ? (
          <motion.div
            key="relight"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={PANEL_TRANSITION}
            className="h-full"
          >
            <RelightPanel
              previewUrl={editPreviewUrl}
              isSubmitting={Boolean(submitting.relight)}
              isPrimaryProcessing={isPrimaryProcessing}
              onGenerate={onGenerateRelight}
              onBack={handleCloseTool}
              onClose={handleCloseTool}
              className="w-full rounded-none border-0"
            />
          </motion.div>
        ) : canEditImage && activeEditTool === "remove-background" ? (
          <motion.div
            key="remove-background"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={PANEL_TRANSITION}
            className="h-full"
          >
            <RemoveBackgroundPanel
              models={removeBackgroundModels}
              isLoadingModels={isLoadingRemoveBgModels}
              isSubmitting={Boolean(submitting.removeBackground)}
              isPrimaryProcessing={isPrimaryProcessing}
              onGenerate={onGenerateRemoveBackground}
              onBack={handleCloseTool}
              onClose={handleCloseTool}
              className="w-full rounded-none border-0"
            />
          </motion.div>
        ) : (
          <motion.div
            key="tools-home"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={PANEL_TRANSITION}
            className="h-full"
          >
            <EditToolsSidebar
              workflow={workflow}
              items={workflow?.items}
              activeItem={activeItem}
              primaryMediaId={workflow?.metadata?.primaryMediaId}
              displayTitle={displayTitle}
              canEditImage={canEditImage}
              isDownloading={isDownloading}
              onSelectTool={onSelectTool}
              onSelectVersion={onSelectVersion}
              onDownload={onDownload}
              onRenameWorkflow={onRenameWorkflow}
              onDeleteMedia={onDeleteMedia}
              onDetachMedia={onDetachMedia}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

export default EditInspectorRail;
