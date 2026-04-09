"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PromptBarBase
 * A reusable container for all prompt bar types.
 * Handles drag-and-drop, common styles, and form management.
 */
export function PromptBarBase({ 
    children, 
    className,
    containerClassName,
    formClassName,
    hideBackground = false,
    s, // The prompt bar state from usePromptBar
    onSubmit,
    maxWidth = "550px"
}) {
    const submitForm = (e) => {
        if (e) e.preventDefault();
        if (onSubmit) onSubmit(e);
        else s.handleGenerate(e);
    };

    return (
        <div className={cn(
            hideBackground ? "w-full" : "fixed bottom-8 left-1/2 -translate-x-1/2 w-full z-50 flex items-center justify-center px-6",
            containerClassName
        )}>
            <div className={cn("flex flex-col gap-3 w-full", !hideBackground && `max-w-[${maxWidth}]`, className)}>
                <form onSubmit={submitForm} className={cn("w-full flex-col relative transition-all duration-200", formClassName)}>
                    <div 
                        onDragEnter={s.handleDragEnter}
                        onDragOver={s.handleDragOver}
                        className={cn(
                            "w-full flex flex-col transition-all duration-200 relative",
                             
                                "rounded-2xl p-3 gap-1.5 border border-white/5 backdrop-blur-[80px] bg-[#161718E6] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        )}
                    >
                        <AnimatePresence>
                            {s.isDragging && (
                                <DragOverlay 
                                    mode={s.generationMode} 
                                    selectedModel={s.selectedModel}
                                    onDrop={s.handleDrop} 
                                    onDragLeave={s.handleDragLeave} 
                                />
                            )}
                        </AnimatePresence>

                        {s.hasChanges && (
                            <button
                                type="button"
                                onClick={s.handleReset}
                                className="absolute right-3 top-3 p-1.5 text-white/30 hover:text-white bg-transparent transition-colors z-50 outline-none"
                                title="Clear everything"
                            >
                                <X size={16} />
                            </button>
                        )}

                        {children}
                    </div>
                </form>
            </div>
        </div>
    );
}

function DragOverlay({ mode, selectedModel, onDrop, onDragLeave }) {
    const isKeyframeOrMotion = mode === 'keyframe' || mode === 'motion-control' || mode === 'motion';
    
    const supportsStart = selectedModel?.support?.keyframe 
        ? !!selectedModel.support.keyframe.start 
        : true;

    const supportsEnd = selectedModel?.support?.keyframe 
        ? !!selectedModel.support.keyframe.end 
        : (isKeyframeOrMotion && mode !== 'motion-control' && mode !== 'motion');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-100 bg-[#0d0e0f]/90 backdrop-blur-sm flex items-center justify-center p-3 gap-3"
            onDragLeave={onDragLeave}
        >
            {!isKeyframeOrMotion ? (
                <DropZone 
                    label="Add Ingredient" 
                    onDrop={(e) => onDrop(e, 'normal')} 
                />
            ) : (
                <>
                    {supportsStart && (
                        <DropZone 
                            label="Add start frame" 
                            onDrop={(e) => onDrop(e, 'start')} 
                        />
                    )}
                    {supportsEnd && (
                        <DropZone 
                            label="Add end frame" 
                            onDrop={(e) => onDrop(e, 'end')} 
                        />
                    )}
                </>
            )}
        </motion.div>
    );
}

function DropZone({ label, onDrop }) {
    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-white/10', 'border-white/20');
            }}
            onDragLeave={(e) => {
                e.currentTarget.classList.remove('bg-white/10', 'border-white/20');
            }}
            onDrop={(e) => {
                e.currentTarget.classList.remove('bg-white/10', 'border-white/20');
                onDrop(e);
            }}
            className={cn(
                "flex-1 h-full min-h-[100px] border border-dashed border-white/10 rounded-3xl",
                "flex flex-col items-center justify-center gap-2 transition-all cursor-copy group"
            )}
        >
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                <Plus size={20} className="text-white/60 group-hover:text-white" />
            </div>
            <span className="text-[13px] font-medium text-white/50 group-hover:text-white">
                {label}
            </span>
        </div>
    );
}
