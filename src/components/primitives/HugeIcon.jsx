import { cn } from "@/shared/lib/utils";

export const HUGE_ICON_SIZES = {
  xs: "ds-icon-xs",
  sm: "ds-icon-sm",
  md: "ds-icon-md",
  lg: "ds-icon-lg",
  xl: "ds-icon-xl",
};

const ALLOWED_VARIANTS = new Set(["stroke", "solid", "duotone", "twotone", "bulk"]);

/**
 * HugeIcon — Hugeicons icon-font primitive (Stroke Rounded by default).
 * Token-aligned sizing API (`xs`..`xl` + parent `--ds-icon-size` inheritance)
 * with zero npm dependencies via the official Hugeicons CDN stylesheet in `app/layout.js`.
 *
 * Example: `<HugeIcon name="home-03" size="sm" />`
 */
export const HugeIcon = ({
  iconName,
  name,
  size,
  variant = "stroke",
  className,
  ...props
}) => {
  const rawName = String(iconName || name || "").trim();
  const normalizedName = rawName.replace(/^hgi-/, "");
  const safeVariant = ALLOWED_VARIANTS.has(variant) ? variant : "stroke";
  const sizeClass = size ? HUGE_ICON_SIZES[size] : undefined;

  return (
    <span
      role="img"
      aria-hidden="true"
      data-icon-provider="hugeicons"
      data-icon-name={normalizedName || undefined}
      data-size={sizeClass ? size : undefined}
      className={cn(
        "huge-icon hgi notranslate relative select-none align-middle",
        `hgi-${safeVariant}`,
        normalizedName && `hgi-${normalizedName}`,
        sizeClass,
        className
      )}
      {...props}
    />
  );
};

export default HugeIcon;
