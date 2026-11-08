/**
 * Input Primitive — OpenArt / Labveil Unified Design System
 * 
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Never add ad-hoc border/bg/color/padding classes.
 * 2. USE CANONICAL VARIANTS: `default`, `search`, `blurinput`.
 * 3. `className` IS EXCLUSIVELY FOR LAYOUT (e.g. `w-full`, `max-w-md`).
 */

"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";

function renderIconNode(IconCandidate, props) {
  if (!IconCandidate) return null;
  if (React.isValidElement(IconCandidate)) {
    return IconCandidate;
  }
  if (
    typeof IconCandidate === "function" ||
    (typeof IconCandidate === "object" && IconCandidate !== null && ("$$typeof" in IconCandidate || "render" in IconCandidate))
  ) {
    const Component = IconCandidate;
    return <Component {...props} />;
  }
  return null;
}

const Input = React.forwardRef(({
  className,
  containerClassName,
  variant = "default",
  type = "text",
  label,
  icon: Icon,
  iconStrokeWidth,
  googleIcon,
  googleIconWeight = 300,
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

  const isBlurInput = variant === "blurinput";
  const isSearch = variant === "search";
  const hasWrapper = isSearch || isBlurInput || !!Icon || !!googleIcon || !!onClear || showEditButton || !!rightElement || !!label || hasPrefix;

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
        className={cn(
          "flex flex-col gap-1.5 w-full font-sans antialiased",
          containerClassName
        )}
      >
        {label && (
          <label className="text-xs font-semibold text-on-surface">
            {label}
          </label>
        )}
        <div 
          className={cn(
            "relative flex items-center justify-between w-full transition-all border-none outline-none font-sans antialiased",
            isSearch
              ? "h-10.5 min-h-10.5 rounded-sm border border-outline-variant px-2.5 gap-2 text-sm text-on-surface shadow-none bg-surface-container hover:bg-surface-container-high focus-within:bg-surface-container-high focus-within:border-primary"
              : isBlurInput
              ? "h-9 min-h-9 rounded-sm py-0.5 pr-2.5 pl-3.5 gap-2 text-sm font-medium text-on-surface flex-row bg-surface-container border border-outline-variant hover:bg-surface-container-high focus-within:border-primary"
              : "min-h-13 rounded-sm px-3 py-2 bg-surface text-on-surface border border-outline-variant hover:border-outline focus-within:border-primary"
          )}
        >
          {googleIcon && (
            <span className={cn("flex items-center justify-center shrink-0 select-none", isSearch ? "size-7 rounded-full text-on-surface-subtle mr-0.5" : "text-on-surface-subtle")}>
              <GoogleIcon iconName={googleIcon} name={googleIcon} weight={googleIconWeight} className={cn("shrink-0", isSearch ? "text-xl" : "text-lg")} />
            </span>
          )}

          {Icon && !googleIcon && (
            <span className={cn("flex items-center justify-center shrink-0", isSearch ? "size-7 text-on-surface-subtle mr-0.5" : isBlurInput ? "mr-0.5" : "mr-2.5 text-on-surface-subtle")}>
              {renderIconNode(Icon, {
                className: cn("shrink-0", isSearch ? "text-xl" : "size-4 text-on-surface-subtle"),
                strokeWidth: iconStrokeWidth ?? (isBlurInput ? 1.75 : 2.0),
              })}
            </span>
          )}

          {hasPrefix && (
            <span className={cn("text-on-surface-subtle select-none shrink-0 pointer-events-none mr-0.5 font-sans", textClasses || "text-sm")}>
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
              "bg-transparent border-none outline-none p-0 flex-1 placeholder:text-on-surface-subtle text-on-surface min-w-0 font-sans antialiased shadow-none cursor-text",
              isSearch ? "text-xs-plus font-medium leading-normal placeholder:text-on-surface-subtle" : "text-sm font-medium",
              className
            )}
            {...props}
          />

          {onClear && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClear}
              className={cn(
                "p-1 size-7 rounded-md text-white/60 hover:text-white transition-colors shrink-0 ml-1 cursor-pointer",
                isSearch && "size-6 rounded-full hover:bg-white/10"
              )}
              aria-label="Clear input"
            >
              {ClearIcon ? (
                renderIconNode(ClearIcon, { className: "size-4" })
              ) : (
                <GoogleIcon iconName="close" className="text-lg" />
              )}
            </Button>
          )}

          {showEditButton && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleEditClick}
              className="flex items-center justify-center size-7 p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2 cursor-pointer"
              aria-label="Edit"
            >
              <GoogleIcon iconName="edit" className="text-xl" />
            </Button>
          )}

          {rightElement}
        </div>
      </div>
    );
  }

  const isNavbar = variant === "navbar" || variant === "inline";

  return (
    <input
      type={type}
      ref={ref}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={cn(
        isNavbar
          ? "bg-transparent border-none outline-none text-md font-medium tracking-tight text-on-surface placeholder:text-on-surface-subtle max-w-65 focus:text-on-surface focus:ring-0 p-0 shadow-none cursor-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans antialiased"
          : "flex min-h-13 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-on-surface placeholder:text-on-surface-subtle hover:border-outline focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans antialiased shadow-none cursor-text",
        !isNavbar && !className?.includes("text-") && "text-sm",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
