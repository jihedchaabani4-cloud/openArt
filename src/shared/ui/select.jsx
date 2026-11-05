"use client"

import * as React from "react"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import * as SelectPrimitive from "@radix-ui/react-select"

import { cn } from "@/shared/lib/utils"

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

// ─── Design Tokens ────────────────────────────────────────────────────────────
// bg-panel         → #292929
// border-subtle    → rgba(255,255,255,0.05)   (white/5)
// border-focus     → rgba(255,255,255,0.20)   (white/20)
// text-primary     → #f5f5f5   (neutral-100)
// text-muted       → #737373   (neutral-500)
// hover-bg         → rgba(255,255,255,0.05)   (white/5)
//
// Typography:
//   group label    → 0.75rem / weight 500 / leading-tight
//   item text      → 0.875rem / weight 400 / leading-[18px]
//   subtitle       → 0.7rem   / weight 400 / leading-[14px]
//
// Spacing:
//   trigger        → h-11 (44px), px-3 py-2.5
//   item           → px-2 py-1.5, gap-2 (icon↔text)
//   item inner     → gap-0.5 (label↔subtitle)
//   label          → px-2.5 py-1.5 pb-0.5
//   content        → px-1, viewport p-1
//   side-offset    → 4px
//
// Radius:
//   trigger        → rounded-lg (8px)
//   panel          → rounded-lg
//   item           → rounded-sm
//
// Shadow (panel):
//   0px 4px 4px rgba(0,0,0,.05), 0px 20px 25px -5px rgba(0,0,0,.05)
// ─────────────────────────────────────────────────────────────────────────────

function Select({ ...props }) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({ ...props }) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({ ...props }) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({ className, size = "default", variant = "default", asChild = false, children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      asChild={asChild}
      data-size={size}
      data-variant={variant}
      className={cn(
        // Layout
        "flex items-center",
        variant === "blur" ? "w-full h-10 px-3.5 justify-between" : "w-auto max-w-fit px-3 py-2.5",
        // Shape
        "rounded-sm",
        // Colors
        variant === "blur" ? "bg-surface-elevated text-white hover:bg-white/10 border border-white/10" : "bg-transparent hover:bg-white/10 text-white",
        // Text
        "text-sm font-medium text-white",
        "hover:cursor-pointer transition-colors outline-none",

        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={undefined}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <GoogleIcon iconName="keyboard_arrow_down" className="text-base opacity-60 shrink-0 ml-2" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  side = "top",
  sideOffset = 4,
  ...props
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          // Layout
          "relative z-[80] flex flex-col overflow-y-auto select-none font-sans antialiased",
          // Size
          "min-w-[120px] max-h-[500px]",
          // Shape
          "rounded-lg p-2",
          // Colors
          "bg-surface-card border border-white/10 text-white shadow-none",
          // Shadow
          "shadow-none",
          // Animations — open
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          // Animations — close
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          // Slide directions
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          // Popper offset compensation
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        side={side}
        sideOffset={sideOffset}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-0.5",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/**
 * SelectLabel — group heading
 *
 * Tokens:
 *   font-size   : 0.75rem (text-xs)
 *   font-weight : 500 (medium)
 *   color       : #737373 (neutral-500 / muted)
 *   padding     : px-2.5 py-1.5 pb-0.5  →  10px 10px 2px 10px
 */
function SelectLabel({ className, ...props }) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-2.5 py-1.5 pb-0.5",
        "text-[0.75rem] font-medium leading-tight text-[#737373]",
        className
      )}
      {...props}
    />
  )
}

/**
 * SelectItem — supports icon + label + optional subtitle
 *
 * Tokens:
 *   padding      : px-2 py-1.5  →  8px 8px 6px 8px
 *   gap          : gap-2  →  8px  (icon ↔ text block)
 *   radius       : rounded-sm
 *   text color   : #f5f5f5 (primary)
 *   icon color   : #737373 (muted) → #f5f5f5 on hover (group-hover)
 *   hover bg     : rgba(255,255,255,0.05)
 *   label font   : 0.875rem / weight 400 / leading-[18px]
 *   subtitle font: 0.7rem   / weight 400 / color #737373 / leading-[14px]
 *   checkmark    : size-3.5, color #737373
 *   inner gap    : gap-0.5  →  2px  (label ↔ subtitle)
 *
 * Usage:
 *   <SelectItem value="portrait" icon={<PortraitIcon />} subtitle="1080×1920">
 *     9:16
 *   </SelectItem>
 *
 * Props:
 *   icon      — any React node (SVG, lucide icon, etc.)
 *   subtitle  — optional secondary line below the label
 */
function SelectItem({ className, children, icon, subtitle, badge, iconVariant = "standard", ...props }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // Layout
        "group flex cursor-pointer items-center gap-3 min-h-[40px] px-3.5 py-2 rounded-sm outline-none select-none font-sans antialiased transition-all duration-150",
        // Text & State layers
        "text-white/90 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white",
        // Disabled
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {/* ── Icon slot ─────────────────────────────────────────────────────── */}
      {icon && (
        <span 
          className={cn(
            "shrink-0 flex items-center justify-center text-[20px] transition-colors duration-150 text-white/80",
            iconVariant === "square" && "aspect-square h-[48px] -ml-2 -my-1.5 bg-[#171717] rounded-sm border-r border-white/5"
          )}
        >
          {renderIconNode(icon)}
        </span>
      )}

      {/* ── Label + subtitle block ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-1.5 pt-0.5">
          <SelectPrimitive.ItemText>
            <span className="text-[14px] font-medium leading-5 capitalize truncate">
              {children}
            </span>
          </SelectPrimitive.ItemText>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {subtitle && (
          <span className="text-[12px] font-normal leading-4 text-white/60 truncate">
            {subtitle}
          </span>
        )}
      </div>

      {/* ── Checkmark ─────────────────────────────────────────────────────── */}
      <span className="shrink-0 flex size-4 items-center justify-center text-white/80">
        <SelectPrimitive.ItemIndicator>
          <GoogleIcon iconName="check" className="text-sm font-bold" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

/**
 * SelectSeparator — thin divider between groups
 */
function SelectSeparator({ className, ...props }) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1.5 h-px bg-white/10",
        className
      )}
      {...props}
    />
  )
}

function SelectScrollUpButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-[#737373]",
        className
      )}
      {...props}
    >
      <GoogleIcon iconName="keyboard_arrow_up" className="text-[18px]" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-[#737373]",
        className
      )}
      {...props}
    >
      <GoogleIcon iconName="keyboard_arrow_down" className="text-[18px]" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}