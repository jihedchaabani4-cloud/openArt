"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";

/**
 * HowToDrawer Component
 * Explains how AI Elements work in Cinema Studio.
 */
export function HowToDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-fill-overlay backdrop-blur-sm">
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
            className="relative w-full max-w-md h-full bg-omni-bg text-text-primary border-y-0 border-r-0 border-l border-line-default p-6 flex flex-col justify-between shadow-none z-10 overflow-y-auto"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-line-subtle">
                <div className="flex items-center gap-2">
                  <HugeIcon name="sparkles" size="md" className="text-content-base/80" />
                  <h2 className="ds-type-feature-title text-content-base">How AI Elements Work</h2>
                </div>
              <IconButton
                type="button"
                variant="ghost"
                onClick={onClose}
                aria-label="Close"
              >
                <HugeIcon name="cancel-01" size="md" />
              </IconButton>
            </div>

            {/* Content Steps */}
            <div className="flex flex-col gap-6 pt-6">
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-ui-button-tonal border border-border-weak text-text-primary flex items-center justify-center ds-type-small shrink-0">
                  1
                </div>
                <div>
                  <h3 className="ds-type-caption-label text-text-primary">Upload Reference Photos</h3>
                  <p className="ds-type-small text-text-secondary mt-1">
                    Provide 1 to 6 clear photos of your product, character, or object.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-ui-button-tonal border border-border-weak text-text-primary flex items-center justify-center ds-type-small shrink-0">
                  2
                </div>
                <div>
                  <h3 className="ds-type-caption-label text-text-primary">AI Vision Analysis</h3>
                  <p className="ds-type-small text-text-secondary mt-1">
                    Our AI Vision extracts identity traits, materials, aesthetics, and optimal generation directives.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-ui-button-tonal border border-border-weak text-text-primary flex items-center justify-center ds-type-small shrink-0">
                  3
                </div>
                <div>
                  <h3 className="ds-type-caption-label text-text-primary">Reuse in Studio Prompts</h3>
                  <p className="ds-type-small text-text-secondary mt-1">
                    Type <code className="px-1.5 py-0.5 rounded-sharp bg-ui-button-tonal text-text-primary ds-type-micro-tag font-mono">@Element</code> in the prompt bar to integrate it consistently across any scene.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-line-subtle">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full"
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
