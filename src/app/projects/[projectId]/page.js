"use client"

import * as React from "react"
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { GenerationsStudio } from "@/widgets/StudioLayout/GenerationsStudio/GenerationsStudio"
import { useProjectSessions } from "@/features/workflows/api/workflowsApi"
import { cn } from "@/shared/lib/utils"
import { Sparkles, Library } from "lucide-react"
import { ElementsView } from "@/widgets/StudioLayout/ElementsView/ElementsView"

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
    { id: "studio",   label: "Studio",   icon: Sparkles },
    { id: "elements", label: "Elements", icon: Library  },
]

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
    return (
        <div className="flex items-center gap-1 p-3 bg-[#050505]">
            <div className="flex items-center gap-0.5 p-1 rounded-xl bg-white/5 border border-white/5">
                {TABS.map((tab) => {
                    const isActive = tab.id === active
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                "relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors duration-200 cursor-pointer",
                                isActive ? "text-white" : "text-white/30 hover:text-white/60"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="tab-bg"
                                    className="absolute inset-0 rounded-lg bg-white/10"
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                            )}
                            <Icon className="relative z-10 size-3.5" />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectDetailPage({ params }) {
    const { projectId } = React.use(params)
    const { setSelectedProjectId, activeSessionId, setActiveSessionId } = useGenerationsStore()
    const [activeTab, setActiveTab] = React.useState("studio")

    // Set the active project on mount
    useEffect(() => {
        if (projectId) setSelectedProjectId(projectId)
    }, [projectId, setSelectedProjectId])

    // Fetch sessions for this project
    const sessions = useProjectSessions(projectId) || []

    // Auto-select the most recent session if none is active
    useEffect(() => {
        if (sessions.length > 0 && !activeSessionId) {
            setActiveSessionId(sessions[0].session_id)
        }
    }, [sessions, activeSessionId, setActiveSessionId])

    return (
        <div className="flex flex-col h-screen bg-[#050505] overflow-hidden">
            <TabBar active={activeTab} onChange={setActiveTab} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1 overflow-hidden"
                >
                    {activeTab === "studio"   && <GenerationsStudio />}
                    {activeTab === "elements" && <ElementsView />}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
