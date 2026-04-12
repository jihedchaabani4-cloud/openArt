"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Video, Loader2, Plus, MoreHorizontal, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { useProjectData, useMoveWorkflow } from "@/features/workflows/api/workflowsApi";
import { useCreateSession, useUpdateSession, useDeleteSession } from "@/features/projects/api/createSessionApi";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/shared/ui/context-menu";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";

function formatRelativeTime(dateString) {
    if (!dateString) return "just now";
    const diffInSeconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `about ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `about ${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
}

// Spring config — tuned for 120Hz feel
const SPRING = {
    type: "spring",
    stiffness: 600,
    damping: 32,
    mass: 0.6,
};

// Faster spring for opacity/scale micro-animations
const SPRING_FAST = {
    type: "spring",
    stiffness: 600,
    damping: 36,
    mass: 0.4,
};

export function SessionSidebar() {
    const queryClient = useQueryClient();
    const { selectedProjectId, activeSessionId, setActiveSessionId } = useGenerationsStore();

    // ── Fetch all project data (sessions come from projectContents.sessions) ──
    const { data: projectData, isLoading } = useProjectData(selectedProjectId);
    const sessions = projectData?.projectContents?.sessions ?? [];
    const workflows = projectData?.projectContents?.workflows ?? [];
    const allMedia = projectData?.projectContents?.media ?? [];

    const { mutateAsync: createSession } = useCreateSession();
    const { mutateAsync: updateSession } = useUpdateSession();
    const { mutateAsync: deleteSession } = useDeleteSession();

    const { mutate: moveWorkflow } = useMoveWorkflow();

    const [isHovered, setIsHovered] = React.useState(false);
    const [openDropdownId, setOpenDropdownId] = React.useState(null);
    const [openContextMenuId, setOpenContextMenuId] = React.useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
    const [sessionToDelete, setSessionToDelete] = React.useState(null);
    const [editingSessionId, setEditingSessionId] = React.useState(null);
    const [editingName, setEditingName] = React.useState("");
    const [dragOverSessionId, setDragOverSessionId] = React.useState(null);
    const [isDraggingOver, setIsDraggingOver] = React.useState(false);
    const [isDragOverNew, setIsDragOverNew] = React.useState(false);

    // Group media by session and sort by most recent for thumbnails
    const sessionMediaMap = React.useMemo(() => {
        const map = {};
        const wfToSession = {};
        workflows.forEach(w => {
            wfToSession[w.name || w.id] = w.session_id || w.metadata?.sessionId;
        });
        
        allMedia.forEach(m => {
            const sid = wfToSession[m.workflowId];
            if (sid) {
                if (!map[sid]) map[sid] = [];
                map[sid].push(m);
            }
        });
        
        Object.values(map).forEach(arr => {
            arr.sort((a,b) => new Date(b.mediaMetadata?.createTime || b.create_time || 0) - new Date(a.mediaMetadata?.createTime || a.create_time || 0));
        });
        return map;
    }, [workflows, allMedia]);

    // ── Frontend sorting: Newest sessions first ──
    const sortedSessions = React.useMemo(() => {
        return [...sessions].sort((a, b) => 
            new Date(b.metadata?.createTime || 0) - new Date(a.metadata?.createTime || 0)
        );
    }, [sessions]);

    if (!selectedProjectId) return null;

    const isExpanded = isHovered || isDraggingOver || openDropdownId !== null || openContextMenuId !== null || editingSessionId !== null;

    const handleCreateSession = async () => {
        const newSession = await createSession({ project_id: selectedProjectId, session_name: "Untitled" });
        if (newSession?.id || newSession?.session_id) {
            setActiveSessionId(newSession.id || newSession.session_id);
        }
    };

    const handleRename = (sessionId, currentName) => {
        setEditingSessionId(sessionId);
        setEditingName(currentName || "Untitled");
        setOpenDropdownId(null);
    };

    const handleSaveRename = async () => {
        const targetId = editingSessionId;
        const targetName = editingName.trim();
        if (targetId) {
            setEditingSessionId(null);
            if (targetName) {
                updateSession({ sessionId: targetId, sessionData: { session_name: targetName }, projectId: selectedProjectId });
            }
        }
    };

    const handleKeyDown = (e) => {
        // Stop propagation so it doesn't trigger studio hotkeys etc
        e.stopPropagation();
        if (e.key === "Enter") {
            handleSaveRename();
        } else if (e.key === "Escape") {
            setEditingSessionId(null);
        }
    };

    const handleDelete = (sessionId) => {
        setSessionToDelete(sessionId);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (sessionToDelete) {
            await deleteSession({ sessionId: sessionToDelete, projectId: selectedProjectId });
            if (activeSessionId === sessionToDelete) setActiveSessionId(null);
            setSessionToDelete(null);
        }
    };

    const handleDragOver = (e, sessionId) => {
        e.preventDefault();
        // Matching 'all' or 'copy' with copy is safer across browsers
        e.dataTransfer.dropEffect = "copy";
        
        if (dragOverSessionId !== sessionId) {
            console.log(`🔎 [DragOver] Session: ${sessionId}`);
            setDragOverSessionId(sessionId);
        }
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverSessionId(null);
        }
    };

    const handleDrop = (e, targetSessionId) => {
        e.preventDefault();
        setDragOverSessionId(null);
        setIsDraggingOver(false);
        const workflowId = e.dataTransfer.getData("workflowId");

        // 🐛 Debug: show drop info
        console.group("🎯 [Drop] Session Drop Info");
        console.log("workflowId received:", workflowId || "(empty — nothing in dataTransfer)");
        console.log("targetSessionId    :", targetSessionId);
        console.log("projectId          :", selectedProjectId);
        console.groupEnd();

        if (!workflowId || !targetSessionId) return;
        moveWorkflow({
            workflowId,
            sessionId:  targetSessionId,
            projectId:  selectedProjectId,
        });
    };

    const handleDropNewSession = (e) => {
        e.preventDefault();
        setIsDragOverNew(false);
        setIsDraggingOver(false);
        const workflowId = e.dataTransfer.getData("workflowId");

        console.log("✨ [Drop] Creating new session for workflow:", workflowId);

        if (!workflowId) return;
        moveWorkflow({
            workflowId,
            newsession: true,
            projectId: selectedProjectId,
            sessionName: "New Session"
        });
    };

    return (
        <div className="w-[60px] h-full shrink-0 relative z-40 bg-transparent">

            {/* ── Expanding wrapper — Framer Motion spring ── */}
            <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 max-h-[90vh] h-fit flex flex-col items-start overflow-hidden py-2 rounded-r-md shadow-2xl"
                animate={{
                    width: isExpanded ? 280 : 72,
                    backgroundColor: isExpanded ? "rgba(10,10,10,0.85)" : "rgba(0,0,0,0)",
                    boxShadow: isExpanded ? "0 25px 50px -12px rgba(0,0,0,0.5)" : "none",
                    borderColor: isExpanded ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0)",
                }}
                transition={SPRING}
                style={{ backdropFilter: isExpanded ? "blur(40px)" : "none" }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onDragEnter={() => setIsDraggingOver(true)}
                onDragLeave={(e) => {
                    // only collapse sidebar when drag fully leaves the sidebar container
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                        setIsDraggingOver(false);
                        setDragOverSessionId(null);
                    }
                }}
                onDrop={() => setIsDraggingOver(false)}
            >
                {/* Fixed-width inner container to prevent reflow */}
                <div className="w-[280px] flex flex-col h-fit shrink-0 items-start">

                    {/* ── Header: New Session Button ── */}
                    <div className="px-1 w-[280px] flex justify-start mb-2 shrink-0">
                        <button
                            className={cn(
                                "flex items-center justify-start w-full h-12 px-1 rounded-md transition-all group/btn text-white/40 hover:text-white",
                                isDragOverNew ? "bg-white/10 ring-2 ring-white/30" : "hover:bg-white/5"
                            )}
                            onClick={handleCreateSession}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "copy";
                                setIsDragOverNew(true);
                                setIsDraggingOver(true);
                            }}
                            onDragLeave={() => setIsDragOverNew(false)}
                            onDrop={handleDropNewSession}
                        >
                            <motion.div
                                className={cn(
                                    "w-12 h-12 flex items-center justify-center rounded-lg shrink-0 transition-colors",
                                    isDragOverNew ? "bg-white/30" : "bg-white/15"
                                )}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.93 }}
                                transition={SPRING_FAST}
                            >
                                <Plus className="w-4 h-4" />
                            </motion.div>

                            <motion.span
                                className="font-medium text-sm ml-5 whitespace-nowrap overflow-hidden"
                                animate={{
                                    opacity: isExpanded ? 1 : 0,
                                    x: isExpanded ? 0 : -6,
                                }}
                                transition={{
                                    ...SPRING_FAST,
                                    delay: isExpanded ? 0.06 : 0,
                                }}
                            >
                                New session
                            </motion.span>
                        </button>
                    </div>

                    {/* ── Sessions List ── */}
                    <div className="w-[280px] max-h-[60vh] overflow-y-auto overflow-x-hidden hide-scrollbar flex flex-col items-start gap-2 px-1 shrink">
                        {isLoading ? (
                            <div className="w-full flex justify-end pr-5">
                                <Loader2 className="w-4 h-4 animate-spin text-white/30" />
                            </div>
                        ) : (
                            sortedSessions.map((session, index) => {
                                // New shape: session.name = UUID, session.metadata.displayName = label
                                const sessionId = session.name;
                                const isActive = activeSessionId === sessionId;
                                const displayName = session.metadata?.displayName || "Untitled";
                                
                                const sessionMediaList = sessionMediaMap[sessionId] || [];
                                const itemsCount = sessionMediaList.length;
                                const latestMedia = sessionMediaList[0];
                                const thumbUrl = latestMedia?.url || null;
                                const isVideoSession = thumbUrl && /\.(mp4|webm|mov)$/i.test(thumbUrl);
                                const Icon = ImageIcon;

                                return (
                                    <div
                                        key={sessionId}
                                        className={cn(
                                            "w-full rounded-md transition-all duration-150",
                                            dragOverSessionId === sessionId ? "ring-2 ring-white/40 bg-white/5" : ""
                                        )}
                                        onDragOver={(e) => handleDragOver(e, sessionId)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, sessionId)}
                                    >
                                    <ContextMenu 
                                        onOpenChange={(open) => {
                                            if (open) {
                                                setOpenContextMenuId(sessionId);
                                                setOpenDropdownId(null);
                                            } else {
                                                setOpenContextMenuId(null);
                                            }
                                        }}
                                    >
                                        <ContextMenuTrigger asChild>
                                            <motion.div
                                                className={cn(
                                                    "relative w-full flex items-center justify-start rounded-md group/item p-1 cursor-pointer transition-all duration-150",
                                                    isActive && isExpanded ? "bg-[#1e1e1e]" : "",
                                                )}
                                                onClick={() => setActiveSessionId(sessionId)}
                                                // Entrance animation
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ ...SPRING_FAST, delay: index * 0.03 }}
                                                whileHover={{
                                                    backgroundColor: isActive && isExpanded
                                                            ? "rgba(30,30,30,1)"
                                                            : "rgba(255,255,255,0.05)",
                                                }}
                                            >
                                        {/* ── Text side (revealed on expand) ── */}
                                        <motion.div
                                            className="absolute right-4 left-[72px] flex flex-col justify-center pointer-events-none"
                                            animate={{
                                                opacity: isExpanded ? 1 : 0,
                                                x: isExpanded ? 0 : -8,
                                            }}
                                            transition={{
                                                ...SPRING_FAST,
                                                delay: isExpanded ? 0.07 : 0,
                                            }}
                                            style={{ pointerEvents: isExpanded ? "auto" : "none" }}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                {editingSessionId === sessionId ? (
                                                    <div className="flex flex-1 items-center gap-1 min-w-0 mr-2">
                                                        <input
                                                            type="text"
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onBlur={(e) => {
                                                                if (!e.relatedTarget?.closest('.save-edit-btn')) {
                                                                    setEditingSessionId(null);
                                                                }
                                                            }}
                                                            onKeyDown={handleKeyDown}
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
                                                                handleSaveRename();
                                                            }}
                                                            title="Save"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="font-semibold text-xs text-white truncate max-w-[120px]">
                                                        {displayName}
                                                    </span>
                                                )}

                                                <DropdownMenu 
                                                    open={openDropdownId === sessionId}
                                                    onOpenChange={(open) => {
                                                        setOpenDropdownId(open ? sessionId : null);
                                                        if (open) setOpenContextMenuId(null);
                                                    }}
                                                >
                                                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                                        <button className="text-white/40 hover:text-white p-1.5 rounded-md hover:bg-white/10 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#1e1e1e] border-white/10 text-white min-w-[140px] rounded-md z-50 shadow-2xl">
                                                        <DropdownMenuItem
                                                            onClick={(e) => { e.stopPropagation(); handleRename(sessionId, displayName); }}
                                                            className="focus:bg-white/10 cursor-pointer"
                                                        >
                                                            Edit title
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(sessionId); }}
                                                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <span className="text-xs font-medium text-white/40 mt-1">
                                                {formatRelativeTime(session.metadata?.createTime)}
                                            </span>
                                        </motion.div>

                                        {/* ── Thumbnail / Avatar ── */}
                                        <motion.div
                                            className={cn(
                                                "w-12 h-12 shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-white/20 relative z-10",
                                               
                                            )}
                                            whileHover={{ scale: 1.06 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={SPRING_FAST}
                                        >
                                            {thumbUrl ? (
                                                isVideoSession ? (
                                                    <video
                                                        src={thumbUrl}
                                                        className="w-full h-full object-cover"
                                                        muted
                                                        loop
                                                        onMouseEnter={e => e.currentTarget.play()}
                                                        onMouseLeave={e => e.currentTarget.pause()}
                                                    />
                                                ) : (
                                                    <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                                )
                                            ) : (
                                                <Icon className={cn(
                                                    "w-5 h-5 transition-colors",
                                                    isActive ? "text-white/90" : "text-white/40 group-hover/item:text-white/70"
                                                )} />
                                            )}

                                            {/* Items count badge */}
                                            <AnimatePresence>
                                                {itemsCount > 0 && (
                                                    <motion.div
                                                        className="absolute right-0.5 bottom-0.5 min-w-[15px] h-[15px] rounded-full bg-[#1e1e1e] border-2 border-[#1e1e1e] flex items-center justify-center px-1 z-20"
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                        transition={SPRING_FAST}
                                                    >
                                                        <span className="text-[9px] font-medium text-white/90 leading-none">
                                                            {itemsCount}
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none rounded-md" />
                                        </motion.div>
                                    </motion.div>
                                    </ContextMenuTrigger>
                                    {openContextMenuId === sessionId && (
                                        <ContextMenuContent className="bg-[#1e1e1e] border-white/10 text-white min-w-[140px] rounded-md z-50 shadow-2xl">
                                            <ContextMenuItem
                                                onClick={(e) => { e.stopPropagation(); handleRename(sessionId, displayName); }}
                                                className="focus:bg-white/10 cursor-pointer"
                                            >
                                                Edit title
                                            </ContextMenuItem>
                                            <ContextMenuItem
                                                onClick={(e) => { e.stopPropagation(); handleDelete(sessionId); }}
                                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                            >
                                                Delete session
                                            </ContextMenuItem>
                                        </ContextMenuContent>
                                    )}
                                </ContextMenu>
                                </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </motion.div>

            <ConfirmDeleteDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                title="Supprimer la session ?"
                description="Tous les contenus de cette session seront définitivement supprimés."
                onConfirm={confirmDelete}
            />

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}