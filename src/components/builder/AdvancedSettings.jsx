"use client"

import * as React from "react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import {
    Settings,
    User,
    Smile,
    Zap,
    Eye,
    ChevronDown,
    Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import builderData from "@/data/builderData.json"
import { useStudioStore } from "@/store/useStudioStore"

export function AdvancedSettings() {
    // ── Connect to unified store ──────────────────────────────────────────────
    const { nodes, activeNodeId, updateActiveNodeData } = useStudioStore()
    const characterData = nodes[activeNodeId]?.data || {}

    const [activeTab, setActiveTab] = React.useState("face")

    const tabs = [
        { id: "face", label: "Face", icon: Smile },
        { id: "body", label: "Body", icon: User },
        { id: "style", label: "Style", icon: Zap }
    ]

    const faceTraits = [
        { label: "Eyes - Type", key: "Eyes_-_Type" },
        { label: "Eyes - Details", key: "Eyes_-_Details" },
        { label: "Mouth & Teeth", key: "Mouth_&_Teeth" },
        { label: "Ears", key: "Ears" },
        { label: "Horns", key: "Horns" },
        { label: "Face Skin Material", key: "Face_Skin_Material" },
        { label: "Surface Pattern", key: "Surface_Pattern" }
    ]

    const bodyTraits = [
        { label: "Body Type", key: "Body_Type" },
        { label: "Left Arm", key: "Left_Arm" },
        { label: "Right Arm", key: "Right_Arm" },
        { label: "Left Leg", key: "Left_Leg" },
        { label: "Right Leg", key: "Right_Leg" }
    ]

    const styleTraits = [
        { label: "Hair / Head Growth", key: "Hair_-_Head_Growth" },
        { label: "Accessories & Markings", key: "Accessories_&_Markings" },
        { label: "Rendering Style", key: "Rendering_Style" }
    ]

    const getActiveTraits = () => {
        switch (activeTab) {
            case "face": return faceTraits
            case "body": return bodyTraits
            case "style": return styleTraits
            default: return []
        }
    }

    return (
        <div className="px-4 py-4">
            <Card className="bg-white/3 border-white/5 overflow-hidden">
                {/* Header + Tabs */}
                <div className="p-4 border-b border-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-white/30" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Advanced Settings</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-300",
                                        isActive
                                            ? "bg-[#D4FF00]/10 border-[#D4FF00]/40 shadow-[0_0_12px_rgba(212,255,0,0.1)]"
                                            : "bg-transparent border-white/5 hover:bg-white/4 opacity-40 hover:opacity-100"
                                    )}
                                >
                                    <tab.icon className={cn(
                                        "w-5 h-5 transition-colors",
                                        isActive ? "text-[#D4FF00]" : "text-muted-foreground"
                                    )} />
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest",
                                        isActive ? "text-[#D4FF00]" : "text-muted-foreground"
                                    )}>
                                        {tab.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Trait Accordions */}
                <Accordion
                    type="multiple"
                    defaultValue={getActiveTraits().map(t => t.label)}
                    className="w-full"
                    key={activeTab}
                >
                    {getActiveTraits().map((trait, idx, arr) => {
                        const items = builderData[trait.key] || []
                        return (
                            <AccordionItem
                                key={trait.label}
                                value={trait.label}
                                className={cn("border-white/5", idx === arr.length - 1 ? "border-none" : "border-b")}
                            >
                                <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-white/2 group transition-colors">
                                    <div className="flex items-center justify-between w-full pr-2 text-left">
                                        <div className="flex items-center gap-3">
                                            <Eye className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <span className="text-[11px] font-bold text-muted-foreground group-data-[state=open]:text-white transition-colors">{trait.label}</span>
                                        </div>
                                        {characterData[trait.key] && (
                                            <span className="text-[8px] font-black text-[#D4FF00]/60 uppercase truncate max-w-[60px]">
                                                {characterData[trait.key]}
                                            </span>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3 pt-1">
                                    {items.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-1">
                                            {items.map((item) => {
                                                const isActive = characterData[trait.key] === item.name
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => updateActiveNodeData(trait.key, item.name)}
                                                        className={cn(
                                                            "group relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-300",
                                                            isActive
                                                                ? "border-[#D4FF00] shadow-[0_0_16px_rgba(212,255,0,0.3)]"
                                                                : "border-white/10 opacity-60 hover:opacity-100"
                                                        )}
                                                    >
                                                        <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                                                            <span className="text-[8px] font-black text-white uppercase tracking-wider line-clamp-1">{item.name}</span>
                                                        </div>
                                                        {isActive && (
                                                            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#D4FF00] rounded-full flex items-center justify-center z-10">
                                                                <Check className="w-2.5 h-2.5 text-black" />
                                                            </div>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground italic">No assets found for {trait.label}.</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </Card>
        </div>
    )
}
