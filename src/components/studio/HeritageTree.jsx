"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { cn } from "@/lib/utils"
import { User, GitBranch, Settings, Layers } from "lucide-react"
import { BasicSettings } from "@/components/builder/BasicSettings"
import { AdvancedSettings } from "@/components/builder/AdvancedSettings"

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
    { id: "tree", label: "Tree", icon: GitBranch },
    { id: "basic", label: "Basic", icon: Layers },
    { id: "advanced", label: "Advanced", icon: Settings },
]

// ─── Memoized recursive node card ─────────────────────────────────────────────
const NodeCard = React.memo(function NodeCard({ node, depth, childrenMap, activeNodeId, selectNode }) {
    const isActive = activeNodeId === node.id
    const isRoot = !node.parentId
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

                {/* Node Card */}
                <button
                    onClick={() => selectNode(node.id)}
                    className={cn(
                        "flex-1 min-w-0 group relative mb-2 p-2 rounded-lg transition-all duration-200 flex items-center gap-3 border focus:outline-none",
                        isActive
                            ? "bg-[#D4FF00]/8 border-[#D4FF00]/40 shadow-[0_0_24px_rgba(212,255,0,0.12)]"
                            : "bg-transparent border-transparent hover:bg-white/4 opacity-50 hover:opacity-100"
                    )}
                >
                    {/* Circular Thumbnail */}
                    <div className={cn(
                        "h-9 w-9 rounded-full overflow-hidden shrink-0 border-2 transition-all duration-300",
                        isActive
                            ? "border-[#D4FF00] shadow-[0_0_12px_rgba(212,255,0,0.4)]"
                            : "border-white/10 group-hover:border-white/25"
                    )}>
                        {node.imageUrl ? (
                            <img src={node.imageUrl} alt={isRoot ? "Origin" : "Variation"} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                <User className={cn("w-4 h-4", isActive ? "text-[#D4FF00]" : "text-white/20")} />
                            </div>
                        )}
                    </div>

                    {/* Text */}
                    <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className={cn(
                            "text-[9px] font-black uppercase tracking-[0.12em] leading-none",
                            isActive ? "text-[#D4FF00]" : "text-white/30"
                        )}>
                            {isRoot ? "ORIGIN" : "VARIATION"}
                        </span>
                        <span className={cn(
                            "text-[10px] font-medium mt-1 truncate w-full leading-tight",
                            isActive ? "text-white/90" : "text-white/25 group-hover:text-white/50"
                        )}>
                            {node.prompt || "Initial state"}
                        </span>
                    </div>

                    {/* Branch count */}
                    {children.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                            <GitBranch className="w-2.5 h-2.5 text-white/20" />
                            <span className="text-[8px] text-white/20 font-bold">{children.length}</span>
                        </div>
                    )}

                    {isActive && <div className="absolute inset-0 rounded-lg bg-[#D4FF00]/3 pointer-events-none" />}
                </button>
            </div>

            {/* Recursive Children */}
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

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function HeritageTree() {
    const { nodes, activeNodeId, activeCharacterId, selectNode } = useStudioStore()
    const [activeTab, setActiveTab] = React.useState("tree")

    // O(n) pre-computation
    const { characterNodes, childrenMap, roots } = React.useMemo(() => {
        const allNodes = Object.values(nodes)
        const characterNodes = allNodes.filter(n => n.characterId === activeCharacterId)
        const childrenMap = {}
        characterNodes.forEach(node => {
            if (!childrenMap[node.id]) childrenMap[node.id] = []
            if (node.parentId) {
                if (!childrenMap[node.parentId]) childrenMap[node.parentId] = []
                childrenMap[node.parentId].push(node)
            }
        })
        Object.keys(childrenMap).forEach(id => {
            childrenMap[id].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        })
        const roots = characterNodes.filter(n => !n.parentId)
        roots.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        return { characterNodes, childrenMap, roots }
    }, [nodes, activeCharacterId])

    return (
        <aside className="w-[320px] shrink-0 flex flex-col h-screen border-l border-white/10 bg-black">

            {/* ── Header ── */}
            <div className="px-4 pt-5 pb-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_6px_rgba(212,255,0,0.8)]" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/80">
                        Character Studio
                    </h2>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/5">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.label}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.12em] transition-all duration-200 focus:outline-none",
                                    isActive
                                        ? "bg-[#D4FF00] text-black shadow-[0_0_10px_rgba(212,255,0,0.25)]"
                                        : "text-white/30 hover:text-white/60"
                                )}
                            >
                                <tab.icon className="w-3 h-3" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Tab: TREE ── */}
            {activeTab === "tree" && (
                <>
                    {/* Node count */}
                    <div className="px-4 py-2 border-b border-white/5 shrink-0 flex items-center justify-between">
                        <span className="text-[9px] text-white/15 uppercase font-bold tracking-widest">
                            {characterNodes.length} {characterNodes.length === 1 ? "node" : "nodes"}
                        </span>
                        <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-[#D4FF00]/50" />
                            <div className="w-1 h-1 rounded-full bg-[#D4FF00]/30" />
                            <div className="w-1 h-1 rounded-full bg-[#D4FF00]/15" />
                        </div>
                    </div>

                    {/* Scrollable Tree */}
                    <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide" style={{ overflowX: "hidden" }}>
                        {roots.length === 0 ? (
                            <div className="flex items-center justify-center h-32 opacity-20">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">No nodes</span>
                            </div>
                        ) : (
                            roots.map(root => (
                                <NodeCard
                                    key={root.id}
                                    node={root}
                                    depth={0}
                                    childrenMap={childrenMap}
                                    activeNodeId={activeNodeId}
                                    selectNode={selectNode}
                                />
                            ))
                        )}
                    </div>
                </>
            )}

            {/* ── Tab: BASIC ── */}
            {activeTab === "basic" && (
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <BasicSettings />
                </div>
            )}

            {/* ── Tab: ADVANCED ── */}
            {activeTab === "advanced" && (
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <AdvancedSettings />
                </div>
            )}
        </aside>
    )
}
