import { AnimatePresence, motion } from "framer-motion";
import { ImportMediaPopover } from "@/features/media";

/**
 * PromptBarTopPanel
 *
 * Pure presentational component for the prompt bar top panel zone.
 * Renders ImportMediaPopover (panel variant) above the prompt bar shell.
 * Props only — no store access.
 */
export function PromptBarTopPanel({
  mentionQuery,
  dialogOpen,
  onOpenChangeDialog,
  dialogAnchorRef,
  activeSlotAllowedType,
  activeSlotMaxAllowed,
  remainingImagesQuota,
  activeDialogSlot,
  activeDialogMode,
  dialogSelectedItems,
  allSelectedMedia,
  onSelectMedia,
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {dialogOpen && (
        <motion.div
          key="import-media-panel"
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto w-fit max-w-[95vw]"
        >
          <ImportMediaPopover
            variant="panel"
            open={dialogOpen}
            onOpenChange={onOpenChangeDialog}
            anchorRef={dialogAnchorRef}
            allowedType={activeSlotAllowedType}
            maxAllowed={activeSlotMaxAllowed}
            remainingImages={activeDialogSlot && activeDialogSlot.role !== "reference" ? undefined : remainingImagesQuota}
            mode={activeDialogMode}
            selectedItems={dialogSelectedItems}
            excludedItems={allSelectedMedia}
            onSelect={(assets) =>
              onSelectMedia(assets, {
                keepOpen: !activeDialogSlot || activeDialogSlot.role === "reference",
              })
            }
            initialSearch={mentionQuery}
            closeOnSelect={false}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
