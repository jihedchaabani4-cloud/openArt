import * as React from "react";
import { cn } from "@/shared/lib/utils";

const Card = React.forwardRef(function Card(
  {
    className,
    variant = "default",
    interactive = false,
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="card"
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      className={cn(
        "rounded-md sm:rounded-[28px] bg-white/5 backdrop-blur-2xl text-white hover:bg-white/10 transition-all font-sans antialiased overflow-hidden flex flex-col relative border border-white/10",
        interactive && "cursor-pointer hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95",
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
        bordered && "border-b border-white/10 pb-4",
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
      className={cn("text-base font-semibold tracking-tight text-white leading-snug", className)}
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
      className={cn("text-xs text-white/50 leading-relaxed", className)}
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
        bordered && "border-t border-white/10 pt-4",
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
