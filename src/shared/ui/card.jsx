import * as React from "react";
import { Surface } from "./surface";
import { cn } from "@/shared/lib/utils";

/**
 * Card Primitive — design-system.md §7
 * - Project card (grid): padding 4px 4px 6px, radius 16px (--r-xl)
 * - Hover bg: rgba(255,255,255,.05) (--overlay-5)
 * - Active: scale(0.99)
 * - Focus: ring 2px rgba(255,255,255,.30) (--ring-focus)
 */
const Card = React.forwardRef(function Card(
  {
    className,
    variant = "default",
    interactive,
    tone,
    radius = "xl",
    ...props
  },
  ref
) {
  const resolvedTone = tone || (variant === "glass" ? "overlay" : "card");
  const isInteractive = interactive ?? (variant === "interactive");

  return (
    <Surface
      ref={ref}
      tone={resolvedTone}
      radius={radius}
      data-slot="card"
      data-variant={variant}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? "button" : undefined}
      className={cn(
        "text-[var(--text-body)] transition-all font-sans antialiased overflow-hidden flex flex-col relative",
        isInteractive &&
          "cursor-pointer hover:bg-[var(--overlay-5)] hover:border-[var(--border-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] active:scale-[0.99]",
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(function CardHeader(
  { className, bordered = false, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 p-4 sm:p-5",
        bordered && "border-b border-[var(--border-subtle)] pb-3",
        className
      )}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(function CardTitle(
  { className, ...props },
  ref
) {
  return (
    <h3
      ref={ref}
      data-slot="card-title"
      className={cn("text-base font-semibold tracking-tight text-[var(--text-primary)] leading-snug", className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(function CardDescription(
  { className, ...props },
  ref
) {
  return (
    <p
      ref={ref}
      data-slot="card-description"
      className={cn("text-xs text-[var(--text-tertiary)] leading-relaxed", className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardCanvas = React.forwardRef(function CardCanvas(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="card-canvas"
      className={cn("relative w-full overflow-hidden bg-[var(--bg-root)]", className)}
      {...props}
    />
  );
});
CardCanvas.displayName = "CardCanvas";

const CardContent = React.forwardRef(function CardContent(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="card-content"
      className={cn("p-4 sm:p-5 pt-0 sm:pt-0 flex-1", className)}
      {...props}
    />
  );
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(function CardFooter(
  { className, bordered = false, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn(
        "flex items-center p-4 sm:p-5 pt-0 sm:pt-0 gap-2 shrink-0",
        bordered && "border-t border-[var(--border-subtle)] pt-3",
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Body = CardContent;
Card.Canvas = CardCanvas;
Card.Footer = CardFooter;

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardCanvas,
  CardFooter,
};
export default Card;
