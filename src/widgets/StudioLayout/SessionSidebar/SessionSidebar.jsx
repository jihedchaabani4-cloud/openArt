"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { usePromptStore } from "@/features/studio";
import { useProjectData, useMoveWorkflow } from "@/features/workflows/api/workflowsApi";
import { useCreateSession, useUpdateSession, useDeleteSession } from "@/features/projects/api/createSessionApi";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { InlineRenamePill } from "@/shared/ui/InlineRenamePill";

import { NewSessionButton } from "./NewSessionButton";
import { SessionItem } from "./SessionItem";

// Ultra-responsive snappy transition — instantaneous response on hover with zero delay
const SIDEBAR_TRANSITION = {
  type: "tween",
  duration: 0.16,
  ease: [0.16, 1, 0.3, 1],
};

/**
 * SessionSidebar — Dedicated floating right-hand session navigation rail for the Generations page.
 * Strictly adheres to Krea AI's UI specification:
 * - Collapsed: 58px wide floating pill showing only the 1:1 right square cells (New + thumbnails).
 * - Expanded: Smoothly expands leftwards to 280px on hover/drag, revealing labels, timestamps, and 3-dots menus.
 */
export function SessionSidebar() {
  const { selectedProjectId, activeSessionId, setActiveSessionId } = useGenerationsStore();

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: projectData, isLoading } = useProjectData(selectedProjectId);
  const sessions = React.useMemo(() => projectData?.projectContents?.sessions ?? [], [projectData]);
  const workflows = React.useMemo(() => projectData?.projectContents?.workflows ?? [], [projectData]);
  const allMedia = React.useMemo(() => projectData?.projectContents?.media ?? [], [projectData]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutateAsync: createSession } = useCreateSession();
  const { mutateAsync: updateSession } = useUpdateSession();
  const { mutateAsync: deleteSession } = useDeleteSession();
  const { mutate: moveWorkflow } = useMoveWorkflow();

  // ── Local state ───────────────────────────────────────────────────────────
  const [isHovered, setIsHovered] = React.useState(false);
  const [openDropdownId, setOpenDropdownId] = React.useState(null);
  const [openContextMenuId, setOpenContextMenuId] = React.useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [sessionToDelete, setSessionToDelete] = React.useState(null);
  const [editingSessionId, setEditingSessionId] = React.useState(null);
  const [editingName, setEditingName] = React.useState("");
  const [editingSessionRect, setEditingSessionRect] = React.useState(null);
  const canDismissRef = React.useRef(false);
  const [dragOverSessionId, setDragOverSessionId] = React.useState(null);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [isDragOverNew, setIsDragOverNew] = React.useState(false);

  const isDraggingGalleryItem = usePromptStore((s) => s.isDraggingGalleryItem);

  // ── Derived data ──────────────────────────────────────────────────────────
  /** Map: sessionId → sorted media array (newest first) */
  const sessionMediaMap = React.useMemo(() => {
    const map = {};
    const wfToSession = {};
    workflows.forEach((w) => {
      const sId = w.session_id || w.metadata?.sessionId;
      if (sId) {
        wfToSession[w.name || w.id] = sId;
        const short = sId.split("/").pop();
        if (short !== sId) wfToSession[w.name || w.id] = sId;
      }
    });

    allMedia.forEach((m) => {
      const sid = wfToSession[m.workflowId];
      if (sid) {
        if (!map[sid]) map[sid] = [];
        map[sid].push(m);
        const short = sid.split("/").pop();
        if (short !== sid) {
          if (!map[short]) map[short] = [];
          map[short].push(m);
        }
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

  const isExpanded =
    isHovered ||
    isDraggingOver ||
    isDraggingGalleryItem ||
    openDropdownId !== null ||
    openContextMenuId !== null ||
    editingSessionId !== null;

  // Dynamically update rename pill position if the session list scrolls or window resizes
  React.useEffect(() => {
    if (!editingSessionId) {
      setEditingSessionRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(`[data-session-id="${editingSessionId}"]`);
      if (el) {
        setEditingSessionRect(el.getBoundingClientRect());
      }
    };

    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [editingSessionId]);

  if (!selectedProjectId) {
    return null;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateSession = async () => {
    const nextIndex = (sessions || []).length + 1;
    const newSession = await createSession({
      project_id: selectedProjectId,
      session_name: `Session ${nextIndex}`,
    });
    if (newSession?.id || newSession?.session_id) {
      setActiveSessionId(newSession.id || newSession.session_id);
    }
  };

  const handleRename = (sessionId, currentName, rect) => {
    canDismissRef.current = false;
    setEditingSessionId(sessionId);
    setEditingName(currentName || "Untitled");
    setEditingSessionRect(rect || null);
    setOpenDropdownId(null);
    setOpenContextMenuId(null);
    setTimeout(() => {
      canDismissRef.current = true;
    }, 150);
  };

  const handleSaveRename = async (newName) => {
    const targetId = editingSessionId;
    const targetName = (newName ?? editingName).trim();
    if (targetId && targetName) {
      await updateSession({
        sessionId: targetId,
        sessionData: { session_name: targetName },
        projectId: selectedProjectId,
      });
    }
    setEditingSessionId(null);
    setEditingSessionRect(null);
  };

  const handleCancelRename = () => {
    setEditingSessionId(null);
    setEditingSessionRect(null);
  };

  const getPillPosition = () => {
    if (!editingSessionRect || typeof window === "undefined") {
      return { top: "50%", right: "320px", transform: "translateY(-50%)" };
    }
    const PILL_HEIGHT = 56;
    const top = Math.max(
      16,
      Math.min(
        window.innerHeight - PILL_HEIGHT - 16,
        editingSessionRect.top + (editingSessionRect.height - PILL_HEIGHT) / 2
      )
    );
    // Align pill to 14px to the left of the session rail
    const right = Math.max(16, window.innerWidth - editingSessionRect.left + 14);
    return {
      top: `${top}px`,
      right: `${right}px`,
    };
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

  // ── Drag & drop handlers ──────────────────────────────────────────────────
  const handleDragOver = (e, sessionId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (dragOverSessionId !== sessionId) {
      setDragOverSessionId(sessionId);
      setIsDragOverNew(false);
    }
    setIsDraggingOver(true);
  };

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

  return (
    <aside
      role="navigation"
      aria-label="Generation space navigation"
      className="nVZd1Tjd w-[64px] shrink-0 h-full relative z-30 flex flex-col justify-center select-none pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        tabIndex={0}
        role="navigation"
        aria-label="Generation space navigation"
        className={cn(
          "L2toal1p i-P5XMop absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-end rounded-2xl overflow-hidden p-1.5 gap-1 outline-none transition-colors duration-100",
          isExpanded
            ? "bg-[#0d0e0e]/95 backdrop-blur-[24px] shadow-2xl shadow-black/80"
            : "bg-transparent backdrop-blur-none shadow-none"
        )}
        animate={{
          width: isExpanded ? 292 : 64,
        }}
        transition={SIDEBAR_TRANSITION}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragEnter={() => setIsDraggingOver(true)}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDraggingOver) setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDraggingOver(false);
            setDragOverSessionId(null);
            setIsDragOverNew(false);
          }
        }}
        onDrop={() => setIsDraggingOver(false)}
      >
        {/* ── Top Row: New Session action / drop target ── */}
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

        {/* ── Sessions List Container ── */}
        <div className="hMbd1cHn w-[276px] max-h-[calc(65vh-70px)] overflow-y-auto overflow-x-hidden flex flex-col gap-1 pr-0.5 custom-session-scrollbar">
          {isLoading ? (
            <div className="w-full flex justify-center py-4">
              <GoogleIcon
                iconName="progress_activity"
                className="text-[18px] animate-spin text-white/30"
              />
            </div>
          ) : (
            sortedSessions.map((session, index) => {
              const sid = session.name || session.id || session.session_id;
              const mediaList =
                sessionMediaMap[sid] ||
                sessionMediaMap[session.name] ||
                sessionMediaMap[session.id] ||
                [];

              return (
                <SessionItem
                  key={sid || index}
                  session={session}
                  index={index}
                  isActive={
                    activeSessionId === sid ||
                    activeSessionId === session.name ||
                    activeSessionId === session.id
                  }
                  isExpanded={isExpanded}
                  isDraggingOver={isDraggingOver}
                  dragOverSessionId={dragOverSessionId}
                  mediaList={mediaList}
                  editingSessionId={editingSessionId}
                  openDropdownId={openDropdownId}
                  openContextMenuId={openContextMenuId}
                  onSelect={setActiveSessionId}
                  onRename={handleRename}
                  onDelete={handleDelete}
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
              );
            })
          )}
        </div>
      </motion.div>

      {/* ── Dialog-like Rename Portal (Pill next to session + full-screen dismissal backdrop) ── */}
      {editingSessionId && typeof window !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[99999]">
          {/* Layer 1 — Full-screen backdrop: blocks clicks to any other card, closes on click */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] cursor-default"
            onPointerDown={(e) => {
              e.stopPropagation();
              if (canDismissRef.current) {
                handleCancelRename();
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (canDismissRef.current) {
                handleCancelRename();
              }
            }}
          />

          {/* Layer 2 — Floating Pill positioned directly to the left of the session row */}
          <div
            className="fixed z-[100000] pointer-events-auto"
            style={getPillPosition()}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <InlineRenamePill
              initialName={editingName || ""}
              onSave={handleSaveRename}
              onCancel={handleCancelRename}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ── Delete confirmation dialog ── */}
      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Supprimer la session ?"
        description="Tous les contenus de cette session seront définitivement supprimés."
        onConfirm={confirmDelete}
      />


    </aside>
  );
}
