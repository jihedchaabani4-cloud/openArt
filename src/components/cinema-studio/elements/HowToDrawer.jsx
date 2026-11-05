"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/shared/ui/button";

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
          className="relative w-full max-w-md h-full bg-[#121215] border-l border-white/10 p-6 flex flex-col justify-between shadow-none z-10 overflow-y-auto"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white/80" />
                <h2 className="text-lg font-bold text-white">How AI Elements Work</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="size-9 p-0 rounded-full hover:bg-white/10 text-white"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content Steps */}
            <div className="flex flex-col gap-6 pt-6">
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center text-xs font-bold shrink-0">
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
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Vision Analysis</h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Our AI Vision extracts identity traits, materials, aesthetics, and optimal generation directives.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Reuse in Studio Prompts</h3>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                    Type <code className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">@Element</code> in the prompt bar to integrate it consistently across any scene.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full h-10 px-6 text-sm"
            >
              Got it
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default HowToDrawer;
