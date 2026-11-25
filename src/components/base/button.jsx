import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/shared/lib/utils";

// Visuals live in globals.css (.ds-btn-*). This file only maps variant → class.
const buttonVariants = cva(
  "cursor-pointer gap-1.5 whitespace-nowrap shrink-0 select-none outline-none disabled:pointer-events-none disabled:opacity-50 rounded-subtle",
  {
    variants: {
      variant: {
        primary: "ds-btn-primary focus-workspace",
        "cta-lg": "ds-btn-cta-lg focus-workspace",
        cta_lg: "ds-btn-cta-lg focus-workspace",
        cta: "ds-btn-cta-lg focus-workspace",
        secondary: "ds-btn-secondary focus-workspace",
        tonal: "ds-btn-tonal focus-workspace",
        pill: "ds-btn-pill focus-workspace",
        "filter-chip": "ds-filter-chip focus-workspace",
        filter_chip: "ds-filter-chip focus-workspace",
        ghost: "ds-btn-ghost focus-workspace",
        outline: "ds-btn-outline focus-workspace",
        link: "ds-btn-link inline-flex items-center focus-workspace",
        "dropdown-card": "ds-btn-dropdown-card rounded-subtle bg-ui-button-tonal hover:bg-surface-tonal-hover",
        dropdown_card: "ds-btn-dropdown-card rounded-subtle bg-ui-button-tonal hover:bg-surface-tonal-hover",
        segmented: "ds-btn-segmented rounded-subtle focus-workspace",
        nav: "ds-nav-item rounded-subtle focus-workspace",
      },
      size: {
        default: "",
        xs: "h-6 px-2 ds-type-micro-tag [--ds-icon-size:var(--icon-size-xs)]",
        s: "h-8 [--ds-icon-size:var(--icon-size-sm)]",
        m: "h-9 [--ds-icon-size:var(--icon-size-md)]",
        l: "h-[42px] [--ds-icon-size:var(--icon-size-lg)]",
        sm: "h-8 px-2.5 ds-type-small [--ds-icon-size:var(--icon-size-sm)]",
        lg: "h-10 px-5 ds-type-button [--ds-icon-size:var(--icon-size-lg)]",
        icon: "size-8 p-1 [--ds-icon-size:var(--icon-size-sm)]",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "default",
    },
  }
);

const Button = React.forwardRef(function Button(
  { className, variant, size, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot.Root : "button";
  const resolvedSize = size?.toLowerCase?.() ?? size;
  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant || "ghost"}
      data-size={resolvedSize}
      className={cn(buttonVariants({ variant, size: resolvedSize }), className)}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
