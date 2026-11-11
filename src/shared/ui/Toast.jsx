"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Toast Primitive — design-system 08-feedback.md §1
 * Sonner-style feedback toast
 */
export const Toast = React.forwardRef(function Toast(
  {
    title,
    description,
    icon: IconComp,
    onClose,
    action,
    variant = "default",
    className,
    children,
    ...props
  },
  ref
) {
  const variantBorder = {
    default: "border-[var(--border-brand-btn)]",
    success: "border-[var(--success)]",
    error: "border-[var(--danger)]",
    warning: "border-[var(--warning)]",
    info: "border-[var(--info)]",
  };

  return (
    <div
      ref={ref}
      role="status"
      className={cn("toast", variantBorder[variant] || variantBorder.default, className)}
      {...props}
    >
      {IconComp && <span className="icon shrink-0">{IconComp}</span>}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {title && <div className="title">{title}</div>}
        {description && <div className="desc">{description}</div>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="close shrink-0 cursor-pointer border-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
});

Toast.displayName = "Toast";
export default Toast;
