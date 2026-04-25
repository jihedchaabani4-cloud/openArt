"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, FolderOpen, Image as ImageIcon, Settings, Sparkles, LayoutGrid } from "lucide-react"

const NAV_ITEMS = [
    { label: "Home", href: "/", icon: Home },
    { label: "Projects", href: "/projects", icon: FolderOpen },
    { label: "Assets", href: "/assets", icon: ImageIcon },
    { label: "Settings", href: "/settings", icon: Settings },
]

export function GlobalSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-[80px] sm:w-[260px] h-screen fixed left-0 top-0 bg-[#080808] border-r border-white/5 flex flex-col pt-8 pb-6 z-[200]">
            <div className="flex items-center gap-3 px-6 mb-12">
                <div className="size-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                    <Sparkles className="size-4 text-white" />
                </div>
                <span className="hidden sm:block text-[15px] font-bold tracking-tight text-white uppercase italic">
                    Open Art
                </span>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                    const Icon = item.icon
                    return (
                        <Link key={item.href} href={item.href} className="relative block">
                            {isActive && (
                                <motion.div 
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-white/10 rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}
                            <div className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${isActive ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}>
                                <Icon className="size-5 shrink-0" />
                                <span className="hidden sm:block text-[14px] font-medium">{item.label}</span>
                            </div>
                        </Link>
                    )
                })}
            </nav>

            <div className="px-4 mt-auto">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shrink-0">
                        <span className="text-[10px] font-bold text-white/60">JD</span>
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="text-[13px] font-semibold text-white leading-tight">Jihad</span>
                        <span className="text-[11px] text-white/40 font-medium">Free Plan</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
