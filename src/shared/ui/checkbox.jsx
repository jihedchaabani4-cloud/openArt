"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";

const Checkbox = React.forwardRef(({
  className,
  size = "default",
  variant = "default",
  ...props
}, ref) => {
  const isLg = size === "lg";

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="checkbox"
      data-variant={variant}
      data-size={size}
      className={cn(
        "peer shrink-0 cursor-pointer rounded-sm border border-[#27272A] bg-white/5 transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-white/70",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-black",
        isLg ? "size-5" : "size-4",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <GoogleIcon iconName="check" className={cn(isLg ? "text-sm font-bold" : "text-xs font-bold")} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
