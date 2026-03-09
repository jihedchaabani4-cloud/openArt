"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStudioStore } from "@/store/useStudioStore"
import { useCinemaStore } from "@/store/useCinemaStudioStore"
import { useAudioStore } from "@/store/useAudioStore"
import { StudioNavbar } from "../StudioNavbar"
import ImagePromptBar from "@/components/features/ImagePromptBar"
import CinemaPromptBar from "@/components/features/CinemaPromptBar"
import AudioPromptBar from "@/components/features/AudioPromptBar"
import ImageStatusView from "@/components/skeleton/ImageStatusView"
import { ImageViewerDialog } from "../dialogs/ImageViewerDialog"
import { X, RefreshCcw, Trash2, Check, Play, Music as MusicIcon, Film, FilmIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Sub-Components ──────────────────────────────────────────────────────────

const EmptyState = ({ message }) => (
    <div className="col-span-full h-[60vh] flex flex-col items-center justify-center opacity-30 gap-4">
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
        </div>
        <p className="text-sm font-medium tracking-wide uppercase tracking-[0.2em]">{message}</p>
    </div>
)

const ImageGridItem = ({ node, selectedNodeId, onRegenerate, onRemove }) => (
    <div 
        draggable 
        onDragStart={(e) => {
            e.dataTransfer.setData("nodeId", node.id)
            if (node.image_url) {
                e.dataTransfer.setData("imageUrl", node.image_url)
            }
            e.dataTransfer.effectAllowed = "copy"
        }}
        onClick={() => {
            if (node.status === "completed") {
                useStudioStore.getState().setNodeSelection(node.id)
            }
        }}
        className={cn(
            "group cursor-grab active:cursor-grabbing transition-all duration-300 rounded-xl overflow-hidden relative aspect-[3/4]",
            selectedNodeId === node.id ? "ring-4 ring-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" : "ring-0 ring-transparent"
        )}
    >
        {selectedNodeId === node.id && node.status === "completed" && (
            <div className="absolute top-3 left-3 z-30 flex items-center justify-center w-6 h-6 bg-white text-black rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-in zoom-in duration-300">
                <Check className="w-4 h-4 stroke-[3]" />
            </div>
        )}

        {/* ── Error State Buttons ── */}
        {(node.status === "error" || node.status === "failed") && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 p-4 bg-black/50 backdrop-blur-[2px]">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRegenerate(node.id)
                    }}
                    className="group/regen w-full max-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-2xl hover:bg-[#D4FF00] transition-all active:scale-95"
                >
                    <RefreshCcw className="w-3.5 h-3.5 group-hover/regen:animate-spin" />
                    Regenerate
                </button>
                
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        if (confirm("Are you sure you want to delete this generation?")) {
                            onRemove(node.id)
                        }
                    }}
                    className="group/delete w-full max-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 backdrop-blur-md"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </button>
            </div>
        )}
        
        {/* ── Action Buttons (Hover) ── */}
        {node.status === "completed" && (
            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
                <ImageViewerDialog nodeId={node.id}>
                    <button 
                        className="flex items-center gap-1 px-2 py-1 bg-white/90 text-black rounded-md text-[10px] font-bold uppercase tracking-widest shadow hover:bg-white transition-colors active:scale-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        View
                    </button>
                </ImageViewerDialog>
            </div>
        )}

        <ImageStatusView
            status={node.status}
            src={node.image_url}
            label={node.model || "Flux Pro"}
            aspect="9/16"
            className="shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
        />
    </div>
)

const CinemaGridItem = ({ shot }) => (
    <div className="group relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-white/20 transition-all cursor-pointer">
        {shot.video_url ? (
            <video 
                src={shot.video_url} 
                className="w-full h-full object-cover"
                onMouseEnter={e => e.currentTarget.play()}
                onMouseLeave={e => {
                    e.currentTarget.pause()
                    e.currentTarget.currentTime = 0
                }}
                muted
                loop
            />
        ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/20">
                <Film className="w-8 h-8" />
                <span className="text-[10px] uppercase tracking-widest">Generating Video...</span>
            </div>
        )}
        
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-white/90 line-clamp-2 leading-relaxed">
                {shot.description || "Cinematic Shot"}
            </p>
        </div>

        {shot.status === 'completed' && (
            <div className="absolute top-2 right-2 size-6 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="size-3 fill-white text-white" />
            </div>
        )}
    </div>
)

const AudioGridItem = ({ audio }) => (
    <div className="group relative aspect-square rounded-xl overflow-hidden bg-[#111] border border-white/5 p-4 flex flex-col justify-between hover:border-white/20 transition-all cursor-pointer">
        <div className="size-10 rounded-lg bg-[#D4FF00]/10 flex items-center justify-center text-[#D4FF00]">
            <MusicIcon className="size-5" />
        </div>
        
        <div>
            <h4 className="text-xs font-medium text-white/90 truncate">{audio.title || "Audio Track"}</h4>
            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">{audio.duration || "0:30"}</p>
        </div>

        <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="size-12 rounded-full bg-[#D4FF00] flex items-center justify-center shadow-[0_0_20px_rgba(212,255,0,0.3)]">
                <Play className="size-5 fill-black text-black ml-1" />
            </div>
        </button>
    </div>
)

export function StudioLayoutV2() {
    const { 
        nodes, initSocket,
        regenerateNode, removeNode, selectedNodeId, studioMode,
        activeWorkspaceId
    } = useStudioStore()

    const { audios, fetchAudios } = useAudioStore()

    React.useEffect(() => {
        initSocket()
        if (activeWorkspaceId) {
            fetchAudios(activeWorkspaceId)
        }
    }, [initSocket, activeWorkspaceId, fetchAudios])

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-white">
            
            {/* ── Main Content Area ── */}
            <main className="flex-1 flex flex-col relative min-w-0">
                
                {/* ── Content: Grid OR Empty ── */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6  scrollbar-hide">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={`${studioMode}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1"
                        >
                                {studioMode === "image" ? (
                                    nodes.length > 0 ? (
                                        nodes.map((node) => (
                                            <ImageGridItem 
                                                key={node.id} 
                                                node={node} 
                                                selectedNodeId={selectedNodeId}
                                                onRegenerate={regenerateNode}
                                                onRemove={removeNode}
                                            />
                                        ))
                                    ) : (
                                        <EmptyState message="No image generations found" />
                                    )
                                ) : studioMode === "cinema" ? (
                                    <div className="col-span-full h-full flex flex-col items-center justify-center gap-4">
                                        <FilmIcon className="w-12 h-12 text-white/20" />
                                        <p className="text-white/40">Switching to Cinema Studio...</p>
                                        <Button 
                                            variant="studio-neon" 
                                            onClick={() => window.location.href = '/cinema-studio'}
                                        >
                                            Go to Cinema Page
                                        </Button>
                                    </div>
                                ) : (
                                    audios.length > 0 ? (
                                        audios.map((audio) => (
                                            <AudioGridItem key={audio.id} audio={audio} />
                                        ))
                                    ) : (
                                        <EmptyState message="No audio generations found" />
                                    )
                                )}
                            </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── Bottom Floating Prompt Bar ── */}
                <div className="absolute bottom-8 inset-x-0 z-30 flex justify-center px-6 pointer-events-none">
                    <div className="w-full max-w-[850px] pointer-events-auto">
                        {/* Custom wrapper to match the image style */}
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
