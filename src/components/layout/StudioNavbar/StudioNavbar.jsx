"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useProjects, useUpdateProject } from "@/features/projects/api/projectsApi"
import {
    useWorkflowsStore as useGenerationsStore,
    useProjectData,
    extractAvailableModels,
} from "@/features/workflows"
import { useRealBackendModels, resolveModelIcon } from "@/features/prompt-bar"

import { StudioNavbarLeft } from "./StudioNavbarLeft"
import { StudioNavbarRight } from "./StudioNavbarRight"
import { UserDropdown } from "@/components/layout/UserDropdown"

export function StudioNavbar() {
    const activeProjectId = useGenerationsStore(s => s.selectedProjectId);

    const pathname = usePathname() || "";
    const isCleanNavbarTab = pathname.includes("/edit/") || pathname.endsWith("/new");

    const { data: projects = [] } = useProjects();
    const { mutateAsync: updateProject } = useUpdateProject();
    const { data: projectData } = useProjectData(activeProjectId);
    const { data: backendModelsData } = useRealBackendModels({ projectId: activeProjectId });

    const availableModels = React.useMemo(() => {
        const seen = new Set();
        const result = [];
        const pushModel = (value, label, domain = null, icon = null) => {
            const cleanValue = String(value || "").trim();
            const cleanLabel = String(label || cleanValue).trim();
            if (!cleanValue) return;
            const key = cleanLabel.toLowerCase();
            if (seen.has(key) || seen.has(cleanValue.toLowerCase())) return;
            seen.add(key);
            seen.add(cleanValue.toLowerCase());
            result.push({
                value: cleanValue,
                label: cleanLabel,
                domain,
                icon: icon || resolveModelIcon({ id: cleanValue, name: cleanLabel }),
            });
        };

        for (const m of backendModelsData?.models ?? []) {
            const domain = m?.domain === "video" || m?.category === "video" ? "video" : "image";
            pushModel(m?.id || m?.name, m?.name || m?.id, domain, m?.icon || resolveModelIcon(m));
        }
        for (const extracted of extractAvailableModels(projectData?.projectContents)) {
            pushModel(extracted, extracted, null, null);
        }
        return result.sort((a, b) => a.label.localeCompare(b.label));
    }, [backendModelsData?.models, projectData?.projectContents]);

    const activeProject = React.useMemo(
        () => projects.find(p => p.project_id === activeProjectId),
        [projects, activeProjectId]
    );
    const selectedProjectName = activeProject?.project_name || "Select Project";

    const handleEditProjectName = async (nextName) => {
        if (!activeProjectId) return
        await updateProject({
            projectId: activeProjectId,
            projectData: { project_name: nextName },
        })
    }

    return (
        <nav
            className="relative shrink-0 w-full px-3 py-2 h-11 z-30 flex flex-col justify-center bg-transparent overflow-hidden"
        >
            <div className="header-backdrop header-backdrop-visible" aria-hidden="true" />
            <div className="relative flex items-center justify-between gap-2 h-full w-full min-w-0">
                <StudioNavbarLeft
                    searchExpanded={false}
                    selectedProjectName={selectedProjectName}
                    onEditProjectName={handleEditProjectName}
                    activeProjectId={activeProjectId}
                />

                {!isCleanNavbarTab ? (
                    <StudioNavbarRight searchExpanded={false} availableModels={availableModels} />
                ) : (
                    <div className="ml-auto flex flex-none items-center gap-2 z-50">
                        <UserDropdown />
                    </div>
                )}
            </div>
        </nav>
    )
}
