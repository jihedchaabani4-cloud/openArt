"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

const Textarea = React.forwardRef(({
  className,
  containerClassName,
  label,
  labelExtra,
  hint,
  value,
  onChange,
  placeholder = "Describe how your character acts...",
  minHeight = 160,
  maxHeight = 300,
  rows = 4,
  ...props
}, ref) => {
  const innerRef = React.useRef(null);

  React.useImperativeHandle(ref, () => innerRef.current);

  const [isOverflowing, setIsOverflowing] = React.useState(false);

  // Auto-resize logic based on scrollHeight
  const adjustHeight = React.useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = "auto";
    const contentHeight = el.scrollHeight;
    const nextHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);
    el.style.height = `${nextHeight}px`;
    setIsOverflowing(contentHeight > maxHeight);
  }, [minHeight, maxHeight]);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = (e) => {
    adjustHeight();
    onChange?.(e);
  };

  const hasContainer = !!label || !!hint;

  const textareaElement = (
    <div 
      className={cn(
        "relative w-full rounded-2xl bg-[oklch(20%_0_0)] p-4 transition-all border border-transparent hover:bg-white/[0.06] focus-within:bg-[oklch(22%_0_0)] focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/20"
      )}
    >
      <textarea
        ref={innerRef}
        value={value}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-xs sm:text-sm text-white/90 placeholder-white/30 resize-none outline-none custom-scrollbar leading-relaxed font-sans transition-[height] duration-150 ease-out",
          isOverflowing ? "overflow-y-auto" : "overflow-hidden",
          className
        )}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
        }}
        {...props}
      />
    </div>
  );

  if (hasContainer) {
    return (
      <div className={cn("flex flex-col gap-2 w-full", containerClassName)}>
        {label && (
          <label className="text-xs font-semibold text-white/80 flex items-center justify-between">
            <span>{label} {labelExtra && <span className="font-normal text-white/40">{labelExtra}</span>}</span>
          </label>
        )}

        {textareaElement}

        {hint && (
          <p className="text-[11px] text-white/40 leading-relaxed pt-0.5">
            {hint}
          </p>
        )}
      </div>
    );
  }

  return textareaElement;
});

Textarea.displayName = "Textarea";

export { Textarea };
