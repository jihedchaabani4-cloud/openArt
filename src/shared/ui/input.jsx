import * as React from "react"

import { cn } from "@/shared/lib/utils"

const Input = React.forwardRef(({ className, type, icon: Icon, onClear, clearIcon: ClearIcon, ...props }, ref) => {
  const hasWrapper = !!Icon || !!onClear;

  if (hasWrapper) {
    return (
      <label className={cn(
        "flex h-11 w-full items-center gap-2 rounded-lg bg-black/75 bg-[linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1))]   px-3 py-2.5 text-sm text-white transition-all cursor-text",
        className
      )}>
        <Icon className="size-4 text-white shrink-0" />
        <input
          type={type}
          ref={ref}
          className="bg-transparent border-none outline-none flex-1 placeholder:text-white/40 min-w-0"
          {...props}
        />
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-md hover:cursor-pointer text-white transition-colors shrink-0"
          >
            {ClearIcon ? <ClearIcon className="size-6" /> : <span className="text-xs font-bold px-1">Clear</span>}
          </button>
        )}
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
