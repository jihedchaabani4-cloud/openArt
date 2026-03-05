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
    AlertCircle,
    Dna,
    Palette,
    Globe,
    UserCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import builderData from "@/data/builderData.json"
import { useStudioStore } from "@/store/useStudioStore"

export function AdvancedSettings() {
    // ── Connect to unified store ──────────────────────────────────────────────
    const { stagedDna, updateActiveNodeData } = useStudioStore()

    const [activeTab, setActiveTab] = React.useState("face")

    const tabs = [
        { 
            id: "face", 
            label: "Face", 
            icon: Smile,
            image: "https://cdn.higgsfield.ai/ai_influencer_parent_category/e0805c7f-c1b0-4c68-bbc7-bab5ae86d6df.webp"
        },
        { 
            id: "body", 
            label: "Body", 
            icon: User,
            image: "https://cdn.higgsfield.ai/ai_influencer_parent_category/ee30f691-5d7b-4788-af82-73d86b6f32bb.webp"
        },
        { 
            id: "style", 
            label: "Style", 
            icon: Zap,
            image: "https://cdn.higgsfield.ai/ai_influencer_parent_category/5b67892f-ef65-4f8d-af20-e0f35a13f1b3.webp"
        }
    ]

    const faceTraits = [
        { label: "Eyes - Type", path: "identity_dna.sculpt.eye_details", builderKey: "Eyes_-_Type", icon: Eye },
        { label: "Eyes - Details", path: "identity_dna.sculpt.eye_details", builderKey: "Eyes_-_Details", icon: Eye },
        { label: "Mouth & Teeth", path: "identity_dna.sculpt.mouth_teeth", builderKey: "Mouth_&_Teeth", icon: Smile },
        { label: "Ears", path: "identity_dna.sculpt.ears", builderKey: "Ears", icon: UserCircle },
        { label: "Horns", path: "identity_dna.sculpt.horns", builderKey: "Horns", icon: Zap },
        { label: "Face Skin Material", path: "identity_dna.sculpt.face_skin_material", builderKey: "Face_Skin_Material", icon: Palette },
        { label: "Surface Pattern", path: "identity_dna.sculpt.surface_pattern", builderKey: "Surface_Pattern", icon: Globe }
    ]

    const bodyTraits = [
        { label: "Body Type", path: "physical_dna.body_type", builderKey: "Body_Type", icon: User },
        { label: "Left Arm", path: "physical_dna.left_arm", builderKey: "Left_Arm", icon: Dna },
        { label: "Right Arm", path: "physical_dna.right_arm", builderKey: "Right_Arm", icon: Dna },
        { label: "Left Leg", path: "physical_dna.left_leg", builderKey: "Left_Leg", icon: Dna },
        { label: "Right Leg", path: "physical_dna.right_leg", builderKey: "Right_Leg", icon: Dna }
    ]

    const styleTraits = [
        { label: "Hair / Head Growth", path: "style_dna.hair.style", builderKey: "Hair_-_Head_Growth", icon: Palette },
        { label: "Accessories & Markings", path: "style_dna.accessories", builderKey: "Accessories_&_Markings", icon: Zap },
        { label: "Rendering Style", path: "style_dna.rendering_style", builderKey: "Rendering_Style", icon: Eye }
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
        <div className="px-4 py-4">
            <div className="flex flex-col gap-4">
                {/* ── Tab Switcher */}
                <div className="ai-influencer-advanced-tabs px-1 py-2 flex gap-2">
                    {tabs.map((t) => {
                        const isActive = activeTab === t.id
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setActiveTab(t.id)}
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all h-[82px] max-xl:h-[68px] overflow-hidden relative border-2",
                                    isActive 
                                        ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)]" 
                                        : "border-white/5 opacity-60 hover:opacity-100"
                                )}
                                style={{
                                    background: isActive 
                                        ? "linear-gradient(90deg, #D4FF00 0%, #D4FF00 100%)" 
                                        : "linear-gradient(90deg, rgb(20, 22, 25) 0%, rgb(39, 41, 43) 100%)",
                                    border: isActive 
                                        ? "2px solid #D4FF00" 
                                        : "2px solid rgba(255, 255, 255, 0.08)"
                                }}
                            >
                                <div className="size-11 max-xl:size-9 rounded-lg overflow-hidden relative">
                                    <img 
                                        src={t.image} 
                                        alt={t.label} 
                                        className="object-cover size-full" 
                                    />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-normal uppercase tracking-wider",
                                    isActive ? "text-black" : "text-white/50"
                                )}>
                                    {t.label}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <Card className="bg-white/3 border-white/5 overflow-hidden">
                    <Accordion
                        type="multiple"
                        defaultValue={getActiveTraits().map(t => t.label)}
                        className="w-full"
                        key={activeTab}
                    >
                        {getActiveTraits().map((trait, idx) => {
                            const items = builderData[trait.builderKey] || []
                            const val = getNestedValue(currentData, trait.path)
                            const TraitIcon = trait.icon || Settings

                            return (
                                <AccordionItem
                                    key={trait.label}
                                    value={trait.label}
                                    className=""
                                >
                                    <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                                        <div className="flex items-center gap-3 w-full pr-4 text-left">
                                            <TraitIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <span className="text-xs font-normal tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white transition-colors">{trait.label}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 pb-3 pt-1">
                                        {items.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-2">
                                                {items.map((item) => {
                                                    const isActive = val === item.name
                                                    return (
                                                        <Button
                                                            variant="studio-option-tile"
                                                            size="tile"
                                                            key={item.id}
                                                            onClick={() => updateActiveNodeData(trait.path, isActive ? "" : item.name)}
                                                            className={cn(
                                                                "relative",
                                                                isActive ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)]" : "border-white/5 opacity-60 hover:opacity-100"
                                                            )}
                                                        >
                                                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent flex items-end p-2">
                                                                <span className="text-[9px] font-normal text-white uppercase tracking-wider line-clamp-1 w-full text-center">{item.name}</span>
                                                            </div>
                                                            {isActive && (
                                                                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#D4FF00] rounded-full flex items-center justify-center z-10">
                                                                    <Check className="w-2.5 h-2.5 text-black" />
                                                                </div>
                                                            )}
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6 bg-white/2 rounded-lg border border-dashed border-white/10">
                                                <AlertCircle className="w-4 h-4 text-white/10 mb-2" />
                                                <p className="text-[9px] font-normal text-white/20 uppercase tracking-widest">No assets found</p>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                </Card>
            </div>
        </div>
    )
}
