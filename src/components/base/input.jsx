"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";
import { Button } from "@/components/base/button";

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

  const isBare = variant === "composer" || variant === "navbar" || variant === "inline" || variant === "transparent";
  const isGhost = variant === "ghost" || variant === "blurinput";
  const isAccent = variant === "accent" || variant === "search" || variant === "filled";
  const isSearch = variant === "search";
  const resolvedGoogleIcon = googleIcon || (isSearch && !Icon ? "search" : undefined);
  const hasWrapper = isSearch || isAccent || isGhost || isBare || !!Icon || !!resolvedGoogleIcon || !!onClear || showEditButton || !!rightElement || !!label || hasPrefix;

  if (hasWrapper) {
    return (
      <div 
        className={cn(
          "flex flex-col gap-1.5 w-full font-sans antialiased",
          containerClassName
        )}
      >
        {label && (
          <label className="text-xs font-semibold text-text-primary">
            {label}
          </label>
        )}
        <div 
          className={cn(
            isBare
              ? "ds-input-bare bg-transparent border-none outline-none shadow-none p-0 h-auto flex items-center justify-between w-full hover:bg-transparent focus-within:bg-transparent"
              : isGhost
                ? "ds-input-ghost relative flex items-center justify-between w-full h-9 px-3 rounded-2xl bg-white-5 hover:bg-ui-button-hover focus-within:bg-ui-button-hover border-none outline-none transition-colors"
                : isAccent
                  ? "ds-input ds-input-accent ds-input-search relative flex items-center justify-between w-full h-9 px-2.5 rounded-lg bg-accent/50 hover:bg-accent/70 focus-within:bg-accent/70 border-none outline-none transition-colors"
                  : "ds-input relative flex items-center justify-between w-full border-none outline-none",
            className
          )}
        >
          {resolvedGoogleIcon && (
            <span className="flex items-center justify-center shrink-0 select-none text-icon-secondary mr-2">
              <GoogleIcon iconName={resolvedGoogleIcon} name={resolvedGoogleIcon} weight={googleIconWeight} className="text-lg shrink-0" />
            </span>
          )}

          {Icon && !googleIcon && (
            <span className="flex items-center justify-center shrink-0 text-icon-secondary mr-2">
              {renderIconNode(Icon, {
                className: "size-4 text-icon-secondary shrink-0",
                strokeWidth: iconStrokeWidth ?? 1.75,
              })}
            </span>
          )}

          {hasPrefix && (
            <span className="text-text-secondary select-none shrink-0 pointer-events-none mr-1 font-sans text-sm">
              {prefixStr}
            </span>
          )}

          <input
            type={type}
            ref={inputRef}
            placeholder={placeholder}
            value={hasPrefix ? displayValue : value}
            onChange={handleChange}
            className="bg-transparent border-none outline-none p-0 flex-1 placeholder:text-text-secondary text-text-primary text-sm font-medium min-w-0 font-sans antialiased shadow-none cursor-text"
            {...props}
          />

          {onClear && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClear}
              className="p-1 size-7 rounded-md shrink-0 ml-1 cursor-pointer hover:bg-ui-button-tonal"
              aria-label="Clear input"
            >
              {ClearIcon ? (
                renderIconNode(ClearIcon, { className: "size-4" })
              ) : (
                <GoogleIcon iconName="close" className="text-lg text-icon-secondary" />
              )}
            </Button>
          )}

          {showEditButton && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleEditClick}
              className="flex items-center justify-center size-7 p-1.5 rounded-md shrink-0 ml-2 cursor-pointer hover:bg-ui-button-tonal"
              aria-label="Edit"
            >
              <GoogleIcon iconName="edit" className="text-lg text-icon-secondary" />
            </Button>
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
        isBare
          ? "ds-input-bare bg-transparent border-none outline-none text-sm font-medium text-text-primary placeholder:text-text-secondary focus:ring-0 hover:bg-transparent focus:bg-transparent p-0 shadow-none cursor-text disabled:opacity-50 font-sans antialiased"
          : isGhost
            ? "ds-input-ghost flex w-full h-9 px-3 rounded-2xl bg-white-5 hover:bg-ui-button-hover focus:bg-ui-button-hover border-none outline-none placeholder:text-text-secondary text-text-primary text-sm font-medium transition-colors cursor-text"
            : isAccent
              ? "ds-input ds-input-accent ds-input-search flex w-full h-9 px-2.5 rounded-lg bg-accent/50 hover:bg-accent/70 focus:bg-accent/70 border-none outline-none placeholder:text-text-secondary text-text-primary text-sm font-medium transition-colors cursor-text"
              : "ds-input flex w-full border-none outline-none placeholder:text-text-secondary disabled:cursor-not-allowed disabled:opacity-50 cursor-text",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
