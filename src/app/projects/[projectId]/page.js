"use client"

import * as React from "react"
import { useEffect } from "react"
import { useGenerationsStore } from "@/features/generations/model/useGenerationsStore"
import { GenerationsStudio } from "@/widgets/StudioLayout/GenerationsStudio/GenerationsStudio"
import { useSessions } from "@/features/projects/api/projectsApi"

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
    const { data: sessions = [] } = useSessions(projectId)

    // Auto-select the most recent session if none is active
    useEffect(() => {
        if (sessions.length > 0 && !activeSessionId) {
            setActiveSessionId(sessions[0].session_id)
        }
    }, [sessions, activeSessionId, setActiveSessionId])

    return <GenerationsStudio />;
}
