"use client"

import { ProjectCard } from "@/features/projects/ui/ProjectCard"

export function ProjectsGrid({ projects, isLoading, onDelete, onRename }) {
    if (isLoading && projects.length === 0) {
        return (
            <div className="flex flex-wrap gap-12">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div key={idx} className="w-full sm:w-[calc(50%-24px)] lg:w-[calc(33.33%-32px)] aspect-[1.6/1] rounded-[18px] border border-white/5 bg-white/5 animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-wrap gap-2">
            {projects.map((project) => (
                <div key={project.project_id} className="w-full sm:w-[calc(50%-4px)] lg:w-[calc(33.33%-6px)]">
                    <ProjectCard
                        project={project}
                        onDelete={onDelete}
                        onRename={onRename}
                    />
                </div>
            ))}

            {projects.length === 0 && !isLoading && (
                <div className="col-span-full flex flex-col items-center justify-center py-32 text-center opacity-40">
                    <div className="mb-6 size-16 rounded-2xl border-2 border-dashed border-white/10" />
                    <p className="text-sm font-medium tracking-wide">No projects found</p>
                </div>
            )}
        </div>
    )
}
