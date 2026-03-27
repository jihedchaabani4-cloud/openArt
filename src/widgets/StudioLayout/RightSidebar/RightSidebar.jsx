"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { Settings, Layers, SlidersHorizontal } from "lucide-react";

const TABS = [
    { id: "properties", label: "Properties", icon: SlidersHorizontal },
    { id: "layers", label: "Layers", icon: Layers },
    { id: "settings", label: "Settings", icon: Settings },
];

export function RightSidebar() {
    const [activeTab, setActiveTab] = useState(TABS[0].id);

    return (
        <aside className="w-[320px] shrink-0 h-full border-l border-white/10 bg-[#0a0a0a] flex flex-col z-30 relative">
            {/* Header / Tabs Container */}
            <div className="flex items-center px-4 h-14 border-b border-white/5 shrink-0 relative">
                <div className="flex space-x-1 w-full relative bg-white/5 p-1 rounded-lg">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex-1 flex items-center justify-center gap-1.5 h-8 text-[11px] font-medium rounded-md transition-colors",
                                    isActive ? "text-white" : "text-white/40 hover:text-white/80"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="rightSidebarTabIndicator"
                                        className="absolute inset-0 bg-white/10 rounded-md ring-1 ring-white/10 shadow-sm"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <Icon className="w-3.5 h-3.5 relative z-10" />
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 hide-scrollbar relative">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-6 w-full"
                    >
                        {/* Dummy Content based on active tab */}
                        {activeTab === "properties" && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">General</div>
                                    <div className="h-11 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-lg border border-white/5 flex items-center px-4 text-sm text-white/60">
                                        Selection details...
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Transform</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="h-11 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-lg border border-white/5 flex items-center px-4 text-sm text-white/60 font-mono">X: 0</div>
                                        <div className="h-11 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-lg border border-white/5 flex items-center px-4 text-sm text-white/60 font-mono">Y: 0</div>
                                        <div className="h-11 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-lg border border-white/5 flex items-center px-4 text-sm text-white/60 font-mono">W: auto</div>
                                        <div className="h-11 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-lg border border-white/5 flex items-center px-4 text-sm text-white/60 font-mono">H: auto</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "layers" && (
                            <div className="space-y-3">
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1 mb-2">Hierarchy</div>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-11 bg-white/[0.02] rounded-lg border border-white/5 flex items-center px-4 text-sm text-white/60 hover:bg-white/10 hover:border-white/10 cursor-pointer transition-all">
                                        <Layers className="w-4 h-4 mr-3 opacity-40" />
                                        Layer {i}
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Workspace</div>
                                    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-sm text-white/50 leading-relaxed">
                                        No active configuration parameters are available for the current selection.
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </aside>
    );
}
