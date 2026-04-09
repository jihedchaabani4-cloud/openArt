"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { useCreateProject } from "@/features/projects/api/projectsApi"
import { useRouter } from "next/navigation"

export function ProjectsNavbar() {
    const router = useRouter()
    const { mutateAsync: createProject } = useCreateProject()

    const handleCreateNew = async () => {
        const name = prompt("Project Name:", "")
        if (name) {
            const project = await createProject({ project_name: name })
            if (project?.project_id) {
                router.push(`/projects/${project.project_id}`)
            }
        }
    }

    return (
        <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 left-0 w-full z-50 flex items-center justify-between min-h-[60px] px-6 bg-black/80 backdrop-blur-xl border-b border-white/5"
        >
            {/* ── Logo / Brand ── */}
            <Link
                href="/projects"
                className="flex items-center gap-2.5 text-white/90 hover:text-white transition-colors group"
            >
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                        <path d="M12.7368 2.60967C12.6694 2.25593 12.3601 2 12 2C11.6399 2 11.3306 2.25593 11.2632 2.60967C10.7844 5.12353 9.83969 7.03715 8.43842 8.43842C7.03715 9.83969 5.12353 10.7844 2.60967 11.2632C2.25593 11.3306 2 11.6399 2 12C2 12.3601 2.25593 12.6694 2.60967 12.7368C5.12353 13.2156 7.03715 14.1603 8.43842 15.5616C9.83969 16.9629 10.7844 18.8765 11.2632 21.3903C11.3306 21.7441 11.6399 22 12 22C12.3601 22 12.6694 21.7441 12.7368 21.3903C13.2156 18.8765 14.1603 16.9629 15.5616 15.5616C16.9629 14.1603 18.8765 13.2156 21.3903 12.7368C21.7441 12.6694 22 12.3601 22 12C22 11.6399 21.7441 11.3306 21.3903 11.2632C18.8765 10.7844 16.9629 9.83969 15.5616 8.43842C14.1603 7.03715 13.2156 5.12353 12.7368 2.60967Z" />
                    </svg>
                </div>
                <span className="text-[15px] font-semibold tracking-tight">Open Art</span>
            </Link>

            {/* ── New Project ── */}
            <button
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-white text-black text-xs font-semibold hover:bg-white/90 active:scale-95 transition-all"
            >
                <Plus className="size-3.5" />
                New Project
            </button>
        </motion.nav>
    )
}
