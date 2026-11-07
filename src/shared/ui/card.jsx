/**
 * Card Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Card borders, corners, and surface colors are standard.
 * 2. USE CANONICAL VARIANTS: `variant="default" | "interactive" | "glass"`.
 * 3. `className` IS EXCLUSIVELY FOR LAYOUT (e.g. `col-span-1`, `w-full`).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as React from "react";
import { cn } from "@/shared/lib/utils";

const Card = React.forwardRef(({
  className,
  variant = "default",
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      data-slot="card"
      data-variant={variant}
      className={cn(
        "rounded-md text-white transition-all font-sans antialiased overflow-hidden",
        variant === "default" && "bg-card border border-white/5 shadow-none",
        variant === "interactive" && "bg-card border border-white/5 hover:bg-white/10 hover:border-white/10 cursor-pointer shadow-none active:scale-95",
        variant === "glass" && "bg-white/5 border border-white/10 backdrop-blur-md shadow-none",
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn("flex flex-col gap-1.5 p-4 sm:p-5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({
  className,
  ...props
}, ref) => (
  <h3
    ref={ref}
    data-slot="card-title"
    className={cn("text-base font-semibold text-white tracking-tight leading-snug", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({
  className,
  ...props
}, ref) => (
  <p
    ref={ref}
    data-slot="card-description"
    className={cn("text-xs text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    data-slot="card-content"
    className={cn("p-4 sm:p-5 pt-0 sm:pt-0", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({
  className,
  ...props
}, ref) => (
  <div
    ref={ref}
    data-slot="card-footer"
    className={cn("flex items-center p-4 sm:p-5 pt-0 sm:pt-0 gap-2", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
