"use client";

import React from "react";
import { motion } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
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
import { SPRING_FAST } from "./constants";
import { formatRelativeTime } from "./utils";
import { Button } from "@/shared/ui/button";
/**
 * SessionItem — a single session row inside the sidebar.
 */
export function SessionItem({
    session,
    index,
    isActive,
    isExpanded,
    isDraggingOver,
    dragOverSessionId,
    mediaList,
    editingSessionId,
    editingName,
    openDropdownId,
    openContextMenuId,
    onSelect,
    onRename,
    onSaveRename,
    onDelete,
    onKeyDown,
    onEditingNameChange,
    onDropdownOpenChange,
    onContextMenuOpenChange,
    onDragOver,
    onDrop,
}) {
    const sessionId    = session.name;
    const displayName  = session.metadata?.displayName || "Untitled";
    const thumbUrl     = mediaList[0]?.url || null;
    const isVideoThumb = thumbUrl && /\.(mp4|webm|mov)$/i.test(thumbUrl);

    return (
        <div
            className={cn(
                "w-[230px] rounded-md transition-all duration-0",
                dragOverSessionId === sessionId
                    ? "outline outline-2 outline-white/10 -outline-offset-2 bg-white/10"
                    : ""
            )}
            onDragOver={(e) => onDragOver(e, sessionId)}
            onDrop={(e) => onDrop(e, sessionId)}
        >
            <ContextMenu
                onOpenChange={(open) => onContextMenuOpenChange(open, sessionId)}
            >
                <ContextMenuTrigger asChild>
                    <motion.div
                        className="relative w-full flex items-center justify-start rounded-md group/item p-0 cursor-pointer transition-all duration-0"
                        onClick={() => onSelect(sessionId)}
                        initial={{ opacity: 0, x: -8, backgroundColor: "rgba(0,0,0,0)" }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            backgroundColor: isActive && isExpanded ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0)",
                            pointerEvents: isDraggingOver ? "none" : "auto",
                        }}
                        transition={{ ...SPRING_FAST, delay: index * 0.03 }}
                        whileHover={{
                            backgroundColor: isActive && isExpanded
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(255,255,255,0.05)",
                        }}
                    >
                        {/* ── Text panel (revealed on expand) ── */}
                        <motion.div
                            className="absolute right-4 left-[52px] flex flex-col justify-center pointer-events-none"
                            animate={{
                                opacity: isExpanded ? 1 : 0,
                                x: isExpanded ? 0 : -8,
                            }}
                            transition={SPRING_FAST}
                            style={{ pointerEvents: isExpanded ? "auto" : "none" }}
                        >
                            <div className="flex items-center justify-between w-full gap-1">
                                <div className="flex flex-col min-w-0">
                                    {editingSessionId === sessionId ? (
                                        <div className="flex items-center gap-1 min-w-0">
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => onEditingNameChange(e.target.value)}
                                                onBlur={(e) => {
                                                    if (!e.relatedTarget?.closest(".save-edit-btn")) {
                                                        onEditingNameChange(""); // reset
                                                    }
                                                }}
                                                onKeyDown={onKeyDown}
                                                autoFocus
                                                onFocus={(e) => e.target.select()}
                                                className="font-bold text-[13px] text-white bg-white/10 border border-white/20 rounded w-full px-1 py-0.5 min-w-0 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 placeholder:text-white/30"
                                                onClick={(e) => e.stopPropagation()}
                                                placeholder="Session Name"
                                            />
                                            <button
                                                className="save-edit-btn p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors shrink-0"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    onSaveRename();
                                                }}
                                                title="Save"
                                            >
                                                <GoogleIcon iconName="check" className="text-[13px]" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="font-bold text-[13px] text-white truncate max-w-[160px]">
                                            {displayName}
                                        </span>
                                    )}

                                    <span className="text-[10px] font-medium text-white/40 -mt-0.5">
                                        {formatRelativeTime(session.metadata?.createTime)}
                                    </span>
                                </div>

                                <DropdownMenu
                                    open={openDropdownId === sessionId}
                                    onOpenChange={(open) => onDropdownOpenChange(open, sessionId)}
                                >
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <button className="shrink-0 p-1 rounded-lg text-white/0 group-hover/item:text-white/50 hover:!text-white hover:bg-white/10 transition-all duration-150 outline-none flex items-center justify-center">
                                            <GoogleIcon iconName="more_horiz" className="text-[13px]" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="min-w-[140px]">
                                        <DropdownMenuItem
                                            onClick={(e) => { e.stopPropagation(); onRename(sessionId, displayName); }}
                                        >
                                            Edit title
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => { e.stopPropagation(); onDelete(sessionId); }}
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </motion.div>

                        {/* ── Thumbnail ── */}
                        <motion.div
                            className={cn(
                                "w-10 h-10 shrink-0 rounded-md overflow-hidden flex items-center justify-center relative z-10 transition-all",
                                thumbUrl
                                    ? "bg-white/20"
                                    : (isActive
                                        ? "bg-black/95 bg-[linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1))]"
                                        : "bg-black/25 bg-[linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1))]")
                            )}
                            whileHover={{ scale: 1.06 }}
                            whileTap={{ scale: 0.95 }}
                            transition={SPRING_FAST}
                        >
                            {thumbUrl && (
                                isVideoThumb ? (
                                    <video
                                        src={thumbUrl}
                                        className="w-full h-full object-cover"
                                        muted
                                        loop
                                        onMouseEnter={(e) => e.currentTarget.play()}
                                        onMouseLeave={(e) => e.currentTarget.pause()}
                                    />
                                ) : (
                                    <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                )
                            )}
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none rounded-md" />
                        </motion.div>
                    </motion.div>
                </ContextMenuTrigger>

                {/* Context menu (right-click) */}
                {openContextMenuId === sessionId && (
                    <ContextMenuContent className="min-w-[140px]">
                        <ContextMenuItem
                            onClick={(e) => { e.stopPropagation(); onRename(sessionId, displayName); }}
                        >
                            Edit title
                        </ContextMenuItem>
                        <ContextMenuItem
                            onClick={(e) => { e.stopPropagation(); onDelete(sessionId); }}
                        >
                            Delete session
                        </ContextMenuItem>
                    </ContextMenuContent>
                )}
            </ContextMenu>
        </div>
    );
}
