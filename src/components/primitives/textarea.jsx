"use client";

import * as React from "react";
import { Label } from "@/components/base/label";
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
  const isOutline = variant === "outline";
  const isPersonality = variant === "personality" || variant === "flow";

  const textareaElement = (
    <div 
      className={cn(
        isOutline
          ? "ds-input-outline relative w-full rounded-subtle p-3"
          : isPersonality
          ? "personality-textarea-wrapper relative w-full rounded-subtle bg-surface-container p-3.5 sm:p-4 transition-all border border-outline-variant hover:border-outline focus-within:border-primary focus-within:bg-surface-container-high"
          : isBlur
          ? "relative w-full rounded-subtle p-3 transition-all border border-outline-variant bg-surface-container hover:border-outline focus-within:border-primary"
          : "relative w-full rounded-subtle bg-surface-container p-4 transition-all border border-outline-variant hover:border-outline focus-within:border-primary focus-within:bg-surface-container-high"
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
          isOutline
            ? "w-full bg-transparent ds-type-small text-text-primary placeholder:text-text-secondary resize-none outline-none custom-scrollbar font-sans disabled:opacity-50"
            : "w-full bg-transparent ds-type-small text-on-surface placeholder:text-on-surface-subtle resize-none outline-none custom-scrollbar transition-all duration-150 ease-out",
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
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {label && (
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={props.id} disabled={props.disabled}>
              {label}
            </Label>
            {labelExtra && (
              <Label as="span" disabled={props.disabled} className="tabular-nums">
                {labelExtra}
              </Label>
            )}
          </div>
        )}

        {textareaElement}

        {hint && (
          <p className="ds-type-micro-tag text-on-surface-subtle pt-0.5">
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
