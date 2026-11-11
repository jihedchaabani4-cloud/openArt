import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * IconButton Primitive — design-system.md §3.6
 * Variants:
 * - default (icon-24): 24x24, radius 8, color #828282, hover bg overlay-5 + color #FFF, active scale(.96)
 * - small (icon-24-sm): 24x24, radius 6, color #898A8B, hover bg overlay-10, color #FFF
 * - collapse: 36x36, radius 12, bg overlay-5, color #828282, hover bg overlay-10
 * - notification: 36 hit / 24 inner circle, full, inner bg overlay-5, hover overlay-10
 */
export const IconButton = React.forwardRef(function IconButton(
  {
    children,
    variant = "default",
    className,
    disabled = false,
    ...props
  },
  ref
) {
  const variantClasses = {
    default:
      "w-[24px] h-[24px] rounded-[var(--r-sm)] text-[var(--text-tertiary)] hover:bg-[var(--overlay-5)] hover:text-[var(--text-primary)] active:scale-95",
    small:
      "w-[24px] h-[24px] rounded-[var(--r-xs)] text-[var(--text-secondary)] hover:bg-[var(--overlay-10)] hover:text-[var(--text-primary)] active:scale-95",
    collapse:
      "w-[36px] h-[36px] rounded-[var(--r-lg)] bg-[var(--overlay-5)] text-[var(--text-tertiary)] hover:bg-[var(--overlay-10)] hover:text-[var(--text-primary)] active:scale-95",
    notification:
      "w-[36px] h-[36px] rounded-[var(--r-full)] flex items-center justify-center text-[var(--text-footer)] hover:text-[var(--text-primary)]",
  };

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center cursor-pointer transition-all outline-none border-0 select-none shrink-0",
        variantClasses[variant] || variantClasses.default,
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className
      )}
      {...props}
    >
      {variant === "notification" ? (
        <span className="w-[24px] h-[24px] rounded-full bg-[var(--overlay-5)] hover:bg-[var(--overlay-10)] flex items-center justify-center transition-colors">
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
});

IconButton.displayName = "IconButton";
export default IconButton;
