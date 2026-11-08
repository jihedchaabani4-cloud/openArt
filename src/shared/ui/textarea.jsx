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
          ? "personality-textarea-wrapper relative w-full rounded-md bg-surface-container p-3.5 sm:p-4 transition-all border border-outline-variant hover:border-outline focus-within:border-primary focus-within:bg-surface-container-high"
          : isBlur
          ? "relative w-full rounded-sm p-3 transition-all border border-outline-variant bg-surface-container hover:border-outline focus-within:border-primary"
          : "relative w-full rounded-md bg-surface-container p-4 transition-all border border-outline-variant hover:border-outline focus-within:border-primary focus-within:bg-surface-container-high"
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
          "w-full bg-transparent text-xs sm:text-sm text-on-surface placeholder:text-on-surface-subtle resize-none outline-none custom-scrollbar leading-relaxed font-sans transition-all duration-150 ease-out",
          isPersonality && "personality-textarea text-on-surface",
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
          <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
            <span>{label} {labelExtra && <span className="font-normal text-on-surface-subtle">{labelExtra}</span>}</span>
          </label>
        )}

        {textareaElement}

        {hint && (
          <p className="text-2xs text-on-surface-subtle leading-relaxed pt-0.5">
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
