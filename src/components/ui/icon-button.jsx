import * as React from "react";
import { cn } from "@/shared/lib/utils";

function IconButton({
  className,
  type = "button",
  variant = "ghost",
  ...props
}) {
  const variantStyles = {
    ghost: "bg-transparent text-white hover:bg-white/10",
    tonal: "bg-white/10 text-white hover:bg-white/15",
    outline: "border border-[#27272A] bg-transparent text-white hover:bg-[#27272A]/50",
  };

  return (
    <button
      type={type}
      data-slot="icon-button"
      className={cn(
        "size-9.5 rounded-[10px] p-2.5 inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer outline-none focus-visible:ring-0",
        variantStyles[variant] || variantStyles.ghost,
        className
      )}
      {...props}
    />
  );
}

export { IconButton };
