"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { cn } from "@/lib/utils"
import { X, Sparkles, ChevronRight, Check } from "lucide-react"
import { BasicSettings } from "@/components/builder/BasicSettings"
import { AdvancedSettings } from "@/components/builder/AdvancedSettings"
import { Button } from "@/components/ui/button"

const TABS = [
    { id: "basic", label: "Basic Traits" },
    { id: "advanced", label: "Advanced Traits" },
]

/**
 * CharacterCreator
 * Full-screen creation page. Opens when user clicks "Create new".
 *
 * Flow:
 *   1. Parent calls addCharacter("Draft") → creates a draft in store (now active)
 *   2. User selects traits via BasicSettings / AdvancedSettings (they write to active node)
 *   3. "Generate" → asks for a name → calls updateCharacterName → closes
 *   4. "Cancel" → calls removeCharacter to delete the draft → closes
 *
 * Props:
 *   draftId  — id of the newly created draft character
 *   onClose  — called when creation is finished (confirmed or cancelled)
 */
export function CharacterCreator() {
    const { 
        stagedDna, setStagedDna, 
        creationPrompt, setCreationPrompt,
        creationTab, setCreationTab
    } = useStudioStore()

    const handleReset = () => {
        setCreationPrompt("")
        setStagedDna({
            character_name: "",
            identity_dna: {
                core: { character_type: "Human", gender: "Female", ethnicity: "Arab", age_stage: "Young Adult", eye_color: "Amber", skin_conditions: [] },
                sculpt: { eye_details: "Sharp", nose: "Straight", lips: "Full", jawline: "Defined", mouth_teeth: "Normal", ears: "Human", horns: "None", face_skin_material: "Natural", surface_pattern: "None" }
            },
            physical_dna: { body_type: "Athletic", height: "Tall", left_arm: "Normal arm", right_arm: "Normal arm", left_leg: "Normal leg", right_leg: "Normal leg", modifications: [] },
            style_dna: { hair: { style: "Cyber-mohawk", color: "Neon Pink" }, rendering_style: "Photorealistic", outfit: "Futuristic techwear jacket", accessories: [], markings: [] },
            environment: { location: "Neo-Tokyo Street", lighting: "Neon glow", weather: "Rainy night", time_of_day: "Night" },
            expression_dna: { emotion: "Confident", gaze_direction: "Frontal" }
        })
    }

    return (
        <aside className="w-[30vw] max-w-[450px] shrink-0 flex flex-col h-screen bg-transparent z-20">
            {/* ── Tabs Selector */}
            <div className="px-6 pt-4 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-lg p-0.5">
                    <button 
                        type="button" 
                        onClick={() => setCreationTab("builder")}
                        className={cn(
                            "px-3 py-1 text-[10px] font-normal uppercase tracking-widest rounded-md transition-all",
                            creationTab === "builder" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60"
                        )}
                    >
                        Builder
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setCreationTab("prompt")}
                        className={cn(
                            "px-3 py-1 text-[10px] font-normal uppercase tracking-widest rounded-md transition-all",
                            creationTab === "prompt" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60"
                        )}
                    >
                        Prompt
                    </button>
                </div>
                <div className="flex items-center">
                    <button 
                        type="button" 
                        onClick={handleReset}
                        className="px-2 py-1 text-[10px] font-normal uppercase tracking-widest text-white/20 hover:text-[#FF4D4D] transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* ── Content */}
            <div className="flex-1 pt-2 overflow-y-auto scrollbar-hide ">
                <div className="h-full">
                    {creationTab === "prompt" ? (
                        <div className="space-y-6 p-6">
                            <textarea
                                value={creationPrompt}
                                onChange={(e) => setCreationPrompt(e.target.value)}
                                placeholder="A cybernetic warrior with glowing pink hair..."
                                className="w-full rounded-lg border transition bg-surface-primary placeholder:text-font-secondary outline-none px-2.5 h-10 text-sm border-divider-primary text-font-secondary focus:ring-1 focus:text-white focus:ring-white focus:shadow-[0px_0px_0px_4px_rgba(99,99,99,1.00)] focus-within:ring-1 focus-within:text-white focus-within:ring-white focus-within:shadow-[0px_0px_0px_4px_rgba(99,99,99,1.00)] disabled:opacity-60 disabled:cursor-not-allowed hover:border-divider-primary text-font-primary placeholder:text-font-secondary [&:not(:placeholder-shown)]:text-font-primary h-full resize-none p-3 hide-scrollbar min-h-90"
                                autoFocus
                            />
                        </div>
                    ) : (
                        <div className="space-y-8 ">
                            <BasicSettings />
                            <AdvancedSettings />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    )
}
