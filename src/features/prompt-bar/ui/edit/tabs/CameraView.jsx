import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import { Info, ArrowRight, LayoutGrid } from "lucide-react";
import { ModelSelector } from "../../common/selectors/ModelSelector";
import { PromptTextarea } from "../../common/PromptTextarea";
const CAMERA_MOTIONS = [
    { id: "static", label: "Static", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729328/Static_j4m7uu.mp4" },
    { id: "handheld", label: "Handheld", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729327/Handheld_mxhev9.mp4" },
    { id: "zoom-out", label: "Zoom Out", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729329/Zoom_Out_nly7ir.mp4" },
    { id: "zoom-in", label: "Zoom in", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729329/Zoom_in_jqpbkz.mp4" },
    { id: "camera-follows", label: "Camera follows", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729326/Camera_follows_divs8n.mp4" },
    { id: "pan-left", label: "Pan left", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729328/Pan_left_jndklz.mp4" },
    { id: "pan-right", label: "Pan right", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729328/Pan_right_yxxmrm.mp4" },
    { id: "tilt-up", label: "Tilt up", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729329/Tilt_up_bbcudx.mp4" },
    { id: "tilt-down", label: "Tilt down", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729329/Tilt_down_qp4e64.mp4" },
    { id: "orbit-around", label: "Orbit around", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729328/Orbit_around_opvkav.mp4" },
    { id: "drone-shot", label: "Drone shot", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729327/Drone_shot_igjxtc.mp4" },
    { id: "360-roll", label: "360 roll", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729326/360_roll_c6ainz.mp4" },
    { id: "dolly-in", label: "Dolly in", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729326/Dolly_in_ysm8vh.mp4" },
    { id: "dolly-out", label: "Dolly out", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729326/Dolly_out_ypisdm.mp4" },
    { id: "dolly-left", label: "Dolly left", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729326/Dolly_left_qh6et8.mp4" },
    { id: "dolly-right", label: "Dolly right", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729326/Dolly_right_zpmq6k.mp4" },
    { id: "jib-down", label: "Jib down", video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776729327/Jib_down_v9e5qz.mp4" },
];

const CAMERA_POSITIONS = [
    { id: "center", label: "Center", image: "https://res.cloudinary.com/dsak0vfdj/image/upload/v1776737449/Camera_position_centre_un820i.jpg" },
    { id: "left", label: "Left", image: "https://res.cloudinary.com/dsak0vfdj/image/upload/v1776737449/Camera_position_left_ec8hlf.jpg" },
    { id: "right", label: "Right", image: "https://res.cloudinary.com/dsak0vfdj/image/upload/v1776737448/Camera_position_right_jyi3uo.jpg" },
    { id: "high", label: "High", image: "https://res.cloudinary.com/dsak0vfdj/image/upload/v1776737450/Camera_position_hight_axv5zs.jpg" },
    { id: "low", label: "Low", image: "https://res.cloudinary.com/dsak0vfdj/image/upload/v1776737449/Camera_position_low_sf7xst.jpg" },
    { id: "closer", label: "Closer", image: "https://res.cloudinary.com/dsak0vfdj/image/upload/v1776737449/Camera_position_closer_w4ddca.jpg" },
    { id: "further", label: "Further", image: "https://res.cloudinary.com/dsak0vfdj/image/upload/v1776737448/Camera_position_further_gyefpl.jpg" },
];

import { Loader2 } from "lucide-react";
import { RangeSlider } from "@/shared/ui/RangeSlider";

export function CameraView({ s }) {
    const [activeTab, setActiveTab] = useState("motion");
    // Local selection state for UI, but also sync with store
    // Sync with store
    const [selectedMotion, setSelectedMotion] = useState(() => {
        const item = CAMERA_MOTIONS.find(m => m.label === s.camera);
        return item ? item.id : null;
    });
    const [selectedPosition, setSelectedPosition] = useState(() => {
        const item = CAMERA_POSITIONS.find(p => `Position: ${p.label}` === s.camera);
        return item ? item.id : null;
    });

    useEffect(() => {
        if (!s.camera) return;
        const motionItem = CAMERA_MOTIONS.find(m => m.label === s.camera);
        if (motionItem) setSelectedMotion(motionItem.id);
        
        const posItem = CAMERA_POSITIONS.find(p => `Position: ${p.label}` === s.camera);
        if (posItem) setSelectedPosition(posItem.id);
    }, [s.camera]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [duration, setDuration] = useState(5);

    // Dragger logic — uses Pointer Events API (compatible with framer-motion)
    const sliderRef = useRef(null);
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const isDragging = useRef(false);
    const pressedItemRef = useRef(null);

    const onPointerDown = (e) => {
        if (!sliderRef.current) return;
        // Only handle primary button (left click)
        if (e.button !== undefined && e.button !== 0) return;
        isDown.current = true;
        isDragging.current = false;
        // Capture pointer so we keep receiving events even if cursor leaves element
        sliderRef.current.setPointerCapture(e.pointerId);
        startX.current = e.clientX - sliderRef.current.getBoundingClientRect().left;
        scrollLeft.current = sliderRef.current.scrollLeft;
    };

    const onPointerUp = (e) => {
        if (!sliderRef.current) return;
        isDown.current = false;
        const didDrag = isDragging.current;
        try { sliderRef.current.releasePointerCapture(e.pointerId); } catch (_) {}
        if (!didDrag && pressedItemRef.current) {
            handleItemClick(pressedItemRef.current);
        }
        pressedItemRef.current = null;
        requestAnimationFrame(() => {
            if (didDrag) isDragging.current = false;
        });
    };

    const onPointerLeave = () => {
        isDown.current = false;
        isDragging.current = false;
        pressedItemRef.current = null;
    };

    const onPointerMove = (e) => {
        if (!isDown.current || !sliderRef.current) return;
        const x = e.clientX - sliderRef.current.getBoundingClientRect().left;
        const walk = (x - startX.current) * 1.5;

        if (Math.abs(walk) > 10) { // Increased threshold from 5 to 10
            isDragging.current = true;
        }

        sliderRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const handleItemClick = (item) => {
        // Only block if we actually dragged significantly
        if (isDragging.current) return;

        if (activeTab === "motion") {
            setSelectedMotion(item.id);
            s.setCamera?.(item.label);
        } else {
            setSelectedPosition(item.id);
            s.setCamera?.(`Position: ${item.label}`);
        }
    };

    const handleItemPointerDown = (item) => {
        pressedItemRef.current = item;
    };

    const currentItems = activeTab === "motion" ? CAMERA_MOTIONS : CAMERA_POSITIONS;
    const currentSelected = activeTab === "motion" ? selectedMotion : selectedPosition;

    return (
        <div className="flex flex-col w-full gap-3 bg-(--color-imagine-grey-2) backdrop-blur-[80px] rounded-xl w-full min-w-[400px]">
            {/* Sub-tabs Header */}
            <div className="flex items-center gap-6 px-6 pt-3">
                <button 
                    type="button"
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
                    type="button"
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
                
                <div className="flex-1" />
                
                <button 
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Collapse to row" : "Expand to grid"}
                    className={cn(
                        "p-1.5 rounded-md transition-all",
                        isExpanded ? "bg-white/10 text-white shadow-inner" : "text-white/40 hover:text-white/80 hover:bg-white/5"
                    )}
                >
                    <LayoutGrid size={18} strokeWidth={2} />
                </button>
            </div>

            <div className="w-full flex items-center gap-2 pt-1">
                {/* Scrollable Container */}
                <div 
                    ref={sliderRef}
                    onPointerDown={!isExpanded ? onPointerDown : undefined}
                    onPointerUp={!isExpanded ? onPointerUp : undefined}
                    onPointerMove={!isExpanded ? onPointerMove : undefined}
                    onPointerLeave={!isExpanded ? onPointerLeave : undefined}
                    className={cn(
                        "flex gap-3 pb-2 pt-1 px-4 transition-all duration-300",
                        isExpanded 
                            ? "flex-wrap grid grid-cols-2 sm:grid-cols-3 max-h-[350px] overflow-y-auto mt-1 mb-2 scrollbar-thin scrollbar-thumb-white/10" 
                            : "overflow-x-auto cursor-grab active:cursor-grabbing"
                    )}
                    style={{ 
                        scrollbarWidth: isExpanded ? 'thin' : 'none',
                        msOverflowStyle: 'none',
                        maskImage: !isExpanded ? 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)' : undefined,
                        WebkitMaskImage: !isExpanded ? 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)' : undefined
                    }}
                >
                    {currentItems.map((item) => {
                        const isSelected = currentSelected === item.id;
                        
                        return (
                            <button
                                type="button"
                                key={item.id}
                                onPointerDown={() => handleItemPointerDown(item)}
                                onClick={isExpanded ? () => handleItemClick(item) : undefined}
                                className={cn(
                                    "flex flex-col gap-2 transition-all group select-none border-none outline-none text-left bg-transparent p-0",
                                    !isExpanded ? "min-w-[140px] md:min-w-[160px]" : "w-full",
                                    isSelected ? "opacity-100" : "opacity-60 hover:opacity-100"
                                )}
                            >
                                <div 
                                    className={cn(
                                        "w-full aspect-[16/9] rounded-[10px] overflow-hidden bg-[rgb(28,28,28)] transition-all relative shadow-sm pointer-events-none",
                                        isSelected 
                                            ? "border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-2 ring-white/40" 
                                            : ""
                                    )}
                                >
                                    {item.video ? (
                                        <video 
                                            src={item.video}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    ) : item.image ? (
                                        <img 
                                            src={item.image} 
                                            alt={item.label}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <>
                                            {/* Placeholder gradient background */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
                                            
                                            <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 shadow-inner">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <span className={cn(
                                    "text-xs font-medium px-1 transition-colors pointer-events-none",
                                    isSelected ? "text-white" : "text-white/60 group-hover:text-white/90"
                                )}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Row */}
            <div className="flex w-full items-center justify-between pb-2 px-6 pt-1 gap-3">
                {/* Time Selector */}
                <div className="w-36 shrink-0">
                    <RangeSlider
                        label="Duration"
                        min={1}
                        max={10}
                        step={1}
                        value={duration}
                        onChange={setDuration}
                        displayValue={`${duration}s`}
                    />
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <ModelSelector
                        type="motion"
                        onChange={s.setModel}
                        defaultId={s.model?.id}
                        dynamicModels={s.studioModels}
                        loading={s.studioModelsLoading}
                        className="border-none bg-transparent hover:bg-transparent h-8 text-[12px] font-bold text-white/60 hover:text-white transition-colors"
                    />
                    <button
                        type="button"
                        className="text-white/50 hover:text-white transition-colors"
                    >
                        <Info size={18} strokeWidth={2.5} />
                    </button>
                    <button 
                        type="button"
                        onClick={() => s.handleGenerate()}
                        disabled={s.generating || !currentSelected}
                        className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-full transition-all border shadow-sm active:scale-95",
                            currentSelected
                                ? "bg-white text-black border-white hover:bg-white/90"
                                : "bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white",
                            "disabled:opacity-30 disabled:hover:bg-white/5"
                        )}
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
