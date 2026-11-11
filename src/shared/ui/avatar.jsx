"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/shared/lib/utils";

const Avatar = ({ className, ...props }) => (
  <AvatarPrimitive.Root
    className={cn(
      "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full select-none",
      className
    )}
    {...props}
  />
);

const AvatarImage = ({ className, ...props }) => (
  <AvatarPrimitive.Image
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
);

const AvatarFallback = ({ className, ...props }) => (
  <AvatarPrimitive.Fallback
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-[var(--overlay-10)] text-[var(--text-primary)] font-medium text-xs",
      className
    )}
    {...props}
  />
);

export { Avatar, AvatarImage, AvatarFallback };
export default Avatar;
