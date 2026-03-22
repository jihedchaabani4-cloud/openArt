// src/components/features/ImagePromptBar/components/Row2/ModeSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Image, Film, Video, ChevronDown, Wand2 } from 'lucide-react';
import { cn } from "@/shared/lib/utils";
import { ModeItem } from './ModeItem';

export const MODES = [
  { id: 'image', label: 'Generate Image', icon: Image },
  { id: 'video', label: 'Generate Video', icon: Film },
  { id: 'motion', label: 'Generate Motion', icon: Video },
  { id: 'motion-control', label: 'Motion Control', icon: Wand2 },
];

export function ModeSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentMode = MODES.find(m => m.id === value) || MODES[0];
  const Icon = currentMode.icon;

  return (
    <div ref={ref} className="relative z-[60] ml-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-10 px-3 rounded-[10px] bg-white/5 hover:bg-white/10 border border-white/10 text-[13px] font-medium text-white transition-all cursor-pointer whitespace-nowrap"
      >
        <span className="flex items-center justify-center size-5 rounded-md bg-white/10 shrink-0 text-white/80">
          <Icon size={12} strokeWidth={2.5} />
        </span>
        {currentMode.label}
        <ChevronDown size={14} className="text-white/40 ml-1" />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-[180px] bg-[#1c1c1c] border border-white/10 rounded-[12px] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden origin-bottom-left animate-in fade-in zoom-in-95 duration-200">
          {MODES.map(mode => (
            <ModeItem
              key={mode.id}
              mode={mode}
              isSelected={value === mode.id}
              onClick={() => {
                onChange(mode.id);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
