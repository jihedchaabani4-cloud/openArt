"use client";

import React from "react";
import { BaseSelector } from "../ui/common/selectors/BaseSelector";

/**
 * SelectControl
 * Prompt Bar Platform — Segmented selector for enum/select parameters.
 * Directly utilizes BaseSelector for smooth drag-to-scroll production styling.
 *
 * Props:
 *   definition: ParameterDefinition { name, label, values: [{ value, label, disabled }] }
 *   value: currently selected value
 *   onChange: (nextValue) => void
 *   error: string (optional)
 *   disabled: boolean (optional)
 */
export const SelectControl = React.memo(function SelectControl({
  definition,
  value,
  onChange,
  error,
  disabled = false,
}) {
  const options = React.useMemo(() => {
    return (definition?.values || []).map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return {
          value: opt.value,
          label: opt.label || String(opt.value),
          disabled: opt.disabled || disabled,
          icon: opt.icon,
        };
      }
      return {
        value: opt,
        label: String(opt),
        disabled,
      };
    });
  }, [definition?.values, disabled]);

  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      {definition?.label && (
        <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
          {definition.label}
        </span>
      )}
      <BaseSelector
        value={value}
        onChange={onChange}
        options={options}
      />
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
});
