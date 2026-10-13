import * as React from "react"
import { cn } from "@/shared/lib/utils"

const ButtonGroup = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center bg-[var(--foreground-state-05)] border-0 border-none max-w-fit rounded-[var(--mat-sys-corner-medium,12px)] p-1 gap-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }
