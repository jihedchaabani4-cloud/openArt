"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

const Input = React.forwardRef(({
  className,
  containerClassName,
  type = "text",
  label,
  icon: Icon,
  onClear,
  clearIcon: ClearIcon,
  showEditButton,
  onEditClick,
  rightElement,
  prefix,
  placeholder,
  value,
  onChange,
  ...props
}, ref) => {
  const inputRef = React.useRef(null);

  React.useImperativeHandle(ref, () => inputRef.current);

  const handleEditClick = (e) => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    onEditClick?.(e);
  };

  const hasPrefix = !!prefix;
  const prefixStr = typeof prefix === "string" ? prefix : "@";

  const displayValue = React.useMemo(() => {
    if (typeof value === "string" && hasPrefix && value.startsWith(prefixStr)) {
      return value.slice(prefixStr.length);
    }
    return value;
  }, [value, hasPrefix, prefixStr]);

  const handleChange = (e) => {
    if (!onChange) return;
    if (hasPrefix) {
      const rawVal = e.target.value;
      const cleanVal = rawVal.startsWith(prefixStr) ? rawVal.slice(prefixStr.length) : rawVal;
      const fullVal = cleanVal ? prefixStr + cleanVal : prefixStr;
      const customEvent = {
        ...e,
        target: { ...e.target, value: fullVal },
        currentTarget: { ...e.currentTarget, value: fullVal },
      };
      onChange(customEvent);
    } else {
      onChange(e);
    }
  };

  const hasWrapper = !!Icon || !!onClear || showEditButton || !!rightElement || !!label || hasPrefix;

  const textClasses = React.useMemo(() => {
    if (!className) return "";
    return className
      .split(" ")
      .filter((c) => c.startsWith("text-") || c.startsWith("font-") || c.startsWith("tracking-") || c.startsWith("leading-"))
      .join(" ");
  }, [className]);

  if (hasWrapper) {
    return (
      <div 
        className={cn("sc-43d80680-1 bremDC flex flex-col gap-1.5 w-full font-sans", containerClassName)}
        style={{
          WebkitTapHighlightColor: "transparent",
          textRendering: "optimizeSpeed",
          boxSizing: "border-box",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {label && (
          <label className="text-xs font-semibold text-white/80">
            {label}
          </label>
        )}
        <div className="sc-43d80680-3 zuyCa relative flex items-center justify-between w-full min-h-[52px] rounded-md px-3 py-2 bg-transparent border-none outline-none hover:bg-white/5 focus-within:bg-[oklch(20%_0_0)] transition-all">
          {Icon && (
            <Icon className="size-4 text-white/70 shrink-0 mr-2.5" strokeWidth={2.5} />
          )}

          {hasPrefix && (
            <span className={cn("text-white/70 select-none shrink-0 pointer-events-none mr-0.5 font-sans", textClasses || "text-sm")}>
              {prefixStr}
            </span>
          )}

          <input
            type={type}
            ref={inputRef}
            placeholder={placeholder}
            value={hasPrefix ? displayValue : value}
            onChange={handleChange}
            className={cn(
              "sc-43d80680-5 dQKPMK bg-transparent border-none outline-none p-0 flex-1 placeholder:text-white/40 text-white min-w-0 font-sans shadow-none cursor-text",
              !className?.includes("text-") && "text-sm",
              className
            )}
            style={{
              borderStyle: "none",
              borderWidth: "medium",
              borderColor: "currentColor",
              borderImage: "none",
              boxShadow: "none",
            }}
            {...props}
          />

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-md text-white/60 hover:text-white transition-colors shrink-0 ml-2"
              aria-label="Clear input"
            >
              {ClearIcon ? <ClearIcon className="size-5" /> : <span className="text-xs font-bold px-1">Clear</span>}
            </button>
          )}

          {showEditButton && (
            <button
              type="button"
              onClick={handleEditClick}
              className="sc-43d80680-4 gEyGfK flex items-center justify-center p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2 cursor-pointer"
              aria-label="Edit"
            >
              <GoogleIcon iconName="edit" className="text-[1.25rem]" />
            </button>
          )}

          {rightElement}
        </div>
      </div>
    );
  }

  return (
    <input
      type={type}
      ref={ref}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={cn(
        "flex min-h-[52px] w-full rounded-md border-none bg-transparent px-3 py-2 text-white placeholder:text-white/40 hover:bg-white/5 focus:bg-[oklch(20%_0_0)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans shadow-none cursor-text p-0",
        !className?.includes("text-") && "text-sm",
        className
      )}
      style={{
        WebkitTapHighlightColor: "transparent",
        textRendering: "optimizeSpeed",
        borderStyle: "none",
        boxShadow: "none",
      }}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
