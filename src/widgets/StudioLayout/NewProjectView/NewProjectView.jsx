"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import ImagePromptBar from "@/features/prompt-bar"


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

            {message && message !== "No cinematic shots found" && message !== "No generated images found" && (
                <p className="text-sm font-medium tracking-wide uppercase text-white/20 mt-4">{message}</p>
            )}
        </motion.div>

        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />
    </div>
)

export function NewProjectView() {
    const { selectedProjectId: projectId } = useGenerationsStore()

    return (
        <div className="flex h-full w-full overflow-hidden bg-[#050505] text-white p-4 gap-6">
            
            {/* ── Main Content Area ── */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-[#080808] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
                
                {/* ── Content: Masonry Grid OR Empty ── */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-hide">
                    <AnimatePresence mode="wait">
                       
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
                    </AnimatePresence>
                </div>

                {/* ── Bottom Floating Prompt Bar ── */}
                <div className="fixed bottom-8 inset-x-0 z-30 flex justify-center px-6 pointer-events-none">
                    <div className="w-full max-w-[850px] pointer-events-auto">
                        <div className="">
                            <ImagePromptBar hideBackground={true} isNewProject={true} />
                        </div>
                    </div>
                </div>

                {/* Ambient glow in background */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
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
