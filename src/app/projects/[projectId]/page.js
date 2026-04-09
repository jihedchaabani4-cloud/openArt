"use client"

import * as React from "react"
import { useEffect } from "react"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { GenerationsStudio } from "@/widgets/StudioLayout/GenerationsStudio/GenerationsStudio"
import { useProjectSessions } from "@/features/workflows/api/workflowsApi"
export default function ProjectDetailPage({ params }) {
    const { projectId } = React.use(params)
    const { setSelectedProjectId, activeSessionId, setActiveSessionId } = useGenerationsStore()

    // Set the active project on mount
    useEffect(() => {
        if (projectId) {
            setSelectedProjectId(projectId)
        }
    }, [projectId, setSelectedProjectId])

    // Fetch sessions for this project
    const sessions = useProjectSessions(projectId) || []

    // Auto-select the most recent session if none is active
    useEffect(() => {
        if (sessions.length > 0 && !activeSessionId) {
            setActiveSessionId(sessions[0].session_id)
        }
    }, [sessions, activeSessionId, setActiveSessionId])

    return <GenerationsStudio />;
}
