import React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export const ActionBtn = React.forwardRef(({ onClick, children, className, ...props }, ref) => (
  <Button
    ref={ref}
    variant="groupBtn"
    size="icon"
    className={cn("h-7 w-7 transition-all text-[#303031] hover:bg-white/90 rounded-md", className)}
    onClick={onClick}
    {...props}
  >
    {children}
  </Button>
));
ActionBtn.displayName = "ActionBtn";
