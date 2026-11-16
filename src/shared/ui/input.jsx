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

  const isBlurInput = variant === "blurinput";
  const isSearch = variant === "search";
  const hasWrapper = isSearch || isBlurInput || !!Icon || !!googleIcon || !!onClear || showEditButton || !!rightElement || !!label || hasPrefix;

  if (hasWrapper) {
    return (
      <div 
        className={cn(
          "flex flex-col gap-1.5 w-full font-sans antialiased",
          containerClassName
        )}
      >
        {label && (
          <label className="text-xs font-semibold text-white">
            {label}
          </label>
        )}
        <div 
          className={cn(
            "relative flex items-center justify-between w-full shadow-none transition-all outline-none focus-within:border-white/50",
            isSearch
              ? "h-9 px-2.5 rounded-sm bg-white/5 border border-white/10 text-white"
              : "h-9.5 px-3.5 rounded-[10px] bg-white/5 border border-[#27272A] text-white",
            className
          )}
        >
          {googleIcon && (
            <span className="flex items-center justify-center shrink-0 select-none text-white/50 mr-2">
              <GoogleIcon iconName={googleIcon} name={googleIcon} weight={googleIconWeight} className="text-lg shrink-0" />
            </span>
          )}

          {Icon && !googleIcon && (
            <span className="flex items-center justify-center shrink-0 text-white/50 mr-2">
              {renderIconNode(Icon, {
                className: "size-4 text-white/50 shrink-0",
                strokeWidth: iconStrokeWidth ?? 1.75,
              })}
            </span>
          )}

          {hasPrefix && (
            <span className="text-white/50 select-none shrink-0 pointer-events-none mr-1 font-sans text-sm">
              {prefixStr}
            </span>
          )}

          <input
            type={type}
            ref={inputRef}
            placeholder={placeholder}
            value={hasPrefix ? displayValue : value}
            onChange={handleChange}
            className="bg-transparent border-none outline-none p-0 flex-1 placeholder:text-white/50 text-white text-sm font-medium min-w-0 font-sans antialiased shadow-none cursor-text"
            {...props}
          />

          {onClear && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClear}
              className="p-1 size-7 rounded-md shrink-0 ml-1 cursor-pointer hover:bg-white/10"
              aria-label="Clear input"
            >
              {ClearIcon ? (
                renderIconNode(ClearIcon, { className: "size-4" })
              ) : (
                <GoogleIcon iconName="close" className="text-lg text-white/50" />
              )}
            </Button>
          )}

          {showEditButton && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleEditClick}
              className="flex items-center justify-center size-7 p-1.5 rounded-md shrink-0 ml-2 cursor-pointer hover:bg-white/10"
              aria-label="Edit"
            >
              <GoogleIcon iconName="edit" className="text-lg text-white/50" />
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
          ? "bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-white/50 focus:ring-0 p-0 shadow-none cursor-text disabled:opacity-50 font-sans antialiased"
          : "flex h-9.5 w-full rounded-sm border border-[#27272A] bg-white/5 px-3.5 text-white placeholder:text-white/50 hover:border-white/20 focus:border-white/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans antialiased shadow-none cursor-text text-sm",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
