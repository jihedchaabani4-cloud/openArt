"use client";

import React from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * EditReferenceList
 * A modular component to display reference images in the Edit Prompt Bar.
 */
export function EditReferenceList({ images = [], onRemove, className }) {
    if (!images || images.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap items-center gap-2 px-1", className)}>
            {images.map((ref, idx) => (
                <button 
                    key={ref.id || idx} 
                    type="button"
                    onClick={() => onRemove?.(ref.url)}
                    className="relative group/ref w-14 h-14 rounded-2xl overflow-hidden border  shadow-xl shrink-0 transition-all hover:border-red-500/50 hover:ring-2 hover:ring-red-500/20 cursor-pointer"
                    title="Click to remove"
                >
                    <img 
                        src={ref.url} 
                        alt="Reference" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/ref:scale-110"
                    />
                    <div className="absolute inset-0 bg-red-600/40 opacity-0 group-hover/ref:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                        <X size={16} className="text-white drop-shadow-md scale-75 group-hover/ref:scale-100 transition-transform duration-300" />
                    </div>
                </button>
            ))}
        </div>
    );
}
