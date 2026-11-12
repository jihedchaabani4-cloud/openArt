import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const buttonGroupVariants = cva(
  "flex items-center max-w-fit gap-0.5 border-0 border-none",
  {
    variants: {
      variant: {
        default: "bg-(--foreground-state-05) rounded-sm p-1",
        pill: "bg-white/60 backdrop-blur-md rounded-full p-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const ButtonGroup = React.forwardRef(({ className, variant, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="button-group"
      data-variant={variant || "default"}
      className={cn(buttonGroupVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  )
})
ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup, buttonGroupVariants }
