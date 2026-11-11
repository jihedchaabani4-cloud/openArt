"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Field Primitive — design-system 04-inputs.md
 * Shared field shell for inputs, selects, and textareas
 */
export const Field = React.forwardRef(function Field(
  {
    children,
    size = "default",
    invalid = false,
    disabled = false,
    readonly = false,
    className,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      data-invalid={invalid ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      data-readonly={readonly ? "true" : undefined}
      className={cn(
        "field",
        size === "lg" && "field--lg",
        invalid && "border-[var(--danger)]",
        disabled && "opacity-50 pointer-events-none",
        readonly && "bg-[var(--overlay-5)] shadow-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

export function FormItem({ children, className, ...props }) {
  return (
    <div className={cn("form-item", className)} {...props}>
      {children}
    </div>
  );
}

export function FormLabel({ children, className, ...props }) {
  return (
    <label className={cn("form-label", className)} {...props}>
      {children}
    </label>
  );
}

export function FormHelp({ children, className, ...props }) {
  return (
    <p className={cn("form-help", className)} {...props}>
      {children}
    </p>
  );
}

export function FormError({ children, className, ...props }) {
  return (
    <p className={cn("form-error", className)} {...props}>
      {children}
    </p>
  );
}

Field.displayName = "Field";
export default Field;
