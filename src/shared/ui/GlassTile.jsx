import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * GlassTile Primitive — design-system.md §3.6.1 & §7.4
 * - Size: 24x24, Radius: 8px (--r-sm)
 * - Glass variant: bg overlay-8, border 1px solid border-glass, shadow --sh-glass
 * - Gradient nav variants (§7.4):
 *   - home: #222221 → #3B3C3A
 *   - generations: #51E2E0 → #125C8D
 *   - elements: #4188BE → #0E2772
 *   - favorites: #E251B4 → #8D1237
 *   - community: #A5A5A5 → #3D3D3D
 */

const gradientMap = {
  home: "linear-gradient(135deg, #222221 3.87%, #3B3C3A 93.45%)",
  generations: "linear-gradient(135deg, #51E2E0 3.87%, #125C8D 93.45%)",
  elements: "linear-gradient(135deg, #4188BE 3.87%, #0E2772 93.45%)",
  favorites: "linear-gradient(135deg, #E251B4 3.87%, #8D1237 93.45%)",
  community: "linear-gradient(135deg, #A5A5A5 3.87%, #3D3D3D 93.45%)",
};

export const GlassTile = ({
  children,
  variant = "glass", // 'glass' | 'home' | 'generations' | 'elements' | 'favorites' | 'community'
  className,
  ...props
}) => {
  const isGradient = gradientMap[variant];

  return (
    <div
      className={cn(
        "relative grid place-items-center w-[24px] h-[24px] rounded-[var(--r-sm)] shrink-0 overflow-hidden select-none transition-colors",
        !isGradient &&
          "bg-[var(--overlay-8)] border border-[var(--border-glass)] shadow-[var(--sh-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        isGradient &&
          "border border-[var(--border-glass-sm)] shadow-[var(--sh-tile)] text-[var(--text-primary)]",
        className
      )}
      style={isGradient ? { background: isGradient } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassTile;
