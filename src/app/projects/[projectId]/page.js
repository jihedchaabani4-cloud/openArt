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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectDetailPage({ params }) {
    const { projectId } = React.use(params)
    const { setSelectedProjectId, activeSessionId, setActiveSessionId } = useGenerationsStore()

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
        <div className="flex flex-col h-screen bg-[#050505] overflow-hidden ">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                className="flex-1 overflow-hidden"
            >
                <GenerationsStudio />
            </motion.div>
        </div>
    )
}
