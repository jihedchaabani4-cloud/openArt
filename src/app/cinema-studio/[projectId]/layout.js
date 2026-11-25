"use client"

import { usePathname, useParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"

import { LeftNavigationRail } from "@/components/layout/LeftNavigationRail"
import { StudioNavbar } from "@/components/layout/StudioNavbar"
import { useWorkflowsStore } from "@/features/workflows"
import { useProjectData } from "@/features/workflows/api/workflowsApi"
import { useProjectFolders } from "@/features/folders"
import { LoadingScreen } from "@/components/primitives/LoadingScreen"
import { ProjectError } from "@/components/cinema-studio/projects/ProjectError"
import { queryKeys } from "@/shared/api/queryKeys"
import { useDragAutoScroll } from "@/features/studio"
import { useStudioDropExecutor } from "@/features/studio/model/useStudioDropExecutor"
import { usePromptBarRouteWatcher } from "@/features/prompt-bar"

/**
 * [FSD Layer: widgets/StudioLayout]
 * 🏗️ Studio Layout (SaaS Architecture)
 * 
 * Blueprint:
 * 1. Single Source of Truth via layout fetch.
 * 2. Controlled Error Handling via shared ProjectError component.
 * 3. Pure Cache Management on entry/exit.
 */
export default function StudioLayout({ children }) {
    const pathname = usePathname()
    const { projectId } = useParams()
    useDragAutoScroll();
    useStudioDropExecutor(projectId);
    usePromptBarRouteWatcher();
    const queryClient = useQueryClient()
    const selectedProjectId = useWorkflowsStore(s => s.selectedProjectId);
    const setSelectedProjectId = useWorkflowsStore(s => s.setSelectedProjectId);
    const setIsNavbarHidden = useWorkflowsStore(s => s.setIsNavbarHidden);
    
    // 🔹 Data Layer (Pure Hooks, concurrent project + folders prefetch)
    const { isLoading: isProjectLoading, isError: isProjectError, refetch: refetchProject } = useProjectData(projectId);
    const { isLoading: isFoldersLoading, isError: isFoldersError, refetch: refetchFolders } = useProjectFolders(projectId);

    const isLoading = isProjectLoading || isFoldersLoading;
    const isError = isProjectError || isFoldersError;
    const refetch = useCallback(() => {
        refetchProject();
        refetchFolders();
    }, [refetchProject, refetchFolders]);

    // 🚀 Sync selectedProjectId with URL
    useEffect(() => {
        if (projectId && projectId !== selectedProjectId) {
            setSelectedProjectId(projectId);
        }
    }, [projectId, selectedProjectId, setSelectedProjectId]);
    
    // 🔹 Local Entry state
    const [isEntryLoading, setIsEntryLoading] = useState(true)

    const isEditPage =
        pathname?.includes("/assets/edit/") ||
        pathname?.includes("/generations/edit/") ||
        pathname?.includes("/edit/") ||
        pathname?.includes("/elements/new") ||
        pathname?.includes("/characters/new") ||
        (pathname?.includes("/elements/") && !pathname?.endsWith("/elements")) ||
        (pathname?.includes("/characters/") && !pathname?.endsWith("/characters"));

    const clearProjectStudioState = useCallback(() => {
        const entryKey = `project-${projectId}-active`;
        sessionStorage.removeItem(entryKey);
    }, [projectId]);

    // 🚀 Navigation Smart logic: Only refetch when entering from OUTSIDE
    useEffect(() => {
        if (!projectId) return;

        const entryKey = `project-${projectId}-active`;
        const isAlreadyInside = sessionStorage.getItem(entryKey);

        if (!isAlreadyInside) {
            // 🔴 Manual Invalidate on fresh entry
            queryClient.invalidateQueries({
                queryKey: queryKeys.projectData.byProject(projectId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.folders.byProject(projectId),
            });
            sessionStorage.setItem(entryKey, "true");
        }

        return () => {
            clearProjectStudioState();
        };
    }, [projectId, queryClient, clearProjectStudioState]);

    useEffect(() => {
        setIsNavbarHidden(false)
    }, [pathname, setIsNavbarHidden])

    // Premium Intro Logic
    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => setIsEntryLoading(false), 800)
            return () => clearTimeout(timer)
        } else {
            setIsEntryLoading(true)
        }
    }, [isLoading])

    const showIntro = isLoading || isEntryLoading

    // 🎯 Controlled Error UI (Using Shared Component)
    if (isError && !isLoading) {
        return <ProjectError onRetry={() => refetch()} />
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden relative bg-main">
            <AnimatePresence mode="wait">
                {showIntro ? (
                    <motion.div
                        key="loader-wrapper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        <LoadingScreen  fullScreen={false} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="content-wrapper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        {!isEditPage ? (
                            <div className="flex-1 min-h-0 flex overflow-hidden relative w-full h-full p-2 gap-2 bg-main">
                                <LeftNavigationRail />
                                <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden h-full rounded-comfortable border border-border-subtle bg-main">
                                    <StudioNavbar />
                                    <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                                        {children}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 relative overflow-hidden">
                                {children}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )

}
