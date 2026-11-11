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
        "relative w-full transition-all border outline-none font-sans antialiased",
        "bg-[var(--bg-surface-2)] border-[var(--border-default)] hover:border-[var(--border-subtle)] focus-within:border-[var(--brand)]",
        isPersonality
          ? "personality-textarea-wrapper rounded-[var(--r-lg)] p-3.5 sm:p-4"
          : isBlur
          ? "rounded-[var(--r-sm)] p-3"
          : "rounded-[var(--r-lg)] p-4"
      )}
    >
      <textarea
        ref={innerRef}
        value={value}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none outline-none leading-relaxed font-sans transition-all duration-150 ease-out scrollbar-hide",
          isPersonality && "personality-textarea",
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
        <div className={cn("personality-section flex flex-col gap-2 w-full", containerClassName)}>
          {label && (
            <div className="label-row flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
              <span className="field-label">
                <span>{label}</span>
                {labelExtra && (
                  <span className="field-label-optional pl-1 font-normal text-[var(--text-tertiary)]">
                    {labelExtra}
                  </span>
                )}
              </span>
            </div>
          )}

          {textareaElement}

          {hint && (
            <div className="disclaimer-overflow pt-0.5">
              <span className="disclaimer-text text-xs text-[var(--text-tertiary)] leading-relaxed">{hint}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={cn("flex flex-col gap-2 w-full", containerClassName)}>
        {label && (
          <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
            <span>{label} {labelExtra && <span className="font-normal text-[var(--text-tertiary)]">{labelExtra}</span>}</span>
          </label>
        )}

        {textareaElement}

        {hint && (
          <p className="text-xs text-[var(--text-tertiary)] leading-relaxed pt-0.5">
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
export default Textarea;
