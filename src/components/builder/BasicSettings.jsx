"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Check,
    Palette,
    Dna,
    UserCircle,
    Globe,
    User,
    Eye,
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import builderData from "@/data/builderData.json"

export function BasicSettings() {
    // ── Connect to unified store ──────────────────────────────────────────────
    const { nodes, activeNodeId, updateActiveNodeData } = useStudioStore()
    const characterData = nodes[activeNodeId]?.data || {}

    const {
        age,
        Character_Type: selectedType,
        Gender: selectedGender,
        "Ethnicity_-_Origin_Base": selectedEthnicity,
        skin: selectedSkin,
        Eye_Color: selectedEyeColor,
        Skin_Conditions: selectedSkinCondition
    } = characterData

    const characterTypes = builderData["Character_Type"] || []
    const genders = builderData["Gender"] || []
    const ethnicities = builderData["Ethnicity_-_Origin_Base"] || []
    const eyeColors = builderData["Eye_Color"] || []
    const skinConditions = builderData["Skin_Conditions"] || []

    const skinColors = [
        "bg-[#0a0a0a]", "bg-[#1a0f0a]", "bg-[#ffffff]", "bg-[#6b16a2]", "bg-[#cc8e6c]",
        "bg-[#9d9d16]", "bg-[#555555]", "bg-[#064e3b]", "bg-[#2563eb]", "bg-[#881337]",
        "bg-slate-200", "bg-linear-to-tr from-blue-300 via-yellow-200 to-pink-300"
    ]

    const currentAge = Array.isArray(age) ? age[0] : (age ?? 25)
    const ageCategory = React.useMemo(() => {
        if (currentAge >= 60) return "Senior"
        if (currentAge >= 35) return "Mature"
        if (currentAge >= 18) return "Adult"
        return "Young"
    }, [currentAge])

    const handleCategoryChange = (cat) => {
        if (cat === "Young") updateActiveNodeData("age", [12])
        if (cat === "Adult") updateActiveNodeData("age", [25])
        if (cat === "Mature") updateActiveNodeData("age", [45])
        if (cat === "Senior") updateActiveNodeData("age", [75])
    }

    return (
        <div className="px-4 py-4">
            <Card className="bg-white/3 border-white/5 overflow-hidden">
                <Accordion type="multiple" defaultValue={["type", "gender", "ethnicity", "skin", "eyes", "conditions", "age"]} className="w-full">

                    {/* Character Type */}
                    <AccordionItem value="type" className="border-b border-white/5">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                <UserCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Character Type</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-3 gap-1">
                                {characterTypes.map((type) => {
                                    const isActive = selectedType === type.name
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => updateActiveNodeData("Character_Type", type.name)}
                                            className={cn(
                                                "group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all duration-300",
                                                isActive ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)]" : "border-white/5 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <img src={type.url} alt={type.name} className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                                                <span className="text-[9px] font-black text-white uppercase tracking-wider">{type.name}</span>
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
                        </AccordionContent>
                    </AccordionItem>

                    {/* Gender */}
                    <AccordionItem value="gender" className="border-b border-white/5">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                <Dna className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Gender</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-3 gap-2">
                                {genders.map((g) => (
                                    <Button
                                        key={g.id}
                                        variant={selectedGender === g.name ? "secondary" : "outline"}
                                        onClick={() => updateActiveNodeData("Gender", g.name)}
                                        className={cn(
                                            "h-12 text-[10px] font-black uppercase tracking-widest border-2 transition-all rounded-lg",
                                            selectedGender === g.name
                                                ? "bg-[#D4FF00] text-black border-[#D4FF00] shadow-xl scale-[1.02]"
                                                : "hover:bg-white/5 text-muted-foreground border-white/5 opacity-60"
                                        )}
                                    >
                                        {g.name}
                                    </Button>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Ethnicity */}
                    <AccordionItem value="ethnicity" className="border-b border-white/5">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                <Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Ethnicity</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-3 gap-1">
                                {ethnicities.map((e) => {
                                    const isActive = selectedEthnicity === e.name
                                    return (
                                        <button
                                            key={e.id}
                                            onClick={() => updateActiveNodeData("Ethnicity_-_Origin_Base", e.name)}
                                            className={cn(
                                                "group relative h-24 overflow-hidden rounded-2xl border-2 transition-all duration-300",
                                                isActive ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)]" : "border-white/5 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <img src={e.url} alt={e.name} className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                                                <span className="text-[9px] font-black text-white uppercase tracking-wider">{e.name}</span>
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
                        </AccordionContent>
                    </AccordionItem>

                    {/* Skin Color */}
                    <AccordionItem value="skin" className="border-b border-white/5">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                <Palette className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Skin Color</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-5 gap-1.5">
                                {skinColors.map((color, idx) => {
                                    const isActive = selectedSkin === idx
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => updateActiveNodeData("skin", idx)}
                                            className={cn(
                                                "relative aspect-square rounded-lg border-2 transition-all overflow-hidden",
                                                isActive ? "border-[#D4FF00] shadow-[0_0_12px_rgba(212,255,0,0.4)]" : "border-white/5 hover:border-white/20"
                                            )}
                                        >
                                            <div className={cn("w-full h-full", color)} />
                                            {isActive && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-[#D4FF00] rounded-full flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5 text-black" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Eye Color */}
                    <AccordionItem value="eyes" className="border-b border-white/5">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Eye Color</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-3 gap-1">
                                {eyeColors.map((eye) => (
                                    <button
                                        key={eye.id}
                                        onClick={() => updateActiveNodeData("Eye_Color", eye.name)}
                                        className={cn(
                                            "group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all duration-300",
                                            selectedEyeColor === eye.name ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)]" : "border-white/5 opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img src={eye.url} alt={eye.name} className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                                            <span className="text-[9px] font-black text-white uppercase tracking-wider">{eye.name}</span>
                                        </div>
                                        {selectedEyeColor === eye.name && (
                                            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#D4FF00] rounded-full flex items-center justify-center z-10">
                                                <Check className="w-2.5 h-2.5 text-black" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Skin Conditions */}
                    <AccordionItem value="conditions" className="border-b border-white/5">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                <Zap className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Skin Conditions</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-3 gap-1">
                                {skinConditions.map((cond) => (
                                    <button
                                        key={cond.id}
                                        onClick={() => updateActiveNodeData("Skin_Conditions", cond.name)}
                                        className={cn(
                                            "group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all duration-300",
                                            selectedSkinCondition === cond.name ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)]" : "border-white/5 opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img src={cond.url} alt={cond.name} className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex items-end p-2">
                                            <span className="text-[9px] font-black text-white uppercase tracking-wider">{cond.name}</span>
                                        </div>
                                        {selectedSkinCondition === cond.name && (
                                            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#D4FF00] rounded-full flex items-center justify-center z-10">
                                                <Check className="w-2.5 h-2.5 text-black" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Age */}
                    <AccordionItem value="age" className="border-none">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-xs font-bold tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Age</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-5 pb-5 pt-2">
                            <div className="grid grid-cols-4 gap-1">
                                {["Young", "Adult", "Mature", "Senior"].map((cat) => (
                                    <Button
                                        key={cat}
                                        variant={ageCategory === cat ? "secondary" : "outline"}
                                        onClick={() => handleCategoryChange(cat)}
                                        className={cn(
                                            "h-9 text-[9px] font-bold border-white/10 transition-all px-1",
                                            ageCategory === cat
                                                ? "bg-[#D4FF00]/20 text-[#D4FF00] border-[#D4FF00]/40"
                                                : "hover:bg-white/5 text-muted-foreground"
                                        )}
                                    >
                                        {cat}
                                    </Button>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Card>
        </div>
    )
}
