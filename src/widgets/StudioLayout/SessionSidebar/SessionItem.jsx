"use client";

import React from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Check } from "lucide-react";
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

/**
 * SessionItem — a single session row inside the sidebar.
 *
 * Props
 * ─────
 * session            – raw session object from the API
 * index              – position in the list (used for entrance stagger)
 * isActive           – whether this session is the currently selected one
 * isExpanded         – whether the sidebar is in its expanded state
 * isDraggingOver     – global drag state (disables pointer events on children)
 * dragOverSessionId  – session currently being hovered during a drag
 * mediaList          – array of media items belonging to this session
 * editingSessionId   – id of the session currently being renamed (or null)
 * editingName        – current value of the inline rename input
 * openDropdownId     – id of the session whose dropdown is open (or null)
 * openContextMenuId  – id of the session whose context menu is open (or null)
 *
 * Callbacks
 * ─────────
 * onSelect(sessionId)
 * onRename(sessionId, currentName)
 * onSaveRename()
 * onDelete(sessionId)
 * onKeyDown(e)
 * onEditingNameChange(value)
 * onDropdownOpenChange(open, sessionId)
 * onContextMenuOpenChange(open, sessionId)
 * onDragOver(e, sessionId)
 * onDrop(e, sessionId)
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
    const itemsCount   = mediaList.length;
    const latestMedia  = mediaList[0];
    const thumbUrl     = latestMedia?.url || null;
    const isVideoThumb = thumbUrl && /\.(mp4|webm|mov)$/i.test(thumbUrl);

    return (
        <div
            className={cn(
                "w-full rounded-md transition-all duration-0",
                dragOverSessionId === sessionId
                    ? "outline outline-2 outline-white/40 -outline-offset-2 bg-white/5"
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
                        className={cn(
                            "relative w-full flex items-center justify-start rounded-md group/item p-0 cursor-pointer transition-all duration-0",
                        )}
                        onClick={() => onSelect(sessionId)}
                        // Entrance animation
                        initial={{ opacity: 0, x: -8, backgroundColor: "rgba(0,0,0,0)" }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            backgroundColor: isActive && isExpanded ? "rgba(30,30,30,1)" : "rgba(0,0,0,0)",
                            pointerEvents: isDraggingOver ? "none" : "auto",
                        }}
                        transition={{ ...SPRING_FAST, delay: index * 0.03 }}
                        whileHover={{
                            backgroundColor: isActive && isExpanded
                                ? "rgba(30,30,30,1)"
                                : "rgba(255,255,255,0.05)",
                        }}
                    >
                        {/* ── Text panel (revealed on expand) ── */}
                        <motion.div
                            className="absolute right-4 left-[68px] flex flex-col justify-center pointer-events-none"
                            animate={{
                                opacity: isExpanded ? 1 : 0,
                                x: isExpanded ? 0 : -8,
                            }}
                            transition={SPRING_FAST}
                            style={{ pointerEvents: isExpanded ? "auto" : "none" }}
                        >
                            {/* Name row */}
                            <div className="flex items-center justify-between w-full">
                                {editingSessionId === sessionId ? (
                                    <div className="flex flex-1 items-center justify-around gap-1 min-w-0 mr-2">
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
                                            className="font-semibold text-xs text-white bg-white/10 border border-white/20 rounded w-full px-1 py-0.5 min-w-0 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 placeholder:text-white/30"
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
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="font-semibold text-xs text-white truncate max-w-[150px]">
                                        {displayName}
                                    </span>
                                )}

                                {/* ⋯ Dropdown */}
                                <DropdownMenu
                                    open={openDropdownId === sessionId}
                                    onOpenChange={(open) => onDropdownOpenChange(open, sessionId)}
                                >
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <button className="text-white/40 hover:text-white p-1.5 rounded-md hover:bg-white/10 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="bg-[#1e1e1e] border-white/10 text-white min-w-[140px] rounded-md z-50 shadow-2xl"
                                    >
                                        <DropdownMenuItem
                                            onClick={(e) => { e.stopPropagation(); onRename(sessionId, displayName); }}
                                            className="focus:bg-white/10 cursor-pointer"
                                        >
                                            Edit title
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => { e.stopPropagation(); onDelete(sessionId); }}
                                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Relative time */}
                            <span className="text-xs font-medium text-white/40 mt-1">
                                {formatRelativeTime(session.metadata?.createTime)}
                            </span>
                        </motion.div>

                        {/* ── Thumbnail ── */}
                        <motion.div
                            className={cn(
                                "w-13 h-13 shrink-0 rounded-md overflow-hidden flex items-center justify-center relative z-10 transition-all",
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
                    <ContextMenuContent className="bg-[#1e1e1e] border-white/10 text-white min-w-[140px] rounded-md z-50 shadow-2xl">
                        <ContextMenuItem
                            onClick={(e) => { e.stopPropagation(); onRename(sessionId, displayName); }}
                            className="focus:bg-white/10 cursor-pointer"
                        >
                            Edit title
                        </ContextMenuItem>
                        <ContextMenuItem
                            onClick={(e) => { e.stopPropagation(); onDelete(sessionId); }}
                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                        >
                            Delete session
                        </ContextMenuItem>
                    </ContextMenuContent>
                )}
            </ContextMenu>
        </div>
    );
}
