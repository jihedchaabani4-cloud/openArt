import { motion, AnimatePresence } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { BaseSelector } from "./BaseSelector";

export const MODES = [
  { value: "image",          label: "Image" },
  { value: "keyframe",       label: "Video" },
  { value: "multiref",       label: "Multi" },
  { value: "motion-control", label: "Control" },
];

export function ModeSelector({ value, onChange, className }) {
  const isVideoMode = value !== 'image';

  // Row 1: Top Level (Image vs Video)
  const row1Options = [
    { value: 'image', label: 'Image', icon: <GoogleIcon iconName="image" className="text-[14px] mr-1" /> },
    { value: 'video', label: 'Video', icon: <GoogleIcon iconName="movie" className="text-[14px] mr-1" /> },
  ];

  const row2Options = [
    { value: 'keyframe', label: 'Frames',      icon: <GoogleIcon iconName="filter_frames" className="text-[14px] mr-1" /> },
    { value: 'multiref', label: 'Ingredients', icon: <GoogleIcon iconName="experiment" className="text-[14px] mr-1" /> },
    { value: 'motion-control', label: 'Control', icon: <GoogleIcon iconName="joystick" className="text-[14px] mr-1" /> },
  ];

  // Determine top row value (legacy "video" mode maps to video bucket in UI)
  const row1Value = isVideoMode ? 'video' : 'image';

  const row2EffectiveValue = value === 'video' ? 'keyframe' : value;

  const handleRow1Change = (newVal) => {
    if (newVal === 'image') {
      onChange('image');
    } else {
      // Default to keyframe when switching to Video
      onChange('keyframe');
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Level 1: Image / Video */}
      <BaseSelector
        value={row1Value}
        onChange={handleRow1Change}
        options={row1Options}
        variant="white"
      />

      {/* Level 2: Sub-modes (Only for Video) */}
      <AnimatePresence>
        {isVideoMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <BaseSelector
              value={row2EffectiveValue}
              onChange={onChange}
              options={row2Options}
              variant="white"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

