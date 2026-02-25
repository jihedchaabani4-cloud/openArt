"use client"

import * as React from "react"
import { Sidebar } from "@/components/Sidebar"
import { MainStage } from "@/components/builder/MainStage"
import { StudioTimeline } from "@/components/builder/StudioTimeline"

export default function CreateCharacterPage() {
    return (
        <div className="flex h-screen bg-[#000000] text-foreground overflow-hidden font-sans selection:bg-[#D4FF00]/30 selection:text-white">
            {/* Left Sidebar - Character Origins */}
            <Sidebar />

            {/* Main Stage - Central Workspace */}
            <MainStage />

            {/* Right Sidebar - Character Heritage Timeline */}
            <aside className="w-[320px] bg-[#000000] border-l border-white/5 flex flex-col h-screen shrink-0 relative">
                <div className="px-6 py-8 border-b border-white/5 bg-[#000000]/80 backdrop-blur-xl z-10 shrink-0">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4FF00]">Character Heritage</h2>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-tighter mt-1">Ancestry & Variations</p>
                </div>

                <StudioTimeline />

                {/* Corner Decorative Element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4FF00]/5 blur-[80px] pointer-events-none" />
            </aside>

            <style jsx global>{`
                :root {
                    --primary: 212 255 0; /* #D4FF00 - Neon Lime */
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                ::selection {
                   background: rgba(212, 255, 0, 0.4);
                   color: white;
                }
            `}</style>
        </div>
    )
}
