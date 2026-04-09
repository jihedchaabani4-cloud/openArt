import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { X } from "lucide-react";

/**
 * PromptControlsPopover
 * A floating panel that appears above the prompt bar.
 */
export function PromptControlsPopover({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "absolute bottom-full left-0 right-0 mb-4 z-50",
            "bg-[#111213F2] backdrop-blur-[60px] border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden",
            "min-h-[220px] flex flex-col"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold tracking-[0.2em] text-white/40 uppercase">
              Prompt Controls
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/[0.02]">
            {children || (
              <span className="text-sm text-white/20 italic">
                No controls available yet
              </span>
            )}
          </div>

          {/* Background Glow */}
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
