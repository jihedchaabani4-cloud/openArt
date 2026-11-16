import * as React from "react";
import { Slot } from "radix-ui";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

export const surfaceVariants = cva(
  "transition-colors duration-150",
  {
    variants: {
      tone: {
        base: "bg-omni-bg text-white border border-white/10",
        panel: "bg-omni-bg text-white border-r border-[#27272A]",
        processing: "bg-[#09090B] text-white",
        card: "bg-white/5 backdrop-blur-2xl text-white border border-white/10",
        elevated: "bg-[#27272A] text-white border border-white/10",
        highest: "bg-[#27272A] text-white border border-white/10",
        sunken: "bg-[#09090B] text-white",
        overlay: "surface-glass text-white border border-white/10",
        tertiary: "bg-[#0E1015] text-white",
        secondary: "bg-[#27272A] text-[#FAFAFA]",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-md",
        md: "rounded-[10px]",
        lg: "rounded-2xl",
        xl: "rounded-3xl",
        "2xl": "rounded-[28px]",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      tone: "base",
      radius: "md",
    },
  }
);

export const Surface = React.forwardRef(function Surface(
  {
    asChild = false,
    tone = "base",
    radius = "md",
    className,
    children,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      ref={ref}
      data-slot="surface"
      data-tone={tone}
      data-radius={radius}
      className={cn(surfaceVariants({ tone, radius }), className)}
      {...props}
    >
      {children}
    </Comp>
  );
});
Surface.displayName = "Surface";
