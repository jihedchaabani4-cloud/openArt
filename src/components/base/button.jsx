import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/shared/lib/utils";

// Visuals live in globals.css (.ds-btn-*). This file only maps variant → class.
const buttonVariants = cva(
  "cursor-pointer gap-2 whitespace-nowrap shrink-0 select-none outline-none disabled:pointer-events-none disabled:opacity-50 rounded-2xl",
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
      },
      size: {
        default: "",
        s: "h-8",
        m: "h-9",
        l: "h-[42px]",
        sm: "h-8 px-3",
        lg: "h-11 px-6",
        icon: "size-9.5 p-2.5",
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
  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant || "ghost"}
      className={cn(buttonVariants({ variant, size: size?.toLowerCase?.() ?? size }), className)}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
