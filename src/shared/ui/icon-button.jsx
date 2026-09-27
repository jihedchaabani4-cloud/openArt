import * as React from "react"
import { Button } from "./button"
import { cn } from "@/shared/lib/utils"

function renderIconNode(IconCandidate, props = {}) {
  if (!IconCandidate) return null;
  if (React.isValidElement(IconCandidate)) {
    return IconCandidate;
  }
  if (
    typeof IconCandidate === "function" ||
    (typeof IconCandidate === "object" && IconCandidate !== null && ("$$typeof" in IconCandidate || "render" in IconCandidate))
  ) {
    const Component = IconCandidate;
    return <Component {...props} />;
  }
  if (typeof IconCandidate === "string" || typeof IconCandidate === "number") {
    return IconCandidate;
  }
  return null;
}

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
        "text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white",
        className
      )}
      {...props}
    >
      {renderIconNode(icon)}
    </Button>
  )
})
IconButton.displayName = "IconButton"

export { IconButton }
