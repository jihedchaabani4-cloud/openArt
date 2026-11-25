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
      <span className="ds-type-caption-label text-text-primary truncate">
        {children}
      </span>

      {badge && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-sharp ds-type-micro-tag bg-surface-tonal text-text-body-muted border border-border-subtle">
          {badge}
        </span>
      )}

      {subtitle && (
        <span className="ds-type-small text-text-secondary truncate hidden sm:inline">
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default NavbarTitle;
