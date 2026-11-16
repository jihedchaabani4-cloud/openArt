import * as React from "react";
import { cn } from "@/shared/lib/utils";

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

export { StatusBanner };
