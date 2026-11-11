import * as React from "react";
import { Icon } from "./Icon";
import { cn } from "@/shared/lib/utils";

/**
 * GoogleIcon adapter — delegates directly to the SVG Icon primitive.
 * Eliminates all external Google/Material Symbol font dependencies
 * while preserving legacy font-span hooks and accessibility.
 */
export const GoogleIcon = ({
  iconName,
  name,
  className,
  size,
  style,
  ...props
}) => {
  const finalName = iconName || name;
  return (
    <span
      data-mat-icon-type="font"
      className={cn("inline-flex items-center justify-center select-none shrink-0 text-white", className)}
      style={style}
    >
      <Icon
        name={finalName}
        size={size}
        {...props}
      />
    </span>
  );
};

export default GoogleIcon;
