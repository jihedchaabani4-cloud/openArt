"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

/**
 * SelectControl
 * Generic segmented / chip selector for enum/select parameters.
 * 
 * Contract:
 * - definition: { name, label, values: [{ value, label, disabled }] }
 * - value: current selected value
 * - onChange: (nextValue) => void
 * - error: validation error string
 * - disabled: boolean
 */
export const SelectControl = React.memo(function SelectControl({
  definition,
  value,
  onChange,
  error,
  disabled = false,
}) {
  const options = definition?.values || [];

  return (
    <div className="flex flex-col gap-1">
      {definition?.label && (
        <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
          {definition.label}
        </span>
      )}
      <div
        className={cn(
          "flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto scrollbar-hide",
          error && "border-red-500/50 bg-red-500/5",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        {options.map((opt) => {
          const isSelected = String(value) === String(opt.value);
          const isDisabled = opt.disabled || disabled;

          return (
            <Button
              key={String(opt.value)}
              type="button"
              variant={isSelected ? "pill-active" : "pill"}
              size="xs"
              onClick={() => !isDisabled && onChange(opt.value)}
              disabled={isDisabled}
              className={cn(
                "whitespace-nowrap flex items-center gap-1.5",
                isDisabled && "opacity-30 cursor-not-allowed text-white/40"
              )}
            >
              {opt.label || String(opt.value)}
            </Button>
          );
        })}
      </div>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
});
