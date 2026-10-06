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
        style={{
          WebkitTapHighlightColor: "transparent",
          textRendering: "optimizeSpeed",
          boxSizing: "border-box",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {label && (
          <label className="text-xs font-semibold text-[var(--mat-sys-on-surface,#e3e3e3)]">
            {label}
          </label>
        )}
        <div 
          className={cn(
            "relative flex items-center justify-between w-full transition-all border-none outline-none font-sans antialiased",
            isSearch
              ? "h-[42px] min-h-[42px] rounded-[16px] border border-[var(--foreground-state-05)] px-2.5 gap-2 text-sm text-[var(--mat-sys-on-surface,#e3e3e3)] shadow-[var(--glass-raised-box-shadow)] hover:bg-[var(--foreground-state-15)] focus-within:bg-[var(--foreground-state-15)] focus-within:border-[rgba(218,220,224,0.18)]"
              : isBlurInput
              ? "h-9 min-h-[36px] rounded-[var(--mat-sys-corner-medium,12px)] py-[2px] pr-[10px] pl-[14px] gap-2 text-sm font-medium text-[var(--mat-sys-on-surface,#e3e3e3)] flex-row"
              : "min-h-[52px] rounded-[var(--mat-sys-corner-medium,12px)] px-3 py-2 bg-transparent hover:bg-[var(--foreground-state-05)] focus-within:bg-[var(--foreground-state-10)]"
          )}
          style={
            isSearch
              ? {
                  backgroundColor: "var(--foreground-state-10, rgba(218, 220, 224, 0.1))",
                  backdropFilter: "blur(80px)",
                  WebkitBackdropFilter: "blur(80px)",
                  boxShadow: "var(--glass-raised-box-shadow, 0 16px 32px -8px rgba(0,0,0,0.4))",
                }
              : isBlurInput
              ? {
                  backgroundColor: "var(--foreground-state-10, rgba(218, 220, 224, 0.1))",
                  backdropFilter: "blur(80px)",
                  WebkitBackdropFilter: "blur(80px)",
                }
              : undefined
          }
        >
          {googleIcon && (
            <span className={cn("flex items-center justify-center shrink-0 select-none", isSearch ? "size-7 rounded-full text-[var(--mat-sys-on-surface-variant,#c4c7c5)] mr-0.5" : "text-[var(--mat-sys-on-surface-variant,#8e918f)]")}>
              <GoogleIcon iconName={googleIcon} name={googleIcon} weight={googleIconWeight} className={cn("shrink-0", isSearch ? "text-[20px]" : "text-[1.1rem]")} />
            </span>
          )}

          {Icon && !googleIcon && (
            <span className={cn("flex items-center justify-center shrink-0", isSearch ? "size-7 text-[var(--mat-sys-on-surface-variant,#c4c7c5)] mr-0.5" : isBlurInput ? "mr-0.5" : "mr-2.5 text-[var(--mat-sys-on-surface-variant,#8e918f)]")}>
              {renderIconNode(Icon, {
                className: cn("shrink-0", isSearch ? "text-[20px]" : "size-4 text-[var(--mat-sys-on-surface-variant,#8e918f)]"),
                strokeWidth: iconStrokeWidth ?? (isBlurInput ? 1.75 : 2.0),
              })}
            </span>
          )}

          {hasPrefix && (
            <span className={cn("text-[var(--mat-sys-on-surface-variant,#8e918f)] select-none shrink-0 pointer-events-none mr-0.5 font-sans", textClasses || "text-sm")}>
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
              "bg-transparent border-none outline-none p-0 flex-1 placeholder:text-[var(--mat-sys-on-surface-variant,#8e918f)] text-[var(--mat-sys-on-surface,#e3e3e3)] min-w-0 font-sans antialiased shadow-none cursor-text",
              isSearch ? "text-[13.5px] font-medium leading-normal placeholder:text-[rgba(218,220,224,0.45)]" : "text-sm font-medium",
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
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
                <GoogleIcon iconName="close" className="text-[18px]" />
              )}
            </Button>
          )}

          {showEditButton && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleEditClick}
              className="flex items-center justify-center size-7 p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2 cursor-pointer"
              aria-label="Edit"
            >
              <GoogleIcon iconName="edit" className="text-[1.25rem]" />
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
          ? "bg-transparent border-none outline-none text-md font-medium tracking-tight text-[var(--mat-sys-on-surface,#e3e3e3)] placeholder:[var(--mat-sys-on-surface-variant,#8e918f)] max-w-[260px] focus:text-white focus:ring-0 p-0 shadow-none cursor-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans antialiased"
          : "flex min-h-[52px] w-full rounded-[var(--mat-sys-corner-medium,12px)] border-none bg-transparent px-3 py-2 text-[var(--mat-sys-on-surface,#e3e3e3)] placeholder:text-[var(--mat-sys-on-surface-variant,#8e918f)] hover:bg-[var(--foreground-state-05)] focus:bg-[var(--foreground-state-10)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans antialiased shadow-none cursor-text p-0",
        !isNavbar && !className?.includes("text-") && "text-sm",
        className
      )}
      style={{
        WebkitTapHighlightColor: "transparent",
        textRendering: "optimizeSpeed",
        WebkitFontSmoothing: "antialiased",
        borderStyle: "none",
        boxShadow: "none",
      }}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
