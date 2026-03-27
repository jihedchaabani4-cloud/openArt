"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGenerationsStore } from "@/features/generations/model/useGenerationsStore"
import { useFilteredGenerations } from "@/features/generations/model/useFilteredGenerations"
import ImagePromptBar from "@/features/prompt-bar"

import { cn } from "@/shared/lib/utils"
import Masonry from 'react-masonry-css'
import { MediaGridItem } from "./MediaGridItem"
import { SessionSidebar } from "../SessionSidebar/SessionSidebar"
import { Session } from "./GeneratedMediaBlock"

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
                Generations Studio
            </span>
            
            <h1 className="text-4xl md:text-5xl font-bold text-center max-w-2xl leading-tight tracking-tight px-6">
                <span className="bg-linear-to-br from-[#FFB8D9] via-[#E2B8FF] to-[#FFD194] bg-clip-text text-transparent opacity-90">
                    What would you shoot<br/>with infinite budget?
                </span>
            </h1>

            {message && message !== "No cinematic shots found" && message !== "No audio generations found" && message !== "No generated images found" && (
                <p className="text-sm font-medium tracking-wide uppercase text-white/20 mt-4">{message}</p>
            )}
        </motion.div>

        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />
    </div>
)

export function GenerationsStudio() {
    // ── FSD Local UI State (Zustand) ──
    const { 
        selectedProjectId: projectId, 
        activeSessionId,
        activeFilter,
        studioLayoutMode,
        setStudioLayoutMode,
        gridSize,
        setGridSize
    } = useGenerationsStore()

    // ── Server State (React Query + Client Filtering) ──
    const { 
        data: displayContent = [], 
        isLoading: generationsLoading, 
        refetch: refetchGenerations 
    } = useFilteredGenerations(projectId, activeSessionId)

    const loading = generationsLoading;

    // Periodic refresh if there are pending generations
    React.useEffect(() => {
        if (!projectId || !activeSessionId) return;

        const hasPending = displayContent.some(g => g.status === 'processing' || g.status === 'pending');
        if (hasPending) {
            const timer = setInterval(() => {
                refetchGenerations();
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [projectId, activeSessionId, displayContent, refetchGenerations])

    // Flatten items for Grid mode
    const flatItems = React.useMemo(() => {
        return displayContent.flatMap(group => 
            (group.items || []).filter(i => i.status !== 'deleted').map(item => ({
                ...item,
                group
            }))
        );
    }, [displayContent]);

    // Masonry column settings based on gridSize
    const breakpointColumnsObj = {
        default: gridSize === "lg" ? 4 : gridSize === "md" ? 6 : 8,
        1536: gridSize === "lg" ? 4 : gridSize === "md" ? 5 : 6, // 2xl
        1280: gridSize === "lg" ? 3 : gridSize === "md" ? 4 : 5, // xl
        1024: gridSize === "lg" ? 3 : 4,                         // lg
        768: 2,                                                  // md
        640: 1                                                   // sm
    };

    return (
        <div className="flex h-full w-full overflow-hidden text-white">
            <SessionSidebar />
            <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden bg-transparent">

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-hide">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <EmptyState message="Loading..." />
                            </motion.div>
                        ) : displayContent.length > 0 ? (
                                <motion.div 
                                    key={`feed-${projectId}`}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="flex flex-col gap-4 w-full  pb-92"
                                >
                                    {studioLayoutMode === 'grouped' ? (
                                        displayContent.map(group => (
                                            <Session 
                                                key={group.id} 
                                                group={group}
                                                gridSize={gridSize}
                                            />
                                        ))
                                    ) : (
                                        <Masonry
                                            breakpointCols={breakpointColumnsObj}
                                            className="flex w-auto gap-4"
                                            columnClassName="bg-clip-padding flex flex-col gap-4"
                                        >
                                            {flatItems.map(item => (
                                                <div 
                                                    key={item.id}
                                                    className="relative  shrink-0"
                                                >
                                                    <MediaGridItem 
                                                        item={item}
                                                        group={item.group}
                                                        showPrompt={true}
                                                    />
                                                </div>
                                            ))}
                                        </Masonry>
                                    )}
                                </motion.div>
                        ) : (
                            <motion.div 
                                key={`empty-${projectId}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <EmptyState message={
                                    !projectId ? "Select a project to start" :
                                    "No generated assets found"
                                } />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Bottom Floating Prompt Bar ── */}
                <div className="fixed bottom-8 inset-x-0 z-30 flex justify-center px-6 pointer-events-none">
                    <div className="w-full max-w-[650px] pointer-events-auto">
                        <ImagePromptBar hideBackground={true} />
                    </div>
                </div>

                <style jsx global>{`
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
            </main>
            
        </div>
    )
}