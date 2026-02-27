"use client"

import * as React from "react"
import { Plus, User, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useCharacterStore } from "@/store/useCharacterStore"

export function GallerySidebar() {
    const {
        savedCharacters,
        activeId,
        selectCharacter,
        createNew
    } = useCharacterStore()

    return (
        <aside className="w-[140px] h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col shrink-0 overflow-hidden">
            {/* Header / Studio Name - Minimalist */}
            <div className="p-4 flex flex-col gap-4 border-b border-white/5">
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 opacity-60">
                    <AlertCircle className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white">Studio</span>
                </div>

                <Button
                    variant="studio-gallery-create"
                    onClick={createNew}
                >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Plus className="w-4 h-4 text-white/40 group-hover:text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-white/30 group-hover:text-primary tracking-tight">Create new</span>
                </Button>
            </div>

            {/* Gallery List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
                {savedCharacters.map((char) => {
                    const isActive = activeId === char.id
                    return (
                        <Button
                            variant="studio-gallery-item"
                            key={char.id}
                            onClick={() => selectCharacter(char)}
                            className={cn(
                                "w-full",
                                isActive ? "opacity-100" : "opacity-40 hover:opacity-100"
                            )}
                        >
                            <div className={cn(
                                "aspect-square rounded-2xl border-2 overflow-hidden transition-all duration-300",
                                isActive ? "border-primary shadow-[0_0_15px_rgba(217,249,157,0.2)]" : "border-white/5 group-hover:border-white/20"
                            )}>
                                {char.previewUrl ? (
                                    <img
                                        src={char.previewUrl}
                                        alt={char.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                        <User className="w-6 h-6 text-white/10" />
                                    </div>
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-1 truncate w-full text-center",
                                isActive ? "text-primary" : "text-white/40"
                            )}>
                                {char.name || "Unnamed"}
                            </span>
                        </Button>
                    )
                })}
            </div>

            {/* Footer / Status */}
            <div className="p-3 border-t border-white/5 bg-white/2">
                <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
                    <p className="text-[9px] font-black italic text-primary leading-none text-center">EARN UP TO $3 500</p>
                </div>
            </div>
        </aside>
    )
}
