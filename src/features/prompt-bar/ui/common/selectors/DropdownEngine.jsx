"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/shared/lib/utils"
import { CheckIcon } from "lucide-react"

// ─── RatioIcon ───────────────────────────────────────────────────────────────
export const RatioIcon = ({ ratio, isSelected }) => {
  if (!ratio || typeof ratio !== "string" || !ratio.includes(":")) return null;
  const [w, h] = ratio.split(":").map(Number);
  if (isNaN(w) || isNaN(h) || w === 0 || h === 0) return null;
  const CW = 32, CH = 24, maxDim = Math.max(w, h), normW = w / maxDim, normH = h / maxDim;
  const PAD = 2, maxW = CW - PAD * 2, maxH = CH - PAD * 2;
  const scale = Math.min(maxW / normW, maxH / normH);
  const rw = Math.max(Math.round(normW * scale), 6), rh = Math.max(Math.round(normH * scale), 6);
  const x = (CW - rw) / 2, y = (CH - rh) / 2;
  return (
    <div className={cn("flex items-center justify-center rounded-md w-8 h-6 text-white")}>
      <svg width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`} fill="none">
        <rect x={x+0.5} y={y+0.5} width={rw-1} height={rh-1} rx="2" stroke="currentColor" strokeWidth={isSelected ? "2" : "1.4"} />
      </svg>
    </div>
  );
};

// ─── useSelectLogic ──────────────────────────────────────────────────────────
export function useSelectLogic(value, onValueChange, config = {}) {
  const { onOpen, onClose, onBeforeSelect, closeOnSelect = true } = config;

  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // Handle open state change callbacks
  useEffect(() => {
    if (open) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [open, onOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [open]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const isDropUp = spaceBelow < 220 && spaceAbove > spaceBelow;

    setPanelStyle({
      position: 'fixed',
      left: rect.left,
      maxWidth: Math.min(280, window.innerWidth - rect.left - 16),
      zIndex: 99999,
      ...(isDropUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  const handleToggle = useCallback(() => {
    if (!open) {
      updatePosition();
    }
    setOpen((prev) => !prev);
  }, [open, updatePosition]);

  // Update position gracefully on scroll/resize
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const handleSelect = useCallback((itemValue) => {
    if (onBeforeSelect) {
      const allowed = onBeforeSelect(itemValue);
      if (allowed === false) return;
    }
    onValueChange?.(itemValue);
    if (closeOnSelect) {
      setOpen(false);
    }
  }, [onValueChange, onBeforeSelect, closeOnSelect]);

  return { open, panelStyle, triggerRef, panelRef, handleToggle, handleSelect };
}

// ─── BaseSelect (Pure Presenter) ────────────────────────────────────────────
export function BaseSelect({
  value,
  displayLabel,
  groups = [],
  className,
  triggerIcon: Icon,
  iconVariant = "standard",
  
  // Logic params
  open,
  panelStyle,
  triggerRef,
  panelRef,
  handleToggle,
  handleSelect,
}) {
  return (
    <div className="relative inline-flex flex-col">
      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        onPointerDown={handleToggle}
        className={cn(
          "flex w-auto max-w-fit items-center gap-1.5",
          "rounded-lg px-3 py-2.5 text-sm text-[#f5f5f5]",
          "bg-transparent hover:bg-white/10 hover:cursor-pointer",
          "disabled:cursor-not-allowed disabled:opacity-50 outline-none",
          className
        )}
      >
        {Icon && <span className="text-white shrink-0">{Icon}</span>}
        <span className="truncate">{displayLabel}</span>
      </button>

      {/* ── Dropdown Panel (Portal) ── */}
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className={cn(
            "min-w-[180px] max-h-[400px] overflow-y-auto",
            "rounded-[10px] px-1 py-1",
            "bg-[#232424] border border-white/5",
            "shadow-[0px_4px_4px_rgba(0,0,0,.1),0px_20px_25px_-5px_rgba(0,0,0,.15)]"
          )}
        >
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div className="px-2.5 py-1.5 pb-0.5 text-xs font-medium text-[#737373] leading-tight">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const isSelected = String(item.value) === String(value);
                const ItemIcon = item.image
                  ? <img src={item.image} alt={item.label} className="size-7 rounded-[4px] object-contain brightness-0 invert" />
                  : item.icon;

                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={item.disabled}
                    onPointerDown={() => !item.disabled && handleSelect(item.value)}
                    className={cn(
                      "group w-full flex items-center gap-2 rounded-[7px] px-2 py-1.5 text-left",
                      "text-[#f5f5f5] cursor-pointer outline-none select-none",
                      "hover:bg-white/5 focus:bg-white/5",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    )}
                  >
                    {/* Icon slot */}
                    {ItemIcon && (
                      <span className={cn(
                        "flex-shrink-0 flex items-center justify-center transition-colors duration-150 group-hover:text-[#f5f5f5]",
                        iconVariant === "square" && "aspect-square h-[36px] -ml-2 -my-1 bg-[#171717] rounded-md border-r border-white/5"
                      )}>
                        {ItemIcon}
                      </span>
                    )}

                    {/* Label + badge */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[0.875rem] font-medium leading-[18px] capitalize truncate">
                          {item.label}
                        </span>
                        {item.badge && <div className="shrink-0">{item.badge}</div>}
                      </div>
                      {item.subtitle && (
                        <span className="text-[0.7rem] text-[#737373] leading-[14px] truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>

                    {/* Checkmark */}
                    {isSelected && <CheckIcon className="size-4 shrink-0 text-white/60 ml-auto" />}
                  </button>
                );
              })}
              {gi < groups.length - 1 && <div className="my-1 h-px bg-white/5" />}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}