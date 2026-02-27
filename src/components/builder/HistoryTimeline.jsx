"use client"

import * as React from "react"
import { useCharacterStore } from "@/store/useCharacterStore"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HistoryTimeline() {
    const { nodes, activeNodeId, setActiveNode } = useCharacterStore()

    // Helper to build the tree structure from flat nodes object
    const roots = Object.values(nodes).filter(node => !node.parentId)

    const renderTree = (node, depth = 0) => {
        const children = Object.values(nodes).filter(n => n.parentId === node.id)
        const isActive = activeNodeId === node.id

        return (
            <div key={node.id} className="flex flex-col">
                {/* Node Row */}
                <div className="flex items-start">
                    {/* Connector Lines (Indentation) */}
                    {depth > 0 && (
                        <div className="flex shrink-0">
                            {Array.from({ length: depth }).map((_, i) => (
                                <div key={i} className="w-6 h-full border-l border-white/10 relative">
                                    {isActive && i === depth - 1 ? (
                                        <div className="absolute top-6 left-0 w-4 h-px bg-lime-400/30" />
                                    ) : i === depth - 1 ? (
                                        <div className="absolute top-6 left-0 w-4 h-px bg-white/10" />
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Card */}
                    <Button
                        variant="studio-timeline-card"
                        onClick={() => setActiveNode(node.id)}
                        className={cn(
                            isActive
                                ? "bg-lime-400/10 border border-lime-400/50 shadow-[0_0_20px_rgba(163,230,53,0.1)]"
                                : "bg-transparent border border-transparent hover:bg-white/5 opacity-40 hover:opacity-100"
                        )}
                    >
                        {/* Circular Thumbnail */}
                        <div className={cn(
                            "h-10 w-10 rounded-full overflow-hidden shrink-0 border-2 transition-all duration-300",
                            isActive ? "border-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.3)] scale-105" : "border-white/10 group-hover:border-white/20"
                        )}>
                            {node.imageUrl ? (
                                <img src={node.imageUrl} alt={node.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#111111] flex items-center justify-center">
                                    <User className={cn("w-4 h-4", isActive ? "text-lime-400" : "text-white/20")} />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-start min-w-0">
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.15em] transition-colors",
                                isActive ? "text-lime-400" : "text-white/60"
                            )}>
                                {node.parentId ? "VARIATION" : "ORIGIN"}
                            </span>
                            <span className="text-[8px] text-white/20 truncate w-full uppercase font-bold tracking-tight">
                                {node.prompt || "Initial creation"}
                            </span>
                        </div>
                    </Button>
                </div>

                {/* Recursively render children */}
                {children.length > 0 && (
                    <div className="flex flex-col ml-0">
                        {children.map(child => renderTree(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide bg-black">
            <div className="space-y-1">
                {roots.map(root => renderTree(root))}
            </div>
        </div>
    )
}
