"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function StudioTimeline() {
    const { nodes, activeNodeId, selectNode, activeCharacterId } = useStudioStore()

    const characterNodes = Object.values(nodes).filter(n => n.characterId === activeCharacterId)
    const roots = characterNodes.filter(node => !node.parentId)

    const renderTree = (node, depth = 0) => {
        const children = characterNodes.filter(n => n.parentId === node.id)
        const isActive = activeNodeId === node.id

        return (
            <div key={node.id} className="flex flex-col">
                <div className="flex items-start">
                    {/* Connector Lines */}
                    {depth > 0 && (
                        <div className="flex shrink-0">
                            {Array.from({ length: depth }).map((_, i) => (
                                <div key={i} className="w-6 h-full border-l border-white/10 relative">
                                    {i === depth - 1 && (
                                        <div className={cn(
                                            "absolute top-6 left-0 w-4 h-px",
                                            isActive ? "bg-[#D4FF00]/50" : "bg-white/10"
                                        )} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Node Thumbnail */}
                    <Button
                        variant="studio-timeline-card"
                        onClick={() => selectNode(node.id)}
                        className={cn(
                            "mb-3 rounded-2xl",
                            isActive
                                ? "bg-[#D4FF00]/10 border-[#D4FF00]/50 shadow-[0_0_20px_rgba(212,255,0,0.15)] scale-[1.02]"
                                : "bg-transparent border-transparent hover:bg-white/5 opacity-50 hover:opacity-100"
                        )}
                    >
                        <div className={cn(
                            "h-12 w-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-300",
                            isActive ? "border-[#D4FF00] shadow-[0_0_10px_rgba(212,255,0,0.3)]" : "border-white/10 group-hover:border-white/20"
                        )}>
                            {node.imageUrl ? (
                                <img src={node.imageUrl} alt={node.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                    <User className={cn("w-5 h-5", isActive ? "text-[#D4FF00]" : "text-white/20")} />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-start min-w-0">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.1em]",
                                isActive ? "text-[#D4FF00]" : "text-white/40"
                            )}>
                                {node.parentId ? "VARIATION" : "ORIGIN"}
                            </span>
                            <span className="text-[9px] text-white/20 truncate w-full uppercase font-bold tracking-tight mt-0.5">
                                {node.prompt || "Initial state"}
                            </span>
                        </div>
                    </Button>
                </div>

                {children.length > 0 && (
                    <div className="flex flex-col">
                        {children.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map(child => renderTree(child, depth + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide bg-[#000000]">
            <div className="space-y-1">
                {[...roots].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map(root => renderTree(root))}
            </div>
        </div>
    )
}
