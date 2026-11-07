"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";

/**
 * NavbarBackButton
 * Standardized back navigation button for studio navbars.
 *
 * @param {Object} props
 * @param {Function} [props.onClick] - Custom click handler
 * @param {string} [props.href] - Route to navigate to via router.push or Link
 * @param {string} [props.label="Back"] - Accessible label
 * @param {string} [props.className] - Additional classes
 * @param {boolean} [props.disabled=false]
 */
export function NavbarBackButton({
  onClick,
  href,
  label = "Back",
  iconName = "arrow_back",
  className,
  disabled = false,
  children,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}) {
  const router = useRouter();

  if (href && !onClick) {
    return (
      <Button
        asChild
        variant="ghost"
        disabled={disabled}
        className={cn(
          "cursor-pointer shrink-0 text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white transition-all",
          children ? "h-10 px-3.5 gap-2 font-medium text-sm" : "h-10 w-10",
          className
        )}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Link href={href} aria-label={label} title={label}>
          <GoogleIcon iconName={iconName} className="text-[20px]" />
          {children}
        </Link>
      </Button>
    );
  }

  const handleClick = (e) => {
    if (disabled) return;
    if (typeof onClick === "function") {
      onClick(e);
    } else {
      router.back();
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      className={cn(
        "cursor-pointer shrink-0 text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white transition-all",
        children ? "h-10 px-3.5 gap-2 font-medium text-sm" : "h-10 w-10",
        className
      )}
      onClick={handleClick}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-label={label}
      title={label}
    >
      <GoogleIcon iconName={iconName} className="text-[20px]" />
      {children}
    </Button>
  );
}

export default NavbarBackButton;
