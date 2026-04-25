"use client"

import * as React from "react"
import { MarqueeTicker } from "./PromoSlider"
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from "@/features/projects/api/projectsApi"
import { useRouter } from "next/navigation"
import { sortProjectsByRecent } from "./projects/model/projectList"
import { ProjectsGrid } from "./projects/ui/ProjectsGrid"
import { ProjectsFloatingAction } from "./projects/ui/ProjectsFloatingAction"
import { LoadingScreen } from "@/shared/ui/LoadingScreen"
import { AnimatePresence, motion } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/shared/api/queryKeys"

export function ProjectsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    
    // Clear cache when unmounting so next visit is fresh
    React.useEffect(() => {
        return () => {
            queryClient.removeQueries({ queryKey: queryKeys.projects.all() })
        }
    }, [queryClient])

    const { data: projects = [], isLoading, error } = useProjects()
    const { mutateAsync: createProject, isPending: isCreating } = useCreateProject()
    const { mutateAsync: deleteProject } = useDeleteProject()
    const { mutateAsync: updateProject } = useUpdateProject()

    const handleCreateNew = async () => {
        // 🚀 Backend now handles automatic naming with date/time
        const project = await createProject({})
        if (project?.project_id) {
            router.push(`/cinema-studio/${project.project_id}`)
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
        <AnimatePresence mode="wait">
            {isLoading ? (
                <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[200] bg-[#050505] flex items-center justify-center"
                >
                    <LoadingScreen fullScreen={false} />
                </motion.div>
            ) : (
                <motion.div 
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="px-5 pt-2 pb-20"
                >
                    <MarqueeTicker isEmpty={projects.length === 0} />

                    <ProjectsGrid
                        projects={sortedProjects}
                        isLoading={isLoading}
                        onDelete={deleteProject}
                        onRename={handleRename}
                        onCreate={handleCreateNew}
                        isCreating={isCreating}
                    />

                    <ProjectsFloatingAction onCreate={handleCreateNew} isLoading={isCreating} />
                </motion.div>
            )}
        </AnimatePresence>
    )

}
