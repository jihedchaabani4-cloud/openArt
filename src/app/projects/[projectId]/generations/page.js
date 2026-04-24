"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useFilteredWorkflows as useFilteredGenerations } from "@/features/workflows/model/useFilteredWorkflows"
import { useProjectSessions } from "@/features/workflows/api/workflowsApi"
import PromptBar from "@/features/prompt-bar"
import { cn } from "@/shared/lib/utils"
import { RowsPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/rows.css'
import { ArrowUp } from "lucide-react"
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem"

import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";
import { getPrimaryMedia } from "@/shared/lib/generationUtils";
import { getItemMetadata as getDisplayMeta } from "@/shared/lib/displayUtils";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";

// ─── Sub-Components ──────────────────────────────────────────────────────────

const EmptyState = ({ message }) => (
    <div className="w-full h-full flex flex-col items-center justify-center">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2"
        >
            <p className="text-white/30 text-lg font-medium tracking-tight text-center px-6">
                {"Start creating or upload media"}
            </p>
        </motion.div>
    </div>
)

export default function GenerationsPage({ params }) {
    const { projectId } = React.use(params)
    const { setSelectedProjectId, activeSessionId, setActiveSessionId, setActiveStudioTab } = useGenerationsStore()
    const gridSize          = useGenerationsStore(s => s.gridSize);
    const setIsNavbarHidden = useGenerationsStore(s => s.setIsNavbarHidden);
    const [isGridResizing, setIsGridResizing] = React.useState(false);

    // Set the active project on mount
    React.useEffect(() => {
        if (projectId) setSelectedProjectId(projectId)
        setActiveStudioTab("generations")
    }, [projectId, setSelectedProjectId, setActiveStudioTab])

    // Fetch sessions for this project
    const sessions = useProjectSessions(projectId) || []

    // Auto-select the most recent session if none is active
    React.useEffect(() => {
        if (sessions.length > 0 && !activeSessionId) {
            setActiveSessionId(sessions[0].session_id)
        }
    }, [sessions, activeSessionId, setActiveSessionId])

    const isDragging = usePromptStore(s => s.isDraggingGalleryItem);
    const router = useRouter();
    
    const { data: fetchResult, isLoading } = useFilteredGenerations(projectId, activeSessionId);
    const workflows = fetchResult?.filteredWorkflows || [];

    // Navigate to the Edit Page for this workflow
    const handleWorkflowClick = (workflow) => {
        const workflowId = workflow.id || workflow.name;
        if (!workflowId || !projectId) return;
        router.push(`/projects/${projectId}/generations/edit/${workflowId}`);
    };

    const scrollRef = React.useRef(null);
    const prevScrollTop = React.useRef(0);
    const rafRef = React.useRef(null);
    const [showTopBtn, setShowTopBtn] = React.useState(false);

    // ─── 144fps scroll handler via requestAnimationFrame ─────────────────────
    const handleScroll = React.useCallback(() => {
        if (rafRef.current) return;

        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            if (!scrollRef.current) return;

            const currentScrollTop = scrollRef.current.scrollTop;

            setShowTopBtn(currentScrollTop > 400);

            const isCurrentlyHidden = useGenerationsStore.getState().isNavbarHidden;
            if (currentScrollTop > prevScrollTop.current && currentScrollTop > 80) {
                if (!isCurrentlyHidden) setIsNavbarHidden(true);
            } else if (currentScrollTop < prevScrollTop.current) {
                if (isCurrentlyHidden) setIsNavbarHidden(false);
            }

            prevScrollTop.current = currentScrollTop;
        });
    }, [setIsNavbarHidden]);

    // Cancel any pending rAF on unmount
    React.useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    React.useEffect(() => {
        setIsGridResizing(true);
        const timeout = window.setTimeout(() => setIsGridResizing(false), 220);
        return () => window.clearTimeout(timeout);
    }, [gridSize]);

    const scrollToTop = React.useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        const start     = el.scrollTop;
        const startTime = performance.now();
        const duration  = 600;

        const ease = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const animate = (now) => {
            const elapsed  = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            el.scrollTop   = start * (1 - ease(progress));
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, []);

    const targetRowHeight = gridSize === "lg" ? 380 : gridSize === "md" ? 280 : 200;

    const photos = React.useMemo(() => {
        return workflows.reduce((acc, workflow, i) => {
            const primaryItem = getPrimaryMedia(workflow);
            if (!primaryItem) return acc;

            const meta = getDisplayMeta(primaryItem, workflow);
            const aspect = meta?.aspect ?? "3/4";
            const [wStr, hStr] = aspect.split("/");
            const wNum = parseFloat(wStr) || 3;
            const hNum = parseFloat(hStr) || 4;
            const BASE = 1200;
            const width  = Math.round(BASE * (wNum / Math.max(wNum, hNum)));
            const height = Math.round(BASE * (hNum / Math.max(wNum, hNum)));

            const url = meta?.url || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

            acc.push({
                src:      url,
                width,
                height,
                key:      workflow.id || workflow.name || String(i),
                workflow,
            });
            return acc;
        }, []);
    }, [workflows]);


    return (
        <div className="flex h-full w-full overflow-hidden text-white bg-[#050505] relative">


            <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden z-10">
                <AnimatePresence>
                    {isDragging && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[25] bg-black/60 backdrop-blur-[4px] pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto pt-[80px] overflow-x-hidden p-5 custom-scrollbar"
                >
                    <AnimatePresence mode="wait">
                        {workflows.length > 0 ? (
                            <motion.div 
                                key="feed"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                className={cn(
                                    "flex flex-col gap-6 w-full pb-32 transition-opacity duration-200",
                                    isGridResizing && "opacity-90"
                                )}
                            >
                                <RowsPhotoAlbum
                                    photos={photos}
                                    targetRowHeight={targetRowHeight}
                                    spacing={16}
                                    rowConstraints={{ singleRowMaxHeight: targetRowHeight * 1.6 }}
                                    render={{
                                        photo: (_, { photo, width, height }) => (
                                            <MediaGridItem
                                                key={photo.key}
                                                workflow={photo.workflow}
                                                onClick={() => handleWorkflowClick(photo.workflow)}
                                                className="rounded-2xl border-none shadow-xl"
                                                width={width}
                                                height={height}
                                                disableLayoutAnimation={isGridResizing}
                                            />
                                        ),
                                    }}
                                />
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <EmptyState message="NO WORKFLOWS FOUND" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Dedicated Generations PromptBar */}
                <PromptBar />

                <AnimatePresence>
                    {showTopBtn && (
                        <motion.button
                            initial={{ opacity: 0, y: 30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            onClick={scrollToTop}
                            className="absolute bottom-10 right-10 z-50 p-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 text-white backdrop-blur-xl shadow-2xl transition-all cursor-pointer"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 14px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background-color: rgba(255, 255, 255, 0.2);
                        border-radius: 20px;
                        border: 4px solid transparent;
                        background-clip: padding-box;
                        transition: background 0.2s ease;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(255, 255, 255, 0.35);
                    }
                    .custom-scrollbar {
                        -ms-overflow-style: auto;
                        scrollbar-width: thin;
                        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;

                        /* ✦ 144fps smooth scroll */
                        scroll-behavior: smooth;
                        -webkit-overflow-scrolling: touch;
                        overscroll-behavior-y: contain;
                        will-change: scroll-position;
                    }
                `}</style>
            </main>
        </div>
    )
}
