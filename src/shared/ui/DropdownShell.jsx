"use client"

import * as React from "react"
import { X, Volume2, Eye, Eraser } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

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
        <button
          type="button"
          className={cn(
            "size-9 rounded-2xl flex items-center justify-center transition-all ",
            isActive
              ? "bg-transparent text-white/80 "
              : " text-white hover:bg-white/10 hover:text-white "
          )}
        >
          {trigger}
        </button>
      </DropdownMenuTrigger>

      {/* ── Panel ── */}
      <DropdownMenuContent
        align={align}
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn(
          panelWidth,
          "backdrop-blur-xl bg-[#141516]  rounded-2xl p-3 z-50",
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
        <p className="text-xs font-medium text-white">
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

export const DropdownSegmented = React.memo(({ value, onChange, options, className, variant = "default" }) => {
  return (
    <div className={cn("flex gap-1 bg-white/5 rounded-xl overflow-x-auto scrollbar-hide", className)}>
      {options.map((opt) => {
        const isSelected = value === opt.value && !opt.disabled;
        
        return (
          <button
            key={opt.value}
            onClick={() => !opt.disabled && onChange(opt.value)}
            disabled={opt.disabled}
            className={cn(
              "flex-1 min-w-fit px-3 py-3 rounded-lg text-[13px] transition-all font-medium flex flex-row items-center justify-center gap-2 relative whitespace-nowrap",
              isSelected
                ? (variant === "white" ? "bg-white text-black" : "bg-[#505153] text-white")
                : opt.disabled
                ? "opacity-30 cursor-not-allowed"
                : "text-white hover:text-white hover:bg-white/5"
            )}
          >
            {opt.icon && <span className="">{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
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
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs  transition-all font-medium",
              isSelected
                ? "bg-[#505153]  text-white"
                : "bg-white/2  text-white hover:text-white hover:bg-white/10"
            )}
          >
            {opt}
          </button>
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

export function DropdownReset({ onClick, label = "Reset all" }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white hover:text-white hover:bg-white/5 transition-all"
    >
      <X className="size-3 group-hover:rotate-90 transition-transform duration-300" />
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownClearAction — small "Clear" link
// ─────────────────────────────────────────────────────────────────────────────

export function DropdownClearAction({ onClick, label = "Clear" }) {
  return (
    <button onClick={onClick} className="text-[10px] text-white font-medium hover:underline">
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DropdownToggle — Off/On pill toggle
// ─────────────────────────────────────────────────────────────────────────────

export const DropdownToggle = React.memo(({ value, onChange }) => {
  return (
    <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-lg">
      <button
        onClick={() => onChange(false)}
        className={cn(
          "px-3 py-1 rounded-md text-xs font-medium transition-all",
          !value ? "bg-[#505153] text-white" : "text-white hover:text-white/50"
        )}
      >
        Off
      </button>
      <button
        onClick={() => onChange(true)}
        className={cn(
          "px-3 py-1 rounded-md text-xs font-medium transition-all",
          value ? "bg-[#505153] text-white" : "text-white hover:text-white/50"
        )}
      >
        On
      </button>
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
          {icon}
        </span>
        <span className="text-sm text-white">{label}</span>
      </div>
      {children}
    </div>
  )
}
