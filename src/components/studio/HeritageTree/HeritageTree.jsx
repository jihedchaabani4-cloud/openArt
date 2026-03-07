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
import { Badge } from "@/components/ui/badge"
import { DeleteNodeDialog } from "../dialogs/DeleteNodeDialog"

// ─── Tabs Configuration ───────────────────────────────────────────────────────
const TABS = [
    { id: "tree", label: "Tree", icon: GitBranch },
    { id: "basic", label: "Basic", icon: Layers },
    { id: "advanced", label: "Advanced", icon: Settings },
    { id: "info", label: "Info", icon: Info }
]

// ─── Recursive Node Card ──────────────────────────────────────────────────────
const NodeCard = React.memo(function NodeCard({ node, depth, childrenMap, activeNodeId, selectNode, isProcessing }) {
    const isActive = activeNodeId === node.id
    const isRoot = !node.parent_id
    const children = childrenMap[node.id] || []

    return (
        <div className={cn("flex flex-col", isProcessing && "pointer-events-none opacity-80")}>
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
                        "max-h-9 w-9 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-300",
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
                            isProcessing={isProcessing}
                        />
                    ))}
                </div>
            )}
        </div>
    )
})

// ─── Main Heritage Tree Sidebar ────────────────────────────────────────────────
export function HeritageTree({ isInsideDialog = false }) {
    const { nodes, activeNodeId, activeCharacterId, characters, removeNode, getFullContext } = useStudioStore()
    const [isPromptExpanded, setIsPromptExpanded] = React.useState(false)
    const [isParamsExpanded, setIsParamsExpanded] = React.useState(false)
    const [isCopied, setIsCopied] = React.useState(false)

    const activeNode = nodes[activeNodeId]
    const isProcessing = activeNode?.status === "processing"
    const characterNodesCount = Object.values(nodes).filter(n => n.character_id === activeCharacterId).length
    
    // Use getFullContext to get the merged DNA from root to this node
    const { mergedDna: dna } = React.useMemo(() => {
        if (!activeNodeId) return { mergedDna: {} }
        return getFullContext(activeNodeId)
    }, [activeNodeId, nodes, getFullContext])

    const metadata = dna.flux_metadata || {}

    // Extract traits for the parameters section
    const traits = React.useMemo(() => {
        if (!dna.identity_dna) return []
        const core = dna.identity_dna.core || {}
        const list = [
            core.character_type,
            core.gender,
            core.ethnicity,
            core.age_stage,
            core.eye_color,
            ...(Array.isArray(core.skin_conditions) ? core.skin_conditions : (core.skin_conditions ? [core.skin_conditions] : []))
        ].filter(v => v && v !== "" && v !== "None" && v !== "Normal")
        return list
    }, [dna])

    const physicalTraits = React.useMemo(() => {
        if (!dna.physical_dna) return []
        const p = dna.physical_dna
        const list = [
            p.body_type,
            p.height,
            p.left_arm !== "Normal arm" ? p.left_arm : null,
            p.right_arm !== "Normal arm" ? p.right_arm : null,
            ...(Array.isArray(p.modifications) ? p.modifications.map(m => typeof m === 'string' ? m : m.desc) : (p.modifications ? [p.modifications] : []))
        ].filter(v => v && v !== "" && v !== "None" && v !== "Normal")
        return list
    }, [dna])

    const createdAtStr = React.useMemo(() => {
        if (!activeNode?.created_at) return "Unknown"
        return new Date(activeNode.created_at).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
        })
    }, [activeNode?.created_at])

    const statusColor = 
        activeNode?.status === "completed" ? "bg-[#D4FF00]" :
        activeNode?.status === "processing" ? "bg-yellow-400" : "bg-red-500"

    const statusText = 
        activeNode?.status === "completed" ? "Ready" :
        activeNode?.status === "processing" ? "Generating" : "Error"

    return (
        <aside 
            className="max-w-[450px] w-full p-4 w-[30%] shrink-0 flex flex-col h-screen min-h-0 cursor-auto pointer-events-auto font-sans"
        >
            {/* Content: Info & Actions only */}
            <div className="flex-1 bg-[#131517] rounded-2xl border border-[#1C1F23] overflow-y-auto scrollbar-hide">
                <div className="p-4 space-y-8">
                    {/* Node Metadata Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Info className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-[12px] font-normal uppercase tracking-[0.08em] text-white/40">Node Information</span>
                        </div>
                        <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
                            <div className="flex justify-between items-center py-[14px] px-4">
                                <span className="text-[14px] text-white/30 font-normal">Status</span>
                                <div className="flex items-center gap-1.5">
                                    <div className={cn(
                                        "w-1 h-1 rounded-full shadow-[0_0_4px_currentColor]", 
                                        isProcessing ? "text-yellow-400 animate-pulse" : (activeNode?.status === "completed" ? "text-[#D4FF00]" : "text-red-500")
                                    )} style={{ backgroundColor: 'currentColor' }} />
                                    <span className={cn(
                                        "text-[14px] font-normal", 
                                        isProcessing ? "text-yellow-400" : (activeNode?.status === "completed" ? "text-white" : "text-red-500")
                                    )}>
                                        {isProcessing ? "Generating..." : statusText}
                                    </span>
                                </div>
                            </div>
                    
                            <div className="flex justify-between items-center py-[14px] px-4">
                                <span className="text-[14px] text-white/30 font-normal">Seed</span>
                                <span className="text-[14px] font-normal text-white tracking-tight">{metadata.seed || "Random"}</span>
                            </div>
                            {metadata.pulid_weight && (
                                <div className="flex justify-between items-center py-[14px] px-4">
                                    <span className="text-[14px] text-white/30 font-normal">Identity Strength</span>
                                    <span className="text-[14px] font-normal text-white">{(metadata.pulid_weight * 100).toFixed(0)}%</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-[14px] px-4">
                                <span className="text-[14px] text-white/30 font-normal">Created</span>
                                <span className="text-[14px] font-normal text-[#D4FF00]">{createdAtStr}</span>
                            </div>
                        </div>
                    </div>

                    {/* Prompt Section (Only for Variations) */}
                    {activeNode?.edit_command && activeNode.parent_id && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <svg className="!size-4 text-white/40" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3.75 5C3.33579 5 3 5.33579 3 5.75C3 6.16421 3.33579 6.5 3.75 6.5H20.25C20.6642 6.5 21 6.16421 21 5.75C21 5.33579 20.6642 5 20.25 5H3.75Z" fill="currentColor"></path>
                                        <path d="M17.6708 10.1646C17.5438 9.9105 17.2841 9.75 17 9.75C16.7159 9.75 16.4562 9.9105 16.3292 10.1646L14.941 12.941L12.1646 14.3292C11.9105 14.4562 11.75 14.7159 11.75 15C11.75 15.2841 11.9105 15.5438 12.1646 15.6708L14.941 17.059L16.3292 19.8354C16.4562 20.0895 16.7159 20.25 17 20.25C17.2841 20.25 17.5438 20.0895 17.6708 19.8354L19.059 17.059L21.8354 15.6708C22.0895 15.5438 22.25 15.2841 22.25 15C22.25 14.7159 22.0895 14.4562 21.8354 14.3292L19.059 12.941L17.6708 10.1646Z" fill="currentColor"></path>
                                        <path d="M3.75 11.25C3.33579 11.25 3 11.5858 3 12C3 12.4142 3.33579 12.75 3.75 12.75H9.25C9.66421 12.75 10 12.4142 10 12C10 11.5858 9.66421 11.25 9.25 11.25H3.75Z" fill="currentColor"></path>
                                        <path d="M3.75 17.5C3.33579 17.5 3 17.8358 3 18.25C3 18.6642 3.33579 19 3.75 19H7.25C7.66421 19 8 18.6642 8 18.25C8 17.8358 7.66421 17.5 7.25 17.5H3.75Z" fill="currentColor"></path>
                                    </svg>
                                    <span className="text-[12px] font-normal uppercase tracking-[0.08em] text-white/40">Prompt</span>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const textToCopy = activeNode?.edit_command || metadata.generated_prompt;
                                        navigator.clipboard.writeText(textToCopy);
                                        setIsCopied(true);
                                        setTimeout(() => setIsCopied(false), 2000);
                                    }}
                                    className={cn(
                                        "text-[12px] font-normal uppercase tracking-wider transition-all duration-200 border rounded-lg px-2.5 py-1.5",
                                        isCopied 
                                            ? "text-white border-white/20 bg-white/10" 
                                            : "text-[#D4FF00] border-[#D4FF00]/20 bg-[#D4FF00]/5 hover:text-white"
                                    )}
                                >
                                    {isCopied ? "Copied" : "Copy"}
                                </button>
                            </div>
                            
                            <div className="bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
                                <div className="py-2 px-4">
                                    <div className={cn(
                                        "overflow-y-auto scrollbar-hide transition-all duration-300",
                                        (activeNode?.edit_command?.length > 100)
                                            ? (isPromptExpanded ? "max-h-[500px]" : "max-h-[100px]")
                                            : "max-h-none"
                                    )}>
                                        <p className="text-[14px] leading-relaxed text-white/60 break-words whitespace-pre-wrap font-normal">
                                            "{activeNode?.edit_command}"
                                        </p>
                                    </div>
                                </div>
                                {activeNode?.edit_command?.length > 100 && (
                                    <button 
                                        type="button" 
                                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                                        className="py-2.5 px-4 flex items-center gap-1 border-t border-white/5 w-full cursor-pointer hover:bg-white/5 transition-colors group"
                                    >
                                        <span className="text-[11px] font-normal uppercase tracking-wider text-white/30 group-hover:text-white/60">
                                            {isPromptExpanded ? "Show less" : "Show full prompt"}
                                        </span>
                                        <svg 
                                            className={cn(
                                                "size-4 ml-auto transition-transform duration-300 text-white/20 group-hover:text-white/40",
                                                isPromptExpanded ? "rotate-180" : "rotate-0"
                                            )} 
                                            aria-hidden="true" 
                                            width="24" 
                                            height="24" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M20 9L12.7071 16.2929C12.3166 16.6834 11.6834 16.6834 11.2929 16.2929L4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Character Parameters (Always show if data exists) */}
                    {(traits.length > 0 || physicalTraits.length > 0) && (
                        <section className="surface-section w-full !gap-0">
                            <div className="surface-section-header py-1">
                                <div className="surface-section-header-left">
                                    <div className="flex items-center gap-2">
                                        <div className="size-4 text-white/40">
                                            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M11 2C15.2174 2 18.6702 5.26397 18.9756 9.40332C18.9892 9.58687 19.0454 9.76579 19.1475 9.91895L20.832 12.4453C21.1262 12.8869 21.024 13.4814 20.5996 13.7998L19.4004 14.6992C19.1485 14.888 19 15.1842 19 15.499V17C19 18.1046 18.1046 19 17 19H14V21C14 21.5523 13.5523 22 13 22H7C6.44772 22 6 21.5523 6 21V16.7217C5.99988 16.4185 5.8596 16.1341 5.63477 15.9307C4.01868 14.4681 3 12.3538 3 10C3 5.58172 6.58172 2 11 2ZM11 6.5C10.7891 6.5 10.6001 6.63034 10.5244 6.82715L9.93457 8.36035C9.83299 8.62433 9.62433 8.83299 9.36035 8.93457L7.82715 9.52441C7.63034 9.60011 7.5 9.78914 7.5 10C7.5 10.2109 7.63034 10.3999 7.82715 10.4756L9.36035 11.0654C9.62433 11.167 9.83299 11.3757 9.93457 11.6396L10.5244 13.1729C10.6001 13.3697 10.7891 13.5 11 13.5C11.2109 13.5 11.3999 13.3697 11.4756 13.1729L12.0654 11.6396C12.167 11.3757 12.3757 11.167 12.6396 11.0654L14.1729 10.4756C14.3697 10.3999 14.5 10.2109 14.5 10C14.5 9.78914 14.3697 9.60011 14.1729 9.52441L12.6396 8.93457C12.3757 8.83299 12.167 8.62433 12.0654 8.36035L11.4756 6.82715C11.3999 6.63034 11.2109 6.5 11 6.5Z" fill="currentColor"></path>
                                            </svg>
                                        </div>
                                        <p className="text-white/40 font-normal text-[12px] uppercase tracking-wider">Character parameters</p>
                                    </div>
                                </div>
                            </div>

                            <div className="surface-section-item-container mt-1">
                                <div className="surface-section-item p-0 h-auto flex-col text-sm text-white/60 bg-white/3 border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="p-3 w-full">
                                        <div className="flex flex-col min-h-0 gap-3">
                                            <div className="flex flex-wrap gap-1">
                                                {traits.map((t, i) => (
                                                    <Badge key={i} variant="studio" className="rounded-lg px-2 py-1 text-xs font-normal">
                                                        {t}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <div className={cn(
                                                "flex flex-col gap-3 overflow-hidden transition-all duration-300",
                                                isParamsExpanded ? "opacity-100 h-auto" : "opacity-0 h-0 pointer-events-none"
                                            )}>
                                                <div className="w-full h-px bg-white/5"></div>
                                                <div className="flex items-center gap-1">
                                                    <svg className="size-4 text-white/40" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 1C10.3431 1 9 2.34315 9 4C9 5.65685 10.3431 7 12 7C13.6569 7 15 5.65685 15 4C15 2.34315 13.6569 1 12 1Z" fill="currentColor"></path>
                                                        <path d="M7.75 8C6.7835 8 6 8.7835 6 9.75V15.25C6 16.2165 6.7835 17 7.75 17H8V21.75C8 22.4404 8.55964 23 9.25 23H14.75C15.4404 23 16 22.4404 16 21.75V17H16.25C17.2165 17 18 16.2165 18 15.25V9.75C18 8.7835 17.2165 8 16.25 8H7.75Z" fill="currentColor"></path>
                                                    </svg>
                                                    <span className="text-[14px] font-normal text-white/60">Body</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {physicalTraits.map((t, i) => (
                                                        <Badge key={i} variant="studio" className="rounded-lg px-2 py-1 text-xs font-normal">
                                                            {t}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        type="button" 
                                        onClick={() => setIsParamsExpanded(!isParamsExpanded)}
                                        className="py-2 px-4 flex items-center gap-1 border-t border-white/5 w-full cursor-pointer hover:bg-white/5 transition-colors group"
                                    >
                                        <span className="flex text-xs font-normal text-white/30 group-hover:text-white/60">
                                            {isParamsExpanded ? "Show less" : "Show more"}
                                        </span>
                                        <svg 
                                            className={cn(
                                                "size-4 ml-auto transition-transform duration-300 text-white/20 group-hover:text-white/40",
                                                isParamsExpanded ? "rotate-180" : "rotate-0"
                                            )} 
                                            aria-hidden="true" 
                                            width="24" 
                                            height="24" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path d="M20 9L12.7071 16.2929C12.3166 16.6834 11.6834 16.6834 11.2929 16.2929L4 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Node Actions Section */}
                    <div className={cn("space-y-4 pt-2 transition-opacity duration-300", isProcessing && "opacity-50 pointer-events-none")}>
                        <div className="flex items-center gap-2 px-1">
                            <Settings className="w-3.5 h-3.5 text-white/40" />
                            <span className="text-[12px] font-normal uppercase tracking-[0.08em] text-white/40">Actions</span>
                        </div>

                        <Button 
                            variant="studio-neon" 
                            disabled={isProcessing}
                            className="w-full h-[48px] px-6 shadow-[0_0_20px_rgba(212,255,0,0.15)] group rounded-2xl"
                        >
                            <Play className="w-4 h-4 fill-black transition-transform group-hover:scale-110" />
                            <span className="text-[14px] font-normal uppercase tracking-widest">Simulate Motion</span>
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="studio-normal"
                                disabled={isProcessing}
                                onClick={() => {
                                    if (!activeNode?.image_url) return;
                                    const link = document.createElement("a");
                                    link.href = activeNode.image_url;
                                    link.download = `variation_${activeNodeId.slice(0, 8)}.jpg`;
                                    link.click();
                                }}
                                className="h-[48px] px-4 rounded-xl"
                            >
                                <Download className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80" />
                                <span className="text-[14px] font-normal uppercase tracking-wider">Download</span>
                            </Button>
                            <DeleteNodeDialog 
                                itemName="node" 
                                isLastNode={characterNodesCount <= 1}
                                onConfirm={() => removeNode(activeNodeId)}
                            >
                                <Button
                                    variant="studio-error"
                                    disabled={isProcessing}
                                    className="h-[48px] px-4 rounded-xl flex-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="text-[14px] font-normal uppercase tracking-wider">Delete</span>
                                </Button>
                            </DeleteNodeDialog>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
