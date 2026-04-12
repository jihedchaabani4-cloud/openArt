"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useFilteredWorkflows as useFilteredGenerations } from "@/features/workflows/model/useFilteredWorkflows"
import { ActiveFilterTags } from "@/features/workflows/ui/ActiveFilterTags"
import PromptBar from "@/features/prompt-bar"

import { cn } from "@/shared/lib/utils"
import { RowsPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/rows.css'
import { ArrowUp } from "lucide-react"
import { MediaGridItem } from "./MediaGridItem"
import { SessionSidebar } from "../SessionSidebar/SessionSidebar"
import { getItemMetadata, getPrimaryMedia } from "@/shared/lib/generationUtils";
import { getItemMetadata as getDisplayMeta } from "@/shared/lib/displayUtils";

// ─── Sub-Components ──────────────────────────────────────────────────────────

const EmptyState = ({ message }) => (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative corner markers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-[260px] -translate-y-[100px] w-6 h-6 border-t border-l border-white/20" />
        <div className="absolute top-1/2 left-1/2 translate-x-[236px] -translate-y-[100px] w-6 h-6 border-t border-r border-white/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-[260px] translate-y-[76px] w-6 h-6 border-b border-l border-white/20" />
        <div className="absolute top-1/2 left-1/2 translate-x-[236px] translate-y-[76px] w-6 h-6 border-b border-r border-white/20" />

        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 z-10"
        >
            <span className="text-[10px] font-bold tracking-[0.4em] text-white/40 uppercase">
                Workflows Studio
            </span>
            
            <h1 className="text-4xl md:text-5xl font-bold text-center max-w-2xl leading-tight tracking-tight px-6">
                <span className="bg-linear-to-br from-[#FFB8D9] via-[#E2B8FF] to-[#FFD194] bg-clip-text text-transparent opacity-90">
                    What would you shoot<br/>with infinite budget?
                </span>
            </h1>

            {message && message !== "No cinematic shots found" && message !== "No audio workflows found" && message !== "No generated images found" && (
                <p className="text-sm font-medium tracking-wide uppercase text-white/20 mt-4">{message}</p>
            )}
        </motion.div>

        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />
    </div>
)

export function GenerationsStudio({ 
    workflows: propWorkflows = null, 
    isLoading: propIsLoading = null, 
    gridSize: propGridSize = null,
    isDetailView: propIsDetailView = null,
    selectedMediaId: propSelectedMediaId = null,
    onSelectMedia = () => {},
    emptyMessage = "NO WORKFLOWS FOUND"
}) {
    const store = useGenerationsStore();
    const router = useRouter();
    const { data: fetchResult, isLoading: fetchIsLoading } = useFilteredGenerations(store.selectedProjectId, store.activeSessionId);

    const workflows = propWorkflows !== null ? propWorkflows : (fetchResult?.filteredWorkflows || []);
    const isLoading = propIsLoading !== null ? propIsLoading : fetchIsLoading;
    const gridSize = propGridSize !== null ? propGridSize : store.gridSize;
    
    // Navigate to the Edit Page for this workflow
    const handleWorkflowClick = (workflow) => {
        const workflowId = workflow.id || workflow.name;
        if (!workflowId || !store.selectedProjectId) return;
        router.push(`/projects/${store.selectedProjectId}/edit/${workflowId}`);
    };

    const scrollRef = React.useRef(null);
    const [showTopBtn, setShowTopBtn] = React.useState(false);

    const handleScroll = React.useCallback(() => {
        if (!scrollRef.current) return;
        setShowTopBtn(scrollRef.current.scrollTop > 400);
    }, []);

    const scrollToTop = React.useCallback(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    // Target row height driven by gridSize
    const targetRowHeight = gridSize === "lg" ? 380 : gridSize === "md" ? 280 : 200;

    // Build the photo descriptors that react-photo-album needs
    const photos = React.useMemo(() => {
        return workflows.reduce((acc, workflow, i) => {
            const primaryItem = getPrimaryMedia(workflow);
            if (!primaryItem) return acc;

            // Derive pixel dimensions from the aspect string (e.g. "16/9", "3/4")
            const meta = getDisplayMeta(primaryItem, workflow);
            const aspect = meta?.aspect ?? "3/4";
            const [wStr, hStr] = aspect.split("/");
            const wNum = parseFloat(wStr) || 3;
            const hNum = parseFloat(hStr) || 4;
            // Scale to a fixed base so react-photo-album can do its maths
            const BASE = 1200;
            const width  = Math.round(BASE * (wNum / Math.max(wNum, hNum)));
            const height = Math.round(BASE * (hNum / Math.max(wNum, hNum)));

            const url = meta?.url;
            if (!url) return acc;   // skip items with no resolved URL

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
        <div className="flex h-full w-full overflow-hidden text-white bg-[#050505]">
            <SessionSidebar />
            
            <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 scrollbar-hide"
                >
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <EmptyState message="Loading..." />
                            </motion.div>
                        ) : workflows.length > 0 ? (
                            <motion.div 
                                key="feed"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                className="flex flex-col gap-6 w-full pb-32"
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
                                <EmptyState message={emptyMessage} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Fixed bottom bar for prompt */}
                <div className="absolute bottom-10 inset-x-0 z-30 flex justify-center px-6 pointer-events-none">
                    <div className="w-full max-w-[650px] pointer-events-auto">
                        <PromptBar hideBackground={true} />
                    </div>
                </div>

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
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            </main>
        </div>
    )
}
