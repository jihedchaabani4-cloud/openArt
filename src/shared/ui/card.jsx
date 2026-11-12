/**
 * Card Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Card borders, corners, and surface colors are standard.
 * 2. USE CANONICAL VARIANTS: `variant="default" | "interactive" | "glass"` or `tone / radius`.
 * 3. DUAL EXPORT & SYNONYM PATTERN: Full backward compatibility for named exports
 *    alongside ergonomic compound dot-notation (`Card.Header`, `Card.Canvas`, `Card.Body`).
 * 4. `className` IS EXCLUSIVELY FOR LAYOUT (e.g. `col-span-1`, `w-full`).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as React from "react";
import { Surface } from "./surface";
import { cn } from "@/shared/lib/utils";

const Card = React.forwardRef(function Card(
  {
    className,
    variant = "default",
    interactive,
    tone,
    radius = "md",
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
        "text-content-base transition-all font-sans antialiased overflow-hidden flex flex-col relative",
        isInteractive && "cursor-pointer hover:bg-white/10 hover:border-line-interactive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-line-interactive transition-all active:scale-95",
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
        bordered && "border-b border-line-subtle pb-3",
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
      className={cn("text-base font-semibold tracking-tight text-content-base leading-snug", className)}
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
      className={cn("text-xs text-content-muted leading-relaxed", className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardCanvas = React.forwardRef(function CardCanvas(
  { className, ...props },
  ref
) {
  // Edge-to-edge bleed zone with zero padding for video, WebGL, or scrubbers
  return (
    <div
      ref={ref}
      data-slot="card-canvas"
      className={cn("relative w-full overflow-hidden bg-surface-sunken", className)}
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
        bordered && "border-t border-line-subtle pt-3",
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

// Attach dot-notation compound aliases to Card
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Body = CardContent; // Ergonomic alias for CardContent
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
