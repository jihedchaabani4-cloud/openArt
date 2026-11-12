"use client";

import { cn } from "@/shared/lib/utils";

/**
 * NavbarTitle
 * Standardized typography for navbar titles and subtitles.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Title text or elements
 * @param {React.ReactNode} [props.badge] - Optional badge tag next to the title
 * @param {string} [props.subtitle] - Optional subtle subtitle underneath or next to title
 * @param {string} [props.className] - Additional classes
 */
export function NavbarTitle({
  children,
  badge,
  subtitle,
  className,
}) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0 select-none", className)}>
      <span className="text-md font-medium tracking-tight text-white truncate">
        {children}
      </span>

      {badge && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/70 border border-white/10">
          {badge}
        </span>
      )}

      {subtitle && (
        <span className="text-xs text-white/40 truncate hidden sm:inline">
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default NavbarTitle;
