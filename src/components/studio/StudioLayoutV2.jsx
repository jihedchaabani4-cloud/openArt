"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStudioStore } from "@/store/useStudioStore"
import { CharacterPanel } from "./CharacterPanel"
import ImagePromptBar from "@/components/features/promptbar"
import CinemaPromptBar from "@/components/features/CinemaPromptBar"
import ImageStatusView from "@/components/skeleton/ImageStatusView"
import { ImageViewerDialog } from "./dialogs/ImageViewerDialog"
import { X, RefreshCcw, Trash2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function StudioLayoutV2() {
    const { 
        characters, fetchCharacters, activeCharacterId, selectCharacter,
        isCreating, setIsCreating, nodes, initSocket,
        regenerateNode, removeNode, selectedNodeId, studioMode
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
                
                {/* ── Content: Grid OR Empty ── */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6  scrollbar-hide">
                    <AnimatePresence mode="wait">
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
                                        <div 
                                            key={node.id}
                                            draggable 
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData("nodeId", node.id)
                                                e.dataTransfer.effectAllowed = "copy"
                                            }}
                                            onClick={() => {
                                                if (node.status === "completed") {
                                                    useStudioStore.getState().setNodeSelection(node.id)
                                                }
                                            }}
                                            className={cn(
                                                "group cursor-grab active:cursor-grabbing transition-all duration-300 rounded-xl overflow-hidden relative",
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
                                                            regenerateNode(node.id)
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
                                                                removeNode(node.id)
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
                    </AnimatePresence>
                </div>

                {/* ── Bottom Floating Prompt Bar ── */}
                <div className="absolute bottom-8 inset-x-0 z-30 flex justify-center px-6 pointer-events-none">
                    <div className="w-full max-w-[850px] pointer-events-auto">
                        {/* Custom wrapper to match the image style */}
                        <div className="shadow-[0_24px_80px_rgba(0,0,0,0.8)] rounded-[24px]">
                            {studioMode === "cinema" ? (
                                <CinemaPromptBar hideBackground={true} />
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
