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
                {children}
            </div>
        </form>
    );
}
