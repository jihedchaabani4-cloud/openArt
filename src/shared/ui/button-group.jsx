import * as React from "react"
import { cn } from "@/shared/lib/utils"

const ButtonGroup = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center bg-white/10 max-w-fit rounded-lg p-1 gap-0.5",
        // Remove individual rounding from children
      
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
