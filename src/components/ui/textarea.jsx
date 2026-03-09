import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none",
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
