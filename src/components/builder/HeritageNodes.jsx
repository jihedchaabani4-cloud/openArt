"use client"

import * as React from "react"
import { useCharacterStore } from "@/store/useCharacterStore"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeritageNodes() {
    const { nodes, activeNodeId, setActiveNode } = useCharacterStore()

    // Get all nodes and sort them (or keep them as they are in the store)
    // For a vertical stack like in the image, we might just want to show them in order of creation
    const nodeList = Object.values(nodes).sort((a, b) => {
        // Simple heuristic: root first, then by ID (timestamp)
        if (a.id === "root") return -1
        if (b.id === "root") return 1
        return a.id.localeCompare(b.id)
    })

    return (
        <div className="flex flex-col gap-3 z-30">
            {nodeList.map((node) => {
                const isActive = activeNodeId === node.id
                return (
                    <Button
                        variant="studio-heritage-node"
                        key={node.id}
                        onClick={() => setActiveNode(node.id)}
                        className={cn(
                            isActive
                                ? "border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.4)] scale-105 z-10"
                                : "border-white/10 hover:border-white/30 opacity-60 hover:opacity-100"
                        )}
                    >
                        <div className="w-full h-full bg-[#111111] flex items-center justify-center">
                            {node.imageUrl ? (
                                <img
                                    src={node.imageUrl}
                                    alt={node.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <User className={cn("w-6 h-6", isActive ? "text-lime-400" : "text-white/20")} />
                            )}
                        </div>

                        {/* Glow effect for active node */}
                        {isActive && (
                            <div className="absolute inset-0 bg-lime-400/5 blur-xl pointer-events-none" />
                        )}
                    </Button>
                )
            })}
        </div>
    )
}
