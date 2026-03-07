"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStudioStore } from "@/store/useStudioStore"
import { useCinemaStore } from "@/store/useCinemaStudioStore"
import CinemaPromptBar from "@/components/features/CinemaPromptBar"
import ImagePromptBar from "@/components/features/ImagePromptBar"
import AudioPromptBar from "@/components/features/AudioPromptBar"
import ImageStatusView from "@/components/skeleton/ImageStatusView"
import { ImageViewerDialog } from "../dialogs/ImageViewerDialog"
import { Play, Film, Image as ImageIcon, Heart } from "lucide-react"
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
                Cinema Studio 2.0
            </span>
            
            <h1 className="text-4xl md:text-5xl font-bold text-center max-w-2xl leading-tight tracking-tight px-6">
                <span className="bg-gradient-to-br from-[#FFB8D9] via-[#E2B8FF] to-[#FFD194] bg-clip-text text-transparent opacity-90">
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

const MediaGridItem = ({ item, type }) => {
    const { removeGeneration, workspaceId, fetchAssets, fetchGenerations, toggleLike } = useCinemaStore()
    const { activeWorkspaceId } = useStudioStore()
    const isVideo = type === 'shot' || (item.asset_type === 'video') || (item.asset?.asset_type === 'video');
    const isAudio = (item.asset_type === 'audio') || (item.asset?.asset_type === 'audio');
    const url = type === 'shot' ? item.video_url : (item.file_url || item.asset?.file_url);
    const status = item.status;
    const isLiked = item.is_Like || false;
    
    // Determine aspect ratio from params if available
    const ratioStr = item.params?.ratio || (type === 'shot' ? "16:9" : "1:1");
    let aspect = "3/4"; 
    
    if (isAudio) aspect = "4/1";
    else if (ratioStr === "16:9") aspect = "16/9";
    else if (ratioStr === "9:16") aspect = "9/16";
    else if (ratioStr === "1:1") aspect = "1/1";
    else if (ratioStr === "4:3") aspect = "4/3";
    else if (ratioStr === "3:4") aspect = "3/4";
    else if (ratioStr === "2:3") aspect = "2/3";
    else if (ratioStr === "3:2") aspect = "3/2";
    else if (ratioStr === "21:9") aspect = "21/9";

    const prompt = type === 'shot' 
        ? item.description 
        : (item.params?.prompt || item.prompt || (isAudio ? "Generated Audio" : "Cinematic Asset"));

    const handleDelete = () => {
        if (type !== 'shot') {
            removeGeneration(item.id)
        }
    }

    const handleLike = (e) => {
        e.stopPropagation();
        toggleLike(item.id, isLiked);
    }

    const handleRetry = async () => {
        if (type === 'shot' || !item.params) return;
        
        try {
            const { api } = await import("@/lib/api");
            const targetWorkspaceId = workspaceId || activeWorkspaceId;
            
            let endpoint = "/cinema/generate";
            let payload = {
                ...item.params,
                workspace_id: targetWorkspaceId
            };

            if (item.section === 'audio_gen') {
                endpoint = "/audio/generate";
            } else if (!item.section || item.section === 'image_gen') {
                endpoint = "/images/generate";
            }

            const res = await api.post(endpoint, payload);
            if (res.ok) {
                // Delete the failed one and refresh
                removeGeneration(item.id);
                fetchAssets(targetWorkspaceId);
                fetchGenerations(targetWorkspaceId);
            }
        } catch (error) {
            console.error("❌ Retry failed:", error);
        }
    }

    const content = (
        <ImageStatusView
            status={status}
            src={url}
            alt={prompt}
            aspect={aspect}
            showOverlay={!isAudio}
            onCancel={(status === 'rejected' || status === 'failed' || status === 'error') ? handleDelete : undefined}
            onRetry={(status === 'failed' || status === 'error') ? handleRetry : undefined}
            className={cn(
                "cursor-pointer",
                status === 'completed' && "hover:border-white/20"
            )}
        >
            {/* Custom rendering for video and audio since ImageStatusView only handles img by default */}
            {status === 'completed' && url && (
                isVideo ? (
                    <video 
                        src={url} 
                        className="w-full h-full object-cover"
                        onMouseEnter={e => e.currentTarget.play()}
                        onMouseLeave={e => {
                            e.currentTarget.pause()
                            e.currentTarget.currentTime = 0
                        }}
                        muted
                        loop
                    />
                ) : isAudio ? (
                    <div className="w-full h-full flex items-center justify-center bg-blue-500/10 p-4">
                        <div className="flex items-center gap-3 w-full">
                            <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Play className="size-4 text-blue-400 fill-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-1/3 bg-blue-500/50" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null
            )}
        </ImageStatusView>
    );

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            draggable={status === 'completed' && !isVideo && !isAudio}
            onDragStart={(e) => {
                if (status === 'completed' && url) {
                    e.dataTransfer.setData("imageUrl", url);
                    e.dataTransfer.effectAllowed = "copy";
                }
            }}
            className={cn(
                "mb-4 break-inside-avoid w-full group relative",
                status === 'completed' && !isVideo && !isAudio ? "cursor-grab active:cursor-grabbing" : ""
            )}
        >
            {!isAudio ? (
                <ImageViewerDialog
                    item={item}
                    src={url}
                    title={prompt}
                    isVideo={isVideo}
                    showSidebar={true}
                >
                    {content}
                </ImageViewerDialog>
            ) : content}

            {/* Like Button Overlay */}
            {status === 'completed' && type !== 'shot' && (
                <button
                    onClick={handleLike}
                    className={cn(
                        "absolute top-2 left-2 size-8 rounded-full backdrop-blur-md flex items-center justify-center border transition-all z-20",
                        isLiked 
                            ? "bg-red-500/20 border-red-500/30 text-red-500 opacity-100" 
                            : "bg-black/20 border-white/10 text-white/40 hover:text-white opacity-0 group-hover:opacity-100"
                    )}
                >
                    <Heart className={cn("size-4", isLiked && "fill-current")} />
                </button>
            )}

            {(isVideo || isAudio) && status === 'completed' && url && (
                <div className="absolute top-2 right-2 size-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Play className="size-3 fill-white text-white" />
                </div>
            )}
        </motion.div>
    )
}

export function CinemaStudio() {
    const { studioMode, activeWorkspaceId, setStudioMode } = useStudioStore()
    const { 
        scenes, shots, assets, generations, loading, init, activeSceneId,
        fetchAssets, fetchGenerations, workspaceId: storeWorkspaceId,
        activeFilter
    } = useCinemaStore()

    React.useEffect(() => {
        if (activeWorkspaceId) {
            init(activeWorkspaceId)
        }
    }, [activeWorkspaceId, init])

    // Periodic refresh if there are pending generations
    React.useEffect(() => {
        if (!activeWorkspaceId || activeWorkspaceId !== storeWorkspaceId) return;

        const hasPending = generations.some(g => g.status === 'processing' || g.status === 'pending');
        if (hasPending) {
            const timer = setInterval(() => {
                fetchAssets(activeWorkspaceId);
                fetchGenerations(activeWorkspaceId);
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [activeWorkspaceId, storeWorkspaceId, generations, fetchAssets, fetchGenerations])

    // Content logic: Toggle between Cinema (Shots) and Image/Audio (Generations)
    const displayContent = React.useMemo(() => {
        // If the store data doesn't match the active workspace, return empty to avoid stale data
        if (activeWorkspaceId !== storeWorkspaceId) return [];

        let baseData = [];

        if (studioMode === "cinema") {
            baseData = scenes.flatMap(scene => (shots[scene.id] || []).map(s => ({ ...s, _displayType: 'shot' })))
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        } else if (studioMode === "audio") {
            // Filter only audio generations
            baseData = generations
                .filter(g => g.asset?.asset_type === 'audio' || g.section === 'audio_gen')
                .map(g => ({ ...g, _displayType: 'asset' }))
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        } else {
            // studioMode === "image" - Filter out audio, keep images and videos
            baseData = generations
                .filter(g => !g.asset || (g.asset.asset_type !== 'audio' && g.section !== 'audio_gen'))
                .map(g => ({ ...g, _displayType: 'asset' }))
                .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        }

        // Apply Liked Filter
        if (activeFilter === 'liked') {
            return baseData.filter(item => item.is_Like === true);
        }

        return baseData;
    }, [studioMode, scenes, shots, generations, activeWorkspaceId, storeWorkspaceId, activeFilter])

    return (
        <div className="flex h-full w-full overflow-hidden bg-[#0a0a0a] text-white">
            
            {/* ── Main Content Area ── */}
            <main className="flex-1 flex flex-col relative min-w-0">
                
                {/* ── Content: Masonry Grid OR Empty ── */}
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
                                key={`${studioMode}-${activeWorkspaceId}-grid`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-2"
                            >
                                {displayContent.map((item) => (
                                    <MediaGridItem key={item.id} item={item} type={item._displayType} />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key={`${studioMode}-${activeWorkspaceId}-empty`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <EmptyState message={
                                    !activeWorkspaceId ? "Select a workspace to start" :
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
                    <div className="w-full max-w-[850px] pointer-events-auto">
                        <div className="shadow-[0_24px_80px_rgba(0,0,0,0.8)] rounded-[24px]">
                            {studioMode === "cinema" ? (
                                <CinemaPromptBar hideBackground={true} />
                            ) : studioMode === "audio" ? (
                                <AudioPromptBar hideBackground={true} />
                            ) : (
                                <ImagePromptBar hideBackground={true} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Ambient glow in background */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
                </div>
            </main>

            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}
