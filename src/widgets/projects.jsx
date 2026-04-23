"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MarqueeTicker } from "./PromoSlider"
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from "@/features/projects/api/projectsApi"
import { sortProjectsByRecent } from "./projects/model/projectList"
import { ProjectsGrid } from "./projects/ui/ProjectsGrid"
import { ProjectsFloatingAction } from "./projects/ui/ProjectsFloatingAction"
import { LoadingScreen } from "@/shared/ui/LoadingScreen"

export function ProjectsPage() {
    const { data: projects = [], isLoading, error } = useProjects()
    const { mutateAsync: createProject } = useCreateProject()
    const { mutateAsync: deleteProject } = useDeleteProject()
    const { mutateAsync: updateProject } = useUpdateProject()

    const handleCreateNew = async () => {
        const name = prompt("Project Name:", "")
        if (name) {
            await createProject({ project_name: name })
        }
    }

    const handleRename = async (id, providedName = null) => {
        const newName = providedName || prompt("Project Name:", "")
        if (newName && newName.trim()) {
            await updateProject({ projectId: id, projectData: { project_name: newName.trim() } })
        }
    }

    const sortedProjects = React.useMemo(() => sortProjectsByRecent(projects), [projects])

    return (
        <div className="min-h-screen bg-transparent text-white font-sans selection:bg-[#D4FF00]/30">
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <LoadingScreen key="loader" />
                ) : (
                    <motion.div 
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="px-8 pt-2 pb-20"
                    >
                        <MarqueeTicker />

                        {error && (
                            <div className="mb-8 rounded-md border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                                {error.message || String(error)}
                            </div>
                        )}

                        <ProjectsGrid
                            projects={sortedProjects}
                            isLoading={isLoading}
                            onDelete={deleteProject}
                            onRename={handleRename}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {!isLoading && <ProjectsFloatingAction onCreate={handleCreateNew} />}
        </div>
    )
}
