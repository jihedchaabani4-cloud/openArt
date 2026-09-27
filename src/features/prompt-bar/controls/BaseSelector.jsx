"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import { RatioIcon } from "../ui/common/selectors/DropdownEngine.jsx";

/**
 * BaseSelector
 *
 * Generic Segmented Selector Component adapted from the old Cinema Studio Prompt Bar.
 *
 * Design:
 * - Rounded-xl frosted container (bg-white/5)
 * - Drag-to-scroll support for long horizontal option rows
 * - High-contrast active state (bg-white text-black font-semibold shadow-sm)
 * - Muted inactive state (text-white/80 hover:text-white hover:bg-white/10)
 * - Each item supports: [icon + label]
 *
 * Data Contract:
 * - label?: string               // Parameter header label (e.g. "Aspect Ratio", "Quality")
 * - value: any                   // Currently selected value
 * - onChange: (newVal) => void   // Selection callback
 * - options: Array<Option>       // Array of items: string or { value, label, icon, disabled }
 * - disabled?: boolean
 * - error?: string
 * - className?: string
 */
export const BaseSelector = React.memo(function BaseSelector({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  error,
  className,
}) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── Drag-to-scroll support (exact Cinema Studio behavior) ─────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
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
      const x = e.pageX - el.offsetLeft;
      const walk = x - startX;
      if (Math.abs(walk) > 4) {
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

  // ── Normalize incoming options ───────────────────────────────────────────
  const normalizedOptions = React.useMemo(() => {
    return (options || []).map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return {
          value: opt.value,
          label: opt.label !== undefined ? String(opt.label) : String(opt.value),
          icon: opt.icon,
          disabled: Boolean(opt.disabled),
        };
      }
      return {
        value: opt,
        label: String(opt),
        icon: null,
        disabled: false,
      };
    });
  }, [options]);

  // ── Helper to render the item's icon ─────────────────────────────────────
  const renderItemIcon = (opt, isSelected) => {
    const icon = opt.icon;
    const valStr = String(opt.value);

    // 1. Explicit React JSX node
    if (React.isValidElement(icon)) {
      return <span className="shrink-0">{icon}</span>;
    }

    // 2. Image URL
    if (typeof icon === "string" && (icon.startsWith("/") || icon.startsWith("http"))) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={icon}
          alt=""
          className={cn(
            "size-4 rounded object-contain shrink-0",
            !isSelected && "brightness-0 invert opacity-70"
          )}
        />
      );
    }

    // 3. GoogleIcon name
    if (typeof icon === "string" && icon.length > 0) {
      return (
        <GoogleIcon
          iconName={icon}
          className={cn("text-[14px] shrink-0", isSelected ? "text-black" : "text-white/70")}
        />
      );
    }

    // 4. Auto-detect aspect ratio string (e.g. "16:9", "1:1")
    if (valStr.includes(":") && valStr.split(":").length === 2) {
      return (
        <span className={cn("shrink-0", isSelected ? "text-black" : "text-white/70")}>
          <RatioIcon ratio={valStr} isSelected={isSelected} />
        </span>
      );
    }

    return null;
  };

  return (
    <div className={cn("flex flex-col gap-1.5 min-w-0", className)}>
      {/* ── Optional Parameter Label ── */}
      {label && (
        <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase select-none">
          {label}
        </span>
      )}

      {/* ── Segmented Pill Row ── */}
      <div
        ref={containerRef}
        className={cn(
          "flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto scrollbar-hide select-none cursor-grab active:cursor-grabbing",
          error && "border-red-500/50 bg-red-500/5",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        {normalizedOptions.map((opt) => {
          const isSelected = String(value) === String(opt.value) && !opt.disabled;
          const isDisabled = opt.disabled || disabled;
          const iconEl = renderItemIcon(opt, isSelected);

          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (isDragging || isDisabled) return;
                onChange?.(opt.value);
              }}
              className={cn(
                "flex-1 min-w-fit px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all flex flex-row items-center justify-center gap-1.5 relative whitespace-nowrap outline-none shrink-0",
                isDragging && "pointer-events-none",
                isSelected
                  ? "bg-white text-black font-semibold shadow-sm"
                  : isDisabled
                  ? "opacity-30 cursor-not-allowed text-white/40"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              {/* Icon slot */}
              {iconEl}

              {/* Label slot */}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Error message ── */}
      {error && <span className="text-[10px] text-red-400 select-none">{error}</span>}
    </div>
  );
});
