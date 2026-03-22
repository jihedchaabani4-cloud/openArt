"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Image as ImageIcon, Video, FolderOpen, Loader2, Plus, MoreHorizontal } from "lucide-react";
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

export function SessionSidebar() {
    const queryClient = useQueryClient();
    const { selectedProjectId, activeSessionId, setActiveSessionId } = useGenerationsStore();
    const { data: sessions = [], isLoading } = useSessions(selectedProjectId);
    const { mutateAsync: createSession } = useCreateSession();
    const { mutateAsync: updateSession } = useUpdateSession();
    const { mutateAsync: deleteSession } = useDeleteSession();

    const [isHovered, setIsHovered] = React.useState(false);
    const [openDropdownId, setOpenDropdownId] = React.useState(null);

    // ── Cover watcher: poll for completed asset URL and patch sessions cache ──
    React.useEffect(() => {
        if (!selectedProjectId) return;

        const interval = setInterval(async () => {
            if (pendingSessionIds.size === 0) return;

            const sessionsSnapshot = queryClient.getQueryData(queryKeys.sessions.byProject(selectedProjectId));
            if (!Array.isArray(sessionsSnapshot)) return;

            // Check all pending sessions (regardless of whether they have a cover yet)
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
                        // Patch cover_url in local cache immediately
                        queryClient.setQueryData(queryKeys.sessions.byProject(selectedProjectId), (old) => {
                            if (!Array.isArray(old)) return old;
                            return old.map(s =>
                                s.session_id === sid
                                    ? { ...s, cover_url: s.cover_url || completedItem.asset.file_url }
                                    : s
                            );
                        });

                        // Now do a real server re-fetch so items_count is accurate
                        queryClient.invalidateQueries({ queryKey: queryKeys.sessions.byProject(selectedProjectId) });

                        pendingSessionIds.delete(sid);
                        console.log(`[SessionSidebar] ✅ Generation complete — cover_url patched + sessions refreshed for: ${sid}`);
                    }
                } catch (e) {
                    // Silently fail — next interval will retry
                }
            }
        }, 4000); // Check every 4 seconds

        return () => clearInterval(interval);
    }, [selectedProjectId, queryClient]);

    if (!selectedProjectId) return null;

    const isExpanded = isHovered || openDropdownId !== null;

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
        
        // Now it uses the actual `items_count` injected by the backend
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

    const handleRename = async (sessionId, currentName) => {
        const newName = prompt("Rename Session:", currentName || "Untitled");
        if (newName && newName !== currentName) {
            await updateSession({ sessionId, sessionData: { session_name: newName }, projectId: selectedProjectId });
        }
    };

    const handleDelete = async (sessionId) => {
        if (confirm("Are you sure you want to delete this session?")) {
            await deleteSession({ sessionId, projectId: selectedProjectId });
            if (activeSessionId === sessionId) {
                setActiveSessionId(null);
            }
        }
    };

    return (
        <div className="w-[88px] h-full shrink-0 relative z-40 bg-transparent">
            {/* The expanding wrapper */}
            <div 
                className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 max-h-[90vh] h-fit transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col items-end overflow-hidden py-2 border-y border-l border-white/5 rounded-l-md shadow-2xl",
                    isExpanded ? "w-[320px] bg-[#0a0a0a]/80 backdrop-blur-3xl" : "w-[88px] bg-[#0a0a0a]/60 backdrop-blur-2xl"
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                
                {/* A strictly sized container to prevent content reflow during animation */}
                <div className="w-[320px] flex flex-col h-fit shrink-0 items-end">
                    
                    {/* Header: New Session Button */}
                    <div className="px-4 w-[320px] flex justify-end mb-6 shrink-0 pt-2">
                        <button 
                            className="flex items-center justify-between w-full h-14 pl-4 pr-[3px] rounded-md hover:bg-white/5 transition-all group/btn text-white/40 hover:text-white group/btnContainer"
                            onClick={handleCreateSession}
                        >
                            <span className={cn(
                                "transition-opacity duration-200 delay-100 font-semibold text-sm",
                                isExpanded ? "opacity-100" : "opacity-0"
                            )}>
                                New session
                            </span>
                            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-transparent group-hover/btnContainer:bg-white/5 transition-all shrink-0">
                                <Plus className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                            </div>
                        </button>
                    </div>

                    {/* Sessions List */}
                    <div className="w-[320px] max-h-[60vh] overflow-y-auto overflow-x-hidden hide-scrollbar flex flex-col items-end gap-3 px-4 shrink">
                        {isLoading ? (
                            <div className="w-full flex justify-end pr-5">
                                <Loader2 className="w-5 h-5 animate-spin text-white/30" />
                            </div>
                        ) : (
                            sessions.map((session) => {
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
                                    <div 
                                        key={session.session_id} 
                                        className={cn(
                                            "relative w-full flex items-center justify-end rounded-md group/item p-1 cursor-pointer transition-all",
                                            isActive ? "bg-[#1e1e1e]" : "hover:bg-white/5"
                                        )}
                                        onClick={() => setActiveSessionId(session.session_id)}
                                    >
                                        
                                        {/* Text Side (Revealed on Sidebar Hover) */}
                                        <div className={cn(
                                            "absolute left-4 right-[72px] flex flex-col justify-center transition-opacity duration-200 delay-100",
                                            isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                                        )}>
                                            <div className="flex items-center justify-between w-full">
                                                <span className="font-semibold text-sm text-white truncate max-w-[150px]">
                                                    {session.name || session.session_name || "Untitled"}
                                                </span>
                                                
                                                <DropdownMenu onOpenChange={(open) => setOpenDropdownId(open ? session.session_id : null)}>
                                                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                                        <button className="text-white/40 hover:text-white p-1.5 rounded-md hover:bg-white/10 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#1e1e1e] border-white/10 text-white min-w-[140px] rounded-md z-50 shadow-2xl">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRename(session.session_id, session.session_name) }} className="focus:bg-white/10 cursor-pointer">
                                                            Edit title
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(session.session_id) }} className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer">
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            
                                            <span className="text-xs font-medium text-white/40 mt-1">
                                                {formatRelativeTime(session.updated_at || session.created_at)}
                                            </span>
                                        </div>

                                        {/* Avatar / Thumbnail Side */}
                                        <div 
                                            className={cn(
                                                "w-14 h-14 shrink-0 rounded-md overflow-hidden flex items-center justify-center transition-all relative z-10",
                                                isActive ? "bg-black/20" : "bg-black/20"
                                            )}
                                        >
                                            {thumbUrl ? (
                                                isVideoSession ? (
                                                    <video src={thumbUrl} className="w-full h-full object-cover" muted loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()}/>
                                                ) : (
                                                    <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                                )
                                            ) : (
                                                <Icon className={cn("w-5 h-5", isActive ? "text-white/90" : "text-white/40 group-hover/item:text-white/70")} />
                                            )}
                                            
                                            {itemsCount > 0 && (
                                                <div className="absolute right-1 bottom-1 min-w-[18px] h-[18px] rounded-full bg-[#1e1e1e] border-2 border-[#1e1e1e] flex items-center justify-center px-1 z-20">
                                                    <span className="text-[9px] font-black text-white/90 leading-none">{itemsCount}</span>
                                                </div>
                                            )}
                                            
                                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none rounded-md" />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
