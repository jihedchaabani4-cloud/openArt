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
export function CharacterCreator({ onClose }) {
    const { createCharacter, selectCharacter, stagedDna, setStagedDna } = useStudioStore()

    const [activeTab, setActiveTab] = React.useState("builder") // "builder" | "prompt"
    const [prompt, setPrompt] = React.useState("")
    const [isGenerating, setIsGenerating] = React.useState(false)

    const handleGenerate = async (e) => {
        if (e) e.preventDefault()
        if (activeTab === "prompt" && !prompt.trim()) return
        
        setIsGenerating(true)
        try {
            // Use a default name based on timestamp or first few words of prompt
            const defaultName = activeTab === "prompt" 
                ? (prompt.split(' ').slice(0, 3).join(' ') || "New Character")
                : "New Character"
            
            const finalName = `${defaultName} ${Date.now().toString().slice(-4)}`
            
            const charId = await createCharacter(
                finalName, 
                stagedDna, 
                activeTab === "prompt" ? prompt : ""
            )
            
            if (charId) {
                await selectCharacter(charId)
            }
            onClose()
        } catch (error) {
            console.error("Failed to generate character:", error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleReset = () => {
        setPrompt("")
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
        <aside className="w-[30vw] shrink-0 flex flex-col h-screen bg-transparent z-20">
            {/* ── Tabs Selector */}
            <div className="px-6 pt-4 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center bg-white/[0.03] border border-white/5 rounded-lg p-0.5">
                    <button 
                        type="button" 
                        onClick={() => setActiveTab("builder")}
                        className={cn(
                            "px-3 py-1 text-[10px] font-normal uppercase tracking-widest rounded-md transition-all",
                            activeTab === "builder" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60"
                        )}
                    >
                        Builder
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setActiveTab("prompt")}
                        className={cn(
                            "px-3 py-1 text-[10px] font-normal uppercase tracking-widest rounded-md transition-all",
                            activeTab === "prompt" ? "bg-white/10 text-white shadow-sm" : "text-white/30 hover:text-white/60"
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
            <div className="flex-1 overflow-y-auto scrollbar-hide ">
                <div className="h-full">
                    {activeTab === "prompt" ? (
                        <div className="space-y-6 p-6">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A cybernetic warrior with glowing pink hair..."
                                className="w-full h-78 bg-[#1C1E207A] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-white transition-all resize-none"
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

            {/* ── Footer Actions */}
            <div className="p-6 bg-transparent">
                <form onSubmit={handleGenerate} className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="studio-normal"
                            className="w-14 h-14 rounded-xl shrink-0 p-0 flex items-center justify-center bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all"
                            onClick={() => {
                                const randomPrompts = [
                                    "Cyberpunk mercenary with glowing eyes",
                                    "Elegant elven queen in silver robes",
                                    "Rugged desert survivor with robotic arm",
                                    "Neon-lit street racer with pink hair"
                                ];
                                setPrompt(randomPrompts[Math.floor(Math.random() * randomPrompts.length)]);
                                setActiveTab("prompt");
                            }}
                        >
                            <Sparkles className="w-5 h-5 text-white/40" />
                        </Button>
                        
                        <Button
                            type="submit"
                            disabled={(activeTab === "prompt" && !prompt.trim()) || isGenerating}
                            className={cn(
                                "flex-1 h-14 rounded-xl flex items-center justify-center gap-2 font-normal uppercase tracking-widest transition-all duration-300",
                                (activeTab === "builder" || prompt.trim()) && !isGenerating
                                    ? "bg-[#D4FF00] text-black shadow-[0_0_20px_rgba(212,255,0,0.2)] hover:scale-[1.02]"
                                    : "bg-white/5 text-white/10"
                            )}
                        >
                            {isGenerating ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Generate</span>
                                    <Sparkles className="w-4 h-4 fill-current" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </aside>
    )
}
