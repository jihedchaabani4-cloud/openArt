"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const RadioGroup = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      data-slot="radio-group"
      className={cn("grid gap-2.5", className)}
      {...props}
    />
  );
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  ...props
}, ref) => {
  const isLg = size === "lg";

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      data-slot="radio-group-item"
      data-variant={variant}
      data-size={size}
      className={cn(
        "peer aspect-square shrink-0 cursor-pointer rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-2)] transition-colors outline-none",
        "hover:border-[var(--border-subtle)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--brand-border-on)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        isLg ? "size-5" : "size-4",
        "data-[state=checked]:border-[var(--brand)]",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        <span
          className={cn(
            "rounded-full transition-transform scale-100 bg-[var(--brand)]",
            isLg ? "size-2.5" : "size-2"
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
export default RadioGroup;
