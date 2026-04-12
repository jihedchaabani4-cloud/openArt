import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import { Info, ArrowRight, LayoutGrid } from "lucide-react";
import { ModelSelector } from "../../common/selectors/ModelSelector";
import { PromptTextarea } from "../../common/PromptTextarea";

const CAMERA_MOTIONS = [
    { id: "dolly-in", label: "Dolly in" },
    { id: "dolly-out", label: "Dolly out" },
    { id: "orbit-left", label: "Orbit left" },
    { id: "orbit-right", label: "Orbit right" },
    { id: "orbit-up", label: "Orbit up" },
    { id: "orbit-low", label: "Orbit low" },
    { id: "dolly-in-zoom-out", label: "Dolly in zoom out" },
    { id: "dolly-out-zoom-in", label: "Dolly out zoom in" },
];

const CAMERA_POSITIONS = [
    { id: "center", label: "Center" },
    { id: "left", label: "Left" },
    { id: "right", label: "Right" },
    { id: "high", label: "High" },
    { id: "low", label: "Low" },
    { id: "closer", label: "Closer" },
    { id: "further", label: "Further" },
];

import { Loader2 } from "lucide-react";

export function CameraView({ s }) {
    const [activeTab, setActiveTab] = useState("motion");
    // Local selection state for UI, but also sync with store
    const [selectedMotion, setSelectedMotion] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);

    // Dragger logic
    const sliderRef = useRef(null);
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const isDragging = useRef(false);

    const onMouseDown = (e) => {
        isDown.current = true;
        isDragging.current = false;
        startX.current = e.pageX - sliderRef.current.offsetLeft;
        scrollLeft.current = sliderRef.current.scrollLeft;
    };

    const onMouseLeave = () => {
        isDown.current = false;
    };

    const onMouseUp = () => {
        isDown.current = false;
    };

    const onMouseMove = (e) => {
        if (!isDown.current) return;
        e.preventDefault();
        const x = e.pageX - sliderRef.current.offsetLeft;
        const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
        
        if (Math.abs(walk) > 5) {
            isDragging.current = true; // Mark as dragging to prevent click
        }
        
        sliderRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const handleItemClick = (item) => {
        if (!isDragging.current) {
            if (activeTab === "motion") {
                setSelectedMotion(item.id);
                s.setCamera?.(item.label);
            } else {
                setSelectedPosition(item.id);
                s.setCamera?.(`Position: ${item.label}`);
            }
        }
    };

    const currentItems = activeTab === "motion" ? CAMERA_MOTIONS : CAMERA_POSITIONS;
    const currentSelected = activeTab === "motion" ? selectedMotion : selectedPosition;

    return (
        <div className="flex flex-col w-full gap-3">
            {/* Sub-tabs Header */}
            <div className="flex items-center gap-6 px-6 pt-3">
                <button 
                    onClick={() => setActiveTab("motion")}
                    className={cn(
                        "text-[13px] font-medium transition-colors relative pb-1",
                        activeTab === "motion" ? "text-white" : "text-white/40 hover:text-white/80"
                    )}
                >
                    Camera motion
                    {activeTab === "motion" && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab("position")}
                    className={cn(
                        "text-[13px] font-medium transition-colors relative pb-1",
                        activeTab === "position" ? "text-white" : "text-white/40 hover:text-white/80"
                    )}
                >
                    Camera position
                    {activeTab === "position" && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                    )}
                </button>
            </div>

            <div className="w-full flex items-center gap-2 pt-1">
                {/* Scrollable Container */}
                <div 
                    ref={sliderRef}
                    onMouseDown={onMouseDown}
                    onMouseLeave={onMouseLeave}
                    onMouseUp={onMouseUp}
                    onMouseMove={onMouseMove}
                    className="flex-1 flex overflow-x-auto gap-3 pb-2 pt-1 px-4 cursor-grab active:cursor-grabbing"
                    style={{ 
                        scrollbarWidth: 'none', // Hide standard scrollbar to encourage dragging
                        msOverflowStyle: 'none',
                        maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)'
                    }}
                >
                    {currentItems.map((item) => {
                        const isSelected = currentSelected === item.id;
                        
                        return (
                            <div 
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className={cn(
                                    "flex flex-col gap-2 min-w-[140px] md:min-w-[160px] transition-all group select-none border-none outline-none",
                                    isSelected ? "opacity-100" : "opacity-60 hover:opacity-100"
                                )}
                            >
                                <div 
                                    className={cn(
                                        "w-full aspect-[16/9] rounded-[10px] overflow-hidden bg-[rgb(28,28,28)] transition-all relative shadow-sm pointer-events-none",
                                        isSelected 
                                            ? "border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.05)] ring-1 ring-white/10" 
                                            : ""
                                    )}
                                    style={{
                                        border: !isSelected ? "1px solid rgba(218, 220, 224, 0.05)" : undefined
                                    }}
                                >
                                    {/* Placeholder gradient background */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
                                    
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 shadow-inner">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                        </div>
                                    </div>
                                </div>
                                
                                <span className={cn(
                                    "text-xs font-medium px-1 transition-colors pointer-events-none",
                                    isSelected ? "text-white" : "text-white/60 group-hover:text-white/90"
                                )}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Row */}
            <div className="flex w-full items-center justify-end pb-2 px-6 pt-1">
                <div className="flex items-center gap-3">
                    <ModelSelector
                        type="motion"
                        onChange={s.setModel}
                        defaultId={s.model?.id}
                        dynamicModels={s.studioModels}
                        loading={s.studioModelsLoading}
                        className="border-none bg-transparent hover:bg-transparent h-8 text-[12px] font-bold text-white/60 hover:text-white transition-colors"
                    />
                    <button className="text-white/50 hover:text-white transition-colors">
                        <Info size={18} strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={() => s.handleGenerate()}
                        disabled={s.generating || !currentSelected}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-all border border-white/5 shadow-sm active:scale-95"
                    >
                        {s.generating ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <ArrowRight size={18} strokeWidth={2.5} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
