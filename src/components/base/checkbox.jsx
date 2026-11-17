"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";
import { cn } from "@/shared/lib/utils";

const Checkbox = React.forwardRef(({ className, size = "default", variant = "default", ...props }, ref) => {
  const isLg = size === "lg";
  const isCircle = variant === "circle";

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="checkbox"
      data-variant={variant}
      data-size={size}
      className={cn(
        "ds-checkbox focus-workspace peer shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        isCircle && "ds-checkbox-circle",
        isLg ? "size-5" : "size-4",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center text-current">
        <GoogleIcon iconName="check" className={cn(isLg ? "text-sm font-bold" : "text-xs font-bold")} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
