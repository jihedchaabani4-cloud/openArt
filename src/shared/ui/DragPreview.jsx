'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";

/**
 * [FSD Layer: shared/ui]
 * A global drag ghost component that follows the mouse when an image is being dragged.
 * It's visually styled to look like a premium preview.
 */
export function DragPreview() {
    const draggedImage = useGenerationsStore((s) => s.draggedImage);
    
    // Position MotionValues for zero-lag movement 
    // Seed with initial coordinates from the store to avoid "jump"
    const mouseX = useMotionValue(draggedImage?.x ?? -999);
    const mouseY = useMotionValue(draggedImage?.y ?? -999);

    useEffect(() => {
        if (!draggedImage) return;

        // Sync initial position from store immediately to avoid jump
        if (draggedImage.x !== undefined && draggedImage.y !== undefined) {
            mouseX.set(draggedImage.x);
            mouseY.set(draggedImage.y);
        }

        const handleDragOver = (e) => {
            if (e.clientX === 0 && e.clientY === 0) return;
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener("dragover", handleDragOver);
        return () => window.removeEventListener("dragover", handleDragOver);
    }, [draggedImage, mouseX, mouseY]);

    const isVideo = draggedImage?.is_video || draggedImage?.url?.toLowerCase().endsWith(".mp4") || draggedImage?.url?.toLowerCase().endsWith(".webm");

    return (
        <AnimatePresence>
            {draggedImage && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        filter: "blur(0px)",
                    }}
                    exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 450, 
                        damping: 35, 
                        mass: 0.6,
                        opacity: { duration: 0.15 },
                        filter: { duration: 0.2 }
                    }}
                    style={{
                        position: "fixed",
                        pointerEvents: "none",
                        zIndex: 10000,
                        left: mouseX,
                        top: mouseY,
                        x: "-50%",
                        y: "-50%",
                        willChange: "left, top, transform, opacity",
                    }}
                >
                    <div className="relative overflow-hidden rounded-[24px] border border-white/20 shadow-[0_32px_80px_rgba(0,0,0,0.8)] bg-[#0d0e0f]/40 backdrop-blur-md">
                        {isVideo ? (
                            <video
                                src={draggedImage.url}
                                style={{
                                    width: "200px",
                                    aspectRatio: draggedImage.aspect || "1/1",
                                    objectFit: "cover",
                                }}
                                className="opacity-90 saturate-110"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img
                                src={draggedImage.url}
                                alt="Drag Preview"
                                style={{
                                    width: "200px",
                                    aspectRatio: draggedImage.aspect || "1/1",
                                    objectFit: "cover",
                                }}
                                className="opacity-90 saturate-110"
                            />
                        )}
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent pointer-events-none" />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
