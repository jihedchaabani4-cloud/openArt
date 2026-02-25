"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { cn } from "@/lib/utils"
import { Plus, User } from "lucide-react"
import { CharacterCreator } from "./CharacterCreator"
import { Button } from "@/components/ui/button"
import { CharacterCard } from "./CharacterCard"

export function CharacterPanel() {
    const { characters, activeCharacterId, selectCharacter, createLocalDraft } = useStudioStore()

    const [draftId, setDraftId] = React.useState(null)

    const handleCreateNew = () => {
        // Create a draft character immediately (it becomes active so settings write to it)
        const id = createLocalDraft()
        setDraftId(id)
    }

    const handleCreatorClose = () => {
        setDraftId(null)
    }

    return (
        <>
            <aside className="w-[124px] shrink-0 border-r border-white/10 bg-black flex flex-col h-screen overflow-y-auto overflow-x-hidden scrollbar-hide py-4 px-3 gap-4">

                {/* ── Create New button */}
                {/* ── Create New button */}
                <Button
                    variant="studio-neon"
                    onClick={handleCreateNew}
                    className="w-full aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#1a1a1a] transition-all duration-200 focus:outline-none hover:bg-[#222] border border-white/5 active:scale-[0.98] group p-0 hover:text-white h-auto flex-none"
                >
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center transition-colors duration-200">
                        <Plus className="w-3.5 h-3.5 text-white/40" />
                    </div>
                    <span className="text-[9px] font-bold text-white/40 group-hover:text-white/60 transition-colors">
                        Create new
                    </span>
                </Button>

                {[...characters]
                    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                    .map((char) => (
                        <CharacterCard
                            key={char.id}
                            char={char}
                            isActive={activeCharacterId === char.id}
                            onClick={() => selectCharacter(char.id)}
                        />
                    ))}
            </aside>

            {/* ── Full-screen Character Creator */}
            {draftId && (
                <CharacterCreator draftId={draftId} onClose={handleCreatorClose} />
            )}
        </>
    )
}
