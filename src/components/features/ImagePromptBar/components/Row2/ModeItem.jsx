// src/components/features/ImagePromptBar/components/Row2/ModeItem.jsx
import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export function ModeItem({ mode, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer text-left",
        isSelected
          ? "bg-white/10 text-white"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className={cn(
          "flex items-center justify-center size-6 rounded-md shrink-0",
          isSelected ? "bg-white/20 text-white" : "bg-white/5 text-white/50"
        )}>
          <mode.icon size={13} strokeWidth={2.5} />
        </span>
        {mode.label}
      </div>
      {isSelected && <Check size={14} className="text-white/50" />}
    </button>
  );
}
