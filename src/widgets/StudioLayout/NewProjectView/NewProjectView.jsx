"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import {
  GeneratedPromptBar,
  useRealBackendModels,
} from "@/features/prompt-bar/index.platform"


// ─── Sub-Components ──────────────────────────────────────────────────────────

const EmptyState = () => (
    <div className="w-full h-full flex flex-col items-center justify-center">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2"
        >
            <p className="text-white/30 text-lg font-medium tracking-tight">
                {"Start creating your masterpiece."}
            </p>
        </motion.div>
    </div>
)

export function NewProjectView() {
    const { selectedProjectId: projectId } = useGenerationsStore()
    const { data } = useRealBackendModels()
    const models = data?.models ?? []

    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-white p-4 gap-6">
            
            {/* ── Main Content Area ── */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-background rounded-dialog border border-white/5 shadow-none overflow-hidden">
                
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

                {/* ── Bottom Floating Prompt Bar (v3) ── */}
                <GeneratedPromptBar
                    projectId={projectId}
                    models={models}
                    onGenerate={() => {}}
                />

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
