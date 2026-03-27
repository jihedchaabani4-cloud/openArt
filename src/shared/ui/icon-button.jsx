import * as React from "react"
import { Button } from "./button"
import { cn } from "@/shared/lib/utils"

const IconButton = React.forwardRef(({ 
  icon, 
  className, 
  variant = "ghost",
  size = "icon",
  danger, // ← destructure so it doesn't pass to DOM
  ...props 
}, ref) => {
  return (
    <Button
      ref={ref}
      size={size}
      className={cn(
  
        "text-white ", // optional red styling
        className
      )}
      {...props}
    >
      {icon}
    </Button>
  )
})
IconButton.displayName = "IconButton"

export { IconButton }
