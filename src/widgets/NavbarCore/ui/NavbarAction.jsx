"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

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
      return <Loader2 className="w-4 h-4 animate-spin shrink-0" />;
    }
    if (!icon) {
      if (variant === "danger") {
        return <GoogleIcon iconName="delete" className="text-[16px] shrink-0" />;
      }
      return null;
    }
    if (typeof icon === "string") {
      return <GoogleIcon iconName={icon} className="text-[16px] shrink-0" />;
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
  }, [icon, loading, variant]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size === "icon" ? "icon" : "default"}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      {...rest}
    >
      {renderedIcon}
      {content && <span>{content}</span>}
    </Button>
  );
}

export default NavbarAction;
