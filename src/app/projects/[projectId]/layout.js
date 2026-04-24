"use client"

import { usePathname, useParams } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"

import { SessionSidebar } from "@/widgets/StudioLayout/SessionSidebar/SessionSidebar"
import { StudioNavbar } from "@/widgets/StudioNavbar"
import { useWorkflowsStore } from "@/features/workflows"
import { useProjectData } from "@/features/workflows/api/workflowsApi"
import { LoadingScreen } from "@/shared/ui/LoadingScreen"
import { ProjectError } from "@/shared/ui/ProjectError"
import { queryKeys } from "@/shared/api/queryKeys"

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
    const queryClient = useQueryClient()
    const setIsNavbarHidden = useWorkflowsStore((s) => s.setIsNavbarHidden)
    
    // 🔹 Data Layer (Pure Hook, controlled error)
    const { isLoading, isError, refetch } = useProjectData(projectId)
    
    // 🔹 Local Entry state
    const [isEntryLoading, setIsEntryLoading] = useState(true)

    const isEditPage =
        pathname?.includes("/generations/edit/") ||
        pathname?.includes("/elements/edit/") ||
        pathname?.includes("/edit/")

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
        <div className="flex flex-col h-screen overflow-hidden relative bg-[#050505]">
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
                            <div className="flex-1 min-h-0 flex overflow-hidden">
                                <SessionSidebar />
                                <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
                                    <StudioNavbar />
                                    {children}
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
