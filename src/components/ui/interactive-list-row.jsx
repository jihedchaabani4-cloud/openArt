import * as React from "react";
import { cn } from "@/shared/lib/utils";

function InteractiveListRow({
  className,
  variant = "compact",
  children,
  ...props
}) {
  if (variant === "preview") {
    return (
      <div
        data-slot="interactive-list-row"
        data-variant="preview"
        className={cn(
          "group flex items-center justify-between gap-3 p-2 rounded-2xl transition-colors cursor-pointer hover:bg-white/5",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      data-slot="interactive-list-row"
      data-variant="compact"
      className={cn(
        "h-12 px-3 rounded-lg bg-transparent text-sm font-medium text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { InteractiveListRow };
