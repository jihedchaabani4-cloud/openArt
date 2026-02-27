"use client"

import * as React from "react"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Settings,
    User,
    Smile,
    Zap,
    Eye,
    ChevronDown,
    Check,
    AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import builderData from "@/data/builderData.json"
import { useStudioStore } from "@/store/useStudioStore"

export function AdvancedSettings() {
    // ── Connect to unified store ──────────────────────────────────────────────
    const { stagedDna, updateActiveNodeData } = useStudioStore()

    const [activeTab, setActiveTab] = React.useState("face")

    const tabs = [
        { id: "face", label: "Face", icon: Smile },
        { id: "body", label: "Body", icon: User },
        { id: "style", label: "Style", icon: Zap }
    ]

    const faceTraits = [
        { label: "Eyes - Type", path: "identity_dna.sculpt.eye_details", builderKey: "Eyes_-_Type" },
        { label: "Eyes - Details", path: "identity_dna.sculpt.eye_details", builderKey: "Eyes_-_Details" },
        { label: "Mouth & Teeth", path: "identity_dna.sculpt.mouth_teeth", builderKey: "Mouth_&_Teeth" },
        { label: "Ears", path: "identity_dna.sculpt.ears", builderKey: "Ears" },
        { label: "Horns", path: "identity_dna.sculpt.horns", builderKey: "Horns" },
        { label: "Face Skin Material", path: "identity_dna.sculpt.face_skin_material", builderKey: "Face_Skin_Material" },
        { label: "Surface Pattern", path: "identity_dna.sculpt.surface_pattern", builderKey: "Surface_Pattern" }
    ]

    const bodyTraits = [
        { label: "Body Type", path: "physical_dna.body_type", builderKey: "Body_Type" },
        { label: "Left Arm", path: "physical_dna.left_arm", builderKey: "Left_Arm" },
        { label: "Right Arm", path: "physical_dna.right_arm", builderKey: "Right_Arm" },
        { label: "Left Leg", path: "physical_dna.left_leg", builderKey: "Left_Leg" },
        { label: "Right Leg", path: "physical_dna.right_leg", builderKey: "Right_Leg" }
    ]

    const styleTraits = [
        { label: "Hair / Head Growth", path: "style_dna.hair.style", builderKey: "Hair_-_Head_Growth" },
        { label: "Accessories & Markings", path: "style_dna.accessories", builderKey: "Accessories_&_Markings" },
        { label: "Rendering Style", path: "style_dna.rendering_style", builderKey: "Rendering_Style" }
    ]

    const getNestedValue = (obj, path) => {
        if (!path) return undefined
        return path.split('.').reduce((acc, part) => acc?.[part], obj)
    }

    const getActiveTraits = () => {
        switch (activeTab) {
            case "face": return faceTraits
            case "body": return bodyTraits
            case "style": return styleTraits
            default: return []
        }
    }

    const currentData = stagedDna || {}

    return (
        <div className="px-4 py-4 h-full flex flex-col gap-4">
            {/* ── Tab Switcher (Face Face Body Body Style Style) */}
            <div className="grid grid-cols-3 gap-2 bg-white/3 p-1 rounded-2xl border border-white/5">
                {tabs.map((t) => {
                    const Icon = t.icon
                    const isActive = activeTab === t.id
                    return (
                        <Button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            variant="ghost"
                            className={cn(
                                "relative flex flex-col items-center gap-1.5 py-4 h-auto rounded-xl transition-all duration-300",
                                isActive 
                                    ? "bg-[#D4FF00] text-black shadow-[0_0_20px_rgba(212,255,0,0.3)]" 
                                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-black" : "text-white/40")} />
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t.label}</span>
                                <span className={cn("text-[8px] font-bold uppercase opacity-50", isActive ? "text-black" : "text-white/20")}>{t.label}</span>
                            </div>
                            {isActive && (
                                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/20 rounded-full" />
                            )}
                        </Button>
                    )
                })}
            </div>

            <Card className="bg-white/3 border-white/5 overflow-hidden flex-1 flex flex-col">
                <div className="shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/2">
                    <div className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5 text-[#D4FF00]" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Advanced settings</h3>
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/20">
                        <span className="text-[8px] font-black text-[#D4FF00] uppercase tracking-wider">{activeTab}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <Accordion
                        type="multiple"
                        defaultValue={getActiveTraits().map(t => t.label)}
                        className="w-full"
                        key={activeTab}
                    >
                        {getActiveTraits().map((trait, idx, arr) => {
                            const items = builderData[trait.builderKey] || []
                            const val = getNestedValue(currentData, trait.path)

                            return (
                                <AccordionItem
                                    key={trait.label}
                                    value={trait.label}
                                    className={cn("border-white/5", idx === arr.length - 1 ? "border-none" : "border-b")}
                                >
                                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                                        <div className="flex items-center justify-between w-full pr-2 text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#D4FF00]/10 transition-colors">
                                                    <Eye className="w-3.5 h-3.5 text-white/30 group-hover:text-[#D4FF00] transition-colors" />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-wider text-white/50 group-data-[state=open]:text-white transition-colors">{trait.label}</span>
                                            </div>
                                            {val && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-[#D4FF00] uppercase tracking-tighter bg-[#D4FF00]/10 px-2 py-0.5 rounded-md border border-[#D4FF00]/20 truncate max-w-[80px]">
                                                        {Array.isArray(val) ? val[0] : val}
                                                    </span>
                                                    <ChevronDown className="w-3 h-3 text-white/20 group-data-[state=open]:rotate-180 transition-transform duration-300" />
                                                </div>
                                            )}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 pb-4 pt-1">
                                        {items.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {items.map((item) => {
                                                    const isActive = val === item.name
                                                    return (
                                                        <Button
                                                            variant="studio-option-tile-sm"
                                                            size="tile"
                                                            key={item.id}
                                                            onClick={() => updateActiveNodeData(trait.path, item.name)}
                                                            className={cn(
                                                                "relative aspect-square min-h-[80px] group/item overflow-hidden",
                                                                isActive
                                                                    ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.2)]"
                                                                    : "border-white/5 opacity-60 hover:opacity-100 hover:border-white/20"
                                                            )}
                                                        >
                                                            <img src={item.url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-110" />
                                                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent flex items-end p-2">
                                                                <span className="text-[8px] font-black text-white uppercase tracking-wider line-clamp-1 w-full text-center">{item.name}</span>
                                                            </div>
                                                            {isActive && (
                                                                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#D4FF00] rounded-full flex items-center justify-center z-10 shadow-lg">
                                                                    <Check className="w-2.5 h-2.5 text-black" />
                                                                </div>
                                                            )}
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 bg-white/2 rounded-xl border border-dashed border-white/10">
                                                <AlertCircle className="w-5 h-5 text-white/10 mb-2" />
                                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">No assets found for {trait.label}</p>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                </div>
            </Card>
        </div>
    )
}
