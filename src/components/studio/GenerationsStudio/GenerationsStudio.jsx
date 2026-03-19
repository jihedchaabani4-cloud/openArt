"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGenerationsStudioStore } from "@/store/useGenerationsStudioStore"
import GenerationsPromptBar from "@/components/features/GenerationsPromptBar"
import ImagePromptBar from "@/components/features/ImagePromptBar"
import AudioPromptBar from "@/components/features/AudioPromptBar"
import ImageStatusView from "@/components/skeleton/ImageStatusView"
import { ImageViewerDialog } from "../dialogs/ImageViewerDialog"
import { Play, Heart, LayoutGrid, Rows3, Trash2, Settings2, Layers } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { getItemMetadata } from "@/utils/generationUtils"
import { cn } from "@/lib/utils"

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

import { Session } from "./Session"

export function GenerationsStudio() {
    const { 
        generations, loading, init,
        fetchAssets, fetchGenerations, projectId, activeSessionId,
        activeFilter, studioMode, studioLayoutMode, setStudioLayoutMode,
        gridSize, setGridSize,
        removeGeneration, removeGenerationItem, toggleLike,
        retryGeneration, generateMore
    } = useGenerationsStudioStore()

    // Periodic refresh if there are pending generations
    React.useEffect(() => {
        if (!projectId || !activeSessionId) return;

        const hasPending = generations.some(g => g.status === 'processing' || g.status === 'pending');
        if (hasPending) {
            const timer = setInterval(() => {
                fetchAssets(projectId, activeSessionId);
                fetchGenerations(projectId, activeSessionId);
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [projectId, activeSessionId, generations, fetchAssets, fetchGenerations])

    // Content logic: Toggle between Cinema (Shots) and Image/Audio (Generations)
    const displayContent = React.useMemo(() => {
        if (!projectId) return [];

        let baseData = generations;

        if (studioMode === "cinema") {
            baseData = generations.filter(g => g.section === 'video_generator' || g.items?.some(i => i.asset?.asset_type === 'video'));
        } else if (studioMode === "audio") {
            baseData = generations.filter(g => g.section === 'audio_generator' || g.section === 'audio_gen' || g.items?.some(i => i.asset?.asset_type === 'audio'));
        } else {
            baseData = generations.filter(g => 
                (g.section === 'image_generator' || g.section === 'cinema_studio' || g.items?.some(i => i.asset?.asset_type === 'image')) &&
                !g.items?.some(i => i.asset?.asset_type === 'audio' || i.asset?.asset_type === 'video')
            );
        }

        if (activeFilter === 'liked') {
            baseData = baseData.filter(group => group.items?.some(item => item.is_liked === true));
        }

        return baseData;
    }, [studioMode, generations, projectId, activeFilter])

    // Flatten items for Grid mode
    const flatItems = React.useMemo(() => {
        return displayContent.flatMap(group => 
            (group.items || []).filter(i => i.status !== 'deleted').map(item => ({
                ...item,
                group
            }))
        );
    }, [displayContent]);

    // Helper for grid columns based on size
    const getFlatGridClass = () => {
        if (gridSize === 'sm') return "grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2";
        if (gridSize === 'md') return "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3";
        return "grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"; // 'lg'
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-[#050505] text-white p-4 gap-6">
            <main className="flex-1 flex flex-col relative min-w-0 bg-[#080808] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
                
                {/* ── Header Actions ── */}
                <div className="absolute top-6 right-8 z-40 flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center size-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-all">
                                <Settings2 size={18} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[280px] bg-[#121314] border-white/10 p-3 rounded-2xl shadow-2xl text-white">
                            <div className="flex flex-col gap-5 py-1">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest px-1">View Mode</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setStudioLayoutMode('grid')}
                                            className={cn(
                                                "flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-[13px] font-medium",
                                                studioLayoutMode === 'grid' 
                                                    ? "bg-white/10 border-white/20 text-white" 
                                                    : "bg-transparent border-transparent text-white/40 hover:text-white/60"
                                            )}
                                        >
                                            <LayoutGrid size={15} />
                                            Grid
                                        </button>
                                        <button
                                            onClick={() => setStudioLayoutMode('grouped')}
                                            className={cn(
                                                "flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-[13px] font-medium",
                                                studioLayoutMode === 'grouped' 
                                                    ? "bg-white/10 border-white/20 text-white" 
                                                    : "bg-transparent border-transparent text-white/40 hover:text-white/60"
                                            )}
                                        >
                                            <Layers size={15} />
                                            Batch
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest px-1">Grid Size</span>
                                    <div className="flex bg-white/5 p-1 rounded-xl">
                                        {['sm', 'md', 'lg'].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setGridSize(size)}
                                                className={cn(
                                                    "flex-1 py-1.5 rounded-lg text-[12px] font-bold transition-all uppercase",
                                                    gridSize === size 
                                                        ? "bg-white/10 text-white shadow-sm" 
                                                        : "text-white/25 hover:text-white/50"
                                                )}
                                            >
                                                {size === 'sm' ? 'S' : size === 'md' ? 'M' : 'L'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-hide">
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
                                    key={`${studioMode}-${projectId}-feed`}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="flex flex-col gap-5 w-full"
                                >
                                    {studioLayoutMode === 'grouped' ? (
                                        displayContent.map(group => (
                                            <Session 
                                                key={group.id} 
                                                group={group}
                                                studioMode={studioMode}
                                                gridSize={gridSize}
                                            />
                                        ))
                                    ) : (
                                        <div className={cn("grid", getFlatGridClass())}>
                                            {flatItems.map(item => {
                                                const { isVideo, isAudio, url, aspect } = getItemMetadata(item, item.group);
                                                
                                                const handleDelete = (e) => {
                                                    e?.stopPropagation();
                                                    removeGenerationItem(item.id, item.group_id);
                                                };

                                                const handleRetry = async (e) => {
                                                    e?.stopPropagation();
                                                    await retryGeneration(item.id);
                                                    fetchGenerations(projectId, activeSessionId);
                                                };

                                                return (
                                                    <div key={item.id} className="group relative bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300">
                                                        <ImageStatusView
                                                            status={item.status}
                                                            src={url}
                                                            alt={item.group?.params?.prompt || ""}
                                                            aspect={aspect}
                                                            error={item.error}
                                                            onCancel={(item.status === 'rejected' || item.status === 'failed' || item.status === 'error') ? handleDelete : undefined}
                                                            onRetry={(item.status === 'failed' || item.status === 'error') ? handleRetry : undefined}
                                                            className="w-full h-full"
                                                        >
                                                             {item.status === 'completed' && url && isVideo && (
                                                                <video
                                                                    src={url}
                                                                    className="w-full h-full object-cover"
                                                                    onMouseEnter={e => e.currentTarget.play()}
                                                                    onMouseLeave={e => {
                                                                        e.currentTarget.pause();
                                                                        e.currentTarget.currentTime = 0;
                                                                    }}
                                                                    muted
                                                                    loop
                                                                />
                                                             )}
                                                        </ImageStatusView>
                                                        
                                                        {item.status === 'completed' && (
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between pointer-events-none">
                                                                <div className="flex justify-end gap-2 pointer-events-auto">
                                                                    <button 
                                                                        className="p-1.5 rounded-lg bg-black/50 text-white/50 hover:text-white hover:bg-black/70 backdrop-blur-md transition-all"
                                                                        onClick={(e) => { e.stopPropagation(); toggleLike(item.id, item.is_liked); }}
                                                                    >
                                                                        <Heart className={cn("size-3.5", item.is_liked && "fill-[#D4FF00] text-[#D4FF00]")} />
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center justify-between pointer-events-auto">
                                                                     <div className="flex-1 min-w-0 pr-2">
                                                                        <p className="text-[10px] text-white/70 line-clamp-1 italic">{item.group?.params?.prompt}</p>
                                                                     </div>
                                                                     <button 
                                                                        className="p-1.5 rounded-lg bg-black/50 text-white/30 hover:text-red-400 hover:bg-black/70 backdrop-blur-md transition-all"
                                                                        onClick={handleDelete}
                                                                    >
                                                                        <Trash2 className="size-3.5" />
                                                                     </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {item.status !== 'completed' && (
                                                             <div className="absolute inset-x-0 bottom-0 p-2 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <p className="text-[10px] text-white/70 line-clamp-1 italic">{item.group?.params?.prompt}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                        ) : (
                            <motion.div 
                                key={`${studioMode}-${projectId}-empty`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <EmptyState message={
                                    !projectId ? "Select a project to start" :
                                    studioMode === "cinema" ? "No cinematic shots found" :
                                    studioMode === "audio" ? "No audio generations found" :
                                    "No generated images found"
                                } />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Bottom Floating Prompt Bar ── */}
                <div className="absolute bottom-8 inset-x-0 z-30 flex justify-center px-6 pointer-events-none">
                    <div className="w-full max-w-[1100px] pointer-events-auto">
                        <div className="">
                            {studioMode === "cinema" ? (
                                <GenerationsPromptBar hideBackground={true} />
                            ) : studioMode === "audio" ? (
                                <AudioPromptBar hideBackground={true} />
                            ) : (
                                <ImagePromptBar hideBackground={true} />
                            )}
                        </div>
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
