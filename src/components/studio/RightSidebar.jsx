"use client"

import * as React from "react"
import { BasicSettings } from "@/components/builder/BasicSettings"
import { AdvancedSettings } from "@/components/builder/AdvancedSettings"
import { cn } from "@/lib/utils"

const TABS = [
    { id: "basic", label: "Basic" },
    { id: "advanced", label: "Advanced" },
]

export function RightSidebar() {
    const [activeTab, setActiveTab] = React.useState("basic")

    return (
        <aside className="w-[300px] shrink-0 flex flex-col h-screen border-l border-white/10 bg-black">

            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_6px_rgba(212,255,0,0.8)]" />
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/80">
                        Character Builder
                    </h2>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/5">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-200 focus:outline-none",
                                    isActive
                                        ? "bg-[#D4FF00] text-black shadow-[0_0_12px_rgba(212,255,0,0.3)]"
                                        : "text-white/30 hover:text-white/60"
                                )}
                            >
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {activeTab === "basic" && <BasicSettings />}
                {activeTab === "advanced" && <AdvancedSettings />}
            </div>
        </aside>
    )
}
