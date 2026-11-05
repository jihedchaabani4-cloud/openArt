import React from "react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export const ActionBtn = React.forwardRef(({ onClick, children, className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    className={cn(
      "size-7 p-0 rounded-full text-neutral-800 bg-transparent hover:bg-white/90 border-none flex items-center justify-center",
      className
    )}
    onClick={onClick}
    {...props}
  >
    {children}
  </Button>
));
ActionBtn.displayName = "ActionBtn";
