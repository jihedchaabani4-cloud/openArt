"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStudioStore } from "@/store/useStudioStore"
import { CharacterPanel } from "../CharacterPanel"
import { MainStage } from "@/components/builder/MainStage"
import { HeritageTree } from "../HeritageTree"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function StudioLayout() {
    const { 
        characters, fetchCharacters, activeCharacterId, selectCharacter,
        isCreating, setIsCreating, initSocket, isConnected
    } = useStudioStore()
    const [hasFetched, setHasFetched] = React.useState(false)

    React.useEffect(() => {
        initSocket()
        // fetchCharacters().then(() => setHasFetched(true))
        setHasFetched(true)
    }, [fetchCharacters, initSocket])

    const noCharacters = hasFetched && characters.length === 0

    const handleCreateNew = () => {
        selectCharacter(null)
        setIsCreating(true)
    }

    const handleSelectCharacter = (id) => {
        setIsCreating(false)
        selectCharacter(id)
    }

    return (
        <div
            className="flex h-screen w-screen overflow-hidden relative"
            style={{ background: "#0F1113" }}
        >


            {/* ── Background Grid Layer ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="bg-grid-perspective opacity-40" />
                <div className="absolute inset-0 bg-radial-to-b from-transparent via-[#0F1113]/20 to-[#0F1113]" />
            </div>

            {/* ── Col 1: Character Selector (140px) ─────────────── */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="relative z-10 shrink-0 h-full"
            >
                <CharacterPanel 
                    isCreating={isCreating}
                    activeCharacterId={activeCharacterId}
                    onCreateNew={handleCreateNew}
                    onSelectCharacter={handleSelectCharacter}
                />
            </motion.div>

            {/* ── Col 2: Main Stage (flex-1) ──────── */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent relative z-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                        type: "spring", 
                        damping: 12, 
                        stiffness: 200,
                        delay: 0.2 
                    }}
                    className="flex-1 flex flex-col h-full"
                >
                    <MainStage />
                </motion.div>
            </main>

            {/* ── Col 3: Character Heritage (320px) ───*/}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.1 }}
                className="relative z-10 shrink-0 h-full w-[450px] max-w-[450px] max-lg:w-[320px]"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key="heritage"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        <HeritageTree />
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
