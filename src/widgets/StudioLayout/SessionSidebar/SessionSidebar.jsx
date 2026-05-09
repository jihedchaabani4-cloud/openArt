"use client";

import React from "react";
import { motion } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";
import { useProjectData, useMoveWorkflow } from "@/features/workflows/api/workflowsApi";
import { useCreateSession, useUpdateSession, useDeleteSession } from "@/features/projects/api/createSessionApi";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";

import { SPRING } from "./constants";

// Sidebar open/close spring — tuned for 144 Hz screens
const SIDEBAR_SPRING = {
    type: "spring",
    stiffness: 900,
    damping: 40,
    mass: 0.35,
};
import { NewSessionButton } from "./NewSessionButton";
import { SessionItem } from "./SessionItem";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// SessionSidebar — collapsible sidebar that lists sessions for the active project.
// Expands on hover / drag-enter, collapses on mouse-leave / drag-end.
// ─────────────────────────────────────────────────────────────────────────────
export function SessionSidebar() {
    const { 
        selectedProjectId, 
        activeSessionId, 
        setActiveSessionId,
    } = useGenerationsStore();

    const pathname = usePathname();
    const isElementsActive = pathname?.includes("/elements");

    // ── Data ─────────────────────────────────────────────────────────────────
    const { data: projectData, isLoading } = useProjectData(selectedProjectId);
    const sessions  = projectData?.projectContents?.sessions  ?? [];
    const workflows = projectData?.projectContents?.workflows ?? [];
    const allMedia  = projectData?.projectContents?.media     ?? [];

    // ── Mutations ─────────────────────────────────────────────────────────────
    const { mutateAsync: createSession } = useCreateSession();
    const { mutateAsync: updateSession } = useUpdateSession();
    const { mutateAsync: deleteSession } = useDeleteSession();
    const { mutate: moveWorkflow }       = useMoveWorkflow();
    const isNavbarHidden = useGenerationsStore((s) => s.isNavbarHidden);

    // ── Local state ───────────────────────────────────────────────────────────
    const [isHovered,          setIsHovered]          = React.useState(false);
    const [openDropdownId,     setOpenDropdownId]     = React.useState(null);
    const [openContextMenuId,  setOpenContextMenuId]  = React.useState(null);
    const [isDeleteConfirmOpen,setIsDeleteConfirmOpen]= React.useState(false);
    const [sessionToDelete,    setSessionToDelete]    = React.useState(null);
    const [editingSessionId,   setEditingSessionId]   = React.useState(null);
    const [editingName,        setEditingName]        = React.useState("");
    const [dragOverSessionId,  setDragOverSessionId]  = React.useState(null);
    const [isDraggingOver,     setIsDraggingOver]     = React.useState(false);
    const [isDragOverNew,      setIsDragOverNew]      = React.useState(false);

    // ── Derived data ──────────────────────────────────────────────────────────
    /** Map: sessionId → sorted media array (newest first) */
    const sessionMediaMap = React.useMemo(() => {
        const map = {};
        const wfToSession = {};
        workflows.forEach((w) => {
            wfToSession[w.name || w.id] = w.session_id || w.metadata?.sessionId;
        });
        allMedia.forEach((m) => {
            const sid = wfToSession[m.workflowId];
            if (sid) {
                if (!map[sid]) map[sid] = [];
                map[sid].push(m);
            }
        });
        Object.values(map).forEach((arr) =>
            arr.sort(
                (a, b) =>
                    new Date(b.mediaMetadata?.createTime || b.create_time || 0) -
                    new Date(a.mediaMetadata?.createTime || a.create_time || 0)
            )
        );
        return map;
    }, [workflows, allMedia]);

    /** Newest sessions first */
    const sortedSessions = React.useMemo(
        () =>
            [...sessions].sort(
                (a, b) =>
                    new Date(b.metadata?.createTime || 0) -
                    new Date(a.metadata?.createTime || 0)
            ),
        [sessions]
    );

    const isDraggingGalleryItem = usePromptStore((s) => s.isDraggingGalleryItem);

    const isExpanded =
        isHovered ||
        isDraggingOver ||
        isDraggingGalleryItem ||
        openDropdownId     !== null ||
        openContextMenuId  !== null ||
        editingSessionId   !== null;

    // ── Guard ─────────────────────────────────────────────────────────────────
    if (!selectedProjectId) return null;

    // ── Session handlers ──────────────────────────────────────────────────────
    const handleCreateSession = async () => {
        const newSession = await createSession({
            project_id: selectedProjectId,
            session_name: "Untitled",
        });
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
        const targetId   = editingSessionId;
        const targetName = editingName.trim();
        if (targetId) {
            setEditingSessionId(null);
            if (targetName) {
                updateSession({
                    sessionId: targetId,
                    sessionData: { session_name: targetName },
                    projectId: selectedProjectId,
                });
            }
        }
    };

    const handleKeyDown = (e) => {
        e.stopPropagation(); // prevent studio-wide hotkeys
        if (e.key === "Enter")  handleSaveRename();
        if (e.key === "Escape") setEditingSessionId(null);
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

    // ── Drag handlers ─────────────────────────────────────────────────────────
    const handleDragOver = (e, sessionId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        if (dragOverSessionId !== sessionId) {
            setDragOverSessionId(sessionId);
            setIsDragOverNew(false);
        }
        setIsDraggingOver(true);
    };
    // Note: individual item onDragLeave removed to prevent flicker.
    // Global cleanup is handled by the sidebar container's onDragLeave below.

    const handleDrop = (e, targetSessionId) => {
        e.preventDefault();
        setDragOverSessionId(null);
        setIsDraggingOver(false);
        const workflowId = e.dataTransfer.getData("workflowId");
        if (!workflowId || !targetSessionId) return;
        moveWorkflow({ workflowId, sessionId: targetSessionId, projectId: selectedProjectId });
    };

    const handleDropNewSession = (e) => {
        e.preventDefault();
        setIsDragOverNew(false);
        setIsDraggingOver(false);
        const workflowId = e.dataTransfer.getData("workflowId");
        if (!workflowId) return;
        moveWorkflow({
            workflowId,
            newsession: true,
            projectId: selectedProjectId,
            sessionName: "New Session",
        });
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="w-[60px] h-full shrink-0 relative z-40 bg-transparent flex flex-col">
            {/* Top Buttons */}
            <motion.div 
                className="flex flex-col items-center justify-start  relative z-50 overflow-hidden w-full"
                initial={false}
                animate={{
                    height: isNavbarHidden ? 0 : 76, // 76px exactly matches the Navbar total bounds
                    opacity: isNavbarHidden ? 0 : 1,
                    y: isNavbarHidden ? "-100%" : 0,
                    paddingTop: isNavbarHidden ? 0 : 18, // explicitly push it down to align precisely
                }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
                <Link 
                    href="/cinema-studio"
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 hover:text-white transition-colors"
                >
                    <GoogleIcon iconName="arrow_back" className="text-[13px]" />
                </Link>
            </motion.div>

            {/* Tabs for Studio Views */}
            <div className="flex flex-col items-center gap-2 pt-2 relative z-50 w-full">
                <Link 
                    href={`/cinema-studio/${selectedProjectId}/generations`}
                    className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                        !isElementsActive
                            ? "bg-white/10 text-white " 
                            : "bg-transparent text-white hover:bg-white/5"
                    )}
                    title="Generations"
                >
                    <GoogleIcon iconName="auto_awesome" className="text-[13px]" />
                </Link>
                <Link 
                    href={`/cinema-studio/${selectedProjectId}/elements`}
                    className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                        isElementsActive
                            ? "bg-white/10 text-white " 
                            : "bg-transparent text-white hover:bg-white/5"
                    )}
                    title="Elements Library"
                >
                    <GoogleIcon iconName="package_2" className="text-[13px]" />
                </Link>
            </div>

            {/* Expanding wrapper (anchored right below the buttons) */}
            {!isElementsActive && (
                <div className="relative p-1 w-full flex-1 z-40">
                    <motion.div
                    className={cn(
                        "absolute left-0 top-0 max-h-[calc(100vh-120px)] pl-2.5 h-fit flex flex-col items-start overflow-hidden py-2 rounded-2xl border transition-colors",
                    )}
                animate={{
                    backgroundColor: isExpanded ? "rgba(27, 27, 28, 0.85)" : "rgba(0,0,0,0)",
                    backdropFilter: isExpanded ? "blur(80px)" : "blur(0px)",
                    width: isExpanded ? 260 : 60,
                    boxShadow: isExpanded
                        ? "0 25px 50px -12px rgba(0,0,0,0.5)"
                        : "0 0px 0px 0px rgba(0,0,0,0)",
                    borderColor: isDraggingGalleryItem
                        ? "rgba(255,255,255,0.4)"
                        : isExpanded
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(255,255,255,0)",
                }}
                transition={SIDEBAR_SPRING}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onDragEnter={() => setIsDraggingOver(true)}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!isDraggingOver) setIsDraggingOver(true);
                }}
                onDragLeave={(e) => {
                    // Only collapse when drag fully exits the sidebar container
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                        setIsDraggingOver(false);
                        setDragOverSessionId(null);
                        setIsDragOverNew(false);
                    }
                }}
                onDrop={() => setIsDraggingOver(false)}
            >
                {/* Fixed-width inner wrapper to prevent reflow during animation */}
                <div className="w-[260px] gap-1 flex flex-col h-fit shrink-0">

                    {/* ── New Session button ── */}
                    <NewSessionButton
                        isExpanded={isExpanded}
                        isDraggingOver={isDraggingOver}
                        isDragOverNew={isDragOverNew}
                        onCreate={handleCreateSession}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "copy";
                            setIsDragOverNew(true);
                            setIsDraggingOver(true);
                            setDragOverSessionId(null);
                        }}
                        onDrop={handleDropNewSession}
                    />

                    {/* ── Sessions list ── */}
                    <div className="w-[260px] max-h-[60vh] gap-3 overflow-y-auto overflow-x-hidden hide-scrollbar flex flex-col  pb-1 shrink">
                        {isLoading ? (
                            <div className="w-full flex justify-end pr-5">
                                <GoogleIcon iconName="progress_activity" className="text-[14px] animate-spin text-white/30" />
                            </div>
                        ) : (
                            sortedSessions.map((session, index) => (
                                <SessionItem
                                    key={session.name}
                                    session={session}
                                    index={index}
                                    isActive={activeSessionId === session.name}
                                    isExpanded={isExpanded}
                                    isDraggingOver={isDraggingOver}
                                    dragOverSessionId={dragOverSessionId}
                                    mediaList={sessionMediaMap[session.name] || []}
                                    editingSessionId={editingSessionId}
                                    editingName={editingName}
                                    openDropdownId={openDropdownId}
                                    openContextMenuId={openContextMenuId}
                                    onSelect={setActiveSessionId}
                                    onRename={handleRename}
                                    onSaveRename={handleSaveRename}
                                    onDelete={handleDelete}
                                    onKeyDown={handleKeyDown}
                                    onEditingNameChange={setEditingName}
                                    onDropdownOpenChange={(open, id) => {
                                        setOpenDropdownId(open ? id : null);
                                        if (open) setOpenContextMenuId(null);
                                    }}
                                    onContextMenuOpenChange={(open, id) => {
                                        if (open) {
                                            setOpenContextMenuId(id);
                                            setOpenDropdownId(null);
                                        } else {
                                            setOpenContextMenuId(null);
                                        }
                                    }}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                />
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
                </div>
            )}

            {/* ── Delete confirmation dialog ── */}
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
