"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { cn } from "@/lib/utils"
import { User, Layers, GitBranch, Settings, Info } from "lucide-react"

export function CharacterCard({ character, isActive, onClick }) {
    const { nodes, activeCharacterId } = useStudioStore()
    
    // Count variations for this character
    const variationCount = Object.values(nodes).filter(n => (n.character_id || n.characterId) === character.id).length

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative w-full aspect-square shrink-0 rounded-[24px] overflow-hidden border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2",
                isActive 
                    ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.4)] bg-[#D4FF00]/5" 
                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
            )}
        >
            {/* Main Avatar */}
            <div className={cn(
                "w-12 h-12 max-xl:w-10 max-xl:h-10 rounded-[14px] overflow-hidden border-2 transition-all duration-300",
                isActive ? "border-[#D4FF00]" : "border-white/10 group-hover:border-white/20"
            )}>
                {character.avatar_url ? (
                    <img src={character.avatar_url} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <User className={cn("w-6 h-6 max-xl:w-5 max-xl:h-5", isActive ? "text-[#D4FF00]" : "text-white/20")} />
                    </div>
                )}
            </div>

            {/* Name & Role */}
            <div className="flex flex-col items-center px-2">
                <span className={cn(
                    "text-sm max-xl:text-xs font-normal truncate max-w-full transition-colors",
                    isActive ? "text-white" : "text-white/50 group-hover:text-white"
                )}>
                    {character.name}
                </span>
                <span className="text-[10px] max-xl:text-[9px] font-normal uppercase tracking-widest text-white/20 mt-0.5">
                    {character.role || "Model"}
                </span>
            </div>

            {/* Variation Badge */}
            {variationCount > 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                    <Layers className="w-2.5 h-2.5 text-white/40" />
                    <span className="text-[9px] font-mono text-white/60">{variationCount}</span>
                </div>
            )}
        </button>
    )
}
