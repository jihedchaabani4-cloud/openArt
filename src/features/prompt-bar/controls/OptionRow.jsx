"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { RatioIcon } from "../platform/DropdownEngine.jsx";

/**
 * OptionRow
 *
 * Universal Row List Component for parameters.
 * Each item in the horizontal list renders [icon + label].
 *
 * Capabilities:
 * - Takes an array of options: string[] or { value, label, icon, disabled }[]
 * - Icon can be:
 *    1. React node / SVG (e.g. <RatioIcon />)
 *    2. GoogleIcon name string (e.g. "image", "auto_awesome")
 *    3. Image URL (starting with "/" or "http")
 *    4. Auto-detected RatioIcon if value is like "16:9", "1:1"
 *    5. null/undefined (text-only)
 * - Smooth drag-to-scroll for long rows (e.g. multiple ratios)
 * - Selected vs Unselected states with high contrast styling
 *
 * Props:
 *   label?: string               // Optional parameter header (e.g. "Aspect Ratio")
 *   value: any                   // Current selected value
 *   onChange: (val: any) => void // Callback on selection
 *   options: Array<any>          // Array of option items
 *   disabled?: boolean
 *   error?: string
 *   className?: string
 */
export const OptionRow = React.memo(function OptionRow({
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

  // ── Drag-to-scroll support for long horizontal lists ────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    const onMouseDown = (e) => {
      isDown = true;
      hasMoved = false;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
      setIsDragging(false);
    };

    const onMouseUp = () => {
      isDown = false;
      setTimeout(() => setIsDragging(false), 50);
    };

    const onMouseMove = (e) => {
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

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  // ── Normalize options into { value, label, icon, disabled } ─────────────
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
      // Simple string or number
      return {
        value: opt,
        label: String(opt),
        icon: null,
        disabled: false,
      };
    });
  }, [options]);

  // Helper to render the item's icon
  const renderIcon = (opt, isSelected) => {
    const iconVal = opt.icon;
    const strVal = String(opt.value);

    // 1. Explicit React element / JSX
    if (React.isValidElement(iconVal)) {
      return iconVal;
    }

    // 2. Image URL (e.g. "/icon.png" or "https://...")
    if (typeof iconVal === "string" && (iconVal.startsWith("/") || iconVal.startsWith("http"))) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconVal}
          alt=""
          className={cn(
            "size-4 rounded object-contain shrink-0",
            !isSelected && "brightness-0 invert opacity-70"
          )}
        />
      );
    }

    // 3. Named GoogleIcon string (e.g. "image", "auto_awesome")
    if (typeof iconVal === "string" && iconVal.length > 0) {
      return (
        <GoogleIcon
          iconName={iconVal}
          className={cn("text-[15px] shrink-0", isSelected ? "text-black" : "text-white/70")}
        />
      );
    }

    // 4. Auto-detect aspect ratio icon (e.g. "16:9", "1:1", "9:16")
    if (strVal.includes(":") && strVal.split(":").length === 2) {
      return (
        <span className={cn("shrink-0", isSelected ? "text-black" : "text-white/70")}>
          <RatioIcon ratio={strVal} isSelected={isSelected} />
        </span>
      );
    }

    return null;
  };

  return (
    <div className={cn("flex flex-col gap-1.5 min-w-0", className)}>
      {/* ── Optional Header Label ── */}
      {label && (
        <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase select-none">
          {label}
        </span>
      )}

      {/* ── Segmented Row Container ── */}
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
          const iconElement = renderIcon(opt, isSelected);

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
                "flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap shrink-0",
                isDragging && "pointer-events-none",
                isSelected
                  ? "bg-white text-black font-semibold shadow-sm"
                  : isDisabled
                  ? "opacity-30 cursor-not-allowed text-white/40"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              {/* 1. Icon slot */}
              {iconElement}

              {/* 2. Label slot */}
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Validation error message ── */}
      {error && <span className="text-[10px] text-red-400 select-none">{error}</span>}
    </div>
  );
});
