"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/shared/lib/utils";

const Switch = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
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
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border-on)] disabled:cursor-not-allowed disabled:opacity-40",
        isSm ? "h-5 w-9" : "h-6 w-11",
        "bg-[var(--overlay-20)] hover:bg-[var(--overlay-10)] data-[state=checked]:bg-[var(--brand)]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full ring-0 transition-transform duration-200 ease-in-out bg-[var(--text-primary)] data-[state=checked]:bg-[var(--text-on-brand)]",
          isSm
            ? "size-3.5 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
            : "size-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = "Switch";

export { Switch };
export default Switch;
