"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/base/button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
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
  iconName = "arrow-left-02",
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
          "cursor-pointer shrink-0 text-text-body-muted hover:text-text-primary transition-all",
          children ? "h-7 max-h-full px-2.5 gap-1.5" : "size-7 max-h-full aspect-square p-0",
          className
        )}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <Link href={href} aria-label={label} title={label}>
          <HugeIcon name={iconName} />
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
        "cursor-pointer shrink-0 text-text-body-muted hover:text-text-primary transition-all",
        children ? "h-7 max-h-full px-2.5 gap-1.5" : "size-7 max-h-full aspect-square p-0",
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
      <HugeIcon name={iconName} />
      {children}
    </Button>
  );
}

export default NavbarBackButton;
