import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center font-semibold font-sans antialiased whitespace-nowrap transition-colors shrink-0",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-[#FAFAFA]",
        secondary: "bg-[#27272A] text-[#FAFAFA]",
        accent: "bg-[#FFC241]/15 text-[#FFC241] border border-[#FFC241]/20",
        outline: "bg-transparent text-white/70 border border-white/10",
      },
      size: {
        default: "rounded-md px-1.5 py-0.5 text-xs",
        sm: "rounded px-1 py-0.2 text-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Badge({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
