"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Check, ChevronDown, Filter, Heart, LayoutGrid, List, MoreHorizontal, Plus, Search, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { ProjectCard } from "@/features/projects/ui/ProjectCard"
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from "@/features/projects/api/projectsApi"

export function ProjectsPage() {
    const { data: projects = [], isLoading, error } = useProjects()
    const { mutateAsync: createProject } = useCreateProject()
    const { mutateAsync: deleteProject } = useDeleteProject()
    const { mutateAsync: updateProject } = useUpdateProject()

    const [searchQuery, setSearchQuery] = React.useState("");
    const [sortBy, setSortBy] = React.useState("modified"); // 'modified', 'created', 'alphabetical'
    const [sortOrder, setSortOrder] = React.useState("desc"); // 'asc', 'desc'

    const handleCreateNew = async () => {
        const name = prompt("Project Name:", "")
        if (name) {
            await createProject({ project_name: name })
        }
    }

    const handleRename = async (id, currentName) => {
        const newName = prompt("Project Name:", currentName)
        if (newName && newName !== currentName) {
            await updateProject({ projectId: id, projectData: { project_name: newName } })
        }
    }

    const sortedAndFilteredProjects = React.useMemo(() => {
        let result = projects.filter(p => 
            p.project_name.toLowerCase().includes(searchQuery.toLowerCase())
        )

        // Apply Sort
        result.sort((a, b) => {
            let valA, valB
            if (sortBy === "alphabetical") {
                valA = a.project_name.toLowerCase()
                valB = b.project_name.toLowerCase()
            } else if (sortBy === "created") {
                valA = new Date(a.created_at || 0).getTime()
                valB = new Date(b.created_at || 0).getTime()
            } else {
                valA = new Date(a.updated_at || a.created_at || 0).getTime()
                valB = new Date(b.updated_at || b.created_at || 0).getTime()
            }

            if (valA < valB) return sortOrder === "asc" ? -1 : 1
            if (valA > valB) return sortOrder === "asc" ? 1 : -1
            return 0
        })

        return result
    }, [projects, searchQuery, sortBy, sortOrder])

    return (
        <div className="min-h-screen bg-transparent text-white font-sans selection:bg-[#D4FF00]/30">
            <div className="max-w-[1600px] mx-auto px-8 pt-12 pb-20">
                {/* Header Section */}
                <div className="flex flex-col gap-8 mb-12">
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    
                    <div className="flex items-center justify-between">
                        {/* Search Input */}
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                            <Input 
                                placeholder="Search projects..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 bg-[#1a1c1e] border-white/5 rounded-lg focus:ring-[#D4FF00]/50 focus:border-[#D4FF00]/50 transition-all text-sm"
                            />
                        </div>

                        {/* Sort & Actions */}
                        <div className="flex items-center gap-6">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1a1c1e] border border-white/5 text-white/60 hover:text-white cursor-pointer transition-all group">
                                        {sortOrder === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                                        <span className="text-xs font-medium tracking-wide">
                                            {sortBy === "modified" ? "Date modified" : sortBy === "created" ? "Date created" : "Alphabetical"}
                                        </span>
                                        <ChevronDown className="size-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-[#131517] border-white/10 text-white rounded-xl p-1 shadow-2xl">
                                    <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Sort By</div>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setSortBy("modified")} className="flex items-center justify-between focus:bg-white/5 cursor-pointer rounded-lg px-3 py-2">
                                        <span className="text-sm">Date modified</span>
                                        {sortBy === "modified" && <Check className="size-4 text-[#D4FF00]" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setSortBy("created")} className="flex items-center justify-between focus:bg-white/5 cursor-pointer rounded-lg px-3 py-2">
                                        <span className="text-sm">Date created</span>
                                        {sortBy === "created" && <Check className="size-4 text-[#D4FF00]" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setSortBy("alphabetical")} className="flex items-center justify-between focus:bg-white/5 cursor-pointer rounded-lg px-3 py-2">
                                        <span className="text-sm">Alphabetical</span>
                                        {sortBy === "alphabetical" && <Check className="size-4 text-[#D4FF00]" />}
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuSeparator className="bg-white/5 my-1" />
                                    
                                    <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Order</div>
                                    {sortBy === "alphabetical" ? (
                                        <>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setSortOrder("asc")} className="flex items-center justify-between focus:bg-white/5 cursor-pointer rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <ArrowDown className="size-3.5" />
                                                    <span className="text-sm">A → Z</span>
                                                </div>
                                                {sortOrder === "asc" && <Check className="size-4 text-[#D4FF00]" />}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setSortOrder("desc")} className="flex items-center justify-between focus:bg-white/5 cursor-pointer rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <ArrowUp className="size-3.5" />
                                                    <span className="text-sm">Z → A</span>
                                                </div>
                                                {sortOrder === "desc" && <Check className="size-4 text-[#D4FF00]" />}
                                            </DropdownMenuItem>
                                        </>
                                    ) : (
                                        <>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setSortOrder("desc")} className="flex items-center justify-between focus:bg-white/5 cursor-pointer rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <ArrowUp className="size-3.5" />
                                                    <span className="text-sm">Newest first</span>
                                                </div>
                                                {sortOrder === "desc" && <Check className="size-4 text-[#D4FF00]" />}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setSortOrder("asc")} className="flex items-center justify-between focus:bg-white/5 cursor-pointer rounded-lg px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <ArrowDown className="size-3.5" />
                                                    <span className="text-sm">Oldest first</span>
                                                </div>
                                                {sortOrder === "asc" && <Check className="size-4 text-[#D4FF00]" />}
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            
                            <Button 
                                onClick={handleCreateNew}
                                size="sm"
                                className="bg-white text-black hover:bg-white/90 rounded-md px-5 h-9 font-medium text-xs transition-transform active:scale-95"
                            >
                                <Plus className="size-3.5 mr-2" />
                                New Project
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                {/* Grid Section */}
                {isLoading && projects.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                            <div key={idx} className="aspect-4/3 rounded-md bg-white/5 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                        {sortedAndFilteredProjects.map((project) => (
                            <ProjectCard 
                                key={project.project_id} 
                                project={project} 
                                onDelete={deleteProject}
                                onRename={handleRename}
                            />
                        ))}
                        
                        {sortedAndFilteredProjects.length === 0 && !isLoading && (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-40">
                                <div className="size-16 rounded-2xl border-2 border-dashed border-white/10 mb-6" />
                                <p className="text-sm font-medium tracking-wide">No projects found</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* FAB for mobile or quick access (Optional) */}
            <div className="fixed bottom-8 right-8 z-50 lg:hidden">
                <Button 
                    onClick={handleCreateNew}
                    size="icon" 
                    className="size-14 rounded-full bg-white text-black shadow-2xl hover:bg-white/90 active:scale-95 transition-transform"
                >
                    <Plus className="size-6" />
                </Button>
            </div>
        </div>
    );
}
