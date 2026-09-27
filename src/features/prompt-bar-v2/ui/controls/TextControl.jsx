"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

/**
 * TextControl
 * Generic text input control.
 */
export const TextControl = React.memo(function TextControl({
  definition,
  value,
  onChange,
  error,
  disabled = false,
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[160px]">
      {definition?.label && (
        <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
          {definition.label}
          {definition.required && <span className="text-red-400 ml-1">*</span>}
        </span>
      )}
      <Input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={definition?.description || `Enter ${definition?.label || "text"}...`}
        className={cn(
          "px-3 py-1.5 text-[12px] bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all focus:border-white/30 focus:bg-white/10 placeholder:text-white/30 min-h-0 h-8",
          error && "border-red-500/50 bg-red-500/5",
          disabled && "opacity-50 pointer-events-none"
        )}
      />
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
});
