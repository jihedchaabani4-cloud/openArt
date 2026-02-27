"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { CharacterPanel } from "./CharacterPanel"
import { MainStage } from "@/components/builder/MainStage"
import { HeritageTree } from "./HeritageTree"
import { CharacterCreator } from "./CharacterCreator"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function StudioLayout() {
    const { characters, fetchCharacters, activeCharacterId, selectCharacter } = useStudioStore()
    const [hasFetched, setHasFetched] = React.useState(false)
    const [isCreating, setIsCreating] = React.useState(false)

    React.useEffect(() => {
        fetchCharacters().then(() => setHasFetched(true))
    }, [fetchCharacters])

    const noCharacters = hasFetched && characters.length === 0

    const handleCreateNew = () => {
        selectCharacter(null)
        setIsCreating(true)
    }

    const handleSelectCharacter = (id) => {
        setIsCreating(false)
        selectCharacter(id)
    }

    return (
        <div
            className="flex h-screen w-screen overflow-hidden relative"
            style={{ background: "#131517" }}
        >
            {/* ── Background Grid Layer ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="bg-grid-perspective opacity-40" />
                <div className="absolute inset-0 bg-radial-to-b from-transparent via-[#131517]/20 to-[#131517]" />
            </div>

            {/* ── Col 1: Character Selector (140px) ─────────────── */}
            <CharacterPanel 
                className="relative z-10" 
                isCreating={isCreating}
                activeCharacterId={activeCharacterId}
                onCreateNew={handleCreateNew}
                onSelectCharacter={handleSelectCharacter}
            />

            {/* ── Col 2: Main Stage (flex-1) ──────── */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent relative z-10">
                <MainStage />
            </main>

            {/* ── Col 3: Character Heritage OR Creator (320px) ───*/}
            {isCreating || (noCharacters && !activeCharacterId) ? (
                <CharacterCreator onClose={() => setIsCreating(false)} />
            ) : (
                <HeritageTree className="relative z-10" />
            )}
        </div>
    )
}
