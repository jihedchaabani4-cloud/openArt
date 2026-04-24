"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { FolderOpen } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { LoginDialog } from "@/components/LoginDialog"

export function ProjectsNavbar() {
    const { scrollY } = useScroll()
    const [hidden, setHidden] = useState(false)
    const [loginOpen, setLoginOpen] = useState(false)

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious()
        if (latest > previous && latest > 150) {
            setHidden(true)
        } else {
            setHidden(false)
        }
    })

    return (
        <>
            <motion.nav
                variants={{
                    visible: { y: 0 },
                    hidden: { y: "-100%" },
                }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between  px-8 h-[75px]"
            >
                {/* ── Left: Branding ── */}
                <Link
                    href="/projects"
                    className="flex items-center gap-3 group transition-opacity hover:opacity-100"
                >
        
              
                        <span className="text-[14px] font-bold tracking-[-0.03em] leading-tight text-white uppercase italic">
                            Open Art
                        </span>
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
                        <Button
                            onClick={() => setLoginOpen(true)}
                            variant="studio-ghost"
                            size="sm"
                            className="text-white gap-2 font-semibold text-[16px]"
                        >
                            Login
                        </Button>
                    </div>



                    {/* Profile Avatar */}
                    <Avatar className="size-9 rounded-xl border border-white/10 p-[1px] bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-linear-to-br from-indigo-500/20 to-purple-500/20 text-[10px] font-bold text-white/60">
                            JD
                        </AvatarFallback>
                    </Avatar>
                </div>
            </motion.nav>

            {/* Login Dialog overlay */}
            <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
        </>
    )
}
