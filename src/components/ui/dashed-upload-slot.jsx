import * as React from "react";
import { cn } from "@/shared/lib/utils";

function DashedUploadSlot({
  className,
  size = "default",
  disabled = false,
  children,
  ...props
}) {
  const sizeClasses = {
    square: "size-16",
    aspect: "h-[72px] w-24",
    default: "h-[72px] w-24",
  };

  return (
    <button
      type="button"
      data-slot="dashed-upload-slot"
      disabled={disabled}
      className={cn(
        "rounded-2xl border border-dashed border-white/[0.18] bg-white/5 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        disabled ? "cursor-not-allowed text-white/25 border-white/10 pointer-events-none" : "text-white/50 hover:bg-white/10 hover:text-white",
        sizeClasses[size] || sizeClasses.default,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { DashedUploadSlot };
