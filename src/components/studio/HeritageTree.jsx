"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { cn } from "@/lib/utils"
import {
    User,
    GitBranch,
    Settings,
    Layers,
    Info,
    Play,
    Download,
    Trash2
} from "lucide-react"
import { BasicSettings } from "@/components/builder/BasicSettings"
import { AdvancedSettings } from "@/components/builder/AdvancedSettings"
import { Button } from "@/components/ui/button"

// ─── Tabs Configuration ───────────────────────────────────────────────────────
const TABS = [
    { id: "tree", label: "Tree", icon: GitBranch },
    { id: "basic", label: "Basic", icon: Layers },
    { id: "advanced", label: "Advanced", icon: Settings },
    { id: "info", label: "Info", icon: Info }
]

// ─── Recursive Node Card ──────────────────────────────────────────────────────
const NodeCard = React.memo(function NodeCard({ node, depth, childrenMap, activeNodeId, selectNode }) {
    const isActive = activeNodeId === node.id
    const isRoot = !node.parent_id
    const children = childrenMap[node.id] || []

    return (
        <div className="flex flex-col">
            <div className="flex items-start">
                {/* Connector Lines */}
                {depth > 0 && (
                    <div className="flex shrink-0 self-stretch">
                        {Array.from({ length: depth }).map((_, i) => (
                            <div key={i} className="w-5 shrink-0 relative">
                                <div className="absolute left-3 top-0 bottom-0 w-px bg-white/[0.07]" />
                                {i === depth - 1 && (
                                    <div className={cn(
                                        "absolute left-3 top-6 w-3 h-px",
                                        isActive ? "bg-[#D4FF00]/50" : "bg-white/10"
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Node Card Button */}
                <Button
                    variant="studio-node-card"
                    onClick={() => selectNode(node.id)}
                    className={cn(
                        isActive
                            ? "bg-[#D4FF00]/8 border-[#D4FF00]/40 shadow-[0_0_24px_rgba(212,255,0,0.12)]"
                            : "bg-transparent border-transparent hover:bg-white/4 opacity-50 hover:opacity-100"
                    )}
                >
                    {/* Square Thumbnail */}
                    <div className={cn(
                        "maxh-9 w-9 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-300",
                        isActive
                            ? "border-[#D4FF00] shadow-[0_0_12px_rgba(212,255,0,0.4)]"
                            : "border-white/10 group-hover:border-white/25"
                    )}>
                        {node.image_url ? (
                            <img src={node.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                <User className={cn("w-4 h-4", isActive ? "text-[#D4FF00]" : "text-white/20")} />
                            </div>
                        )}
                    </div>

                    {/* Node Info Text */}
                    <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className={cn(
                            "text-[9px] font-normal uppercase tracking-[0.12em] leading-none",
                            isActive ? "text-[#D4FF00]" : "text-white/30"
                        )}>
                            {isRoot ? "ORIGIN" : "VARIATION"}
                        </span>
                        <span className={cn(
                            "text-[10px] font-normal mt-1 truncate w-full leading-tight",
                            isActive ? "text-white/90" : "text-white/25 group-hover:text-white/50"
                        )}>
                            {node.edit_command || "Initial state"}
                        </span>
                    </div>

                    {/* Branch Indicator */}
                    {children.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                            <GitBranch className="w-2.5 h-2.5 text-white/20" />
                            <span className="text-[8px] text-white/20 font-normal">{children.length}</span>
                        </div>
                    )}
                </Button>
            </div>

            {/* Render Nested Children */}
            {children.length > 0 && (
                <div className="flex flex-col">
                    {children.map(child => (
                        <NodeCard
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            childrenMap={childrenMap}
                            activeNodeId={activeNodeId}
                            selectNode={selectNode}
                        />
                    ))}
                </div>
            )}
        </div>
    )
})

// ─── Main Heritage Tree Sidebar ────────────────────────────────────────────────
export function HeritageTree() {
    const { nodes, activeNodeId, activeCharacterId, removeCharacter } = useStudioStore()

    const activeNode = nodes[activeNodeId]

    const createdAtStr = React.useMemo(() => {
        if (!activeNode?.created_at) return "Unknown"
        return new Date(activeNode.created_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        })
    }, [activeNode?.created_at])

    return (
        <aside className="w-[320px] shrink-0 flex flex-col h-screen border-l border-white/10 bg-[#131517]">

            {/* Sidebar Header */}
            <div className="px-4 pt-5 pb-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_6px_rgba(212,255,0,0.8)]" />
                    <h2 className="text-[11px] font-normal uppercase tracking-[0.25em] text-white/80">
                        Character Studio
                    </h2>
                </div>
            </div>

            {/* Content: Info & Actions only */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-4 space-y-8">
                    {/* Node Metadata Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Info className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-[10px] font-normal uppercase tracking-widest text-white/50">Node Information</span>
                        </div>
                        <div className="bg-white/3 border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-white/30 font-normal uppercase tracking-wider">Status</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-[#D4FF00] shadow-[0_0_4px_#D4FF00]" />
                                    <span className="text-[10px] font-normal text-white uppercase tracking-widest">Ready</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-white/30 font-normal uppercase tracking-wider">Quality</span>
                                <span className="text-[10px] font-normal text-white uppercase tracking-widest">2K High</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-white/30 font-normal uppercase tracking-wider">Created</span>
                                <span className="text-[10px] font-normal text-[#D4FF00] uppercase tracking-widest">{createdAtStr}</span>
                            </div>
                        </div>
                    </div>

                    {/* Node Actions Section */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 px-1">
                            <Settings className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-[10px] font-normal uppercase tracking-widest text-white/50">Actions</span>
                        </div>

                        <Button variant="studio-neon" className="w-full h-14 shadow-[0_0_20px_rgba(212,255,0,0.15)] group rounded-2xl">
                            <Play className="w-4 h-4 fill-black transition-transform group-hover:scale-110" />
                            <span className="text-[11px] font-normal uppercase tracking-widest">Simulate Motion</span>
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="studio-normal"
                                onClick={() => {
                                    if (!activeNode?.image_url) return;
                                    const link = document.createElement("a");
                                    link.href = activeNode.image_url;
                                    link.download = `variation_${activeNodeId.slice(0, 8)}.jpg`;
                                    link.click();
                                }}
                                className="h-12 rounded-xl"
                            >
                                <Download className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80" />
                                <span className="text-[9px] font-normal uppercase tracking-wider">Download</span>
                            </Button>
                            <Button
                                variant="studio-error"
                                onClick={() => {
                                    if (window.confirm("Permanently delete this character and all its variations?")) {
                                        removeCharacter(activeCharacterId)
                                    }
                                }}
                                className="h-12 rounded-xl"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-normal uppercase tracking-wider">Delete</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}

