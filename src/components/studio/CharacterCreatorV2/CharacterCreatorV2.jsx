"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStudioStore, DEFAULT_DNA } from "@/store/useStudioStore"
import { cn } from "@/lib/utils"
import { BasicSettings } from "@/components/builder/BasicSettings"
import { AdvancedSettings } from "@/components/builder/AdvancedSettings"
import { Sparkles, Dna, Trash2, X, Shuffle, ArrowRight } from "lucide-react"

export function CharacterCreatorV2() {
    const { 
        stagedDna, setStagedDna, 
        creationPrompt, setCreationPrompt,
        creationTab, setCreationTab,
        randomizeDna, createCharacter, selectCharacter, setIsCreating
    } = useStudioStore()

    const [isGenerating, setIsGenerating] = React.useState(false)

    const handleRandomize = () => {
        randomizeDna()
        setCreationTab("builder")
    }

    const handleGenerate = async () => {
        if (isGenerating) return
        setIsGenerating(true)
        try {
            const finalName = `New Character ${Date.now().toString().slice(-4)}`
            const charId = await createCharacter(
                finalName, 
                stagedDna, 
                creationTab === "prompt" ? creationPrompt : ""
            )
            if (charId) {
                await selectCharacter(charId)
                setIsCreating(false)
            }
        } catch (error) {
            console.error("Generation failed:", error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleReset = () => {
        setCreationPrompt("")
        setStagedDna(DEFAULT_DNA)
    }

    return (
        <div className="w-full h-full flex flex-col bg-transparent">
            {/* ── Tabs Selector (V1 Style) */}
            <div className="px-6 py-4 flex items-center justify-between gap-3 shrink-0 border-b border-white/5">
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

            {/* ── Main Content Area ── */}
            <div className="flex-1 flex flex-col min-h-0 relative">
                <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
                    <AnimatePresence mode="wait">
                        {creationTab === "prompt" ? (
                            <motion.div
                                key="prompt-mode"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-6"
                            >
                                <textarea
                                    value={creationPrompt}
                                    onChange={(e) => setCreationPrompt(e.target.value)}
                                    placeholder="A cybernetic warrior with glowing pink hair..."
                                    className="w-full aspect-square rounded-lg border transition bg-white/[0.02] placeholder:text-white/20 outline-none px-2.5 text-sm border-white/5 text-white/90 focus:ring-1 focus:text-white focus:ring-white focus:shadow-[0px_0px_0px_4px_rgba(99,99,99,1.00)] focus-within:ring-1 focus-within:text-white focus-within:ring-white focus-within:shadow-[0px_0px_0px_4px_rgba(99,99,99,1.00)] disabled:opacity-60 disabled:cursor-not-allowed hover:border-white/10 resize-none p-3 hide-scrollbar min-h-[200px] max-h-[400px]"
                                    autoFocus
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="dna-mode"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col gap-8 pb-4"
                            >
                                <BasicSettings />
                                <AdvancedSettings />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Fixed Footer Action Row ── */}
                <div className="px-6 py-4 border-t border-white/5 bg-[#1c1e20]/80 backdrop-blur-md shrink-0">
                    <div className="flex gap-3">
                        {creationTab !== "prompt" && (
                            <button
                                type="button"
                                onClick={handleRandomize}
                                className="w-14 h-14 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                                title="Randomize Traits"
                            >
                                <Shuffle className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || (creationTab === "prompt" && !creationPrompt.trim())}
                            className="flex-1 h-14 rounded-xl bg-[#D4FF00] text-black font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#E5FF4D] transition-all active:scale-[0.98] shadow-[0_8px_32px_rgba(212,255,0,0.15)] disabled:opacity-50"
                        >
                            {isGenerating ? "Generating..." : "Generate Influencer"}
                            {!isGenerating && (
                                creationTab === "prompt" 
                                ? <ArrowRight className="w-4 h-4" />
                                : <Sparkles className="w-4 h-4 fill-black" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
