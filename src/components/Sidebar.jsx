"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { cn } from "@/lib/utils"

export function Sidebar() {
    const { characters, activeCharacterId, selectCharacter } = useStudioStore()

    return (
        <aside className="w-[100px] border-r border-white/5 bg-[#050505] flex flex-col items-center py-8 gap-6 h-screen sticky top-0 shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#D4FF00] flex items-center justify-center mb-4">
                <span className="font-black text-black">A</span>
            </div>

            <div className="flex-1 flex flex-col gap-6">
                {characters.map((char) => {
                    const isActive = activeCharacterId === char.id
                    return (
                        <button
                            key={char.id}
                            onClick={() => selectCharacter(char.id)}
                            className="group relative flex flex-col items-center gap-2"
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all duration-300",
                                isActive
                                    ? "border-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.3)] scale-110"
                                    : "border-white/5 opacity-40 hover:opacity-100 hover:border-white/20"
                            )}>
                                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest transition-colors",
                                isActive ? "text-[#D4FF00]" : "text-white/20 group-hover:text-white/40"
                            )}>
                                {char.name}
                            </span>

                            {isActive && (
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#D4FF00] rounded-r-full shadow-[0_0_10px_rgba(212,255,0,0.5)]" />
                            )}
                        </button>
                    )
                })}
            </div>
        </aside>
    )
}
