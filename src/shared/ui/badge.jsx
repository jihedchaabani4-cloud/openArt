import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

/**
 * Badge Primitive — design-system.md §4
 * - Pink skewed promo badge (§4.1)
 * - Blue special offer tag (§4.2)
 * - Standard subtle badges (overlay-5 / overlay-10, border-subtle)
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center font-medium font-sans antialiased whitespace-nowrap transition-colors shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--overlay-5)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[var(--r-sm)]",
        secondary:
          "bg-[var(--overlay-10)] text-[var(--text-secondary)] border-0 rounded-[var(--r-sm)]",
        brand:
          "bg-[var(--brand)] text-[var(--text-on-brand)] font-semibold border-0 rounded-[var(--r-sm)]",
        neon:
          "bg-[var(--brand)] text-[var(--text-on-brand)] font-semibold border-0 rounded-[var(--r-sm)]",
        pink: "badge-pink",
        blue: "tag-blue",
        danger:
          "bg-[var(--overlay-5)] text-[var(--pink-400)] border border-[var(--border-subtle)] rounded-[var(--r-sm)]",
        warning:
          "bg-[var(--overlay-5)] text-[var(--brand-yellow)] border border-[var(--border-subtle)] rounded-[var(--r-sm)]",
        success:
          "bg-[var(--overlay-5)] text-[var(--brand)] border border-[var(--border-subtle)] rounded-[var(--r-sm)]",
        outline:
          "bg-transparent text-[var(--text-secondary)] border border-[var(--border-subtle)] rounded-[var(--r-sm)]",
      },
      size: {
        default: "h-5 px-2 text-xs gap-1",
        sm: "h-4 px-1.5 text-xs gap-0.5",
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
  children,
  ...props
}) {
  if (variant === "pink") {
    return (
      <span className={cn("badge-pink", className)} {...props}>
        <span className="surface">
          <span className="label">{children}</span>
        </span>
      </span>
    );
  }

  return (
    <span
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
export default Badge;
