import React, { useState, useId } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { IconButton } from "@/components/base/icon-button";
import { MediaInput } from "@/components/cinema-studio/prompt-bar/MediaInput.jsx";
import { SwapIcon, ReferenceButton } from "@/components/cinema-studio/prompt-bar/ReferenceButton.jsx";
import { resolveMediaUrl } from "@/features/prompt-bar";

const STACK_POSITIONS = [
  {
    wrapperClass: "absolute size-10 left-0.5 top-0.5",
    rotate: 4,
    scale: 1,
    hoverScale: 1.06,
    opacity: 1,
    zIndex: 30,
  },
  {
    wrapperClass: "absolute size-10 left-2.5 top-px",
    rotate: 6,
    scale: 0.916667,
    hoverScale: 0.97,
    opacity: 1,
    zIndex: 20,
  },
  {
    wrapperClass: "absolute size-10 left-4.5 top-0.5",
    rotate: 8,
    scale: 0.833333,
    hoverScale: 0.88,
    opacity: 1,
    zIndex: 10,
  },
  {
    wrapperClass: "absolute size-10 left-4.5 top-0.5 pointer-events-none",
    rotate: 8,
    scale: 0.78,
    hoverScale: 0.78,
    opacity: 0,
    zIndex: 5,
  },
];

const CARD_SPRING_TRANSITION = {
  layout: {
    type: "spring",
    stiffness: 380,
    damping: 30,
    mass: 0.78,
  },
  rotate: {
    type: "spring",
    stiffness: 380,
    damping: 30,
  },
  scale: {
    type: "spring",
    stiffness: 380,
    damping: 30,
  },
  opacity: {
    duration: 0.18,
    ease: [0.25, 1, 0.5, 1],
  },
};

const REMOVE_ICON_PATH =
  "M7.29268 7.30529C7.47998 7.11782 7.73398 7.0125 7.99882 7.0125C8.26367 7.0125 8.51767 7.11782 8.70497 7.30529L11.994 10.5983L15.283 7.30529C15.3752 7.20978 15.4854 7.1336 15.6072 7.08119C15.7291 7.02878 15.8602 7.00119 15.9928 7.00004C16.1254 6.99888 16.2569 7.02419 16.3797 7.07447C16.5024 7.12475 16.6139 7.199 16.7077 7.29289C16.8015 7.38679 16.8756 7.49844 16.9259 7.62133C16.9761 7.74423 17.0014 7.87591 17.0002 8.00869C16.9991 8.14147 16.9715 8.27269 16.9192 8.39469C16.8668 8.5167 16.7907 8.62704 16.6953 8.71929L13.4063 12.0123L16.6953 15.3053C16.8773 15.4939 16.9779 15.7465 16.9757 16.0087C16.9734 16.2709 16.8683 16.5217 16.6832 16.7071C16.498 16.8925 16.2475 16.9977 15.9856 17C15.7237 17.0022 15.4714 16.9014 15.283 16.7193L11.994 13.4263L8.70497 16.7193C8.5166 16.9014 8.2643 17.0022 8.00242 17C7.74054 16.9977 7.49003 16.8925 7.30484 16.7071C7.11966 16.5217 7.01462 16.2709 7.01234 16.0087C7.01007 15.7465 7.11074 15.4939 7.29268 15.3053L10.5817 12.0123L7.29268 8.71929C7.10543 8.53176 7.00024 8.27745 7.00024 8.01229C7.00024 7.74712 7.10543 7.49282 7.29268 7.30529Z";

/**
 * PromptBarSlotsRow
 *
 * Pure presentational component for rendering active media/reference slots.
 * Handles stacked multi-reference fan, unstacked reference tray with shared layoutId motion,
 * Add Reference buttons, start/end keyframe slots, and swap buttons.
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
  handleRemoveReferenceItem,
  handleOpenDialog,
  onAttachMedia,
  onClearSlot,
  onClearReferences,
  handleRemoveSlot,
  showSwap,
  swapEnabled,
  handleSwapFrames,
  isReferenceUnstacked = false,
  onToggleReferenceUnstacked,
}) {
  const layoutScopeId = useId();
  const [isStackHovered, setIsStackHovered] = useState(false);

  if (!activeSlots || activeSlots.length === 0) {
    return null;
  }

  return (
    <LayoutGroup id={`prompt-bar-slots-${layoutScopeId}`}>
      <div
        ref={dialogAnchorRef}
        className={cn(
          "flex h-full items-center gap-2 px-1 overflow-visible",
          isReferenceUnstacked ? "min-w-0 flex-1" : "shrink-0"
        )}
      >
        {activeSlots.map((slot) => {
          const backendKey = featureConfig?.resolveParameterMapping?.(currentModel, slot.role) ?? slot.role;
          const media = paramValues?.[backendKey];
          const isStart = slot.role === "start";
          const isEnd = slot.role === "end";
          const isReferenceRole = slot.role === "reference";
          const slotLabel = isStart ? "Start" : isEnd ? "End" : slot.label;

          if (isReferenceRole) {
            const refList = getReferenceItems ? getReferenceItems(backendKey) : [];
            const maxRefs = getSlotMaxRefs ? getSlotMaxRefs(slot) : 9;

            if (refList.length === 0) {
              return (
                <div
                  key={`${slot.role}-add-btn`}
                  className="relative flex h-full shrink-0 items-center justify-center px-1"
                >
                  <ReferenceButton
                    variant="add"
                    word="Ref"
                    onClick={() => handleOpenDialog?.(slot)}
                    title="Add Reference / Element / Character"
                  />
                </div>
              );
            }

            if (isReferenceUnstacked) {
              return (
                <div
                  key={`${slot.role}-unstacked`}
                  className="flex h-full min-w-0 flex-1 items-stretch gap-1"
                >
                  <motion.button
                    type="button"
                    data-testid="reference-collapse-stack-btn"
                    aria-label="Stack the uploaded images"
                    initial={{ opacity: 0, x: -12, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                    onClick={() => onToggleReferenceUnstacked?.(false)}
                    className="group relative flex cursor-pointer flex-col items-center justify-center rounded-subtle text-[color:var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--border-heavy)] self-stretch min-h-14 w-9.5 shrink-0"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-subtle bg-[color:var(--white-5)] transition-colors group-hover:bg-[color:var(--ui-button-hover)]"
                    />
                    <span className="relative grid place-items-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
                        <path d="M14.7071 6.29295C14.3166 5.90243 13.6835 5.90243 13.293 6.29295L8.29302 11.293C7.90268 11.6835 7.90262 12.3165 8.29302 12.707L13.293 17.707L13.3692 17.7754C13.7619 18.0957 14.341 18.0731 14.7071 17.707C15.0732 17.3409 15.0958 16.7619 14.7754 16.3691L14.7071 16.293L10.5909 12.1767C10.4933 12.0791 10.4934 11.9209 10.5909 11.8232L14.7071 7.70702C15.0976 7.31649 15.0976 6.68348 14.7071 6.29295Z" />
                      </svg>
                    </span>
                  </motion.button>

                  <div
                    data-edges="none"
                    className="relative flex min-w-0 flex-1 items-center"
                  >
                    <ul
                      aria-label={`${refList.length} of ${maxRefs} reference images`}
                      className="flex flex-wrap items-center gap-2.5 px-3 py-1.5 w-full"
                    >
                      {refList.length < maxRefs && (
                        <motion.li
                          className="shrink-0"
                          initial={{ opacity: 0, scale: 0.82, x: -8 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          transition={{ duration: 0.24, delay: 0.03, ease: [0.25, 1, 0.5, 1] }}
                        >
                          <ReferenceButton
                            variant="add"
                            word="Ref"
                            aria-label={`Add images (${refList.length} of ${maxRefs})`}
                            onClick={() => handleOpenDialog?.(slot)}
                            title="Add Reference / Element / Character"
                          />
                        </motion.li>
                      )}

                      {refList.map((item, idx) => {
                        const itemId = item.workflow_id || item.id || item.url || String(idx);
                        const itemLabel = item.displayName || item.title || item.name || `Reference ${idx + 1}`;
                        const src = resolveMediaUrl(item) || item.url || "";
                        const isVid = item.type === "video" || Boolean(item.is_video) || Boolean(item.isVideo);
                        return (
                          <li key={itemId} className="shrink-0">
                            <motion.div
                              layoutId={`ref-card-${layoutScopeId}-${slot.role}-${itemId}`}
                              layout
                              data-testid={`view-reference-${item.id || item.workflow_id || idx}`}
                              animate={{
                                rotate: 0,
                                scale: 1,
                                opacity: 1,
                              }}
                              transition={CARD_SPRING_TRANSITION}
                              className="relative size-[50px] rounded-subtle border-2 border-[color:var(--border-heavy)]"
                            >
                              {isVid ? (
                                <video
                                  src={src}
                                  muted
                                  loop
                                  autoPlay
                                  playsInline
                                  className="block size-full object-cover overflow-hidden rounded-sharp"
                                />
                              ) : (
                                <img
                                  alt={itemLabel}
                                  decoding="async"
                                  className="block size-full object-cover overflow-hidden rounded-sharp"
                                  src={src}
                                />
                              )}
                              <motion.button
                                type="button"
                                data-testid={`remove-reference-${item.id || item.workflow_id || idx}`}
                                aria-label={`Remove ${itemLabel}`}
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.14, duration: 0.18, ease: [0.34, 1.36, 0.64, 1] }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveReferenceItem?.(item, backendKey);
                                }}
                                className="absolute -right-2 -top-[7px] grid size-5 cursor-pointer place-items-center rounded-subtle surface-glass bg-surface-menu-glass text-icon-primary hover:bg-surface-tonal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-heavy transition-colors duration-200 z-10"
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                                  <path fillRule="evenodd" clipRule="evenodd" d={REMOVE_ICON_PATH} />
                                </svg>
                              </motion.button>
                            </motion.div>
                          </li>
                        );
                      })}
                    </ul>
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0" />
                  </div>
                </div>
              );
            }

            // Render all items in the stack (front card is idx 0, rendered last in DOM; idx >= 3 tucked behind idx 2)
            const stackLayers = refList
              .map((item, idx) => ({
                item,
                idx,
                ...STACK_POSITIONS[Math.min(idx, 3)],
              }))
              .reverse();

            return (
              <div
                key={slot.role}
                onMouseEnter={() => setIsStackHovered(true)}
                onMouseLeave={() => setIsStackHovered(false)}
                className="relative flex h-full shrink-0 items-center justify-center px-2 group/filled"
              >
                <div className="relative inline-flex items-center">
                  <button
                    type="button"
                    data-testid="reference-stack-btn"
                    aria-label={`Show all ${refList.length} uploaded images`}
                    onClick={() => {
                      setIsStackHovered(false);
                      onToggleReferenceUnstacked?.(true);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-comfortable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--border-heavy)] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
                  >
                    <span className="relative h-11 w-14 shrink-0 block">
                      {stackLayers.map(({ item, idx, wrapperClass, rotate, scale, hoverScale, opacity, zIndex }) => {
                        const itemId = item.workflow_id || item.id || item.url || String(idx);
                        const src = resolveMediaUrl(item) || item.url || "";
                        const isVid = item.type === "video" || Boolean(item.is_video) || Boolean(item.isVideo);
                        return (
                          <motion.span
                            key={itemId}
                            layoutId={`ref-card-${layoutScopeId}-${slot.role}-${itemId}`}
                            layout
                            data-testid={`view-reference-${item.id || item.workflow_id || idx}`}
                            className={cn(
                              wrapperClass,
                              "rounded-subtle border-2 border-[color:var(--border-heavy)] block"
                            )}
                            style={{ zIndex }}
                            animate={{
                              rotate: isStackHovered ? 0 : rotate,
                              scale: isStackHovered ? hoverScale : scale,
                              opacity,
                            }}
                            transition={CARD_SPRING_TRANSITION}
                          >
                            {isVid ? (
                              <video
                                src={src}
                                muted
                                loop
                                autoPlay
                                playsInline
                                className="block size-full object-cover overflow-hidden rounded-sharp"
                              />
                            ) : (
                              <img
                                alt=""
                                decoding="async"
                                className="block size-full object-cover overflow-hidden rounded-sharp"
                                src={src}
                              />
                            )}
                          </motion.span>
                        );
                      })}
                    </span>
                    <span className="sr-only">
                      <span>Uploaded</span>
                      <span>Used as reference</span>
                    </span>
                  </button>

                  <motion.button
                    type="button"
                    data-testid="reference-remove-all-btn"
                    aria-label={`Remove all ${refList.length} uploaded images`}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1, rotate: isStackHovered ? 0 : -4 }}
                    transition={{ delay: 0.12, duration: 0.18, ease: [0.34, 1.36, 0.64, 1] }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onClearReferences) {
                        onClearReferences();
                      } else {
                        onClearSlot?.(slot.role);
                      }
                    }}
                    className="absolute -top-1.5 -right-1.5 grid size-5 cursor-pointer place-items-center rounded-subtle surface-glass bg-surface-menu-glass text-icon-primary hover:bg-surface-tonal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-heavy transition-colors duration-200 z-40"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                      <path fillRule="evenodd" clipRule="evenodd" d={REMOVE_ICON_PATH} />
                    </svg>
                  </motion.button>
                </div>
              </div>
            );
          }

          // Fixed Keyframe Slot (Start Frame / End Frame in video mode — all 3 siblings in the same flex row with unified gap)
          return (
            <React.Fragment key={slot.role}>
              <MediaInput
                label={slotLabel}
                role={slot.role}
                variant={slot.role}
                value={media}
                accept={slot.accepts || "image/*"}
                onClick={() => handleOpenDialog?.(slot)}
                onChange={(val) => {
                  if (val) {
                    onAttachMedia?.(slot.role, val);
                  } else {
                    onClearSlot?.(slot.role);
                  }
                }}
                onRemove={() => handleRemoveSlot?.(slot)}
              />
              {isStart && showSwap && (
                <IconButton
                  type="button"
                  onClick={handleSwapFrames}
                  disabled={!swapEnabled}
                  className="size-8 p-0 shrink-0"
                  title={swapEnabled ? "Swap start and end frames" : "Fill both frames to swap"}
                >
                  <SwapIcon />
                </IconButton>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
