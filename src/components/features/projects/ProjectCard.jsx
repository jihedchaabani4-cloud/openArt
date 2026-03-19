"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Folder, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * ProjectCard component with a full-cover design.
 * 
 * @param {Object} project - The project data object
 * @param {Function} onDelete - Callback for deleting a project
 * @param {Function} onRename - Callback for renaming a project
 */
export function ProjectCard({ project, onDelete, onRename }) {
    const formattedDate = project.created_at 
        ? format(new Date(project.created_at), "MMM d, yyyy, HH:mm") 
        : "No date"

    // Default thumbnail if none provided
    const thumbnail = project.thumbnail_url || "https://picsum.photos/seed/project/800/600"

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative aspect-4/3 rounded-md overflow-hidden bg-[#1a1c1e] cursor-pointer shadow-lg border border-white/5"
        >
            <Link href={`/projects/${project.project_id}`} className="absolute inset-0 z-0">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img 
                        src={thumbnail} 
                        alt={project.project_name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Dark Vignette Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20" />
                </div>

                {/* Bottom Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <h3 className="text-[17px] font-semibold text-white tracking-tight mb-0.5 drop-shadow-md truncate">
                        {project.project_name}
                    </h3>
                    <div className="flex items-center gap-2">
                        <p className="text-[12px] text-white/60 font-medium tracking-wide drop-shadow-sm">
                            {formattedDate}
                        </p>
                    </div>
                </div>
            </Link>

            {/* Top Bar - Icons (Kept outside Link to remain interactive) */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                {/* Folder Icon */}
                <div className="size-9 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 transition-colors">
                    <Folder className="size-4.5" />
                </div>

                {/* More Menu */}
                <div className="pointer-events-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button 
                                onClick={(e) => e.stopPropagation()}
                                className="size-9 rounded-xl bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/30 transition-all outline-none"
                            >
                                <MoreHorizontal className="size-5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#131517] border-white/10 text-white rounded-xl p-1.5 shadow-2xl">
                            <DropdownMenuItem 
                                onClick={() => onRename(project.project_id, project.project_name)}
                                className="focus:bg-white/5 cursor-pointer rounded-lg px-3 py-2 text-sm"
                            >
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-white/5 cursor-pointer rounded-lg px-3 py-2 text-sm">
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5 mx-1" />
                            <DropdownMenuItem 
                                onClick={() => onDelete(project.project_id)}
                                className="focus:bg-red-500/10 text-red-400 cursor-pointer rounded-lg px-3 py-2 text-sm"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.div>
    )
}
