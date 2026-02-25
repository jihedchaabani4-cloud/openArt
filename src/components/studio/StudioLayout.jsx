"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { CharacterPanel } from "./CharacterPanel"
import { MainStage } from "@/components/builder/MainStage"
import { CharacterParameters } from "./CharacterParameters"

export function StudioLayout() {
    const { fetchCharacters } = useStudioStore()

    React.useEffect(() => {
        fetchCharacters()
    }, [fetchCharacters])

    return (
        <div
            className="flex h-screen w-screen overflow-hidden"
            style={{ background: "#000000" }}
        >
            {/* ── Col 1: Character Selector (140px) ─────────────── */}
            <CharacterPanel />

            {/* ── Col 2: Main Stage + Heritage Tree (flex-1) ──────── */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
                <MainStage />
            </main>

            {/* ── Col 3: Character Parameters & Actions (300px) ───*/}
            <CharacterParameters />
        </div>
    )
}
