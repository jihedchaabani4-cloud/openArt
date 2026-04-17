"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useProjects, useUpdateProject } from "@/features/projects/api/projectsApi"
import { useProjectSessions, useElementSheetWorkflows } from "@/features/workflows/api/workflowsApi"
import { useCreateSession } from "@/features/projects/api/createSessionApi"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useFilteredWorkflows as useFilteredGenerations } from "@/features/workflows/model/useFilteredWorkflows"

import { StudioNavbarLeft } from "./ui/StudioNavbarLeft"
import { StudioNavbarCenter } from "./ui/StudioNavbarCenter"
import { StudioNavbarRight } from "./ui/StudioNavbarRight"
import { CreateSessionDialog } from "./ui/CreateSessionDialog"
import { ActiveFilterTags } from "@/features/workflows/ui/ActiveFilterTags"

import { useNavbarSearch } from "./hooks/useNavbarSearch"

export function StudioNavbar() {
    const gridSize = useGenerationsStore(s => s.gridSize);
    const setGridSize = useGenerationsStore(s => s.setGridSize);
    const soundOnHover = useGenerationsStore(s => s.soundOnHover);
    const setSoundOnHover = useGenerationsStore(s => s.setSoundOnHover);
    const showTileDetails = useGenerationsStore(s => s.showTileDetails);
    const setShowTileDetails = useGenerationsStore(s => s.setShowTileDetails);
    const showDetails = useGenerationsStore(s => s.showDetails);
    const setShowDetails = useGenerationsStore(s => s.setShowDetails);
    const clearPromptOnSubmit = useGenerationsStore(s => s.clearPromptOnSubmit);
    const setClearPromptOnSubmit = useGenerationsStore(s => s.setClearPromptOnSubmit);
    const activeSessionId = useGenerationsStore(s => s.activeSessionId);
    const setActiveSessionId = useGenerationsStore(s => s.setActiveSessionId);
    const activeProjectId = useGenerationsStore(s => s.selectedProjectId);
    const showUploadedMedia = useGenerationsStore(s => s.showUploadedMedia);
    const setShowUploadedMedia = useGenerationsStore(s => s.setShowUploadedMedia);
    const filters = useGenerationsStore(s => s.filters);
    const setFilter = useGenerationsStore(s => s.setFilter);
    const activeStudioTab = useGenerationsStore(s => s.activeStudioTab);
    const isNavbarHidden = useGenerationsStore(s => s.isNavbarHidden);

    const { data: projects = [] } = useProjects()
    const { mutateAsync: updateProject } = useUpdateProject()
    const projectSessions = useProjectSessions(activeProjectId) || []
    const createSessionMutation = useCreateSession()
    const { availableModels, filteredCount: genFilteredCount, total: genTotal } = useFilteredGenerations(activeProjectId, activeSessionId)
    const { filteredCount: elemFilteredCount, total: elemTotal } = useElementSheetWorkflows(activeProjectId)

    const filteredCount = activeStudioTab === 'elements' ? elemFilteredCount : genFilteredCount;
    const total = activeStudioTab === 'elements' ? elemTotal : genTotal;

    const activeProject = projects.find(p => p.project_id === activeProjectId)
    const selectedProjectName = activeProject?.project_name || "Select Project"
    const activeSession = projectSessions.find(s => s.session_id === activeSessionId)
    const selectedSessionName = activeSession?.session_name || null

    const {
        searchExpanded,
        searchInputRef,
        handleOpenSearch,
        handleCloseSearch
    } = useNavbarSearch(setFilter)

    const [isCreateSessionOpen, setIsCreateSessionOpen] = React.useState(false)

    const handleEditProjectName = async (nextName) => {
        if (!activeProjectId) return
        await updateProject({
            projectId: activeProjectId,
            projectData: { project_name: nextName },
        })
    }

    const handleCreateSession = async (name) => {
        if (!activeProjectId) return

        const latestSession = projectSessions[0]
        if (latestSession && !latestSession.thumbnail) {
            setActiveSessionId(latestSession.session_id)
            setIsCreateSessionOpen(false)
            return
        }

        const newSession = await createSessionMutation.mutateAsync({
            session_name: name,
            project_id: activeProjectId,
        })
        if (newSession) setActiveSessionId(newSession.session_id)
        setIsCreateSessionOpen(false)
    }

    return (
        <motion.nav
            variants={{
                visible: { y: 0 },
                hidden: { y: "-100%" },
            }}
            animate={isNavbarHidden ? "hidden" : "visible"}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 left-0 pl-[5px] pr-8 py-2 w-full z-50 flex flex-col bg-transparent min-h-[60px]"
        >
            <div className="flex  items-stretch min-h-[60px] w-full">
                <StudioNavbarLeft
                    searchExpanded={searchExpanded}
                    selectedProjectName={selectedProjectName}
                    onEditProjectName={handleEditProjectName}
                    projectSessions={projectSessions}
                    activeSessionId={activeSessionId}
                    setActiveSessionId={setActiveSessionId}
                    selectedSessionName={selectedSessionName}
                    setIsCreateSessionOpen={setIsCreateSessionOpen}
                />

                <StudioNavbarCenter
                    searchExpanded={searchExpanded}
                    availableModels={availableModels}
                    filteredCount={filteredCount}
                    total={total}
                    searchInputRef={searchInputRef}
                    handleCloseSearch={handleCloseSearch}
                    handleOpenSearch={handleOpenSearch}
                    filters={filters}
                    setFilter={setFilter}
                />

                <StudioNavbarRight
                    searchExpanded={searchExpanded}
                    gridSize={gridSize}
                    setGridSize={setGridSize}
                    soundOnHover={soundOnHover}
                    setSoundOnHover={setSoundOnHover}
                    showTileDetails={showTileDetails}
                    setShowTileDetails={setShowTileDetails}
                    showDetails={showDetails}
                    setShowDetails={setShowDetails}
                    clearPromptOnSubmit={clearPromptOnSubmit}
                    setClearPromptOnSubmit={setClearPromptOnSubmit}
                    showUploadedMedia={showUploadedMedia}
                    setShowUploadedMedia={setShowUploadedMedia}
                />
            </div>

            <ActiveFilterTags />

            <CreateSessionDialog
                isOpen={isCreateSessionOpen}
                onOpenChange={setIsCreateSessionOpen}
                onCreate={handleCreateSession}
                isCreating={createSessionMutation.isLoading}
            />
        </motion.nav>

    )
}
