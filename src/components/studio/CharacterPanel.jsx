"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"
import { CharacterCreator } from "./CharacterCreator"
import { Button } from "@/components/ui/button"
import { CharacterCard } from "./CharacterCard"

/** 
 * Pick the best node to represent a character in the panel.
 * Source priority:
 *   1) Latest non-error node from nodes store (completed > processing)
 *   2) Fallback to character.imageUrl / character.status coming from /api/characters
 * If everything looks bad → treat as error.
 */
function getDisplayNodeForCharacter(nodes, char) {
    const characterId = char.id
    const list = Object.values(nodes).filter(
        (n) => (n.character_id || n.characterId) === characterId
    )

    if (list.length > 0) {
        const sorted = [...list].sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )

        let chosen = null
        for (const n of sorted) {
            const s = n.status
            if (s === "completed" || s === "processing") {
                chosen = n
                break
            }
        }

        if (!chosen) {
            // All nodes are error/unknown → use latest as error
            return { node: sorted[0], status: "error" }
        }

        const s = chosen.status
        const normalized =
            s === "processing"
                ? "processing"
                : s === "completed"
                    ? "completed"
                    : "error"

        return { node: chosen, status: normalized }
    }

    // No nodes yet in store for this character → fallback to character summary
    const fallbackStatus =
        char.status === "processing"
            ? "processing"
            : char.status === "completed"
                ? "completed"
                : "error"

    if (!char.imageUrl && fallbackStatus === "error") {
        return { node: null, status: "error" }
    }

    // Build a lightweight pseudo-node so the card can use image_url/status
    const pseudoNode = {
        id: `char-${char.id}`,
        character_id: char.id,
        image_url: char.imageUrl,
        status: fallbackStatus,
        created_at: char.timestamp || null,
    }

    return { node: pseudoNode, status: fallbackStatus }
}

export function CharacterPanel({ onCreateNew, onSelectCharacter, isCreating, activeCharacterId }) {
    const { characters, nodes } = useStudioStore()

    return (
        <>
            <aside className="w-[180px] max-xl:w-[140px] shrink-0 pt-12 max-xl:pt-10 px-3 max-xl:px-2 flex flex-col gap-3 h-screen border-r border-white/5 bg-black">
                {/* Outer card container — the rounded box with #131517 */}
                <div className="rounded-[32px] border border-white/[0.06] bg-[#131517] p-2 h-full flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        <div className="flex flex-col items-center gap-2">
                            {/* Create new tile */}
                            <button
                                onClick={onCreateNew}
                                className={cn(
                                    "group relative w-full aspect-square rounded-[24px] overflow-hidden border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.04]",
                                    isCreating 
                                        ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.4)] bg-white/[0.05]" 
                                        : "border-dashed border-white/5 hover:border-[#D4FF00]/30"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 max-xl:w-6 max-xl:h-6 rounded-[10px] flex items-center justify-center transition-colors",
                                    isCreating ? "bg-[#D4FF00]/20" : "bg-white/5"
                                )}>
                                    <Plus className={cn("w-4 h-4 max-xl:w-3 max-xl:h-3 transition-colors", isCreating ? "text-[#D4FF00]" : "text-white/70")} />
                                </div>
                                <span className={cn("text-sm max-xl:text-xs font-normal transition-colors", isCreating ? "text-white" : "text-white/50 group-hover:text-white")}>
                                    Create new
                                </span>
                            </button>

                            {/* Character tiles */}
                            {[...characters]
                                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                                .map((char) => {
                                    const { node: displayNode, status: tileStatus } =
                                        getDisplayNodeForCharacter(nodes, char)
                                    const isActive = activeCharacterId === char.id && !isCreating
                                    
                                    return (
                                        <div
                                            key={char.id}
                                            className="w-full aspect-square shrink-0"
                                        >
                                            <CharacterCard
                                                char={char}
                                                tileNode={displayNode}
                                                tileStatus={tileStatus}
                                                isActive={isActive}
                                                onClick={() => onSelectCharacter(char.id)}
                                            />
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
