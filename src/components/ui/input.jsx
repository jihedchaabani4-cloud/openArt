import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, icon: Icon, ...props }, ref) => {
  if (Icon) {
    return (
      <label className={cn(
        "flex h-11 w-full items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 text-sm text-white focus-within:border-white/20 transition-all cursor-text",
        className
      )}>
        <Icon className="size-4 text-white/40" />
        <input
          type={type}
          ref={ref}
          className="bg-transparent border-none outline-none flex-1 placeholder:text-white/40"
          {...props}
        />
      </label>
    )
  }
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
