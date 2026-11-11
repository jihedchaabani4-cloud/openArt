"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/button";

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
// DropdownShell — base Radix dropdown wrapper
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
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "size-9 rounded-[var(--r-sm)] flex items-center justify-center transition-all p-0",
            isActive
              ? "bg-[var(--overlay-10)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--overlay-5)] hover:text-[var(--text-primary)]"
          )}
        >
          {trigger}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn(panelWidth, className)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownSegmented — horizontal segmented toggle group
// ─────────────────────────────────────────────────────────────────────────────

export const DropdownSegmented = React.memo(function DropdownSegmented({
  value,
  onChange,
  options,
  className,
  variant = "default",
  compact = false,
  visibleCount = null,
}) {
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
      setTimeout(() => setIsDragging(false), 50);
    };

    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        hasMoved = true;
        setIsDragging(true);
      }
      el.scrollLeft = scrollLeft - walk;
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

  const itemStyle = visibleCount
    ? { flexShrink: 0, flexGrow: 0, width: `calc((100% - 8px - ${(visibleCount - 1) * 4}px) / ${visibleCount})` }
    : {};

  return (
    <div
      className={cn(
        "toggle-group flex items-center gap-1 p-1 bg-[var(--overlay-5)] border border-[var(--border-subtle)] rounded-[var(--r-sm)] min-w-0 w-full select-none",
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
                "toggle flex-toggle rounded-[var(--r-sm)] h-8 min-h-8 text-xs font-medium transition-all flex items-center justify-center relative",
                compact ? "p-1.5 size-12 shrink-0 [&_svg]:size-full" : "flex-row gap-1.5 px-3 py-1 flex-1 min-w-fit",
                visibleCount ? "flex-none" : !compact ? "flex-1 min-w-fit" : "",
                isDragging && "pointer-events-none",
                opt.disabled && "opacity-30 cursor-not-allowed pointer-events-none"
              )}
            >
              {opt.icon && (
                <span
                  className={cn(
                    "flex items-center justify-center text-base",
                    isSelected && variant === "white" && "text-[var(--text-on-brand)]",
                    compact && "size-full"
                  )}
                >
                  {renderIconNode(opt.icon)}
                </span>
              )}
              <span className="truncate">{opt.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
});
