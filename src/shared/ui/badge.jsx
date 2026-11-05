/**
 * Badge Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Badges use canonical semantic variants.
 * 2. USE CANONICAL VARIANTS: `default`, `secondary`, `neon`, `success`, `danger`, `outline`.
 * 3. USE CANONICAL SIZES: `default` (h-5), `sm` (h-4).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium font-sans antialiased whitespace-nowrap transition-colors shrink-0",
  {
    variants: {
      variant: {
        default: "bg-white/15 text-white border border-white/10",
        secondary: "bg-white/10 text-white border border-transparent",
        neon: "bg-lime-400 text-black font-semibold border border-transparent shadow-xs",
        success: "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50",
        danger: "bg-red-950/70 text-red-300 border border-red-800/50",
        warning: "bg-amber-950/70 text-amber-300 border border-amber-800/50",
        outline: "bg-transparent text-white/70 border border-white/20",
      },
      size: {
        default: "h-5 px-2 text-xs rounded-badge gap-1",
        sm: "h-4 px-1.5 text-xs rounded-badge gap-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Badge({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
