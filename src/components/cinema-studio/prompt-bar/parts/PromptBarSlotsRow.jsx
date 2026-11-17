import React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { MediaInput } from "@/components/cinema-studio/prompt-bar/MediaInput.jsx";
import { SwapIcon, ReferenceButton, ViewReference } from "@/components/cinema-studio/prompt-bar/ReferenceButton.jsx";

/**
 * PromptBarSlotsRow
 *
 * Pure presentational component for rendering active media/reference slots.
 * Handles reference items, Add Reference buttons, start/end keyframe slots, and swap buttons.
 * Props only — no store access.
 */
export function PromptBarSlotsRow({
  activeSlots,
  featureConfig,
  currentModel,
  paramValues,
  dialogAnchorRef,
  getReferenceItems,
  getSlotMaxRefs,
  calculateUsedImages,
  handleRemoveReferenceItem,
  handleOpenDialog,
  setParameter,
  handleRemoveSlot,
  showSwap,
  swapEnabled,
  handleSwapFrames,
}) {
  if (!activeSlots || activeSlots.length === 0) {
    return null;
  }

  return (
    <div className="overflow-visible">
      <div ref={dialogAnchorRef} className="flex items-center gap-1.5 flex-wrap">
        {activeSlots.map((slot) => {
          const backendKey = featureConfig?.resolveParameterMapping?.(currentModel, slot.role) ?? slot.role;
          const media = paramValues?.[backendKey];
          const isStart = slot.role === "start";
          const isEnd = slot.role === "end";
          const isReferenceRole = slot.role === "reference";
          const slotLabel = isStart ? "Start" : isEnd ? "End" : slot.label;

          if (isReferenceRole) {
            const refList = getReferenceItems ? getReferenceItems(backendKey) : [];
            const maxRefs = getSlotMaxRefs ? getSlotMaxRefs(slot) : 1;
            const usedImages = calculateUsedImages ? calculateUsedImages(refList) : 0;
            const remainingImages = Math.max(0, maxRefs - usedImages);
            const canAddMore = remainingImages > 0;

            return (
              <React.Fragment key={slot.role}>
                {/* Existing reference thumbnails (images, characters, elements) */}
                {refList.map((refItem) => {
                  const itemId = refItem.workflow_id || refItem.id;
                  return (
                    <div key={itemId} className="flex items-center">
                      <ViewReference
                        media={refItem}
                        label={refItem.displayName || "Ref"}
                        onRemove={() => handleRemoveReferenceItem?.(refItem, backendKey)}
                      />
                    </div>
                  );
                })}

                {/* Add button (shown beside thumbnails; hidden only when reaching max real images) */}
                {canAddMore && (
                  <div key={`${slot.role}-add-btn`} className="flex items-center">
                    <ReferenceButton
                      variant="add"
                      word={refList.length === 0 ? "Ref" : "Add"}
                      onClick={() => handleOpenDialog?.(slot)}
                      title={refList.length === 0 ? "Add Reference / Element / Character" : "Add another Reference"}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          }

          // Fixed Keyframe Slot (Start Frame / End Frame in video mode)
          return (
            <div key={slot.role} className="flex items-center gap-1.5">
              <MediaInput
                label={slotLabel}
                role={slot.role}
                variant={slot.role}
                value={media}
                accept={slot.accepts || "image/*"}
                onClick={() => handleOpenDialog?.(slot)}
                onChange={(val) => setParameter?.(backendKey, val)}
                onRemove={() => handleRemoveSlot?.(slot)}
              />
              {isStart && showSwap && (
                <IconButton
                  type="button"
                  onClick={handleSwapFrames}
                  disabled={!swapEnabled}
                  className="size-8 p-0"
                  title={swapEnabled ? "Swap start and end frames" : "Fill both frames to swap"}
                >
                  <SwapIcon />
                </IconButton>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
