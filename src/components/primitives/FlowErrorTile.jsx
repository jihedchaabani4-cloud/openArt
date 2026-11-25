"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/base/button";
import { HugeIcon } from "@/components/primitives/HugeIcon";

/**
 * FlowErrorTile
 * 1:1 Pixel-perfect implementation of Google VideoFX / Flow <flow-video-tile> & <flow-error-tile>.
 * Matches the reference design: dark charcoal blurred background (no red), white outline warning icon,
 * exact typography, and bottom-right aligned circular frosted action buttons (Retry, Reuse prompt, Delete).
 */
export function FlowErrorTile({
  error,
  onReusePrompt,
  canReusePrompt = true,
  onDelete,
  hideActions = false,
  className,
}) {
  const displayError =
    error && typeof error === "string" && error.trim().length > 0
      ? error
      : "This generation might violate our policies. Please try a different prompt or send feedback.";

  return (
    <flow-video-tile class={cn("flow-video-tile block w-full h-full select-none", className)}>
      <div className="container w-full h-full flex flex-col">
        <flow-error-tile class="flow-error-tile block w-full h-full">
          <div
            className="error-tile w-full h-full flex flex-col p-3 sm:p-4 md:p-5 overflow-hidden rounded-none select-none"
          >
            <div className="error-tile-content flex flex-col justify-between h-full w-full min-h-0 overflow-hidden">
              {/* ── Top section: Warning icon + Title + Subtitle ── */}
              <div className="error-message flex flex-col items-start text-left w-full min-h-0 overflow-hidden">
                <HugeIcon name="alert-02" className="error-icon shrink-0" />
                <div
                  className="error-title ds-type-caption-label text-white shrink-0"
                >
                  Failed
                </div>
                <div className="error-subtitle flex flex-col gap-1 mt-1 font-sans min-h-0 overflow-hidden">
                  <span
                    className="error-message-text ds-type-small text-white/75 line-clamp-2"
                  >
                    {displayError}
                  </span>
                  <span
                    className="disclaimer-message ds-type-micro-tag text-white/50 line-clamp-1"
                  >
                    You have not been charged for this generation.
                  </span>
                </div>
              </div>

              {/* ── Bottom-right aligned Action Buttons ── */}
              {!hideActions && (
                <div
                  className="buttons-container flex items-center justify-end gap-1.5 mt-auto w-full self-end pt-1 shrink-0"
                >
                  {/* 1. Reuse Prompt Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    className="size-8 p-0 rounded-subtle"
                    aria-label="Reuse prompt"
                    title="Reuse prompt"
                    disabled={!canReusePrompt}
                    
                    onClick={(e) => {
                      if (canReusePrompt) {
                        e.stopPropagation();
                        onReusePrompt?.(e);
                      }
                    }}
                  >
                    <HugeIcon name="undo" size="md" />
                  </Button>

                  {/* 3. Delete Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    className="size-8 p-0 rounded-subtle"
                    aria-label="Delete"
                    title="Delete"
                    
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(e);
                    }}
                  >
                    <HugeIcon name="delete-02" size="md" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </flow-error-tile>
      </div>
    </flow-video-tile>
  );
}

export default FlowErrorTile;
