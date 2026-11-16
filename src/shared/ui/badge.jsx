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
        yellow: "bg-[#FFC241]/15 text-[#FFC241] border border-[#FFC241]/20",
        warning: "bg-[#FFC241]/15 text-[#FFC241] border border-[#FFC241]/20",
        pro: "bg-[#FFC241]/15 text-[#FFC241] border border-[#FFC241]/20",
        success: "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50",
        danger: "bg-[#E5484D]/15 text-[#E5484D] border border-[#E5484D]/20",
        outline: "bg-transparent text-white/70 border border-white/10",
      },
      size: {
        default: "rounded-sm h-5 px-2 text-xs",
        sm: "rounded-sm h-4 px-1.5 text-xs",
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

function StatusBanner({
  className,
  children,
  ...props
}) {
  return (
    <div
      data-slot="status-banner"
      className={cn(
        "rounded-[10px] bg-[#1A1A1A] bg-gradient-to-r from-[#FFC141]/10 to-[#FFC141]/10 pl-4 pr-4 py-2 border border-[#FFC241]/20 text-[#FAFAFA] flex items-center justify-between gap-3 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Badge, badgeVariants, StatusBanner };
