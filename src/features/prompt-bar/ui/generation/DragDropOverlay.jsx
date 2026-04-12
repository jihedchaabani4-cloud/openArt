import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function DragDropOverlay({
    isDragging,
    generationMode,
    onDropStart,
    onDropEnd,
    onDropIngredient,
    onDragLeaveBase
}) {
    // Show two slots if it's keyframe, otherwise one generic slot
    const isKeyframeMode = generationMode === 'keyframe';

    return (
        <AnimatePresence>
            {isDragging && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative w-full h-[60px] flex items-center justify-center bg-[#1c1c1c] rounded-2xl overflow-hidden border border-white/5 shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.4)]"
                    onDragLeave={onDragLeaveBase}
                >
                    {isKeyframeMode ? (
                        <div className="flex items-center w-full h-full">
                            <DropZone 
                                label="Add start frame" 
                                onDrop={onDropStart} 
                                className="border-r border-white/5"
                            />
                            <DropZone 
                                label="Add end frame" 
                                onDrop={onDropEnd} 
                            />
                        </div>
                    ) : (
                        <DropZone 
                            label="Add Ingredient" 
                            onDrop={onDropIngredient} 
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function DropZone({ label, onDrop, className }) {
    const [isOver, setIsOver] = useState(false);

    return (
        <div
            onDragOver={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                setIsOver(true); 
            }}
            onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOver(false);
            }}
            onDrop={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                setIsOver(false); 
                onDrop?.(e); 
            }}
            className={cn(
                "flex-1 flex items-center justify-center gap-2 transition-all h-full w-full",
                "bg-transparent text-white",
                isOver && "bg-white/5 shadow-inner",
                className
            )}
        >
            <Plus size={16} strokeWidth={2} className="text-white/80" />
            <span className="text-[13px] font-medium tracking-wide text-white/90">{label}</span>
        </div>
    );
}
