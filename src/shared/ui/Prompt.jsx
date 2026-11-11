"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Prompt Primitive — design-system 04-inputs.md §4
 * Contenteditable prompt editor for the composer
 */
export const Prompt = React.forwardRef(function Prompt(
  {
    placeholder = "Type a prompt...",
    value,
    defaultValue,
    onChange,
    disabled = false,
    className,
    ...props
  },
  ref
) {
  const innerRef = React.useRef(null);
  const compRef = ref || innerRef;

  const handleInput = (e) => {
    if (onChange) {
      onChange(e.currentTarget.textContent || "");
    }
  };

  return (
    <div
      ref={compRef}
      contentEditable={!disabled}
      role="textbox"
      aria-multiline="true"
      data-placeholder={placeholder}
      onInput={handleInput}
      className={cn("prompt select-text", disabled && "opacity-50 cursor-not-allowed", className)}
      {...props}
    >
      {value || defaultValue}
    </div>
  );
});

Prompt.displayName = "Prompt";
export default Prompt;
