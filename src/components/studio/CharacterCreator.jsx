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
export function CharacterCreator({ draftId, onClose }) {
    const { finalizeCharacter, removeCharacter } = useStudioStore()

    const [tab, setTab] = React.useState("basic")
    const [step, setStep] = React.useState("traits") // "traits" | "name"
    const [name, setName] = React.useState("")
    const nameRef = React.useRef(null)

    React.useEffect(() => {
        if (step === "name") nameRef.current?.focus()
    }, [step])

    const handleCancel = () => {
        removeCharacter(draftId)
        onClose()
    }

    const handleGenerate = () => {
        setStep("name")
    }

    const handleConfirm = async () => {
        const finalName = name.trim() || `Character ${Date.now().toString().slice(-4)}`
        await finalizeCharacter(draftId, finalName)
        onClose()
    }

    const handleNameKeyDown = (e) => {
        if (e.key === "Enter") handleConfirm()
        if (e.key === "Escape") setStep("traits")
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">

            {/* ── Top bar */}
            <div className="shrink-0 flex items-center justify-between px-8 pt-7 pb-5 border-b border-white/8">
                <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_6px_rgba(212,255,0,0.8)] animate-pulse" />
                    <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">New Character</h1>
                </div>

                {/* Step breadcrumb */}
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.15em]">
                    <span className={step === "traits" ? "text-[#D4FF00]" : "text-white/20"}>01 Traits</span>
                    <ChevronRight className="w-3 h-3 text-white/15" />
                    <span className={step === "name" ? "text-[#D4FF00]" : "text-white/20"}>02 Generate</span>
                </div>

                <Button
                    variant="studio-normal"
                    onClick={handleCancel}
                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors focus:outline-none p-0"
                >
                    <X className="w-4 h-4 text-white/40" />
                </Button>
            </div>

            {/* ── STEP 1: Trait selection */}
            {step === "traits" && (
                <>
                    {/* Tab switcher */}
                    <div className="shrink-0 flex items-center gap-2 px-8 pt-5 pb-3">
                        {TABS.map(t => (
                            <Button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                variant={tab === t.id ? "studio-neon" : "studio-normal"}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-200 focus:outline-none h-auto",
                                    tab === t.id
                                        ? "text-black border-[#D4FF00] shadow-[0_0_12px_rgba(212,255,0,0.3)] bg-[#D4FF00]"
                                        : "bg-transparent text-white/30 border-white/10 hover:text-white/60 hover:border-white/20"
                                )}
                            >
                                {t.label}
                            </Button>
                        ))}
                    </div>

                    {/* Scrollable settings content */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        <div className="max-w-3xl mx-auto">
                            {tab === "basic" && <BasicSettings />}
                            {tab === "advanced" && <AdvancedSettings />}
                        </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="shrink-0 px-8 pb-8 pt-5 border-t border-white/5 flex items-center justify-between">
                        <p className="text-[9px] text-white/15 uppercase tracking-widest font-bold">
                            Select traits then generate
                        </p>
                        <Button
                            variant="studio-neon"
                            onClick={handleGenerate}
                            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl h-auto"
                        >
                            <Sparkles className="w-4 h-4" />
                            Generate Character
                        </Button>
                    </div>
                </>
            )}

            {/* ── STEP 2: Name + Confirm */}
            {step === "name" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8">

                    {/* Big icon */}
                    <div className="w-20 h-20 rounded-full border-2 border-[#D4FF00]/40 bg-[#D4FF00]/5 flex items-center justify-center shadow-[0_0_40px_rgba(212,255,0,0.15)]">
                        <Sparkles className="w-8 h-8 text-[#D4FF00]" />
                    </div>

                    <div className="flex flex-col items-center gap-2 text-center">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Name your character</h2>
                        <p className="text-[9px] text-white/15 uppercase tracking-widest font-bold">
                            Or leave blank for auto-name
                        </p>
                    </div>

                    {/* Name input */}
                    <div className="relative w-full max-w-sm">
                        <div className="absolute -inset-px rounded-2xl bg-[#D4FF00]/20 blur" />
                        <div className="relative flex items-center bg-[#0d0d0d] rounded-2xl border border-[#D4FF00]/25 px-5 h-14">
                            <input
                                ref={nameRef}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleNameKeyDown}
                                placeholder="e.g. Nova, Zephyr, Echo…"
                                maxLength={20}
                                className="flex-1 bg-transparent border-none outline-none text-base font-bold text-white placeholder:text-white/15 text-center tracking-wide"
                            />
                        </div>
                    </div>

                    {/* Confirm button */}
                    <Button
                        variant="studio-neon"
                        onClick={handleConfirm}
                        className="flex items-center gap-2 px-10 py-4 rounded-2xl h-auto"
                    >
                        <Check className="w-4 h-4" />
                        Create Character
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setStep("traits")}
                        className="text-[9px] text-white/20 hover:text-white/50 font-bold uppercase tracking-widest transition-colors hover:bg-transparent"
                    >
                        ← Back to traits
                    </Button>
                </div>
            )}
        </div>
    )
}
