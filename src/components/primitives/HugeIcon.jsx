import { cn } from "@/shared/lib/utils";

export const HUGE_ICON_SIZES = {
  "2xs": "ds-icon-2xs",
  xs: "ds-icon-xs",
  sm: "ds-icon-sm",
  md: "ds-icon-md",
  lg: "ds-icon-lg",
  xl: "ds-icon-xl",
  "2xl": "ds-icon-2xl",
  "3xl": "ds-icon-3xl",
};

export const HUGE_ICON_WEIGHTS = {
  light: "ds-icon-weight-light",
  regular: "ds-icon-weight-regular",
  medium: "ds-icon-weight-medium",
  bold: "ds-icon-weight-bold",
};

const ALLOWED_VARIANTS = new Set(["stroke", "solid", "duotone", "twotone", "bulk"]);

// Official Hugeicons rounded solid paths for filled active states (free CDN only ships hgi-stroke).
const FILLED_SVG_PATHS = {
  favourite:
    "M19.4626 3.99415C16.7809 2.34923 14.4404 3.01211 13.0344 4.06801C12.4578 4.50096 12.1696 4.71743 12 4.71743C11.8304 4.71743 11.5422 4.50096 10.9656 4.06801C9.55962 3.01211 7.21909 2.34923 4.53744 3.99415C1.01807 6.15294 0.221721 13.2749 8.33953 19.2834C9.88572 20.4278 10.6588 21 12 21C13.3412 21 14.1143 20.4278 15.6605 19.2834C23.7783 13.2749 22.9819 6.15294 19.4626 3.99415Z",
};

/**
 * HugeIcon — Hugeicons icon-font primitive (Stroke Rounded by default).
 * Token-aligned sizing (`2xs`..`3xl` + parent `--ds-icon-size` inheritance) and
 * weight (`light` | `regular` | `medium` | `bold`) backed by `src/styles/tokens/icons.css`,
 * with zero npm dependencies via the official Hugeicons CDN stylesheet in `app/layout.js`.
 * Pass `filled` for solid active states (e.g. liked `favourite` heart).
 *
 * Example: `<HugeIcon name="home-03" size="sm" weight="medium" />`
 */
export const HugeIcon = ({
  iconName,
  name,
  size,
  weight,
  variant = "stroke",
  filled = false,
  className,
  ...props
}) => {
  const rawName = String(iconName || name || "").trim();
  const normalizedName = rawName.replace(/^hgi-/, "");
  const safeVariant = ALLOWED_VARIANTS.has(variant) ? variant : "stroke";
  const sizeClass = size ? HUGE_ICON_SIZES[size] : undefined;
  const weightClass = weight ? HUGE_ICON_WEIGHTS[weight] : undefined;
  const filledPath = filled ? FILLED_SVG_PATHS[normalizedName] : null;

  return (
    <span
      role="img"
      aria-hidden="true"
      data-icon-provider="hugeicons"
      data-icon-name={normalizedName || undefined}
      data-size={sizeClass ? size : undefined}
      data-weight={weightClass ? weight : undefined}
      data-filled={filledPath ? "true" : undefined}
      className={cn(
        "huge-icon notranslate relative select-none align-middle",
        !filledPath && "hgi",
        !filledPath && `hgi-${safeVariant}`,
        !filledPath && normalizedName && `hgi-${normalizedName}`,
        sizeClass,
        weightClass,
        className
      )}
      {...props}
    >
      {filledPath && (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-[1em] shrink-0"
          aria-hidden="true"
        >
          <path d={filledPath} />
        </svg>
      )}
    </span>
  );
};

export default HugeIcon;
