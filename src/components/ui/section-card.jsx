import * as React from "react";
import { cn } from "@/shared/lib/utils";

function SectionCard({
  className,
  children,
  ...props
}) {
  return (
    <div
      data-slot="section-card"
      className={cn(
        "rounded-[28px] bg-white/5 backdrop-blur-2xl px-8 py-6 text-white border border-white/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { SectionCard };
