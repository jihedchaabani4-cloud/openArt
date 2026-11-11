"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Tag Primitive — design-system 07-badges-tags.md §2
 * "Special offer" tag with multi-layer radial gradient background
 */
export const Tag = React.forwardRef(function Tag(
  {
    icon: IconComp,
    children,
    className,
    variant = "special-offer",
    ...props
  },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn("tag-blue select-none", className)}
      {...props}
    >
      {IconComp && <span className="shrink-0">{IconComp}</span>}
      <span>{children}</span>
    </span>
  );
});

Tag.displayName = "Tag";
export default Tag;
