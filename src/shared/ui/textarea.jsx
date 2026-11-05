"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

const Textarea = React.forwardRef(({
  className,
  containerClassName,
  variant = "default",
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

  const isBlur = variant === "blur" || variant === "blurinput";
  const isPersonality = variant === "personality" || variant === "flow";

  const textareaElement = (
    <div 
      className={cn(
        isPersonality
          ? "personality-textarea-wrapper relative w-full rounded-lg bg-surface-card p-3.5 sm:p-4 transition-all border border-white/10 hover:border-white/20 focus-within:border-white/30 focus-within:bg-surface-elevated"
          : isBlur
          ? "relative w-full rounded-sm p-3 transition-all border border-white/10 bg-surface-card hover:border-white/20 focus-within:border-white/30"
          : "relative w-full rounded-lg bg-surface-card p-4 transition-all border border-white/10 hover:border-white/20 focus-within:border-white/30 focus-within:bg-surface-elevated"
      )}
      style={undefined}
    >
      <textarea
        ref={innerRef}
        value={value}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-cool-slate resize-none outline-none custom-scrollbar leading-relaxed font-sans transition-[height] duration-150 ease-out",
          isPersonality && "personality-textarea text-white",
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
    if (isPersonality) {
      return (
        <div className={cn("personality-section", containerClassName)}>
          {label && (
            <div className="label-row">
              <span className="field-label">
                <span>{label}</span>
                {labelExtra && (
                  <span className="field-label-optional pl-1">
                    {labelExtra}
                  </span>
                )}
              </span>
            </div>
          )}

          {textareaElement}

          {hint && (
            <div className="disclaimer-overflow">
              <span className="disclaimer-text">{hint}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={cn("flex flex-col gap-2 w-full", containerClassName)}>
        {label && (
          <label className="text-xs font-semibold text-white flex items-center justify-between">
            <span>{label} {labelExtra && <span className="font-normal text-cool-slate">{labelExtra}</span>}</span>
          </label>
        )}

        {textareaElement}

        {hint && (
          <p className="text-[11px] text-cool-slate leading-relaxed pt-0.5">
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
