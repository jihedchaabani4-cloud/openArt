import * as React from "react";
import { cn } from "@/shared/lib/utils";

const BADGE_VARIANTS = {
  default: "ds-badge",
  glass: "ds-badge-glass",
  count: "ds-badge-count",
  secondary: "ds-badge bg-surface-secondary",
  neon: "ds-badge bg-lime-400 text-black font-bold",
  yellow: "ds-badge bg-accent-yellow/15 text-accent-yellow",
  warning: "ds-badge bg-accent-yellow/15 text-accent-yellow",
  pro: "ds-badge bg-accent-yellow/15 text-accent-yellow",
  success: "ds-badge bg-emerald-950/70 text-emerald-300",
  danger: "ds-badge bg-error/15 text-error",
  outline: "ds-badge bg-transparent border border-[var(--border-subtle)]",
};

const BADGE_SIZES = {
  default: "h-5 px-2",
  sm: "h-4 px-1.5",
  count: "",
};

const Badge = React.forwardRef(function Badge(
  { className, variant = "default", size = "default", ...props },
  ref
) {
  const isCount = variant === "count";
  const isGlass = variant === "glass";
  return (
    <span
      ref={ref}
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.default,
        !isCount && !isGlass && (BADGE_SIZES[size] || BADGE_SIZES.default),
        className
      )}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

const BANNER_VARIANTS = {
  accent: "ds-banner-accent",
  default: "ds-banner-accent",
};

const StatusBanner = React.forwardRef(function StatusBanner(
  { className, variant = "accent", children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="status-banner"
      data-variant={variant}
      className={cn(
        BANNER_VARIANTS[variant] || BANNER_VARIANTS.accent,
        "justify-between gap-3 pr-4 py-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

StatusBanner.displayName = "StatusBanner";

export { Badge, StatusBanner, BADGE_VARIANTS, BANNER_VARIANTS };
