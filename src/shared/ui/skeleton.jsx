import * as React from "react";
import { cn } from "@/shared/lib/utils";

function Skeleton({
  className,
  variant = "pulse",
  shape = "default",
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      data-shape={shape}
      className={cn(
        "bg-[var(--overlay-5)] pointer-events-none",
        variant === "pulse" && "animate-pulse",
        variant === "shimmer" && "animate-shimmer bg-gradient-to-r from-[var(--overlay-5)] via-[var(--overlay-10)] to-[var(--overlay-5)]",
        shape === "default" && "rounded-[var(--r-sm)]",
        shape === "card" && "rounded-[var(--r-lg)]",
        shape === "circle" && "rounded-full",
        shape === "badge" && "rounded-[var(--r-xs)]",
        shape === "pill" && "rounded-full",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
export default Skeleton;
