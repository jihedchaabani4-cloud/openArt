import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const Card = React.forwardRef(function Card(
  {
    className,
    variant = "default",
    interactive = false,
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      ref={ref}
      data-slot="card"
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      className={cn(
        "rounded-comfortable bg-surface-card backdrop-blur-2xl text-text-primary hover:bg-ui-button-tonal transition-all font-sans antialiased overflow-hidden flex flex-col relative border border-border-weak",
        interactive && "cursor-pointer hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-heavy active:scale-95",
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
        "flex flex-col gap-1.5 p-6",
        bordered && "border-b border-border-weak pb-4",
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
      className={cn("ds-type-feature-title text-text-primary", className)}
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
      className={cn("ds-type-small text-text-secondary", className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(function CardContent(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="card-content"
      className={cn("p-6 pt-0 flex-1", className)}
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
        "flex items-center p-6 pt-0 gap-2 shrink-0",
        bordered && "border-t border-border-weak pt-4",
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";


const CardCanvas = React.forwardRef(function CardCanvas(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="card-canvas"
      className={cn("relative w-full overflow-hidden", className)}
      {...props}
    />
  );
});
CardCanvas.displayName = "CardCanvas";

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Canvas = CardCanvas;

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardCanvas,
};
