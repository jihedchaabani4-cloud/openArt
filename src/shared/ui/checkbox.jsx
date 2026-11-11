"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Icon } from "@/shared/ui/Icon";
import { cn } from "@/shared/lib/utils";

const Checkbox = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
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
        "peer shrink-0 cursor-pointer rounded-[var(--r-xs)] border transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--brand-border-on)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        isLg ? "size-5" : "size-4",
        "border-[var(--border-default)] bg-[var(--bg-surface-2)] hover:border-[var(--border-subtle)]",
        "data-[state=checked]:bg-[var(--brand)] data-[state=checked]:border-[var(--brand)] data-[state=checked]:text-[var(--text-on-brand)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <Icon name="check" size={isLg ? 14 : 12} className="font-bold stroke-[2.5]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
export default Checkbox;
