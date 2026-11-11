"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * QuietAction Primitive — design-system 02-buttons-quiet.md
 * Shared logic: transparent / 5% -> hover 10% -> pressed 20%; grey fg -> white on hover; focus = 1.5px white ring.
 */
export const QuietAction = React.forwardRef(function QuietAction(
  {
    variant = "default",
    className,
    children,
    disabled = false,
    type = "button",
    icon: IconComp,
    trailingIcon: TrailingIconComp,
    ...props
  },
  ref
) {
  const variantClasses = {
    default: "qa px-2.5 h-[36px] rounded-[var(--r-lg)]",
    row: "qa qa-row",
    "sidebar-action": "qa qa-sidebar-action",
    "icon-24": "qa qa-icon-24",
    close: "qa qa-icon-24 qa-icon-24--close",
    collapse: "qa qa-icon-36",
    notification: "qa qa-icon-36 qa-icon-36--round",
    switcher: "qa qa-switcher",
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(variantClasses[variant] || variantClasses.default, className)}
      {...props}
    >
      {IconComp && <span className="shrink-0">{IconComp}</span>}
      {children && <span>{children}</span>}
      {TrailingIconComp && <span className="trail shrink-0">{TrailingIconComp}</span>}
    </button>
  );
});

QuietAction.displayName = "QuietAction";
export default QuietAction;
