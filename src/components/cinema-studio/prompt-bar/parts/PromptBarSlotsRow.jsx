import React from "react";
import { IconButton } from "@/components/base/icon-button";
import { MediaInput } from "@/components/cinema-studio/prompt-bar/MediaInput.jsx";
import { SwapIcon, ReferenceButton } from "@/components/cinema-studio/prompt-bar/ReferenceButton.jsx";
import { resolveMediaUrl } from "@/features/prompt-bar/core/mediaRef.js";

const STACK_POSITIONS = [
  {
    wrapperClass: "absolute size-12 left-0.5 top-0.5",
    style: { rotate: "0deg", scale: 1 },
  },
  {
    wrapperClass: "absolute size-12 left-3 top-px",
    style: { rotate: "2deg", scale: 0.916667 },
  },
  {
    wrapperClass: "absolute size-12 left-5.25 top-0.5",
    style: { rotate: "4deg", scale: 0.833333 },
  },
];

/**
 * PromptBarSlotsRow
 *
 * Pure presentational component for rendering active media/reference slots.
 * Handles stacked multi-reference fan, Add Reference buttons, start/end keyframe slots, and swap buttons.
 * Props only — no store access.
 */
export function PromptBarSlotsRow({
  activeSlots,
  featureConfig,
  currentModel,
  paramValues,
  dialogAnchorRef,
  getReferenceItems,
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
    <div ref={dialogAnchorRef} className="flex h-full shrink-0 items-center gap-1.5 overflow-visible">
      {activeSlots.map((slot) => {
        const backendKey = featureConfig?.resolveParameterMapping?.(currentModel, slot.role) ?? slot.role;
        const media = paramValues?.[backendKey];
        const isStart = slot.role === "start";
        const isEnd = slot.role === "end";
        const isReferenceRole = slot.role === "reference";
        const slotLabel = isStart ? "Start" : isEnd ? "End" : slot.label;

        if (isReferenceRole) {
          const refList = getReferenceItems ? getReferenceItems(backendKey) : [];

          if (refList.length === 0) {
            return (
              <div
                key={`${slot.role}-add-btn`}
                className="relative flex h-full w-39.5 shrink-0 flex-col items-center justify-center px-6"
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

          // Render up to 3 stacked thumbnails (back -> middle -> front so front is last in DOM)
          const visibleStack = refList.slice(0, 3);
          const stackLayers = visibleStack
            .map((item, idx) => ({
              item,
              ...STACK_POSITIONS[idx],
            }))
            .reverse();

          return (
            <div
              key={slot.role}
              className="relative flex h-full w-39.5 shrink-0 flex-col items-center justify-center px-6 group/filled"
            >
              <button
                type="button"
                data-testid="reference-stack-btn"
                aria-label={`Show all ${refList.length} uploaded images`}
                onClick={() => handleOpenDialog?.(slot)}
                className="flex cursor-pointer flex-col items-center gap-1 rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--border-heavy)] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
              >
                <span className="relative h-13 w-16.5">
                  {stackLayers.map(({ item, wrapperClass, style }, idx) => {
                    const itemId = item.workflow_id || item.id || item.url || String(idx);
                    const src = resolveMediaUrl(item) || item.url || "";
                    const isVid = item.type === "video" || Boolean(item.is_video) || Boolean(item.isVideo);
                    return (
                      <span
                        key={itemId}
                        data-testid={`view-reference-${item.id || item.workflow_id || idx}`}
                        className={wrapperClass}
                        style={style}
                      >
                        <span className="relative size-12 rotate-4 rounded-2xl [corner-shape:squircle] transition-[rotate,scale] duration-300 ease-[var(--ease-out-quart)] group-hover/filled:rotate-0 group-hover/filled:scale-[1.06] motion-reduce:transition-none border-2 border-[color:var(--border-heavy)] [--rim:2px] block">
                          {isVid ? (
                            <video
                              src={src}
                              muted
                              loop
                              autoPlay
                              playsInline
                              className="block size-full object-cover overflow-hidden rounded-[calc(16px-var(--rim,0px))] [corner-shape:squircle]"
                            />
                          ) : (
                            <img
                              alt=""
                              decoding="async"
                              className="block size-full object-cover overflow-hidden rounded-[calc(16px-var(--rim,0px))] [corner-shape:squircle]"
                              src={src}
                            />
                          )}
                        </span>
                      </span>
                    );
                  })}
                </span>
                <span className="flex w-full min-w-0 flex-col items-center text-center">
                  <span className="max-w-30.5 truncate text-[color:var(--text-primary)] text-label-sm">
                    Uploaded
                  </span>
                  <span className="whitespace-nowrap text-[color:var(--text-secondary)] text-body-xs">
                    Used as reference
                  </span>
                </span>
              </button>

              <button
                type="button"
                data-testid="reference-remove-all-btn"
                aria-label={`Remove all ${refList.length} uploaded images`}
                onClick={(e) => {
                  e.stopPropagation();
                  refList.forEach((refItem) => handleRemoveReferenceItem?.(refItem, backendKey));
                }}
                className="absolute top-[calc(-4.3px-var(--rim,0px))] right-[calc(-9.5px-var(--rim,0px))] grid size-5 -rotate-4 cursor-pointer place-items-center rounded-full bg-[color:var(--ui-menu-background)] text-[color:var(--icon-primary)] [--blur:20px] hover:bg-[color:var(--ui-menu-background-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--border-heavy)] transition-[rotate,background-color] duration-300 ease-[var(--ease-out-quart)] group-hover/filled:rotate-0 motion-reduce:transition-none z-10"
                style={{
                  backdropFilter: "blur(var(--blur, 40px))",
                  right: "auto",
                  top: "calc(50% - 46px)",
                  left: "calc(50% + 23px)",
                  rotate: "none",
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M7.29268 7.30529C7.47998 7.11782 7.73398 7.0125 7.99882 7.0125C8.26367 7.0125 8.51767 7.11782 8.70497 7.30529L11.994 10.5983L15.283 7.30529C15.3752 7.20978 15.4854 7.1336 15.6072 7.08119C15.7291 7.02878 15.8602 7.00119 15.9928 7.00004C16.1254 6.99888 16.2569 7.02419 16.3797 7.07447C16.5024 7.12475 16.6139 7.199 16.7077 7.29289C16.8015 7.38679 16.8756 7.49844 16.9259 7.62133C16.9761 7.74423 17.0014 7.87591 17.0002 8.00869C16.9991 8.14147 16.9715 8.27269 16.9192 8.39469C16.8668 8.5167 16.7907 8.62704 16.6953 8.71929L13.4063 12.0123L16.6953 15.3053C16.8773 15.4939 16.9779 15.7465 16.9757 16.0087C16.9734 16.2709 16.8683 16.5217 16.6832 16.7071C16.498 16.8925 16.2475 16.9977 15.9856 17C15.7237 17.0022 15.4714 16.9014 15.283 16.7193L11.994 13.4263L8.70497 16.7193C8.5166 16.9014 8.2643 17.0022 8.00242 17C7.74054 16.9977 7.49003 16.8925 7.30484 16.7071C7.11966 16.5217 7.01462 16.2709 7.01234 16.0087C7.01007 15.7465 7.11074 15.4939 7.29268 15.3053L10.5817 12.0123L7.29268 8.71929C7.10543 8.53176 7.00024 8.27745 7.00024 8.01229C7.00024 7.74712 7.10543 7.49282 7.29268 7.30529Z"
                  />
                </svg>
              </button>
            </div>
          );
        }

        // Fixed Keyframe Slot (Start Frame / End Frame in video mode — stays the same)
        return (
          <div key={slot.role} className="flex items-center gap-1.5 px-2">
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
  );
}
