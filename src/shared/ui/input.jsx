"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
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
  if (typeof IconCandidate === "string" || typeof IconCandidate === "number") {
    return IconCandidate;
  }
  return null;
}

const Input = React.forwardRef(({
  className,
  containerClassName,
  variant = "default",
  type = "text",
  label,
  icon: IconProp,
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
  const hasWrapper = isSearch || isBlurInput || !!IconProp || !!googleIcon || !!onClear || showEditButton || !!rightElement || !!label || hasPrefix;

  const iconName = googleIcon || (typeof IconProp === "string" ? IconProp : null);

  if (hasWrapper) {
    return (
      <div 
        className={cn(
          "flex flex-col gap-1.5 w-full font-sans antialiased",
          containerClassName
        )}
      >
        {label && (
          <label className="text-xs font-semibold text-[var(--text-primary)]">
            {label}
          </label>
        )}
        <div 
          className={cn(
            "relative flex items-center justify-between w-full max-h-full transition-all outline-none font-sans antialiased",
            isSearch
              ? "input-search h-9 rounded-sm shadow-none"
              : isBlurInput
              ? "h-9 rounded-[var(--r-sm)] py-0.5 pr-2.5 pl-3.5 gap-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface-2)] border border-[var(--border-default)] hover:border-[var(--border-subtle)] focus-within:border-[var(--brand)]"
              : "min-h-[44px] rounded-[var(--r-sm)] px-3 py-2 bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-subtle)] focus-within:border-[var(--brand)]"
          )}
        >
          {iconName && (
            <span className={cn("flex items-center justify-center shrink-0 select-none", isSearch ? "size-6 text-[var(--text-tertiary)] mr-1" : "text-[var(--text-tertiary)] mr-2")}>
              <Icon name={iconName} size={isSearch ? 16 : 18} />
            </span>
          )}

          {!iconName && IconProp && (
            <span className={cn("flex items-center justify-center shrink-0", isSearch ? "size-6 text-[var(--text-tertiary)] mr-1" : "mr-2 text-[var(--text-tertiary)]")}>
              {renderIconNode(IconProp, {
                className: "size-4 text-[var(--text-tertiary)] shrink-0",
                strokeWidth: iconStrokeWidth ?? 1.5,
              })}
            </span>
          )}

          {hasPrefix && (
            <span className="text-[var(--text-tertiary)] select-none shrink-0 pointer-events-none mr-0.5 font-sans text-sm">
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
              "bg-transparent border-none outline-none p-0 flex-1 placeholder:text-[var(--text-tertiary)] text-[var(--text-primary)] min-w-0 font-sans antialiased shadow-none cursor-text",
              isSearch ? "text-[14px] leading-[16px] font-medium" : "text-sm font-medium",
              className
            )}
            {...props}
          />

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className={cn(
                "p-1 size-6 rounded-[var(--r-xs)] text-[var(--text-secondary)] hover:bg-[var(--overlay-10)] hover:text-[var(--text-primary)] shrink-0 ml-1 cursor-pointer transition-colors flex items-center justify-center"
              )}
              aria-label="Clear input"
            >
              {ClearIcon ? (
                renderIconNode(ClearIcon, { className: "size-3.5" })
              ) : (
                <Icon name="close" size={14} />
              )}
            </button>
          )}

          {showEditButton && (
            <button
              type="button"
              onClick={handleEditClick}
              className="flex items-center justify-center size-6 p-1 rounded-[var(--r-xs)] text-[var(--text-secondary)] hover:bg-[var(--overlay-10)] hover:text-[var(--text-primary)] shrink-0 ml-2 cursor-pointer transition-colors"
              aria-label="Edit"
            >
              <Icon name="edit" size={16} />
            </button>
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
          ? "bg-transparent border-none outline-none text-[14px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] max-w-65 p-0 shadow-none cursor-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-sans antialiased"
          : "flex min-h-[40px] w-full rounded-[var(--r-sm)] border border-[var(--border-default)] bg-[var(--bg-surface-2)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] hover:border-[var(--border-subtle)] focus:border-[var(--brand)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 transition-all font-sans antialiased shadow-none cursor-text",
        !isNavbar && !className?.includes("text-") && "text-sm",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
export default Input;
