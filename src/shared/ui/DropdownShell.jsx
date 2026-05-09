"use client"

import * as React from "react"
import { Volume2, Eye, Eraser } from "lucide-react"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import { cn } from "@/shared/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Button } from "@/shared/ui/button"
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
    <div className={cn("flex gap-1 p-1.5 bg-white/5 rounded-xl overflow-x-auto scrollbar-hide", className)}>
      {options.map((opt) => {
        const isSelected = value === opt.value && !opt.disabled;
        
        return (
          <Button
            key={opt.value}
            onClick={() => !opt.disabled && onChange(opt.value)}
            disabled={opt.disabled}
            className={cn(
              "flex-1 min-w-fit px-3 py-1.5 rounded-lg text-[13px] transition-all  flex flex-row items-center justify-center gap-2 relative whitespace-nowrap",
              isSelected
                ? (variant === "white" ? "bg-white text-black" : "bg-white/10 text-white")
                : opt.disabled
                ? "opacity-30 cursor-not-allowed"
                : "text-white hover:text-white hover:bg-[#363637]"
            )}
          >
            {opt.icon && <span className="">{opt.icon}</span>}
            {opt.label}
          </Button>
        );
      })}
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// DropdownSegmentedWithLabel — segmented control with a left-side label
// ─────────────────────────────────────────────────────────────────────────────

export const DropdownSegmentedWithLabel = React.memo(({ label, value, onChange, options, className, variant = "default", transparent = false }) => {
  return (
    <div className={cn(
      "flex items-center gap-3 p-1.5 rounded-xl overflow-hidden",
      !transparent && "bg-(--color-imagine-grey-2)",
      className
    )}>
      {label && (
        <span className="text-[14px] font-semibold text-foreground/90 whitespace-nowrap pl-2 shrink-0">
          {label}
        </span>
      )}
      <div className="flex gap-1 flex-1 overflow-x-auto scrollbar-hide">
        {options.map((opt) => {
          const isSelected = value === opt.value && !opt.disabled;
          return (
            <button
              key={opt.value}
              onClick={() => !opt.disabled && onChange(opt.value)}
              disabled={opt.disabled}
              className={cn(
                "flex-1 min-w-fit px-3 font-semibold py-2 rounded-lg text-[14px] transition-all flex flex-row items-center justify-center gap-2 relative whitespace-nowrap",
                isSelected
                  ? (variant === "white" ? "bg-white/80 text-black" : transparent ? "bg-white/10 text-foreground" : "bg-white/10 text-foreground")
                  : opt.disabled
                  ? "opacity-30 cursor-not-allowed"
                  : transparent
                  ? "text-foreground/70 hover:text-foreground hover:bg-white/10"
                  : "text-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {opt.icon && <span>{opt.icon}</span>}
              {opt.label}
            </button>
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

export function DropdownReset({ onReset, label = "Reset", className }) {
  return (
    <Button
      variant="ghost"
      size="sm"
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
