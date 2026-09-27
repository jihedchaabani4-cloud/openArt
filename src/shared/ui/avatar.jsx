"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/shared/lib/utils"

const Avatar = ({ className, ...props }) => (
  <AvatarPrimitive.Root
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-[var(--mat-sys-corner-medium,12px)]",
      className
    )}
    {...props}
  />
)

const AvatarImage = ({ className, ...props }) => (
  <AvatarPrimitive.Image
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
)

const AvatarFallback = ({ className, ...props }) => (
  <AvatarPrimitive.Fallback
    className={cn(
      "flex h-full w-full items-center justify-center rounded-[var(--mat-sys-corner-medium,12px)] bg-[var(--foreground-state-15)] text-[var(--mat-sys-on-surface,#e3e3e3)]",
      className
    )}
    {...props}
  />
)

export { Avatar, AvatarImage, AvatarFallback }
