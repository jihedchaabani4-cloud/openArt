import { AnimatePresence, motion } from "framer-motion";
import { AtMentionMenu } from "../../ui/common/editor/AtMentionMenu.jsx";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";

/**
 * PromptBarTopPanel
 *
 * Pure presentational component for the prompt bar top panel zone.
 * Renders AtMentionMenu (quick mention) or ImportMediaPopover (panel variant)
 * above the prompt bar shell with unified AnimatePresence transitions.
 * Props only — no store access.
 */
export function PromptBarTopPanel({
  quickMentionOpen,
  quickMentionAnchorRef,
  onCloseQuickMention,
  activeReferences,
  onSelectReference,
  onOpenMediaLibrary,
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
      {quickMentionOpen && (
        <div ref={quickMentionAnchorRef} className="w-full flex justify-center">
          <AtMentionMenu
            open={quickMentionOpen}
            onClose={onCloseQuickMention}
            references={activeReferences}
            onSelectReference={onSelectReference}
            onOpenMediaLibrary={onOpenMediaLibrary}
            anchorRef={quickMentionAnchorRef}
            query={mentionQuery}
          />
        </div>
      )}

      {!quickMentionOpen && dialogOpen && (
        <motion.div
          key="import-media-panel"
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-card bg-(--background-base-pri) backdrop-blur-[80px] border border-white/10 shadow-none pointer-events-auto w-fit max-w-[95vw]"
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
            onSelect={onSelectMedia}
            initialSearch={mentionQuery}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
