import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const buttonGroupVariants = cva(
  "items-center border-0 border-none",
  {
    variants: {
      variant: {
        default: "flex max-w-fit gap-0.5 bg-(--foreground-state-05) rounded-subtle p-1",
        pill: "flex max-w-fit gap-0.5 bg-white/60 backdrop-blur-md rounded-subtle p-1",
        radiogroup: "grid h-[38px] grid-cols-4 gap-0.5 rounded-subtle bg-white/5 border border-white/10 p-0.5 w-full",
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
