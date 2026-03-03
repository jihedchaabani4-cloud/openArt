"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStudioStore } from "@/store/useStudioStore"
import { CharacterPanel } from "./CharacterPanel"
import { CharacterCreatorV2 } from "./CharacterCreatorV2"
import ImagePromptBar from "@/components/features/promptbar"
import ImageStatusView from "@/components/skeleton/ImageStatusView"
import { ImageViewerDialog } from "./dialogs/ImageViewerDialog"
import { X, RefreshCcw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function StudioLayoutV2() {
    const { 
        characters, fetchCharacters, activeCharacterId, selectCharacter,
        isCreating, setIsCreating, nodes, initSocket,
        regenerateNode, removeNode, selectedNodeId
    } = useStudioStore()

    const [actionNode, setActionNode] = React.useState(null)

    React.useEffect(() => {
        initSocket()
        fetchCharacters()
    }, [fetchCharacters, initSocket])

    const handleSelectCharacter = (id) => {
        setIsCreating(false)
        selectCharacter(id)
    }

    const handleCreateNew = () => {
        selectCharacter(null)
        setIsCreating(true)
    }

    // Get nodes for the active character
    const activeCharacterNodes = Object.values(nodes)
        .filter(n => (n.character_id || n.characterId) === activeCharacterId)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-white">
            
            {/* ── Left Sidebar: Character Selection ── */}
            <div className="z-20 h-full border-r border-white/5">
                <CharacterPanel 
                    isCreating={isCreating}
                    activeCharacterId={activeCharacterId}
                    onCreateNew={handleCreateNew}
                    onSelectCharacter={handleSelectCharacter}
                />
            </div>

            {/* ── Main Content Area ── */}
            <main className="flex-1 flex flex-col relative min-w-0">
                
                {/* ── Content: Grid OR CharacterCreator ── */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6  scrollbar-hide">
                    <AnimatePresence mode="wait">
                        {isCreating ? (
                            <motion.div
                                key="creator-container"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.4 }}
                                className="h-full w-full flex gap-6"
                            >
                                {/* ── Left: Tutorial Video ── */}
                                <div className="flex-1 h-full relative rounded-[32px] border border-white/5 bg-[#1C1E207A] overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.6)]">
                                    <video 
                                        src="/ai-influencer-main (1).mp4" 
                                        autoPlay 
                                        muted 
                                        loop 
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    
                                    {/* Header badges */}
                                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-mono tracking-widest uppercase text-white/80">
                                            Tutorial
                                        </span>
                                        <span className="px-2 py-1 rounded-lg bg-[#D4FF00]/20 backdrop-blur-md border border-[#D4FF00]/20 text-[10px] font-mono tracking-widest uppercase text-[#D4FF00]">
                                            Live
                                        </span>
                                    </div>

                                    {/* Bottom helper bar */}
                                    <div className="absolute bottom-4 left-4 right-4 z-10">
                                        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] text-white/70 font-medium tracking-wide">AI Influencer DNA System</span>
                                                <span className="text-[10px] text-white/40 uppercase tracking-widest">Tutorial Mode</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* ── Right: Settings column ── */}
                                <div className="w-[700px]">
                                    <CharacterCreatorV2 />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key={activeCharacterId || 'empty'}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1"
                            >
                                {activeCharacterNodes.length > 0 ? (
                                    activeCharacterNodes.map((node, index) => (
                                        <ImageViewerDialog key={node.id} nodeId={node.id}>
                                            <div 
                                                draggable 
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData("nodeId", node.id)
                                                    e.dataTransfer.effectAllowed = "copy"
                                                }}
                                                className={cn(
                                                    "cursor-grab active:cursor-grabbing transition-all duration-300 rounded-xl overflow-hidden",
                                                    selectedNodeId === node.id ? "ring-4 ring-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" : "ring-0 ring-transparent"
                                                )}
                                            >
                                                <ImageStatusView
                                                    status={node.status}
                                                    src={node.image_url}
                                                    label={node.model || "Flux Pro"}
                                                    aspect="9/16"
                                                    className="shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
                                                />

                                                {/* ── Error State Regenerate Button ── */}
                                                {(node.status === "error" || node.status === "failed") && (
                                                    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                regenerateNode(node.id)
                                                            }}
                                                            className="group/regen flex items-center gap-2 px-3 py-2 bg-white text-black rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-2xl hover:bg-[#D4FF00] transition-colors active:scale-95"
                                                        >
                                                            <RefreshCcw className="w-3 h-3 group-hover/regen:animate-spin" />
                                                            Regenerate
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </ImageViewerDialog>
                                    ))
                                ) : (
                                    <div className="col-span-full h-[60vh] flex flex-col items-center justify-center opacity-30 gap-4">
                                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                                        </div>
                                        <p className="text-sm font-medium tracking-wide">Select a character to view generations</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Bottom Floating Prompt Bar ── */}
                {!isCreating && (
                    <div className="absolute bottom-8 inset-x-0 z-30 flex justify-center px-6 pointer-events-none">
                        <div className="w-full max-w-[850px] pointer-events-auto">
                            {/* Custom wrapper to match the image style */}
                            <div className="shadow-[0_24px_80px_rgba(0,0,0,0.8)] rounded-[24px]">
                                <ImagePromptBar hideBackground={true} />
                            </div>
                        </div>
                    </div>
                )}

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
