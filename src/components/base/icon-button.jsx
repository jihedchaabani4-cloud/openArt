import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const ICON_BUTTON_VARIANTS = {
  ghost: "ds-icon-btn",
  tonal: "ds-icon-btn-tonal",
  outline: "ds-icon-btn-outline",
  carousel: "ds-icon-btn-carousel",
  overlay: "ds-icon-btn-overlay",
};

const ICON_BUTTON_SIZES = {
  xs: "size-6 [--ds-icon-size:var(--icon-size-xs)]",
  sm: "size-8 [--ds-icon-size:var(--icon-size-sm)]",
  md: "",
  lg: "size-10 [--ds-icon-size:var(--icon-size-lg)]",
};

// Chrome toolbar control → .focus-chrome (no ring).
const IconButton = React.forwardRef(function IconButton(
  { className, variant = "ghost", size = "md", type = "button", asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      data-slot="icon-button"
      data-variant={variant}
      data-size={size}
      className={cn(
        ICON_BUTTON_VARIANTS[variant] || ICON_BUTTON_VARIANTS.ghost,
        ICON_BUTTON_SIZES[size] || "",
        "focus-chrome cursor-pointer disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

IconButton.displayName = "IconButton";

export { IconButton, ICON_BUTTON_VARIANTS, ICON_BUTTON_SIZES };
