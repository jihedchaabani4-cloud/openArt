"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, Video, Loader2, Plus, MoreHorizontal, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useGenerationsStore } from "@/features/generations/model/useGenerationsStore";
import { useSessions } from "@/features/projects/api/projectsApi";
import { useCreateSession, useUpdateSession, useDeleteSession } from "@/features/projects/api/createSessionApi";
import { pendingSessionIds } from "@/features/generations/api/generationsApi";
import { queryKeys } from "@/shared/api/queryKeys";
import { api } from "@/shared/api/client";
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
    const { data: sessions = [], isLoading } = useSessions(selectedProjectId);
    const { mutateAsync: createSession } = useCreateSession();
    const { mutateAsync: updateSession } = useUpdateSession();
    const { mutateAsync: deleteSession } = useDeleteSession();

    const [isHovered, setIsHovered] = React.useState(false);
    const [openDropdownId, setOpenDropdownId] = React.useState(null);
    const [openContextMenuId, setOpenContextMenuId] = React.useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
    const [sessionToDelete, setSessionToDelete] = React.useState(null);
    const [editingSessionId, setEditingSessionId] = React.useState(null);
    const [editingName, setEditingName] = React.useState("");

    // ── Cover watcher: poll for completed asset URL and patch sessions cache ──
    React.useEffect(() => {
        if (!selectedProjectId) return;

        const interval = setInterval(async () => {
            if (pendingSessionIds.size === 0) return;

            const sessionsSnapshot = queryClient.getQueryData(queryKeys.sessions.byProject(selectedProjectId));
            if (!Array.isArray(sessionsSnapshot)) return;

            const toCheck = [...pendingSessionIds].filter(sid =>
                sessionsSnapshot.some(s => s.session_id === sid)
            );

            for (const sid of toCheck) {
                try {
                    const res = await api.get(`/generations/generations/${selectedProjectId}?session_id=${sid}`);
                    if (!res.ok || !res.data) continue;

                    const completedItem = res.data
                        .flatMap(g => g.items || [])
                        .find(item => item.asset?.file_url);

                    if (completedItem?.asset?.file_url) {
                        queryClient.setQueryData(queryKeys.sessions.byProject(selectedProjectId), (old) => {
                            if (!Array.isArray(old)) return old;
                            return old.map(s =>
                                s.session_id === sid
                                    ? { ...s, cover_url: s.cover_url || completedItem.asset.file_url }
                                    : s
                            );
                        });

                        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.byProject(selectedProjectId) });
                        pendingSessionIds.delete(sid);
                        console.log(`[SessionSidebar] ✅ Generation complete — cover_url patched + sessions refreshed for: ${sid}`);
                    }
                } catch (e) {
                    // Silently fail — next interval will retry
                }
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [selectedProjectId, queryClient]);

    if (!selectedProjectId) return null;

    const isExpanded = isHovered || openDropdownId !== null || openContextMenuId !== null || editingSessionId !== null;

    const handleCreateSession = async () => {
        console.log("[SessionSidebar] 'New session' clicked. Verifying sessions...");

        if (!sessions || sessions.length === 0) {
            console.log("[SessionSidebar] No existing sessions. Creating a new 'Untitled' session.");
            const newSession = await createSession({ project_id: selectedProjectId, session_name: "Untitled" });
            if (newSession && newSession.session_id) setActiveSessionId(newSession.session_id);
            return;
        }

        const sortedSessions = [...sessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latestSession = sortedSessions[0];
        const isEmpty = latestSession.items_count === 0 || (!latestSession.items_count && latestSession.image_cover == null);

        console.log("[SessionSidebar] Latest session found:", latestSession.name || latestSession.session_name || "Untitled");
        console.log("[SessionSidebar] Is the latest session completely empty?", isEmpty, `(Items count: ${latestSession.items_count || 0})`);

        if (isEmpty) {
            console.log("[SessionSidebar] ➔ Reusing the empty session instead of creating a new one.");
            setActiveSessionId(latestSession.session_id);
        } else {
            console.log("[SessionSidebar] ➔ Latest session has content. Creating a new 'Untitled' session via API...");
            const newSession = await createSession({ project_id: selectedProjectId, session_name: "Untitled" });
            if (newSession && newSession.session_id) {
                console.log("[SessionSidebar] ➔ Successfully created and switched to new session:", newSession.session_id);
                setActiveSessionId(newSession.session_id);
            }
        }
    };

    const handleRename = (sessionId, currentName) => {
        setEditingSessionId(sessionId);
        setEditingName(currentName || "Untitled");
        // Also close the dropdown so it doesn't stay open over the input
        setOpenDropdownId(null);
    };

    const handleSaveRename = async () => {
        const targetId = editingSessionId;
        const targetName = editingName.trim();
        if (targetId) {
            setEditingSessionId(null);
            
            const session = sessions.find(s => s.session_id === targetId);
            const currentName = session?.session_name || "Untitled";
            
            if (targetName && targetName !== currentName) {
                // Not waiting on async intentionally, UI returns instantly to unedited view
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

    return (
        <div className="w-[62px] h-full shrink-0 relative z-40 bg-transparent">

            {/* ── Expanding wrapper — Framer Motion spring ── */}
            <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 max-h-[90vh] h-fit flex flex-col items-start overflow-hidden py-2 border-y border-r border-white/5 rounded-r-md shadow-2xl"
                animate={{
                    width: isExpanded ? 280 : 72,
                    backgroundColor: isExpanded
                        ? "rgba(10,10,10,0.85)"
                        : "rgba(10,10,10,0.60)",
                }}
                transition={SPRING}
                style={{ backdropFilter: "blur(40px)" }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Fixed-width inner container to prevent reflow */}
                <div className="w-[280px] flex flex-col h-fit shrink-0 items-start">

                    {/* ── Header: New Session Button ── */}
                    <div className="px-1 w-[280px] flex justify-start mb-2 shrink-0">
                        <button
                            className="flex items-center justify-start w-full h-12 px-1 rounded-md hover:bg-white/5 transition-colors group/btn text-white/40 hover:text-white"
                            onClick={handleCreateSession}
                        >
                            <motion.div
                                className="w-12 h-12 flex items-center justify-center rounded-lg bg-white/15 shrink-0"
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
                            sessions.map((session, index) => {
                                const isActive = activeSessionId === session.session_id;
                                const isVideoSession = session.type === 'video' || (session.name || '').toLowerCase().includes('video');
                                const Icon = isVideoSession ? Video : ImageIcon;

                                let thumbUrl = session.cover_url || null;
                                if (!thumbUrl && session.items && session.items.length > 0) {
                                    const firstItem = session.items[0];
                                    thumbUrl = firstItem?.file_url || firstItem?.asset?.file_url || firstItem?.asset?.url || null;
                                }

                                const itemsCount = session.items_count || session.items?.length || 0;

                                return (
                                    <ContextMenu 
                                        key={session.session_id}
                                        onOpenChange={(open) => setOpenContextMenuId(open ? session.session_id : null)}
                                    >
                                        <ContextMenuTrigger asChild>
                                            <motion.div
                                                className={cn(
                                                    "relative w-full flex items-center justify-start rounded-md group/item p-1 cursor-pointer",
                                            isActive && isExpanded ? "bg-[#1e1e1e]" : ""
                                        )}
                                        onClick={() => setActiveSessionId(session.session_id)}
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
                                                {editingSessionId === session.session_id ? (
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
                                                        {session.name || session.session_name || "Untitled"}
                                                    </span>
                                                )}

                                                <DropdownMenu onOpenChange={(open) => setOpenDropdownId(open ? session.session_id : null)}>
                                                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                                        <button className="text-white/40 hover:text-white p-1.5 rounded-md hover:bg-white/10 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#1e1e1e] border-white/10 text-white min-w-[140px] rounded-md z-50 shadow-2xl">
                                                        <DropdownMenuItem
                                                            onClick={(e) => { e.stopPropagation(); handleRename(session.session_id, session.session_name); }}
                                                            className="focus:bg-white/10 cursor-pointer"
                                                        >
                                                            Edit title
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(session.session_id); }}
                                                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <span className="text-xs font-medium text-white/40 mt-1">
                                                {formatRelativeTime(session.updated_at || session.created_at)}
                                            </span>
                                        </motion.div>

                                        {/* ── Thumbnail / Avatar ── */}
                                        <motion.div
                                            className={cn(
                                                "w-12 h-12 shrink-0 rounded-md overflow-hidden flex items-center justify-center relative z-10",
                                                isActive ? "bg-black/20" : "bg-black/20"
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
                                                        className="absolute right-1 bottom-1 min-w-[18px] h-[18px] rounded-full bg-[#1e1e1e] border-2 border-[#1e1e1e] flex items-center justify-center px-1 z-20"
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                        transition={SPRING_FAST}
                                                    >
                                                        <span className="text-[9px] font-black text-white/90 leading-none">
                                                            {itemsCount}
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none rounded-md" />
                                        </motion.div>
                                    </motion.div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent className="bg-[#1e1e1e] border-white/10 text-white min-w-[140px] rounded-md z-50 shadow-2xl">
                                        <ContextMenuItem
                                            onClick={(e) => { e.stopPropagation(); handleRename(session.session_id, session.session_name); }}
                                            className="focus:bg-white/10 cursor-pointer"
                                        >
                                            Edit title
                                        </ContextMenuItem>
                                        <ContextMenuItem
                                            onClick={(e) => { e.stopPropagation(); handleDelete(session.session_id); }}
                                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                        >
                                            Delete session
                                        </ContextMenuItem>
                                    </ContextMenuContent>
                                </ContextMenu>
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