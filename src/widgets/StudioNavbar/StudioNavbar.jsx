"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useProjects, useUpdateProject } from "@/features/projects/api/projectsApi"
import { useProjectSessions } from "@/features/workflows/api/workflowsApi"
import { useCreateSession } from "@/features/projects/api/createSessionApi"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"

import { StudioNavbarLeft } from "./ui/StudioNavbarLeft"
import { StudioNavbarCenter } from "./ui/StudioNavbarCenter"
import { StudioNavbarRight } from "./ui/StudioNavbarRight"
import { UserDropdown } from "./ui/UserDropdown"
import { CreateSessionDialog } from "./ui/CreateSessionDialog"

import { useNavbarSearch } from "./hooks/useNavbarSearch"

export function StudioNavbar() {
    const activeSessionId = useGenerationsStore(s => s.activeSessionId);
    const setActiveSessionId = useGenerationsStore(s => s.setActiveSessionId);
    const activeProjectId = useGenerationsStore(s => s.selectedProjectId);
    const filters = useGenerationsStore(s => s.filters);
    const setFilter = useGenerationsStore(s => s.setFilter);
    const activeStudioTab = useGenerationsStore(s => s.activeStudioTab);
    const isNavbarHidden = useGenerationsStore(s => s.isNavbarHidden);

    const isCleanNavbarTab = activeStudioTab === 'elements' || activeStudioTab === 'characters';

    const { data: projects = [] } = useProjects();
    const { mutateAsync: updateProject } = useUpdateProject();
    const rawSessions = useProjectSessions(activeProjectId);
    const projectSessions = React.useMemo(() => rawSessions || [], [rawSessions]);
    const createSessionMutation = useCreateSession();

    const activeProject = React.useMemo(
        () => projects.find(p => p.project_id === activeProjectId),
        [projects, activeProjectId]
    );
    const selectedProjectName = activeProject?.project_name || "Select Project";

    const activeSession = React.useMemo(
        () => projectSessions.find(s => s.session_id === activeSessionId),
        [projectSessions, activeSessionId]
    );
    const selectedSessionName = activeSession?.session_name || null;

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
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 pl-2.5 pr-8 h-16 w-full z-50 flex flex-col justify-center bg-transparent"
        >
            <div className="flex items-center h-16 w-full">
                <StudioNavbarLeft
                    searchExpanded={searchExpanded}
                    selectedProjectName={selectedProjectName}
                    onEditProjectName={handleEditProjectName}
                    activeProjectId={activeProjectId}
                    projectSessions={projectSessions}
                    activeSessionId={activeSessionId}
                    setActiveSessionId={setActiveSessionId}
                    selectedSessionName={selectedSessionName}
                    setIsCreateSessionOpen={setIsCreateSessionOpen}
                />

                {!isCleanNavbarTab ? (
                    <>
                        <StudioNavbarCenter
                            searchExpanded={searchExpanded}
                            searchInputRef={searchInputRef}
                            handleCloseSearch={handleCloseSearch}
                            handleOpenSearch={handleOpenSearch}
                            filters={filters}
                            setFilter={setFilter}
                        />

                        <StudioNavbarRight searchExpanded={searchExpanded} />
                    </>
                ) : (
                    <div className="ml-auto flex items-center gap-2 z-50">
                        <UserDropdown />
                    </div>
                )}
            </div>

            <CreateSessionDialog
                isOpen={isCreateSessionOpen}
                onOpenChange={setIsCreateSessionOpen}
                onCreate={handleCreateSession}
                isCreating={createSessionMutation.isLoading}
            />
        </motion.nav>

    )
}
