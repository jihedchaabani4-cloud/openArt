"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    User,
    Info,
    Play,
    Video,
    RotateCcw,
    LayoutGrid,
    Target,
    Download,
    Heart,
    Share2,
    MoreHorizontal,
    ChevronDown,
    ChevronUp,
    Smile,
    Accessibility,
    Sparkles as StyleIcon,
    Trash2
} from "lucide-react"

export function CharacterParameters() {
    const { nodes, activeNodeId, getFullContext, activeCharacterId, removeCharacter } = useStudioStore()
    const { mergedData } = getFullContext(activeNodeId)
    const activeNode = nodes[activeNodeId]

    // Format date
    const createdAtStr = React.useMemo(() => {
        if (!activeNode?.timestamp) return "Unknown"
        return new Date(activeNode.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        })
    }, [activeNode?.timestamp])

    const [isExpanded, setIsExpanded] = React.useState(false)

    // Extract tags from mergedData
    const categories = React.useMemo(() => {
        if (!mergedData) return {}

        const config = {
            general: ["Character_Type", "Gender", "Ethnicity_-_Origin_Base", "skin", "Eye_Color"],
            face: ["Eyes_-_Type", "Eyes_-_Details", "Mouth_&_Teeth", "Ears", "Horns", "Face_Skin_Material", "Surface_Pattern"],
            body: ["Body_Type", "Left_Arm", "Right_Arm", "Left_Leg", "Right_Leg"],
            style: ["Hair_-_Head_Growth", "Accessories_&_Markings", "Rendering_Style"]
        }

        const getTags = (keys) => keys
            .map(key => mergedData[key])
            .filter(val => val && val !== "" && val !== "None" && !(Array.isArray(val) && val[0] === 0))
            .map(val => Array.isArray(val) ? val[0] : val)

        return {
            general: getTags(config.general),
            face: getTags(config.face),
            body: getTags(config.body),
            style: getTags(config.style)
        }
    }, [mergedData])

    const hasAdvancedData = React.useMemo(() => {
        return (categories.face?.length > 0 || categories.body?.length > 0 || categories.style?.length > 0)
    }, [categories])

    return (
        <aside className="w-[300px] shrink-0 flex flex-col h-screen border-l border-white/10 bg-black p-5 gap-6 overflow-y-auto scrollbar-hide">

            {/* ── Character Parameters Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <User className="w-3.5 h-3.5 text-white/40" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                        Character Parameters
                    </h2>
                </div>

                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 transition-all duration-300">
                    <div className="space-y-5">
                        {/* Always show General Tags */}
                        <div className="flex flex-wrap gap-2">
                            {categories.general?.length > 0 ? (
                                categories.general.map((tag, i) => (
                                    <div key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/80">
                                        {tag}
                                    </div>
                                ))
                            ) : (
                                <div className="text-[10px] font-medium text-white/20 italic">No parameters set</div>
                            )}
                        </div>

                        {/* Expanded Sections: Face, Body, Attributes */}
                        {isExpanded && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                {categories.face?.length > 0 && (
                                    <div className="space-y-3 pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <Smile className="w-3 h-3 text-white/30" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Face</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.face.map((tag, i) => (
                                                <div key={i} className="px-3 py-1.5 rounded-lg bg-white/4 border border-white/5 text-[10px] font-bold text-white/70">
                                                    {tag}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {categories.body?.length > 0 && (
                                    <div className="space-y-3 pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <Accessibility className="w-3 h-3 text-white/30" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Body</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.body.map((tag, i) => (
                                                <div key={i} className="px-3 py-1.5 rounded-lg bg-white/4 border border-white/5 text-[10px] font-bold text-white/70">
                                                    {tag}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {categories.style?.length > 0 && (
                                    <div className="space-y-3 pt-3 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <StyleIcon className="w-3 h-3 text-white/30" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Attributes</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.style.map((tag, i) => (
                                                <div key={i} className="px-3 py-1.5 rounded-lg bg-white/4 border border-white/5 text-[10px] font-bold text-white/70">
                                                    {tag}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Only show toggle if there is advanced data to show */}
                    {hasAdvancedData && (
                        <Button
                            variant="ghost"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center justify-between w-full pt-4 mt-2 border-t border-white/5 group focus:outline-none hover:bg-transparent"
                        >
                            <span className="text-[10px] font-bold text-white/30 group-hover:text-white/50 transition-colors uppercase tracking-wider">
                                {isExpanded ? "Show less" : "See all"}
                            </span>
                            {isExpanded ? (
                                <ChevronUp className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors" />
                            ) : (
                                <ChevronDown className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors" />
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Information Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                    <Info className="w-3.5 h-3.5 text-white/40" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                        Information
                    </h2>
                </div>

                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-5">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/30">Feature</span>
                            <span className="text-[10px] font-black text-white/90">AI Influencer</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/30">Quality</span>
                            <span className="text-[10px] font-black text-white/90 uppercase">2k</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/30">Size</span>
                            <span className="text-[10px] font-black text-white/90">1536x2752</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-white/30">Created at</span>
                            <span className="text-[10px] font-black text-[#D4FF00]/80 uppercase">{createdAtStr}</span>
                        </div>
                    </div>

                    <Button variant="ghost" className="flex items-center justify-between w-full pt-2 border-t border-white/5 group hover:bg-transparent px-0">
                        <span className="text-[10px] font-bold text-white/30 group-hover:text-white/50 transition-colors">See all</span>
                        <ChevronDown className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors" />
                    </Button>
                </div>
            </div>

            {/* ── Action Buttons */}
            <div className="mt-auto space-y-3">
                {/* Motion Primary */}
                <Button
                    variant="studio-neon"
                >
                    <Play className="w-4 h-4 text-black fill-black transition-transform group-hover:scale-110" />
                    <span className="text-xs font-black uppercase tracking-widest text-black">Motion</span>
                </Button>

                {/* Secondary Actions Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="studio-normal">
                        <Video className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Animate</span>
                    </Button>
                    <Button variant="studio-normal">
                        <RotateCcw className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Recreate</span>
                    </Button>
                    <Button variant="studio-normal">
                        <LayoutGrid className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Open in</span>
                    </Button>
                    <Button variant="studio-normal">
                        <Target className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Reference</span>
                    </Button>
                    <Button
                        variant="studio-error"
                        onClick={() => {
                            if (window.confirm("Are you sure you want to delete this character?")) {
                                removeCharacter(activeCharacterId)
                            }
                        }}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Delete</span>
                    </Button>
                </div>

                {/* Footer Utility */}
                <div className="flex gap-2">
                    <Button
                        variant="studio-normal"
                        onClick={() => {
                            if (!activeNode?.imageUrl) return;
                            // Attempt direct download via a link
                            // Note: This works best if the server allows CORS or triggers attachment
                            const link = document.createElement("a");
                            link.href = activeNode.imageUrl;
                            link.setAttribute("download", `${activeNodeId}.jpg`);
                            link.setAttribute("target", "_blank"); // Fallback: open in new tab if download is blocked
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        <Download className="w-3.5 h-3.5 text-white/40 group-hover:text-white/80" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Download</span>
                    </Button>
                    <Button variant="studio-normal" className="w-11 h-11 p-0 px-0 flex items-center justify-center">
                        <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="studio-normal" className="w-11 h-11 p-0 px-0 flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="studio-normal" className="w-11 h-11 p-0 px-0 flex items-center justify-center">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </aside >
    )
}
