"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/shared/lib/utils";

// Visuals: .ds-switch / .ds-switch-thumb (globals.css, keyed off data-state).
const Switch = React.forwardRef(({ className, size = "default", variant = "default", ...props }, ref) => {
  const isSm = size === "sm";

  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      data-variant={variant}
      data-size={size}
      className={cn(
        "ds-switch focus-workspace peer shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        isSm && "h-5 w-9",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "ds-switch-thumb pointer-events-none block data-[state=unchecked]:translate-x-0.5",
          isSm ? "size-3.5 data-[state=checked]:translate-x-4" : "data-[state=checked]:translate-x-[22px]"
        )}
      />
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = "Switch";

export { Switch };
