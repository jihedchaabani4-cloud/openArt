"use client"

import { ProjectCard } from "@/features/projects/ui/ProjectCard"
import { Button } from "@/shared/ui/button"
import { Plus, Loader2 } from "lucide-react"

export function ProjectsGrid({ projects, isLoading, onDelete, onRename, onCreate, isCreating }) {
    return (
        <div className="flex flex-col gap-6">
  

            {/* Grid */}
            {isLoading && projects.length === 0 ? (
                <div className="flex flex-wrap gap-12">
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <div key={idx} className="w-full sm:w-[calc(50%-24px)] lg:w-[calc(33.33%-32px)] aspect-[1.6/1] rounded-[18px] border border-white/5 bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="flex flex-wrap gap-4">
                    {/* Actual Projects */}
                    {projects.map((project) => (
                        <div key={project.project_id} className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)]">
                            <ProjectCard
                                project={project}
                                onDelete={onDelete}
                                onRename={onRename}
                            />
                        </div>
                    ))}

     
                </div>
            )}
        </div>
    )
}

