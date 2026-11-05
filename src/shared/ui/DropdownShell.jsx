"use client"

import * as React from "react"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import { cn } from "@/shared/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Button } from "@/shared/ui/button"

function renderIconNode(IconCandidate, props = {}) {
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

// ─────────────────────────────────────────────────────────────────────────────
// DropdownShell — base template for all studio dropdowns (filter, settings…)
// ─────────────────────────────────────────────────────────────────────────────

export function DropdownShell({
  trigger,
  isActive = false,
  open,
  onOpenChange,
  panelWidth = "w-80",
  align = "end",
  children,
  className,
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      {/* ── Trigger ── */}
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "size-9 rounded-sm flex items-center justify-center transition-all p-0",
            isActive
              ? "bg-transparent text-white/90"
              : "text-white/90 hover:bg-white/10 hover:text-white"
          )}
        >
          {trigger}
        </Button>
      </DropdownMenuTrigger>

      {/* ── Panel ── */}
      <DropdownMenuContent
        align={align}
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn(
          panelWidth,
          "bg-surface-card border border-white/10 rounded-lg p-1.5 z-50 shadow-none text-white",
          className
        )}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownSection — labelled section inside the panel
// ─────────────────────────────────────────────────────────────────────────────

export function DropdownSection({ label, action, className, children }) {
  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-white/90">
          {label}
        </p>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownSegmented — pill-style segmented control
// ─────────────────────────────────────────────────────────────────────────────

export const DropdownSegmented = React.memo(({ value, onChange, options, className, variant = "default", compact = false, visibleCount = null }) => {
  const containerRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let hasMoved = false;

    const handleMouseDown = (e) => {
      isDown = true;
      hasMoved = false;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      setIsDragging(false);
    };

    const handleMouseUp = () => {
      isDown = false;
      // Slight delay so child click handlers can detect isDragging
      setTimeout(() => {
        setIsDragging(false);
      }, 50);
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      const x = e.pageX - el.offsetLeft;
      const walk = x - startX;
      if (Math.abs(walk) > 5) {
        if (!hasMoved) {
          hasMoved = true;
          setIsDragging(true);
        }
        e.preventDefault();
        el.scrollLeft = scrollLeft - walk;
      }
    };

    el.addEventListener("mousedown", handleMouseDown);
    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mouseup", handleMouseUp);
    el.addEventListener("mousemove", handleMouseMove);

    return () => {
      el.removeEventListener("mousedown", handleMouseDown);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  // When visibleCount is set: each item is exactly 1/N of visible area
  // container has p-1 (4px each side = 8px) and gap-1 (4px) between items
  const itemStyle = visibleCount
    ? { flexShrink: 0, flexGrow: 0, width: `calc((100% - 8px - ${(visibleCount - 1) * 4}px) / ${visibleCount})` }
    : {};

  return (
    <div
      className={cn(
        "toggle-group flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-sm min-w-0 w-full select-none",
        className
      )}
      role="radiogroup"
    >
      <div
        ref={containerRef}
        className="flex gap-1 w-full overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
      >
      {options.map((opt) => {
        const isSelected = value === opt.value && !opt.disabled;
        const activeVariant = variant === "white" ? "flow-toggle-white" : "flow-toggle-active";

        return (
          <Button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            variant={isSelected ? (variant === "white" ? "primary" : "secondary") : "ghost"}
            onClick={() => {
              if (isDragging) return;
              if (!opt.disabled) onChange(opt.value);
            }}
            disabled={opt.disabled}
            style={itemStyle}
            className={cn(
              "toggle flex-toggle rounded-sm h-8 min-h-[32px] text-[13px] font-medium transition-all flex items-center justify-center relative",
              compact ? "p-1.5 size-12 shrink-0 [&_svg]:size-full" : "flex-row gap-1.5 px-3 py-1 flex-1 min-w-fit",
              visibleCount ? "flex-none" : !compact ? "flex-1 min-w-fit" : "",
              isDragging && "pointer-events-none",
              opt.disabled && "opacity-30 cursor-not-allowed pointer-events-none"
            )}
          >
            {opt.icon && (
              <span className={cn(
                "flex items-center justify-center text-[16px]",
                isSelected && variant === "white" && "text-black",
                compact && "size-full"
              )}>
                {renderIconNode(opt.icon)}
              </span>
            )}
            <span className="truncate">{opt.label}</span>
          </Button>
        );
      })}
      </div>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// DropdownSegmentedWithLabel — segmented control with a left-side label
// ─────────────────────────────────────────────────────────────────────────────

export const DropdownSegmentedWithLabel = React.memo(({ label, value, onChange, options, className, variant = "default", transparent = false }) => {
  const activeVariant = variant === "white" ? "flow-toggle-white" : "flow-toggle-active";

  return (
    <div className={cn(
      "flex items-center gap-2 p-1 rounded-sm overflow-hidden",
      !transparent && "bg-[rgba(218,220,224,0.05)]",
      className
    )}>
      {label && (
        <span className="text-[13px] font-medium text-[rgba(218,220,224,0.75)] whitespace-nowrap pl-2 shrink-0">
          {label}
        </span>
      )}
      <div className="flex gap-1 flex-1 overflow-x-auto scrollbar-hide">
        {options.map((opt) => {
          const isSelected = value === opt.value && !opt.disabled;
          return (
            <Button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              variant={isSelected ? (variant === "white" ? "primary" : "secondary") : "ghost"}
              onClick={() => !opt.disabled && onChange(opt.value)}
              disabled={opt.disabled}
              className="h-8 min-h-[32px] rounded-sm text-[13px] font-medium px-3 flex-1 min-w-fit"
            >
              {opt.icon && (
                <span className={cn(
                  "mr-1.5 flex items-center justify-center text-[16px]",
                  isSelected && variant === "white" && "text-black"
                )}>
                  {renderIconNode(opt.icon)}
                </span>
              )}
              <span className="truncate">{opt.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  )
})


// ─────────────────────────────────────────────────────────────────────────────
// DropdownChips — multi-select chip group
// ─────────────────────────────────────────────────────────────────────────────

export function DropdownChips({ options, selected, onToggle, accent = "lime" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = selected.includes(opt)
        return (
          <Button
            key={opt}
            type="button"
            variant="ghost"
            onClick={() => onToggle(opt)}
            className={cn(
              "px-2.5 py-1.5 rounded-sm text-xs transition-all font-medium h-auto",
              isSelected
                ? "bg-[#505153] text-white hover:bg-[#505153]"
                : "bg-white/2 text-white hover:text-white hover:bg-white/10"
            )}
          >
            {opt}
          </Button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownFooter — statistics + reset row
// ─────────────────────────────────────────────────────────────────────────────

export function DropdownFooter({ hasBorder = true, left, right }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pt-4",
        hasBorder && "border-t border-white/5"
      )}
    >
      <div>{left}</div>
      <div>{right}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownStat — "Showing X of Y" label
// ─────────────────────────────────────────────────────────────────────────────

export function DropdownStat({ count, total, label = "Showing" }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-white uppercase font-medium tracking-widest">{label}</span>
      <span className="text-xs text-white font-medium tabular-nums">
        {count} of {total} items
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownReset — "Reset all" button
// ─────────────────────────────────────────────────────────────────────────────

export function DropdownReset({ onReset, label = "Reset", className }) {
  return (
    <Button
      variant="ghost"
      onClick={onReset}
      className={cn("h-7 px-2 text-[11px] font-medium text-white/40 hover:text-white hover:bg-white/5", className)}
    >
      <GoogleIcon iconName="close" className="mr-1.5 text-[14px]" />
      {label}
    </Button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownClearAction — small "Clear" link
// ─────────────────────────────────────────────────────────────────────────────

export function DropdownClearAction({ onClick, label = "Clear" }) {
  return (
    <Button
      type="button"
      variant="link"
      onClick={onClick}
      className="text-[10px] text-white font-medium hover:underline p-0 h-auto"
    >
      {label}
    </Button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownToggle — Off/On pill toggle
// ─────────────────────────────────────────────────────────────────────────────

export const DropdownToggle = React.memo(({ value, onChange }) => {
  return (
    <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-sm">
      <Button
        type="button"
        variant="ghost"
        onClick={() => onChange(false)}
        className={cn(
          "px-3 py-1 rounded-sm text-xs font-medium transition-all h-auto",
          !value ? "bg-[#505153] text-white hover:bg-[#505153]" : "text-white hover:text-white/50"
        )}
      >
        Off
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onChange(true)}
        className={cn(
          "px-3 py-1 rounded-sm text-xs font-medium transition-all h-auto",
          value ? "bg-[#505153] text-white hover:bg-[#505153]" : "text-white hover:text-white/50"
        )}
      >
        On
      </Button>
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// DropdownRow — icon + label + right-slot row
// ─────────────────────────────────────────────────────────────────────────────

export function DropdownRow({ icon, label, children, className }) {
  return (
    <div className={cn("flex items-center justify-between py-2", className)}>
      <div className="flex items-center gap-3 text-white/50">
        <span className="size-4 flex items-center justify-center [&>svg]:size-4">
          {renderIconNode(icon)}
        </span>
        <span className="text-sm text-white">{label}</span>
      </div>
      {children}
    </div>
  )
}
