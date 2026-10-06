"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * FlowErrorTile
 * 1:1 Pixel-perfect implementation of Google VideoFX / Flow <flow-video-tile> & <flow-error-tile>.
 * Matches the reference design: dark charcoal blurred background (no red), white outline warning icon,
 * exact typography, and bottom-right aligned circular frosted action buttons (Retry, Reuse prompt, Delete).
 */
export function FlowErrorTile({
  error,
  onRetry,
  onReusePrompt,
  onDelete,
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
            className="error-tile w-full h-full flex flex-col p-3 sm:p-4 md:p-5 overflow-hidden rounded-2xl select-none"
            style={{
              background: "linear-gradient(180deg, rgba(28, 28, 28, .8), rgba(45, 45, 45, .8))",
              color: "var(--foreground-state-90)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "none",
            }}
          >
            <div className="error-tile-content flex flex-col justify-between h-full w-full min-h-0 overflow-hidden">
              {/* ── Top section: Warning icon + Title + Subtitle ── */}
              <div className="error-message flex flex-col items-start text-left w-full min-h-0 overflow-hidden">
                <mat-icon
                  role="img"
                  className="mat-icon notranslate error-icon google-symbols mat-icon-no-color shrink-0"
                  aria-hidden="true"
                  data-mat-icon-type="font"
                  style={{
                    fontSize: "20px",
                    width: "20px",
                    height: "20px",
                    color: "rgba(255, 255, 255, 0.85)",
                    marginBottom: "4px",
                  }}
                >
                  warning
                </mat-icon>
                <div
                  className="error-title font-sans font-medium text-white tracking-normal text-[14px] sm:text-[15px] leading-tight shrink-0"
                >
                  Failed
                </div>
                <div className="error-subtitle flex flex-col gap-1 mt-1 font-sans min-h-0 overflow-hidden">
                  <span
                    className="error-message-text font-normal text-white/75 text-[11px] sm:text-[12px] leading-snug line-clamp-2"
                  >
                    {displayError}
                  </span>
                  <span
                    className="disclaimer-message font-normal text-white/50 text-[10px] sm:text-[11px] leading-tight line-clamp-1"
                  >
                    You have not been charged for this generation.
                  </span>
                </div>
              </div>

              {/* ── Bottom-right aligned Action Buttons ── */}
              <div
                className="buttons-container flex items-center justify-end gap-1.5 mt-auto w-full self-end pt-1 shrink-0"
                style={{ justifyContent: "flex-end" }}
              >
                {/* 1. Reuse Prompt Button */}
                <button
                  type="button"
                  flow-icon-button=""
                  maticonbutton=""
                  className="mdc-icon-button mat-mdc-icon-button mat-mdc-button-base mat-mdc-tooltip-trigger mat-unthemed flow-icon-button-primary flow-button-small flow-icon-button-no-touch-target cursor-pointer shrink-0"
                  mat-ripple-loader-class-name="mat-mdc-button-ripple"
                  mat-ripple-loader-centered=""
                  aria-label="Reuse prompt"
                  title="Reuse prompt"
                  style={{
                    width: "34px",
                    height: "34px",
                    minWidth: "32px",
                    minHeight: "32px",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    color: "#ffffff",
                    border: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReusePrompt?.(e);
                  }}
                >
                  <span className="mat-mdc-button-persistent-ripple mdc-icon-button__ripple" />
                  <mat-icon
                    role="img"
                    className="mat-icon notranslate google-symbols mat-icon-no-color"
                    aria-hidden="true"
                    data-mat-icon-type="font"
                    style={{ fontSize: "17px", width: "17px", height: "17px" }}
                  >
                    undo
                  </mat-icon>
                  <span className="mat-focus-indicator" />
                  <span className="mat-mdc-button-touch-target" />
                  <span className="mat-ripple mat-mdc-button-ripple" />
                </button>

                {/* 3. Delete Button */}
                <button
                  type="button"
                  flow-icon-button=""
                  maticonbutton=""
                  className="mdc-icon-button mat-mdc-icon-button mat-mdc-button-base mat-mdc-tooltip-trigger mat-unthemed flow-icon-button-primary flow-button-small flow-icon-button-no-touch-target cursor-pointer shrink-0"
                  mat-ripple-loader-class-name="mat-mdc-button-ripple"
                  mat-ripple-loader-centered=""
                  aria-label="Delete"
                  title="Delete"
                  style={{
                    width: "34px",
                    height: "34px",
                    minWidth: "32px",
                    minHeight: "32px",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    color: "#ffffff",
                    border: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(e);
                  }}
                >
                  <span className="mat-mdc-button-persistent-ripple mdc-icon-button__ripple" />
                  <mat-icon
                    role="img"
                    className="mat-icon notranslate google-symbols mat-icon-no-color"
                    aria-hidden="true"
                    data-mat-icon-type="font"
                    style={{ fontSize: "17px", width: "17px", height: "17px" }}
                  >
                    delete_forever
                  </mat-icon>
                  <span className="mat-focus-indicator" />
                  <span className="mat-mdc-button-touch-target" />
                  <span className="mat-ripple mat-mdc-button-ripple" />
                </button>
              </div>
            </div>
          </div>
        </flow-error-tile>
      </div>
    </flow-video-tile>
  );
}

export default FlowErrorTile;
