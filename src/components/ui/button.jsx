import * as React from "react"
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-normal transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        "studio-normal": "flex items-center justify-center gap-3 h-11 rounded-lg bg-white/3 border border-white/8 hover:bg-white/6  transition-all text-white/80 group",
        "studio-neon": "flex items-center justify-center gap-3 h-11 rounded-lg bg-[#D4FF00] hover:bg-[#e6ff4d] transition-all text-black font-normal uppercase tracking-widest active:scale-[0.98] shadow-[0_0_20px_rgba(212,255,0,0.15)] group",
        "studio-error": "flex items-center justify-center gap-3 h-11 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all",
        "studio-overlay-icon":
          "w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all",
        "studio-node-thumb":
          "relative shrink-0 w-12 h-12 rounded-lg overflow-hidden focus:outline-none transition-all duration-300 border-2 p-0",
        "studio-node-card":
          "flex-1 min-w-0 group relative mb-2 p-2 rounded-lg transition-all duration-200 flex items-center gap-3 border focus:outline-none",
        "studio-option-tile":
          "group relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-300",
        "studio-option-tile-tall":
          "group relative h-24 overflow-hidden rounded-lg border-2 transition-all duration-300",
        "studio-option-tile-sm":
          "group relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-300",
        "studio-tab":
          "flex-1 py-2 rounded-lg text-[10px] font-normal uppercase tracking-[0.15em] transition-all duration-200 focus:outline-none",
        "studio-tab-active":
          "flex-1 py-2 rounded-lg text-[10px] font-normal uppercase tracking-[0.15em] transition-all duration-200 focus:outline-none bg-[#D4FF00] text-black shadow-[0_0_12px_rgba(212,255,0,0.3)]",
        "studio-sidebar-char":
          "group relative flex flex-col items-center gap-2 focus:outline-none",
        "studio-gallery-create":
          "w-full aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group",
        "studio-gallery-item":
          "w-full group relative flex flex-col gap-2 transition-all focus:outline-none",
        "studio-timeline-card":
          "flex-1 group relative mb-2 p-2 rounded-lg transition-all flex items-center gap-3 border focus:outline-none",
        "studio-heritage-node":
          "group relative w-14 h-14 rounded-lg overflow-hidden transition-all duration-300 border-2 p-0",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        /** Use for image/card tiles so height is not forced — content (image + label) defines size */
        tile: "h-auto min-h-0 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
