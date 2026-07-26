"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Layers, Image as ImageIcon, CheckCircle2 } from "lucide-react";

/**
 * HowToDrawer Component
 * Explains how AI Elements work in Cinema Studio.
 */
export function HowToDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="relative w-full max-w-md h-full bg-[#121215] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">How AI Elements Work</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Steps */}
            <div className="flex flex-col gap-6 pt-6">
              
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Upload Reference Photos</h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Provide 1 to 6 clear photos of your product, character, or object.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Vision Analysis & 3-View Sheet</h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Our AI Vision extracts invariant identity traits and generates a unified 3-view studio reference sheet with <code className="text-blue-300">gpt-image-2</code>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Reuse Throughout Your Project</h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Select your saved Element when generating new scenes. The AI preserves consistency across all angles and lighting.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-medium rounded-xl transition-all"
            >
              Got it
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default HowToDrawer;
