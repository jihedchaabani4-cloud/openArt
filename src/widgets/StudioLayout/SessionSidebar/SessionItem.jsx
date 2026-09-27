"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/shared/ui/context-menu";
import { formatRelativeTime } from "./utils";
import { resolveMediaUrl, isMediaVideo } from "@/shared/lib/displayUtils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

/**
 * SessionItem — exact Krea AI structure and division ("ta9sima").
 * Structure: nkUyELME > QRN5ax9i _0c0YtLDn [YxWsR2DP] > _4wLIjhiw (zone 1) + rbL9332z (zone 2) + _6-KYYdj5 (zone 3)
 */
export function SessionItem({
  session,
  isActive,
  isExpanded,
  isDraggingOver,
  dragOverSessionId,
  mediaList = [],
  editingSessionId,
  openDropdownId,
  openContextMenuId,
  onSelect,
  onRename,
  onDelete,
  onDropdownOpenChange,
  onContextMenuOpenChange,
  onDragOver,
  onDrop,
}) {
  const itemRef = React.useRef(null);
  const sessionId = session.name || session.id || session.session_id;
  const displayName = session.metadata?.displayName || session.session_name || "Untitled";
  const mediaCount = mediaList.length;

  const firstMedia = mediaList[0];
  const thumbUrl = firstMedia ? resolveMediaUrl(firstMedia) : null;
  const isVideo = firstMedia ? (isMediaVideo(firstMedia) || (thumbUrl && /\.(mp4|webm|mov)$/i.test(thumbUrl))) : false;

  const isDragTarget = dragOverSessionId === sessionId;

  return (
    <div
      ref={itemRef}
      data-session-id={sessionId}
      className={cn(
        "rt-Flex rt-r-fd-column rt-r-gap-0 nkUyELME w-full transition-all duration-150 select-none",
        isDragTarget && "outline outline-2 outline-white/40 -outline-offset-2 rounded-xl bg-white/10"
      )}
      onDragOver={(e) => onDragOver?.(e, sessionId)}
      onDrop={(e) => onDrop?.(e, sessionId)}
    >
      <ContextMenu
        onOpenChange={(open) => onContextMenuOpenChange?.(open, sessionId)}
      >
        <ContextMenuTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(sessionId)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(sessionId);
              }
            }}
            data-state="enabled"
            data-type="session"
            data-testid="asset-item-session"
            className={cn(
              "QRN5ax9i _0c0YtLDn w-[276px] h-[56px] shrink-0 flex items-center justify-between px-1.5 rounded-xl transition-colors duration-150 cursor-pointer group outline-none",
              isActive && "YxWsR2DP",
              isExpanded
                ? (isActive
                    ? "bg-white/[0.08] hover:bg-white/[0.1]"
                    : "hover:bg-white/[0.04]")
                : "bg-transparent"
            )}
            title={`Session: ${displayName}`}
          >
            {/* ── Zone 1: Text column (_4wLIjhiw) ── */}
            <div
              className={cn(
                "_4wLIjhiw flex-1 min-w-0 pr-1.5 flex flex-col justify-center transition-opacity duration-100",
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
                    className="rt-Flex rt-r-ai-center rt-r-gap flex items-center gap-1 w-full"
                    style={{ "--gap": "4px" }}
                  >
                    <p
                      className="M62SzGkP YVr5CyLZ hMtyerta JLHNaI5D text-[13px] font-medium text-white/95 truncate w-full select-none cursor-pointer"
                      title="Double-click to rename"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        const r = itemRef.current?.getBoundingClientRect();
                        onRename?.(sessionId, displayName, r);
                      }}
                    >
                      {displayName}
                    </p>
                  </div>
                  <div className="bXQHM8vj">
                    <p
                      className="bwb-ytSs bfYBxxY6 ANaoSOqf vlTtiXYR _0-TArdMK MpYFP8Fq text-[11px] text-white/40 -mt-0.5 truncate"
                      data-variant="body"
                      data-truncate="true"
                      data-size="xs"
                      style={{ WebkitLineClamp: 1 }}
                    >
                      {formatRelativeTime(session.metadata?.createTime || session.create_time)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Zone 2: Middle actions button (rbL9332z) ── */}
            <div
              className={cn(
                "rbL9332z shrink-0 transition-opacity duration-100 mr-1.5",
                isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu
                open={openDropdownId === sessionId}
                onOpenChange={(open) => onDropdownOpenChange?.(open, sessionId)}
              >
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="czT9T-Z0 rX9iw-2j x-X6WsHP CwvQCQAW CZfA-iwz size-7 flex items-center justify-center rounded-md text-white/0 group-hover:text-white/50 hover:!text-white hover:bg-white/10 transition-all outline-none"
                    data-testid="delete-button"
                    aria-label="More actions"
                    aria-haspopup="menu"
                    aria-expanded={openDropdownId === sessionId}
                    data-state="enabled"
                    data-button-size="md"
                    data-icon-only="true"
                  >
                    <div className="PDK3Zwgj flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.14265 7.99979C5.14265 8.63097 4.63097 9.14265 3.99979 9.14265C3.36861 9.14265 2.85693 8.63097 2.85693 7.99979C2.85693 7.36861 3.36861 6.85693 3.99979 6.85693C4.63097 6.85693 5.14265 7.36861 5.14265 7.99979Z"
                          fill="currentColor"
                        />
                        <path
                          d="M9.14265 7.99979C9.14265 8.63097 8.63097 9.14265 7.99979 9.14265C7.36861 9.14265 6.85693 8.63097 6.85693 7.99979C6.85693 7.36861 7.36861 6.85693 7.99979 6.85693C8.63097 6.85693 9.14265 7.36861 9.14265 7.99979Z"
                          fill="currentColor"
                        />
                        <path
                          d="M11.9998 9.14265C12.631 9.14265 13.1426 8.63097 13.1426 7.99979C13.1426 7.36861 12.631 6.85693 11.9998 6.85693C11.3686 6.85693 10.8569 7.36861 10.8569 7.99979C10.8569 8.63097 11.3686 9.14265 11.9998 9.14265Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 p-1 bg-[#151617] border-white/10 text-white shadow-xl">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = itemRef.current?.getBoundingClientRect();
                      onRename?.(sessionId, displayName, r);
                    }}
                    className="text-[12px] cursor-pointer hover:bg-white/10 rounded-md"
                  >
                    Edit title
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete?.(sessionId)}
                    className="text-[12px] cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md"
                  >
                    Delete session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ── Zone 3: Right cell (_6-KYYdj5) ── */}
            <div
              className={cn(
                "_6-KYYdj5 bHGXKATD w-[52px] h-[52px] shrink-0 rounded-[13px] overflow-hidden flex items-center justify-center relative transition-all duration-200 ease-out origin-center transform-gpu",
                isActive
                  ? "scale-[1.15] z-20 shadow-xl shadow-black/80"
                  : "scale-100 group-hover:scale-[1.15] hover:scale-[1.15] group-hover:z-10 hover:z-10 group-hover:shadow-lg",
                thumbUrl ? (
                  isActive
                    ? "bg-black/40"
                    : "bg-black/40"
                ) : (
                  isActive
                    ? "bg-[#25262a]"
                    : "bg-[#1d1e20] group-hover:bg-[#25262a]"
                )
              )}
              data-state="enabled"
              data-cell-type={thumbUrl ? "thumbnail" : "empty"}
              aria-label={thumbUrl ? `thumbnail with ${mediaCount} items` : "empty"}
            >
              {thumbUrl ? (
                <div className="nu12nnSD w-full h-full relative">
                  <div className="AT8bHpoz _7il3pN4l w-full h-full rounded-[14px] overflow-hidden" data-size="lg" data-ratio="1:1">
                    {isVideo ? (
                      <video
                        src={thumbUrl}
                        className="qvB3HBZk w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      />
                    ) : (
                      <img
                        src={thumbUrl}
                        alt=""
                        data-testid="thumbnail-1:1-lg"
                        className="qvB3HBZk w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                  {mediaCount > 0 && (
                    <div className="U6VFMyDk absolute bottom-1 right-1 px-1.5 min-w-[18px] h-[18px] rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none border border-white/15 shadow-sm">
                      <p
                        className="_8yb3AdNg vlTtiXYR _0-TArdMK text-[11px] font-bold text-white leading-none"
                        data-variant="labelCaps"
                        data-size="sm"
                      >
                        {mediaCount}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="UFyLjQxp w-full h-full bg-[#1d1e20]" aria-label="Empty Item" />
              )}
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-36 p-1 bg-[#151617] border-white/10 text-white shadow-xl">
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              const r = itemRef.current?.getBoundingClientRect();
              onRename?.(sessionId, displayName, r);
            }}
            className="text-[12px] cursor-pointer hover:bg-white/10 rounded-md"
          >
            Edit title
          </ContextMenuItem>
          <ContextMenuItem
            variant="destructive"
            onClick={() => onDelete?.(sessionId)}
            className="text-[12px] cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md"
          >
            Delete session
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
