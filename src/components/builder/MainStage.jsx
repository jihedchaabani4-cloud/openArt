"use client"

import * as React from "react"
/** @jsxImportSource react */
import { useStudioStore } from "@/store/useStudioStore"
import { Sparkles, Plus, Image as ImageIcon, Zap, User, AlertCircle, RefreshCcw, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
// ─── Image-only node box (vertical column, no text) ──────────────────────────
const NodeCard = React.memo(function NodeCard({ node, childrenMap, activeNodeId, selectNode }) {
    const isActive = activeNodeId === node.id
    const children = childrenMap[node.id] || []

    return (
        <>
            <button
                onClick={() => selectNode(node.id)}
                className={cn(
                    "relative shrink-0 w-12 h-12 rounded-lg overflow-hidden focus:outline-none transition-all duration-300 border-2",
                    isActive
                        ? "border-[#D4FF00] shadow-[0_0_10px_rgba(212,255,0,0.6)] scale-110 z-10"
                        : "border-white/10 opacity-30 hover:opacity-80 hover:border-white/30"
                )}
            >
                {(node.status === "completed" && node.imageUrl) ? (
                    <img src={node.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className={cn(
                        "w-full h-full flex flex-col items-center justify-center gap-1.5 px-2",
                        (node.status === "failed" || node.status === "error") ? "bg-[#5A2020]" : "bg-white/5"
                    )}>
                        {node.status === "processing" ? (
                            <div className="w-3 h-3 border-2 border-[#D4FF00]/40 border-t-[#D4FF00] rounded-full animate-spin" />
                        ) : (node.status === "failed" || node.status === "error") ? (
                            <span className="text-[10px] font-black text-white/90">ERR</span>
                        ) : (
                            <AlertCircle className="w-4 h-4 text-red-500/40" />
                        )}
                    </div>
                )}
                {node.status === "processing" && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="w-full h-full bg-linear-to-t from-[#D4FF00]/10 to-transparent animate-pulse" />
                    </div>
                )}
                {isActive && <div className="absolute inset-0 bg-[#D4FF00]/8 pointer-events-none" />}
            </button>

            {/* Children — same column, below */}
            {children.map(child => (
                <NodeCard
                    key={child.id}
                    node={child}
                    childrenMap={childrenMap}
                    activeNodeId={activeNodeId}
                    selectNode={selectNode}
                />
            ))}
        </>
    )
})


// ─── Main Stage ───────────────────────────────────────────────────────────────
export function MainStage() {
    const {
        nodes, activeNodeId, activeCharacterId,
        generateBranch, getFullContext, selectNode
    } = useStudioStore()

    const [instruction, setInstruction] = React.useState("")
    const [isGenerating, setIsGenerating] = React.useState(false)
    const inputRef = React.useRef(null)

    const activeNode = nodes[activeNodeId]

    // Context tags
    const fullContext = React.useMemo(() => {
        if (!activeNodeId) return { mergedData: {}, prompts: [], path: [] }
        return getFullContext(activeNodeId)
    }, [activeNodeId, nodes])

    const contextTags = React.useMemo(() => {
        return Object.entries(fullContext.mergedData)
            .filter(([, v]) => v && v !== "" && v !== 0 && !(Array.isArray(v) && v[0] === 0))
            .slice(0, 6)
    }, [fullContext])

    // Heritage tree data (O(n))
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

    const handleGenerate = async () => {
        if (!instruction.trim() || isGenerating || activeNode?.status !== "completed") return
        setIsGenerating(true)
        await generateBranch({ instruction: instruction.trim() })
        setInstruction("")
        setIsGenerating(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate() }
    }

    const canGenerate = activeNode?.status === "completed"

    return (
        <div className="flex-1 flex flex-col h-full bg-black relative overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer { 
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}} />

            {/* Main Stage Container (Fixed Viewport) */}
            <div className="flex-1 flex flex-col items-center p-8 min-h-0 overflow-hidden bg-black">

                {/* ── Visual Section: History + Current Image ── */}
                <div className="flex-1 w-full flex items-center justify-center min-h-0 gap-6 mb-8">

                    {/* Heritage Mini-Strip */}
                    <div className="flex flex-col gap-3 py-1 px-2 shrink-0 h-full max-h-full overflow-y-auto scrollbar-hide w-16">
                        {roots.map(root => (
                            <NodeCard
                                key={root.id}
                                node={root}
                                childrenMap={childrenMap}
                                activeNodeId={activeNodeId}
                                selectNode={selectNode}
                            />
                        ))}
                    </div>

                    {/* Portrait Container (Dynamic sizing) */}
                    <div className="relative h-full max-h-full aspect-432/740 rounded-[32px] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] bg-[#0a0a0a]">
                        {(activeNode?.status === "completed" && activeNode?.imageUrl) ? (
                            <img src={activeNode.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : activeNode?.status === "processing" ? (
                            <div className="w-full h-full bg-[#0d0d0d] flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-[#D4FF00]/10 border-t-[#D4FF00] rounded-full animate-spin" />
                                <span className="text-[10px] font-black text-[#D4FF00]/60 uppercase tracking-widest">Generating...</span>
                            </div>
                        ) : (activeNode?.status === "failed" || activeNode?.status === "error") ? (
                            <div className="w-full h-full bg-[#0d0d0d] flex flex-col items-center justify-center relative">
                                {/* Error Content Placeholder (Dark screen) */}
                                <AlertCircle className="w-12 h-12 text-white/5" />

                                {/* Badges at top-left */}
                                <div className="absolute top-6 left-6 flex items-center gap-3">
                                    <div className="flex items-center gap-2 bg-[#FF3B30] px-3 py-1.5 rounded-full shadow-lg">
                                        <div className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center">
                                            <Plus className="w-3 h-3 text-white rotate-45" />
                                        </div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Failed</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full">
                                        <AlertCircle className="w-3.5 h-3.5 text-white/60" />
                                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Credits refunded</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
                                <ImageIcon className="w-8 h-8 text-white/5" />
                                <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Ready</span>
                            </div>
                        )}

                        {/* Gen Badge */}
                        {fullContext.path && fullContext.path.length > 1 && (
                            <div className="absolute top-4 right-4">
                                <div className="px-2.5 py-1 rounded-full bg-[#D4FF00]/90 shadow-xl">
                                    <span className="text-[8px] font-black text-black uppercase tracking-wider">Gen {fullContext.path.length - 1}</span>
                                </div>
                            </div>
                        )}

                        {/* Tags Overlay */}
                        {contextTags.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-12 bg-linear-to-t from-black via-black/40 to-transparent">
                                <div className="flex flex-wrap gap-1.5">
                                    {contextTags.map(([key, value]) => (
                                        <div key={key} className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/5 text-[9px] font-bold text-white/40 uppercase tracking-wider">
                                            {String(Array.isArray(value) ? value[0] : value)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Compact Control Section: Input + Button in one bar ── */}
                <div className="w-full max-w-2xl shrink-0 mb-6 px-4 pb-4">
                    <div className={cn(
                        "relative flex flex-col bg-[#121212]/90 backdrop-blur-3xl rounded-[28px] border transition-all duration-300 shadow-2xl p-2",
                        canGenerate ? "border-white/10 focus-within:border-[#D4FF00]/30" : "border-white/5 opacity-50 grayscale"
                    )}>
                        <Textarea
                            ref={inputRef}
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={canGenerate ? "Type to customize character" : "Select a completed version to edit"}
                            disabled={!canGenerate || isGenerating}
                            className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-white/70 placeholder:text-white/20 px-4 pt-3 min-h-[60px] resize-none scrollbar-hide focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none ring-0"
                        />

                        <div className="flex items-center justify-between px-2 pb-1.5 mt-1">
                            {/* Model Badge */}
                            <Button variant="ghost" className="h-8 pl-2 pr-3 rounded-full bg-white/3 hover:bg-white/5 border border-white/5 flex items-center gap-2 group transition-all hover:text-white">
                                <div className="w-4 h-4 rounded-full bg-[#D4FF00]/20 flex items-center justify-center">
                                    <Zap className="w-2.5 h-2.5 text-[#D4FF00] fill-[#D4FF00]" />
                                </div>
                                <span className="text-[10px] font-bold text-white/50 group-hover:text-white/80 transition-colors uppercase tracking-wider">AI Influencer v1</span>
                                <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/40" />
                            </Button>

                            {/* Generate Button */}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!instruction.trim() || isGenerating || !canGenerate}
                                    variant="studio-neon"
                                    className="h-10 px-6 rounded-2xl flex items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span className="text-[11px] font-black uppercase tracking-widest">EDIT</span>
                                            <Sparkles className="w-3.5 h-3.5 fill-black" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
