"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

/**
 * BooleanControl
 * Generic boolean toggle (On / Off).
 */
export const BooleanControl = React.memo(function BooleanControl({
  definition,
  value,
  onChange,
  error,
  disabled = false,
}) {
  const isChecked = Boolean(value);

  return (
    <div className="flex flex-col gap-1">
      {definition?.label && (
        <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
          {definition.label}
        </span>
      )}
      <div
        className={cn(
          "flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl",
          error && "border-red-500/50 bg-red-500/5",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <Button
          type="button"
          variant={!isChecked ? "pill-active" : "pill"}
          size="xs"
          onClick={() => onChange(false)}
          disabled={disabled}
        >
          Off
        </Button>
        <Button
          type="button"
          variant={isChecked ? "pill-active" : "pill"}
          size="xs"
          onClick={() => onChange(true)}
          disabled={disabled}
        >
          On
        </Button>
      </div>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
});
