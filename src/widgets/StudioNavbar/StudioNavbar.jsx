"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useProjects } from "@/features/projects/api/projectsApi"
import { useProjectSessions } from "@/features/workflows/api/workflowsApi"
import { useCreateSession } from "@/features/projects/api/createSessionApi"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useFilteredWorkflows as useFilteredGenerations } from "@/features/workflows/model/useFilteredWorkflows"

// UI Components
import { StudioNavbarLeft } from "./ui/StudioNavbarLeft"
import { StudioNavbarCenter } from "./ui/StudioNavbarCenter"
import { StudioNavbarRight } from "./ui/StudioNavbarRight"
import { CreateSessionDialog } from "./ui/CreateSessionDialog"
import { ActiveFilterTags } from "@/features/workflows/ui/ActiveFilterTags"

// Hooks

import { useNavbarScroll } from "./hooks/useNavbarScroll"
import { useNavbarSearch } from "./hooks/useNavbarSearch"
import { useProjectEdit } from "./hooks/useProjectEdit"

export function StudioNavbar() {
    // ── Store ──
    const {
        gridSize, setGridSize,
        soundOnHover, setSoundOnHover,
        showTileDetails, setShowTileDetails,
        showDetails, setShowDetails,
        clearPromptOnSubmit, setClearPromptOnSubmit,
        activeSessionId, setActiveSessionId,
        selectedProjectId: activeProjectId,
        showUploadedMedia, setShowUploadedMedia,
        filters, setFilter,
    } = useGenerationsStore()

    // ── Server State ──
    const { data: projects = [] } = useProjects()
    const projectSessions = useProjectSessions(activeProjectId) || []
    const createSessionMutation = useCreateSession()
    const { availableModels, filteredCount, total } = useFilteredGenerations(activeProjectId, activeSessionId)

    // ── Derived ──
    const activeProject = projects.find(p => p.project_id === activeProjectId)
    const selectedProjectName = activeProject?.project_name || "Select Project"
    const activeSession = projectSessions.find(s => s.session_id === activeSessionId)
    const selectedSessionName = activeSession?.session_name || null

    // ── Logic Hooks ──
    const { hidden } = useNavbarScroll()
    const {
        searchExpanded,
        searchInputRef,
        handleOpenSearch,
        handleCloseSearch
    } = useNavbarSearch(setFilter)
    
    const {
        isEditingName,
        editedName,
        setEditedName,
        editInputRef,
        handleStartEdit,
        handleSaveEdit,
        handleCancelEdit
    } = useProjectEdit(activeProjectId, selectedProjectName)

    // ── Local UI State ──
    const [isCreateSessionOpen, setIsCreateSessionOpen] = React.useState(false)

    // ── API Helpers ──
    const updateProjectName = async (projectId, data) => {
        const { api } = await import('@/shared/api/client');
        await api.patch(`/projects/${projectId}`, data);
    }

    const handleCreateSession = async (name) => {
        if (!activeProjectId) return
        
        // Reuse logic from original navbar: if latest session is empty, just select it
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
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed top-0 left-0 w-full z-50 flex flex-col bg-transparent min-h-[60px]"
        >
            <div className="flex items-stretch min-h-[60px] w-full">
                <StudioNavbarLeft 
                    searchExpanded={searchExpanded}
                    activeProjectId={activeProjectId}
                    isEditingName={isEditingName}
                    editInputRef={editInputRef}
                    editedName={editedName}
                    setEditedName={setEditedName}
                    handleSaveEdit={() => handleSaveEdit(updateProjectName)}
                    handleCancelEdit={handleCancelEdit}
                    handleStartEdit={handleStartEdit}
                    selectedProjectName={selectedProjectName}
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