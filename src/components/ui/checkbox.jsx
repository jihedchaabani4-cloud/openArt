"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";

const Checkbox = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 cursor-pointer rounded-md border border-[#27272A] bg-white/5 transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-white/70",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-black",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <GoogleIcon iconName="check" className="text-xs font-bold" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
