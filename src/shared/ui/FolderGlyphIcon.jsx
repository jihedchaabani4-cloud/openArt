import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { getFolderColorGradient } from "@/features/folders/model/folder-color-tokens";

/**
 * FolderGlyphIcon
 * High-fidelity 3D Mac/iOS style rounded folder icon with two-tier gradient depth.
 * Dynamically adapts to folder color (lime, cyan, violet, pink, etc.).
 */
export function FolderGlyphIcon({
  color,
  className,
  size = 18,
  isOpen = false,
  ...props
}) {
  const gradient = getFolderColorGradient(color);
  const gradId = React.useId().replace(/:/g, "");

  const backTabColor = gradient.backTab;
  const frontTopColor = gradient.frontTop;
  const frontBottomColor = gradient.frontBottom;
  const strokeColor = gradient.frontStroke;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient
          id={`front-grad-${gradId}`}
          x1="12"
          y1="5.5"
          x2="12"
          y2="19"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={frontTopColor} />
          <stop offset="100%" stopColor={frontBottomColor} />
        </linearGradient>
      </defs>

      {/* ── Back Folder Tab ── */}
      <path
        d="M2.5 3C2.5 1.89543 3.39543 1 4.5 1H8.2C9.0487 1 9.85194 1.38316 10.381 2.04273L11.5 3.44C11.8527 3.87971 12.3882 4.13529 12.954 4.13529H20.5C21.6046 4.13529 22.5 5.03072 22.5 6.13529V9C22.5 10.1046 21.6046 11 20.5 11H3.5C2.94772 11 2.5 10.5523 2.5 10V3Z"
        fill={backTabColor}
      />

      {/* ── Front Body (Graduated highlight with smooth rounded corners) ── */}
      <rect
        x="1.5"
        y="5.5"
        width="21"
        height="13.5"
        rx="3"
        fill={`url(#front-grad-${gradId})`}
        stroke={strokeColor}
        strokeWidth="0.75"
      />
    </svg>
  );
}
