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

    // Global character status (from /api/characters or manually set in store)
    const characterIsProcessing = char.status === "processing"

    if (list.length > 0) {
        // Priority 1: Specifically the root_node_id if it exists in the nodes store
        let chosen = null
        if (char.root_node_id) {
            chosen = list.find(n => n.id === char.root_node_id && n.status === "completed" && n.image_url)
        }

        // Priority 2: Sort by oldest first to pick the "original" or first generated node
        if (!chosen) {
            const sorted = [...list].sort(
                (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
            )

            for (const n of sorted) {
                const s = n.status
                if (s === "completed" && n.image_url) {
                    chosen = n
                    break
                }
            }

            // If no completed node with image, pick the first processing one
            if (!chosen) {
                chosen = sorted.find(n => n.status === "processing")
            }

            if (!chosen) {
                // All nodes are error/unknown → use oldest as fallback
                return { node: sorted[0], status: "error" }
            }
        }

        // Final status determination:
        // If the character is globally "processing" (e.g. a new edit is in progress),
        // we show the "processing" status regardless of which image we use for display.
        const s = chosen.status
        const normalized = characterIsProcessing
            ? "processing"
            : s === "processing"
                ? "processing"
                : s === "completed"
                    ? "completed"
                    : "error"

        return { node: chosen, status: normalized }
    }

    // No nodes yet in store for this character → fallback to character summary
    const fallbackStatus = characterIsProcessing
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
            <aside className="w-[180px] max-xl:w-[140px] shrink-0 p-4 flex flex-col gap-3 h-screen border-r border-white/5 bg-black">
                {/* Outer card container — the rounded box with #0F1113 */}
                <div className="rounded-[32px] border bg-[#1c1e20] p-2 h-full flex-1 outline-[#d9d9d90a] outline-2 outline-offset-8 flex flex-col">
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        <div className="flex flex-col items-stretch gap-2">
                            {/* Create new tile */}
                            <button
                                onClick={onCreateNew}
                                className={cn(
                                    "group relative w-full aspect-square shrink-0 rounded-[24px] overflow-hidden border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 bg-white/[0.02] hover:bg-white/[0.04]",
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
                                        <CharacterCard
                                            key={char.id}
                                            char={char}
                                            tileNode={displayNode}
                                            tileStatus={tileStatus}
                                            isActive={isActive}
                                            onClick={() => onSelectCharacter(char.id)}
                                        />
                                    )
                                })}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
