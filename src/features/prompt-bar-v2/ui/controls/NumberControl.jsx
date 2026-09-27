"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

/**
 * NumberControl
 * Generic numeric stepper / slider control.
 */
export const NumberControl = React.memo(function NumberControl({
  definition,
  value,
  onChange,
  error,
  disabled = false,
}) {
  const min = definition?.min ?? 0;
  const max = definition?.max ?? 100000;
  const step = definition?.step ?? 1;
  const currentVal = value !== undefined && value !== null ? Number(value) : (definition?.default ?? min);

  const handleInputChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange("");
      return;
    }
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <div className="flex flex-col gap-1 min-w-[130px]">
      <div className="flex items-center justify-between">
        {definition?.label && (
          <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
            {definition.label}
          </span>
        )}
        <span className="text-[11px] font-mono text-white/80 tabular-nums">
          {currentVal}
        </span>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl",
          error && "border-red-500/50 bg-red-500/5",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Number.isNaN(currentVal) ? min : currentVal}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
        />

        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-16 px-1.5 py-0.5 text-right font-mono text-[12px] bg-black/40 border border-white/10 rounded-lg text-white outline-none focus:border-white/30 min-h-0 h-6"
        />
      </div>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
});
