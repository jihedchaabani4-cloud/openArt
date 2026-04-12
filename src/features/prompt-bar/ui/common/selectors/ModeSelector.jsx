import { motion, AnimatePresence } from "framer-motion";
import { Image, Video, Frame, FlaskConical, Activity } from "lucide-react";
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
    { value: 'image', label: 'Image', icon: <Image size={15} className="mr-1" /> },
    { value: 'video', label: 'Video', icon: <Video size={15} className="mr-1" /> },
  ];

  const row2Options = [
    { value: 'keyframe', label: 'Frames',      icon: <Frame size={15} className="mr-1" /> },
    { value: 'multiref', label: 'Ingredients', icon: <FlaskConical size={15} className="mr-1" /> },
    { value: 'motion-control', label: 'Control', icon: <Activity size={15} className="mr-1" /> },
  ];

  // Determine top row value
  const row1Value = isVideoMode ? 'video' : 'image';

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
              value={value}
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

