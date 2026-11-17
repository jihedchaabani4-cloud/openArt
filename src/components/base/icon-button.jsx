import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const ICON_BUTTON_VARIANTS = {
  ghost: "ds-icon-btn",
  tonal: "ds-icon-btn-tonal",
  outline: "ds-icon-btn-outline",
  carousel: "ds-icon-btn-carousel",
};

// Chrome toolbar control → .focus-chrome (no ring).
const IconButton = React.forwardRef(function IconButton(
  { className, variant = "ghost", type = "button", asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      data-slot="icon-button"
      data-variant={variant}
      className={cn(
        ICON_BUTTON_VARIANTS[variant] || ICON_BUTTON_VARIANTS.ghost,
        "focus-chrome cursor-pointer disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

IconButton.displayName = "IconButton";

export { IconButton, ICON_BUTTON_VARIANTS };
