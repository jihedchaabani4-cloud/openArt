"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/shared/lib/utils";

const Switch = React.forwardRef(({
  className,
  size = "default",
  variant = "default",
  ...props
}, ref) => {
  const isSm = size === "sm";

  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      data-variant={variant}
      data-size={size}
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50 bg-white/15 data-[state=checked]:bg-white",
        isSm ? "h-5 w-9" : "h-6 w-11",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full ring-0 transition-transform duration-200 ease-in-out bg-white data-[state=checked]:bg-[#09090B]",
          isSm
            ? "size-3.5 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
            : "size-[18px] data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = "Switch";

export { Switch };
