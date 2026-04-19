"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { Plus, FolderOpen } from "lucide-react"
import { useCreateProject } from "@/features/projects/api/projectsApi"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"

export function ProjectsNavbar() {
    const router = useRouter()
    const { mutateAsync: createProject } = useCreateProject()
    const { scrollY } = useScroll()
    const [hidden, setHidden] = useState(false)

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious()
        if (latest > previous && latest > 150) {
            setHidden(true)
        } else {
            setHidden(false)
        }
    })

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
            variants={{
                visible: { y: 0 },
                hidden: { y: "-100%" },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between h-[68px] px-8 "
        >
            {/* ── Left: Branding ── */}
            <Link
                href="/projects"
                className="flex items-center gap-3 group transition-opacity hover:opacity-100"
            >
                <div className="relative size-8 rounded-xl bg-linear-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg shadow-purple-500/20">
                    <div className="size-full rounded-[11px] bg-black flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                            <path d="M12.7368 2.60967C12.6694 2.25593 12.3601 2 12 2C11.6399 2 11.3306 2.25593 11.2632 2.60967C10.7844 5.12353 9.83969 7.03715 8.43842 8.43842C7.03715 9.83969 5.12353 10.7844 2.60967 11.2632C2.25593 11.3306 2 11.6399 2 12C2 12.3601 2.25593 12.6694 2.60967 12.7368C5.12353 13.2156 7.03715 14.1603 8.43842 15.5616C9.83969 16.9629 10.7844 18.8765 11.2632 21.3903C11.3306 21.7441 11.6399 22 12 22C12.3601 22 12.6694 21.7441 12.7368 21.3903C13.2156 18.8765 14.1603 16.9629 15.5616 15.5616C16.9629 14.1603 18.8765 13.2156 21.3903 12.7368C21.7441 12.6694 22 12.3601 22 12C22 11.6399 21.7441 11.3306 21.3903 11.2632C18.8765 10.7844 16.9629 9.83969 15.5616 8.43842C14.1603 7.03715 13.2156 5.12353 12.7368 2.60967Z" />
                        </svg>
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[14px] font-bold tracking-[-0.03em] leading-tight text-white uppercase italic">
                        Open Art
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold leading-none">
                        Studio
                    </span>
                </div>
            </Link>

            {/* ── Right: Navigation & Actions ── */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 mr-2 pr-4 border-r border-white/10">
                    <Button
                        variant="studio-ghost"
                        size="sm"
                        className="text-white gap-2 font-semibold text-[16px]"
                    >
                        Pricing
                    </Button>
                    <Button
                        variant="studio-ghost"
                        size="sm"
                        className="text-white gap-2 font-semibold text-[16px]"
                    >
                        <FolderOpen className="size-4 opacity-70" />
                        Assist
                    </Button>
                </div>

                <Button
                    onClick={handleCreateNew}
                    variant="studio-neon"
                    size="sm"
                    className="h-9 px-4 rounded-xl gap-2 mr-2"
                >
                    <Plus className="size-4" />
                    New Project
                </Button>

                {/* Profile Avatar */}
                <Avatar className="size-9 rounded-xl border border-white/10 p-[1px] bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-linear-to-br from-indigo-500/20 to-purple-500/20 text-[10px] font-bold text-white/60">
                        JD
                    </AvatarFallback>
                </Avatar>
            </div>
        </motion.nav>
    )
}
