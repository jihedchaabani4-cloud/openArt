"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { BaseSelector } from "./BaseSelector";

/**
 * FeatureModeSelector
 *
 * Feature-level mode and sub-mode segmented controller.
 * - Top row: Image vs Video
 * - Sub row (only when mode is video): Frames vs Reference
 */
export function FeatureModeSelector({
  mode = "image",
  onModeChange,
  subMode = "frames",
  onSubModeChange,
  className = "",
}) {
  const modeOptions = [
    {
      value: "image",
      label: "Image",
      icon: <GoogleIcon iconName="image" className="text-[14px] mr-1.5" />,
    },
    {
      value: "video",
      label: "Video",
      icon: <GoogleIcon iconName="movie" className="text-[14px] mr-1.5" />,
    },
  ];

  const subModeOptions = [
    {
      value: "frames",
      label: "Frames",
      icon: <GoogleIcon iconName="panorama_wide_angle" className="text-[14px] mr-1.5" />,
    },
    {
      value: "reference",
      label: "Reference",
      icon: <GoogleIcon iconName="extension" className="text-[14px] mr-1.5" />,
    },
  ];

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Top Level: Image / Video */}
      <BaseSelector
        value={mode}
        onChange={onModeChange}
        options={modeOptions}
        variant="white"
      />

      {/* Sub Level: Frames / Reference (Only visible in Video mode) */}
      <AnimatePresence initial={false}>
        {mode === "video" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <BaseSelector
              value={subMode}
              onChange={onSubModeChange}
              options={subModeOptions}
              variant="white"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
