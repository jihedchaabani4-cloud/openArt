"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * PromptBarBase
 * Pure form wrapper — handles form submission.
 * Visual container (background, blur, border, positioning) is owned by the parent.
 */
export function PromptBarBase({ 
    children, 
    className,
    formClassName,
    s, // The prompt bar state from usePromptBar
    onSubmit,
    onDragOver,
    onDrop,
    ...props
}) {
    const submitForm = (e) => {
        if (e) e.preventDefault();
        if (onSubmit) onSubmit(e);
        else s.handleGenerate(e);
    };

    return (
        <form
            onSubmit={submitForm}
            className={cn("w-full flex-col relative transition-all duration-200", formClassName)}
        >
            <div
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={cn("w-full flex flex-col relative", className)}
                {...props}
            >
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
    );
}
