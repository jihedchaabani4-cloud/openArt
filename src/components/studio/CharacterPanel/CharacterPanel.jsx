"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { useCinemaStore } from "@/store/useCinemaStudioStore"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CharacterCard } from "../CharacterCard"

export function CharacterPanel({ onCreateNew, onSelectCharacter, isCreating, activeCharacterId }) {
    const { characters, nodes, studioMode } = useStudioStore()
    const { projects, activeProjectId, setActiveProject } = useCinemaStore()

    return (
        <>
            <aside className="w-[180px] max-xl:w-[140px] shrink-0 p-4 flex flex-col gap-3 h-screen border-r border-white/5 bg-black">
                {/* Outer card container — the rounded box with #0F1113 */}
                <div className="rounded-[32px] border bg-[#1c1e20] p-2 h-full flex-1 outline-[#d9d9d90a] outline-2 outline-offset-8 flex flex-col">
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        <div className="flex flex-col items-stretch gap-2">
                            {/* Shared Character list for all modes */}
                            <div className="px-2 py-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Characters</div>
                            {characters.map((char) => (
                                <CharacterCard
                                    key={char.id}
                                    character={char}
                                    isActive={activeCharacterId === char.id}
                                    onClick={() => onSelectCharacter(char.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
