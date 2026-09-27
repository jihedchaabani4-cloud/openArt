"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * NewSessionButton — exact Krea AI structure and division.
 * Structure: qYlzt-QL > QRN5ax9i _0c0YtLDn UsTfO8i5 > _4wLIjhiw (left) + _6-KYYdj5 (right)
 */
export function NewSessionButton({
  isExpanded,
  isDraggingOver,
  isDragOverNew,
  onCreate,
  onDragOver,
  onDrop,
}) {
  return (
    <div className="qYlzt-QL w-full flex justify-end">
      <div
        role="button"
        tabIndex={0}
        onClick={onCreate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onCreate?.();
          }
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        data-state="enabled"
        data-type="icon"
        data-testid="asset-item-icon"
        className={cn(
          "QRN5ax9i _0c0YtLDn UsTfO8i5 w-[276px] h-[56px] shrink-0 flex items-center justify-between px-1.5 rounded-xl transition-colors duration-150 select-none cursor-pointer group outline-none",
          isExpanded
            ? (isDragOverNew
                ? "bg-white/10 outline outline-2 outline-white/30 -outline-offset-2"
                : "hover:bg-white/[0.06] active:bg-white/[0.08]")
            : "bg-transparent"
        )}
        title="Create new session"
        aria-label="New session"
      >
        {/* ── Left zone (_4wLIjhiw) ── */}
        <div
          className={cn(
            "_4wLIjhiw flex-1 min-w-0 pr-2 transition-opacity duration-100",
            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="pBV7IFtu">
            <div
              className="rt-Flex rt-r-fd-column rt-r-ai-start rt-r-jc-center rt-r-gap rt-r-w flex flex-col items-start justify-center gap-1 w-full"
              style={{ "--gap": "4px", "--width": "100%" }}
            >
              <div
                flex="1"
                className="rt-Flex rt-r-ai-center rt-r-gap flex items-center gap-1 flex-1"
                style={{ "--gap": "4px" }}
              >
                <p
                  className="TGRYFzPC bfYBxxY6 ANaoSOqf vlTtiXYR _0-TArdMK text-[13px] font-medium text-white/90 truncate"
                  data-variant="label"
                  data-truncate="true"
                  data-size="md"
                  style={{ WebkitLineClamp: 1 }}
                >
                  New session
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right cell (_6-KYYdj5 bHGXKATD) ── */}
        <div
          className={cn(
            "_6-KYYdj5 bHGXKATD w-[52px] h-[52px] shrink-0 rounded-[13px] flex items-center justify-center transition-all duration-200 ease-out origin-center transform-gpu group-hover:scale-[1.15] hover:scale-[1.15] text-white/60 group-hover:text-white",
            isExpanded
              ? (isDragOverNew
                  ? "bg-white/20 text-white"
                  : "bg-white/[0.04] group-hover:bg-white/[0.08]")
              : (isDragOverNew
                  ? "bg-white/20 text-white rounded-[14px]"
                  : "bg-transparent hover:bg-white/10")
          )}
          data-state="enabled"
          data-cell-type="icon"
          aria-label="icon"
        >
          <div className="_529VkZql flex items-center justify-center" aria-label="Icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 transition-transform group-hover:scale-110"
            >
              <g id="Icons/Actions/Add/Normal">
                <path
                  id="Object Color"
                  d="M9.64296 3.21415C9.64296 2.85911 9.35515 2.57129 9.0001 2.57129C8.64506 2.57129 8.35725 2.85911 8.35725 3.21415V8.357H3.21439C2.85935 8.357 2.57153 8.64482 2.57153 8.99986C2.57153 9.3549 2.85935 9.64272 3.21439 9.64272H8.35725V14.7856C8.35725 15.1406 8.64506 15.4284 9.0001 15.4284C9.35515 15.4284 9.64296 15.1406 9.64296 14.7856V9.64272H14.7858C15.1409 9.64272 15.4287 9.3549 15.4287 8.99986C15.4287 8.64482 15.1409 8.357 14.7858 8.357H9.64296V3.21415Z"
                  fill="currentColor"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
