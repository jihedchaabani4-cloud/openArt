"use client";

import * as React from "react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";

/**
 * NavbarAction
 * Standardized semantic action button for navbar operations,
 * fully delegated to Button variants with zero inline styling.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.label] - Button text label
 * @param {string | React.ReactNode} [props.icon] - GoogleIcon name string or React node
 * @param {"primary" | "danger" | "ghost" | "outline" | "secondary" | "neon"} [props.variant="ghost"]
 * @param {"default" | "sm" | "icon"} [props.size="default"]
 * @param {Function} [props.onClick]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.loading=false]
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children] - Alternative to label
 */
export function NavbarAction({
  label,
  icon,
  variant = "ghost",
  size = "default",
  onClick,
  disabled = false,
  loading = false,
  className,
  children,
  ...rest
}) {
  const content = children || label;

  const renderedIcon = React.useMemo(() => {
    if (loading) {
      return <GoogleIcon iconName="progress_activity" className={size === "icon" ? "text-xl animate-spin shrink-0" : "text-base animate-spin shrink-0"} />;
    }
    if (!icon) {
      if (variant === "danger") {
        return <GoogleIcon iconName="delete" className={size === "icon" ? "text-[20px] shrink-0" : "text-[16px] shrink-0"} />;
      }
      return null;
    }
    if (typeof icon === "string") {
      return <GoogleIcon iconName={icon} className={size === "icon" ? "text-[20px] shrink-0" : "text-[16px] shrink-0"} />;
    }
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (
      typeof icon === "function" ||
      (typeof icon === "object" && icon !== null && ("$$typeof" in icon || "render" in icon))
    ) {
      const IconComponent = icon;
      return <IconComponent className="w-4 h-4 shrink-0" />;
    }
    return null;
  }, [icon, loading, variant, size]);

  const isIcon = size === "icon";
  const coreVariant = variant === "white" || variant === "neon" ? "primary" : variant;

  return (
    <Button
      type="button"
      variant={coreVariant}
      data-variant={variant}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        isIcon && "size-9 p-0",
        variant === "neon" && "bg-brand-neon text-black hover:opacity-80 active:opacity-60",
        className
      )}
      {...rest}
    >
      {renderedIcon}
      {content && <span>{content}</span>}
    </Button>
  );
}

export default NavbarAction;
