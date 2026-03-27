"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/shared/lib/utils"

const Avatar = ({ className, ...props }) => (
  <AvatarPrimitive.Root
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-md",
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
      "flex h-full w-full items-center justify-center rounded-md bg-muted",
      className
    )}
    {...props}
  />
)

export { Avatar, AvatarImage, AvatarFallback }
