/**
 * Button Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ARCHITECTURAL RULES (ENFORCED ACROSS THE CODEBASE):
 * 1. ZERO CALL-SITE RESTYLING: Never write arbitrary styling classes (colors,
 *    borders, paddings, rounded-*, shadows) when invoking <Button />.
 * 2. ONLY SPECIFY VARIANT & SIZE: Callers choose the appropriate `variant`
 *    and `size` props (e.g. <Button variant="primary" size="default" />).
 * 3. `className` IS EXCLUSIVELY FOR LAYOUT: The `className` prop at the call
 *    site may ONLY be used for positioning (e.g. `w-full`, `shrink-0`, `col-span-2`).
 * 4. EXTEND, DON'T OVERRIDE: If a new visual treatment is genuinely required,
 *    add it as a new variant in this file. Never hack it inline at the call site.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"

import { cn } from "@/shared/lib/utils"

// ── Standardized Canonical Style Definitions ─────────────────────────────────
const PRIMARY_WHITE =
  "px-4 py-2 bg-white text-black hover:bg-white/90 active:scale-[0.98] font-semibold rounded-button shadow-none transition-all";

const SECONDARY_SURFACE =
  "px-4 py-2 bg-[var(--mat-sys-surface-container-high,#282a2c)] text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white hover:bg-[var(--foreground-state-15)] active:bg-[var(--foreground-state-25)] rounded-button font-medium shadow-none transition-all";

const OUTLINE_GHOST =
  "px-4 py-2 border border-[var(--mat-sys-outline-variant,#444746)] bg-transparent text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white hover:bg-[var(--foreground-state-10)] active:bg-[var(--foreground-state-15)] rounded-button font-semibold shadow-none transition-all";

const GHOST_SUBTLE =
  "px-3 py-1.5 hover:bg-[var(--foreground-state-10,rgba(218,220,224,0.1))] text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white rounded-button shadow-none transition-all";

const DANGER_GHOST =
  "px-3 py-1.5 bg-transparent text-[var(--foreground-color-danger,#fe6e6e)] hover:text-[var(--foreground-color-danger,#fe6e6e)] hover:bg-[var(--foreground-state-10,rgba(218,220,224,0.1))] active:bg-[var(--foreground-state-25)] rounded-button shadow-none transition-all [&_svg]:text-[var(--foreground-color-danger,#fe6e6e)] [&_mat-icon]:text-[var(--foreground-color-danger,#fe6e6e)] [&_.google-symbols]:text-[var(--foreground-color-danger,#fe6e6e)]";

const DANGER_FILLED =
  "px-4 py-2 bg-[var(--mat-sys-error-container,#8c1d18)] text-[var(--mat-sys-on-error-container,#f9dedc)] hover:brightness-110 border border-[var(--mat-sys-error,#f2b8b5)]/20 active:scale-[0.98] font-semibold rounded-button shadow-none transition-all";

const NEON_CTA =
  "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-button bg-[#EFFE17] text-black text-sm font-semibold pb-0.5 transition-all hover:opacity-80 active:opacity-60 shadow-none disabled:opacity-50";

const PILL_RESTING =
  "rounded-full px-4 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 shadow-none transition-all";

const PILL_ACTIVE =
  "rounded-full px-4 py-1.5 text-xs font-semibold bg-white text-black hover:bg-white/90 shadow-none transition-all";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-button text-sm font-semibold font-sans antialiased shadow-none transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        // ── 5 Core Canonical Tiers ───────────────────────────────────────────
        white: PRIMARY_WHITE,
        primary: PRIMARY_WHITE, // Unified: White is the high-contrast primary CTA
        secondary: SECONDARY_SURFACE,
        outline: OUTLINE_GHOST,
        ghost: GHOST_SUBTLE,
        default: GHOST_SUBTLE,
        danger: DANGER_GHOST,
        "destructive-filled": DANGER_FILLED,

        // ── Specialized Accents & Pills ──────────────────────────────────────
        neon: NEON_CTA,
        pill: PILL_RESTING,
        "pill-active": PILL_ACTIVE,
        link: "text-[var(--mat-sys-link,#a8c7fa)] underline-offset-4 hover:underline",

        // ── Legacy Aliases (Strictly Mapped to Canonical Tiers) ──────────────
        destructive: DANGER_GHOST,
        "ghost-destructive": DANGER_GHOST,
        "destructive-ghost": DANGER_GHOST,
        "ghost-danger": DANGER_GHOST,
        "studio-danger": DANGER_GHOST,
        "studio-error": DANGER_GHOST,
        "studio-white": PRIMARY_WHITE,
        "studio-ghost": GHOST_SUBTLE,
        "studio-outline": OUTLINE_GHOST,
        "studio-normal": SECONDARY_SURFACE,
        "studio-neon": NEON_CTA,
        "user-menu-filled": SECONDARY_SURFACE,
        "user-menu-outline": OUTLINE_GHOST,
        groupBtn: GHOST_SUBTLE,

        "studio-node-thumb": "relative shrink-0 w-12 h-12 rounded-button overflow-hidden focus:outline-none transition-all duration-300 border-2 p-0",
        "studio-node-card": "flex-1 min-w-0 group relative mb-2 p-2 rounded-button transition-all duration-200 flex items-center gap-3 border focus:outline-none",
        "studio-option-tile": "group relative aspect-square overflow-hidden rounded-button border-2 transition-all duration-300",
        "studio-option-tile-tall": "group relative h-24 overflow-hidden rounded-button border-2 transition-all duration-300",
        "studio-option-tile-sm": "group relative aspect-square overflow-hidden rounded-button border-2 transition-all duration-300",
        "studio-tab": "flex-1 py-2 rounded-button text-[10px] font-normal uppercase tracking-[0.15em] transition-all duration-200 focus:outline-none",
        "studio-tab-active": "flex-1 py-2 rounded-button text-[10px] font-normal uppercase tracking-[0.15em] transition-all duration-200 focus:outline-none bg-[#D4FF00] text-black shadow-[0_0_12px_rgba(212,255,0,0.3)]",
        "studio-sidebar-char": "group relative flex flex-col items-center gap-2 focus:outline-none",
        "studio-gallery-create": "w-full aspect-square rounded-button border-2 border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group",
        "studio-gallery-item": "w-full group relative flex flex-col gap-2 transition-all focus:outline-none",
        "studio-timeline-card": "flex-1 group relative mb-2 p-2 rounded-button transition-all flex items-center gap-3 border focus:outline-none",
        "studio-heritage-node": "group relative w-14 h-14 rounded-button overflow-hidden transition-all duration-300 border-2 p-0",

        "flow-pill": "bg-[#232325] text-white hover:bg-[#2c2c2f] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
        "flow-pill-active": "bg-[#cfd2d6] text-black shadow-md cursor-pointer hover:bg-[#d8dbdf]",
        "flow-toggle": "w-full flex-1 h-8 min-h-[32px] px-2 rounded-button flex items-center justify-center gap-1.5 transition-all text-[13px] font-medium text-white hover:bg-[rgba(218,220,224,0.08)] hover:text-white cursor-pointer",
        "flow-toggle-active": "w-full flex-1 h-8 min-h-[32px] px-2 rounded-button flex items-center justify-center gap-1.5 transition-all text-[13px] font-semibold bg-[rgba(218,220,224,0.25)] text-white shadow-sm cursor-pointer",
        "flow-toggle-white": "w-full flex-1 h-8 min-h-[32px] px-2 rounded-button flex items-center justify-center gap-1.5 transition-all text-[13px] font-semibold bg-white text-black hover:bg-white hover:text-black shadow-sm cursor-pointer [&_svg]:text-black [&_mat-icon]:text-black [&_.google-symbols]:text-black",
        "flow-toggle-sm": "w-full flex-1 h-8 min-h-[32px] px-2 rounded-button flex items-center justify-center gap-1.5 transition-all text-[12px] font-medium text-white hover:bg-[rgba(218,220,224,0.08)] hover:text-white cursor-pointer",
        "flow-toggle-sm-active": "w-full flex-1 h-8 min-h-[32px] px-2 rounded-button flex items-center justify-center gap-1.5 transition-all text-[12px] font-semibold bg-[rgba(218,220,224,0.25)] text-white shadow-sm cursor-pointer",
        "flow-toggle-sm-white": "w-full flex-1 h-8 min-h-[32px] px-2 rounded-button flex items-center justify-center gap-1.5 transition-all text-[12px] font-semibold bg-white text-black hover:bg-white hover:text-black shadow-sm cursor-pointer [&_svg]:text-black [&_mat-icon]:text-black [&_.google-symbols]:text-black",
        "flow-trigger": "h-8 px-3 rounded-button inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer outline-none border border-transparent select-none text-[12px] font-medium leading-none bg-[rgba(218,220,224,0.05)] hover:bg-[rgba(218,220,224,0.1)] text-white hover:text-white shrink-0 w-auto",
        "flow-trigger-active": "h-8 px-3 rounded-button inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer outline-none border border-transparent select-none text-[12px] font-medium leading-none bg-[rgba(218,220,224,0.25)] text-white shadow-sm shrink-0 w-auto",
        "flow-generate": "h-8 px-3.5 rounded-button text-[13px] font-semibold transition-all flex items-center gap-1.5 bg-white text-black hover:bg-white/90 active:scale-95 shrink-0 shadow-sm cursor-pointer disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-100",
        "flow-ratio": "w-full h-[54px] min-h-[54px] py-1 px-0.5 rounded-button flex flex-col items-center justify-center gap-1 transition-all text-white hover:bg-[rgba(218,220,224,0.08)] hover:text-white cursor-pointer",
        "flow-ratio-active": "w-full h-[54px] min-h-[54px] py-1 px-0.5 rounded-button flex flex-col items-center justify-center gap-1 transition-all bg-[rgba(218,220,224,0.25)] text-white font-semibold shadow-sm cursor-pointer",
        "flow-boolean": "px-2.5 py-0.5 rounded-button text-[11px] font-medium text-white hover:text-white transition-all cursor-pointer",
        "flow-boolean-active": "px-2.5 py-0.5 rounded-button text-[11px] font-semibold bg-[rgba(218,220,224,0.25)] text-white shadow-sm transition-all cursor-pointer",
        "flow-select-trigger": "w-full h-9 px-3 rounded-button bg-[rgba(218,220,224,0.06)] hover:bg-[rgba(218,220,224,0.12)] active:bg-[rgba(218,220,224,0.2)] text-white flex items-center justify-between transition-all cursor-pointer",
        "flow-menu-item": "w-full px-2.5 py-1.5 rounded-button flex items-center justify-between text-[12px] font-medium transition-all text-left text-[rgba(218,220,224,0.75)] hover:bg-white/5 hover:text-white cursor-pointer",
        "flow-menu-item-active": "w-full px-2.5 py-1.5 rounded-button flex items-center justify-between text-[12px] font-semibold transition-all text-left bg-[rgba(218,220,224,0.25)] text-white cursor-pointer",
        "flow-overlay-action": "bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/65 active:scale-95 transition-all shadow-md border border-white/10 rounded-button cursor-pointer",

        flow: "font-sans antialiased text-[12px] font-medium flex items-center justify-start gap-1.5 h-8 px-2.5 rounded-button bg-white/5 border-none text-white/80 hover:text-white hover:bg-white/10 active:bg-[rgba(218,220,224,0.25)] active:shadow-[0px_4px_32px_-8px_rgba(0,0,0,0.2)] active:blur-[1.5px] active:backdrop-blur-[25px] transition-all duration-200 outline-none select-none cursor-pointer transform-none",
        blur: "font-sans antialiased text-[12px] font-medium flex items-center justify-start gap-1.5 h-8 px-2.5 rounded-button bg-white/5 border-none text-white/80 hover:text-white hover:bg-white/10 active:bg-[rgba(218,220,224,0.25)] active:shadow-[0px_4px_32px_-8px_rgba(0,0,0,0.2)] active:blur-[1.5px] active:backdrop-blur-[25px] transition-all duration-200 outline-none select-none cursor-pointer transform-none",
        "create-element": "font-sans antialiased text-[15px] font-medium flex items-center justify-center gap-2 h-auto px-6 py-4 rounded-dialog bg-[#4a4a4a] hover:bg-[#5a5a5a] text-[#d1d1d1] hover:text-white shadow-2xl shadow-black/50 transition-all active:scale-95 border-none backdrop-blur-md cursor-pointer",
        "studio-fab": "font-sans antialiased text-[15px] font-medium flex items-center justify-center gap-2 h-auto px-6 py-4 rounded-dialog bg-[#4a4a4a] hover:bg-[#5a5a5a] text-[#d1d1d1] hover:text-white shadow-2xl shadow-black/50 transition-all active:scale-95 border-none backdrop-blur-md cursor-pointer",
      },
      size: {
        default: "h-8 px-3.5 text-[12px] rounded-button has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-button px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-button gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-button px-6 has-[>svg]:px-4",
        flow: "h-11 pl-1.5 pr-4 py-1 rounded-button gap-2.5 text-sm font-medium",
        icon: "size-9 p-0 rounded-button",
        "icon-xs": "size-6 p-0 rounded-button [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 p-0 rounded-button",
        "icon-lg": "size-10 p-0 rounded-button",
        "studio": "h-[calc(var(--spacing,0.25rem)*12)] min-w-[calc(var(--spacing,0.25rem)*12)] w-auto gap-[calc(var(--spacing,0.25rem)*2)] rounded-button px-[calc(var(--spacing,0.25rem)*3)] text-[var(--text-md)] leading-[var(--tw-leading,var(--text-md--line-height))] tracking-[var(--tw-tracking,var(--text-md--letter-spacing))]",
        /** Use for image/card tiles so height is not forced — content (image + label) defines size */
        tile: "h-auto min-h-0 p-0 has-[>svg]:p-0",
        /** Format/Aspect ratio toggle button size */
        ratio: "h-[54px] min-h-[54px] p-0 has-[>svg]:p-0",
        /** User avatar square button size */
        avatar: "size-9 min-w-9 min-h-9 p-0 rounded-button has-[>svg]:p-0",
        /** Floating action button size */
        fab: "h-auto min-h-0 px-6 py-4 rounded-dialog text-[15px] has-[>svg]:px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "default",
    size = "default",
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants }
