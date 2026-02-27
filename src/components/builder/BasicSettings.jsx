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
    const { stagedDna, updateActiveNodeData } = useStudioStore()
    const characterData = stagedDna || {}

    // Safely extract from nested structure or fallback to flat if old node
    const core = characterData.identity_dna?.core || characterData
    const selectedType = core.character_type || characterData.Character_Type
    const selectedGender = core.gender || characterData.Gender
    const selectedEthnicity = core.ethnicity || characterData["Ethnicity_-_Origin_Base"]
    const selectedSkin = core.skin || characterData.skin
    const selectedEyeColor = core.eye_color || characterData.Eye_Color
    const selectedSkinCondition = core.skin_conditions || characterData.Skin_Conditions
    const ageValue = core.age || characterData.age

    const characterTypes = builderData["Character_Type"] || []
    const genders = builderData["Gender"] || []
    const ethnicities = builderData["Ethnicity_-_Origin_Base"] || []
    const eyeColors = builderData["Eye_Color"] || []
    const skinConditions = builderData["Skin_Conditions"] || []
    const skinColors = [
        "bg-[#FFE0BD]", "bg-[#F3C99F]", "bg-[#E0AC69]", "bg-[#8D5524]", "bg-[#C68642]",
        "bg-[#3C2012]", "bg-[#26140A]", "bg-[#EAC086]", "bg-[#5C381A]", "bg-[#4B2C11]"
    ]

    const ageCategory = core.age_stage || "Adult"

    const handleCategoryChange = (cat) => {
        const ageMap = { Young: 12, Adult: 25, Mature: 45, Senior: 75 }
        updateActiveNodeData("identity_dna.core.age", ageMap[cat])
        updateActiveNodeData("identity_dna.core.age_stage", cat)
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
                                <span className="text-xs font-normal tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Character Type</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-3 gap-2">
                                {characterTypes.map((type) => {
                                    const isActive = selectedType === type.name
                                    return (
                                        <Button
                                            variant="studio-option-tile"
                                            size="tile"
                                            key={type.id}
                                            onClick={() => updateActiveNodeData("identity_dna.core.character_type", type.name)}
                                            className={cn(
                                                "relative",
                                                isActive ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)]" : "border-white/5 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <img src={type.url} alt={type.name} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent flex items-end p-2">
                                                <span className="text-[9px] font-normal text-white uppercase tracking-wider line-clamp-1 w-full text-center">{type.name}</span>
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
                        </AccordionContent>
                    </AccordionItem>

                    {/* Gender */}
                    <AccordionItem value="gender" className="border-b border-white/5">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                <Dna className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-xs font-normal tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Gender</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-3 gap-2">
                                {genders.map((g) => (
                                    <Button
                                        key={g.id}
                                        variant={selectedGender === g.name ? "secondary" : "outline"}
                                        onClick={() => updateActiveNodeData("identity_dna.core.gender", g.name)}
                                        className={cn(
                                            "h-12 text-[10px] font-normal uppercase tracking-widest border-2 transition-all rounded-lg",
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
                                <span className="text-xs font-normal tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Ethnicity</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-3 gap-2">
                                {ethnicities.map((e) => {
                                    const isActive = selectedEthnicity === e.name
                                    return (
                                        <Button
                                            variant="studio-option-tile"
                                            size="tile"
                                            key={e.id}
                                            onClick={() => updateActiveNodeData("identity_dna.core.ethnicity", e.name)}
                                            className={cn(
                                                "relative aspect-3/4",
                                                isActive ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)]" : "border-white/5 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <img src={e.url} alt={e.name} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent flex items-end p-2">
                                                <span className="text-[9px] font-normal text-white uppercase tracking-wider line-clamp-1 w-full text-center">{e.name}</span>
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
                        </AccordionContent>
                    </AccordionItem>
                    {/* ... rest follows pattern ... */}

                    {/* Skin Color */}
                    <AccordionItem value="skin" className="border-b border-white/5">
                        <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-white/2 group transition-colors">
                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                <Palette className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-xs font-normal tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Skin Color</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-5 gap-1.5">
                                {skinColors.map((color, idx) => {
                                    const isActive = Number(selectedSkin) === idx
                                    return (
                                        <Button
                                            variant="studio-option-tile-sm"
                                            size="tile"
                                            key={idx}
                                            onClick={() => updateActiveNodeData("identity_dna.core.skin", idx)}
                                            className={cn(
                                                "relative overflow-hidden p-0 aspect-square min-w-0",
                                                isActive ? "border-[#D4FF00] shadow-[0_0_12px_rgba(212,255,0,0.4)]" : "border-white/5 hover:border-white/20"
                                            )}
                                        >
                                            <div className={cn("absolute inset-0", color)} />
                                            {isActive && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-4 h-4 bg-[#D4FF00] rounded-full flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5 text-black" />
                                                    </div>
                                                </div>
                                            )}
                                        </Button>
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
                                <span className="text-xs font-normal tracking-wide uppercase text-muted-foreground group-data-[state=open]:text-white">Eye Color</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1">
                            <div className="grid grid-cols-3 gap-1">
                                {eyeColors.map((eye) => (
                                    <Button
                                        variant="studio-option-tile"
                                        size="tile"
                                        key={eye.id}
                                        onClick={() => updateActiveNodeData("identity_dna.core.eye_color", eye.name)}
                                        className={cn(
                                            "relative",
                                            selectedEyeColor === eye.name ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)]" : "border-white/5 opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img src={eye.url} alt={eye.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent flex items-end p-2">
                                            <span className="text-[9px] font-normal text-white uppercase tracking-wider line-clamp-1 w-full text-center">{eye.name}</span>
                                        </div>
                                        {selectedEyeColor === eye.name && (
                                            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#D4FF00] rounded-full flex items-center justify-center z-10">
                                                <Check className="w-2.5 h-2.5 text-black" />
                                            </div>
                                        )}
                                    </Button>
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
                                    <Button
                                        variant="studio-option-tile"
                                        size="tile"
                                        key={cond.id}
                                        onClick={() => updateActiveNodeData("identity_dna.core.skin_conditions", cond.name)}
                                        className={cn(
                                            "relative",
                                            selectedSkinCondition === cond.name ? "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.3)]" : "border-white/5 opacity-60 hover:opacity-100"
                                        )}
                                    >
                                        <img src={cond.url} alt={cond.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent flex items-end p-2">
                                            <span className="text-[9px] font-black text-white uppercase tracking-wider line-clamp-1 w-full text-center">{cond.name}</span>
                                        </div>
                                        {selectedSkinCondition === cond.name && (
                                            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#D4FF00] rounded-full flex items-center justify-center z-10">
                                                <Check className="w-2.5 h-2.5 text-black" />
                                            </div>
                                        )}
                                    </Button>
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
