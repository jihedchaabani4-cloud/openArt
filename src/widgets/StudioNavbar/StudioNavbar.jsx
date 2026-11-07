"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { useProjects, useUpdateProject } from "@/features/projects/api/projectsApi"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { cn } from "@/shared/lib/utils"

import { StudioNavbarLeft } from "./ui/StudioNavbarLeft"
import { StudioNavbarCenter } from "./ui/StudioNavbarCenter"
import { StudioNavbarRight } from "./ui/StudioNavbarRight"
import { UserDropdown } from "@/widgets/navigation/UserDropdown"

import { useNavbarSearch } from "./hooks/useNavbarSearch"

export function StudioNavbar() {
    const activeProjectId = useGenerationsStore(s => s.selectedProjectId);
    const filters = useGenerationsStore(s => s.filters);
    const setFilter = useGenerationsStore(s => s.setFilter);
    const isNavbarHidden = useGenerationsStore(s => s.isNavbarHidden);

    const pathname = usePathname() || "";
    const isCleanNavbarTab = pathname.includes("/edit/") || pathname.endsWith("/new");

    const { data: projects = [] } = useProjects();
    const { mutateAsync: updateProject } = useUpdateProject();

    const activeProject = React.useMemo(
        () => projects.find(p => p.project_id === activeProjectId),
        [projects, activeProjectId]
    );
    const selectedProjectName = activeProject?.project_name || "Select Project";

    const {
        searchExpanded,
        searchInputRef,
        handleOpenSearch,
        handleCloseSearch
    } = useNavbarSearch(setFilter)

    const handleEditProjectName = async (nextName) => {
        if (!activeProjectId) return
        await updateProject({
            projectId: activeProjectId,
            projectData: { project_name: nextName },
        })
    }

    return (
        <motion.nav
            variants={{
                visible: { y: 0 },
                hidden: { y: "-100%" },
            }}
            animate={isNavbarHidden ? "hidden" : "visible"}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 pl-3 pr-4 sm:pr-6 h-16 w-full z-50 flex flex-col justify-center bg-transparent overflow-hidden"
        >
            <div className="header-backdrop header-backdrop-visible" aria-hidden="true" />
            <div className="relative flex items-center h-16 w-full min-w-0">
                <StudioNavbarLeft
                    searchExpanded={searchExpanded}
                    selectedProjectName={selectedProjectName}
                    onEditProjectName={handleEditProjectName}
                    activeProjectId={activeProjectId}
                />

                {!isCleanNavbarTab ? (
                    <>
                        {/* Spacing placeholder for symmetric flex columns */}
                        <div
                            className={cn(
                                "flex-none w-full transition-[max-width] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none invisible mx-auto",
                                searchExpanded ? "max-w-full" : "max-w-[360px] sm:max-w-[420px] md:max-w-[460px]"
                            )}
                            aria-hidden="true"
                        />

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
                    <div className="ml-auto flex flex-none items-center gap-2 z-50">
                        <UserDropdown />
                    </div>
                )}
            </div>
        </motion.nav>
    )
}
