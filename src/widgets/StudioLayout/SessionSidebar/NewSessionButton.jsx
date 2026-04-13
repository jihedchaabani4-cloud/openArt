"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { SPRING_FAST } from "./constants";

/**
 * NewSessionButton — the "+" button at the top of the session sidebar.
 *
 * Props
 * ─────
 * isExpanded     – whether the sidebar is open (shows label text)
 * isDraggingOver – global drag state (disables pointer events on inner div)
 * isDragOverNew  – whether a workflow is being dragged over this button
 * onCreate       – called when the button is clicked
 * onDragOver     – drag-over handler (e)
 * onDrop         – drop handler (e)
 */
export function NewSessionButton({
    isExpanded,
    isDraggingOver,
    isDragOverNew,
    onCreate,
    onDragOver,
    onDrop,
}) {
    return (
        <div className="px-1 w-[230px] flex justify-start mb-2 shrink-0">
            <button
                className={cn(
                    "flex items-center justify-start w-full p-0 rounded-md transition-all group/btn text-white/40 hover:text-white",
                    isDragOverNew
                        ? "bg-white/10 outline outline-2 outline-white/30 -outline-offset-2"
                        : "hover:bg-white/5"
                )}
                onClick={onCreate}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                {/* Icon box */}
                <motion.div
                    className={cn(
                        "w-13 h-13 flex items-center justify-center rounded-md shrink-0 transition-all duration-0",
                        isDragOverNew
                            ? "bg-black/95 bg-[linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1))]"
                            : "bg-black/65 bg-[linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1))]",
                        isDraggingOver && "pointer-events-none"
                    )}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.93 }}
                    transition={SPRING_FAST}
                >
                    <Plus className="w-4 h-4" />
                </motion.div>

                {/* Animated label */}
                <motion.span
                    className="font-medium text-sm ml-3 whitespace-nowrap overflow-hidden"
                    animate={{
                        opacity: isExpanded ? 1 : 0,
                        x: isExpanded ? 0 : -6,
                    }}
                    transition={SPRING_FAST}
                >
                    New session
                </motion.span>
            </button>
        </div>
    );
}
