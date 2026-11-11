import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/shared/lib/utils";

/**
 * Button Primitive — Higgsfield "Cinema Studio" Design System
 * Single Source of Truth: design-system.md §3
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-medium antialiased transition-all disabled:pointer-events-none disabled:opacity-40 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 rounded-[var(--r-sm)]",
  {
    variants: {
      variant: {
        primary:
          "h-8 px-3.5 rounded-[var(--r-sm)] bg-[var(--brand)] text-[var(--text-on-brand)] font-semibold hover:brightness-90 active:brightness-80 border-0",
        generate:
          "btn-generate",
        "generate-hero":
          "btn-generate-hero",
        "generate-compact":
          "btn-generate-compact",
        "mobile-create":
          "btn-mobile-create",
        marketing:
          "btn-marketing",
        pill:
          "btn-pill",
        secondary:
          "h-8 px-3.5 rounded-[var(--r-sm)] bg-[var(--overlay-5)] text-[var(--text-primary)] hover:bg-[var(--overlay-10)] active:bg-[var(--overlay-20)] border-0",
        outline:
          "h-8 px-3.5 rounded-[var(--r-sm)] border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--overlay-5)] active:bg-[var(--overlay-10)]",
        ghost:
          "h-8 px-3.5 rounded-[var(--r-sm)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--overlay-5)] active:bg-[var(--overlay-10)] border-0",
        quiet:
          "h-8 px-3.5 rounded-[var(--r-sm)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--overlay-10)] active:bg-[var(--overlay-20)] border-0",
        chip:
          "h-[28px] px-2 rounded-[var(--r-sm)] bg-[var(--overlay-5)] text-[var(--text-primary)] text-[12px] leading-[18px] hover:bg-[var(--overlay-10)] active:bg-[var(--overlay-20)] border-0",
        "chip-highlight":
          "h-[28px] px-2 rounded-[var(--r-sm)] bg-[var(--overlay-5)] text-[var(--brand)] font-semibold text-[12px] leading-[18px] hover:bg-[var(--overlay-10)] active:bg-[var(--overlay-20)] border-0",
        danger:
          "h-8 px-3.5 rounded-[var(--r-sm)] bg-transparent text-[var(--pink-400)] hover:bg-[var(--overlay-5)] active:bg-[var(--overlay-10)] border-0",
        link:
          "!h-auto !p-0 bg-transparent text-[var(--text-primary)] underline-offset-4 hover:underline font-medium border-0",
        icon:
          "w-[24px] h-[24px] p-0 rounded-[var(--r-sm)] text-[var(--text-secondary)] hover:bg-[var(--overlay-5)] hover:text-[var(--text-primary)] active:scale-95 border-0",
        "toolbar-icon":
          "w-[24px] h-[24px] p-0 rounded-[var(--r-sm)] text-[var(--text-tertiary)] hover:bg-[var(--overlay-10)] hover:text-[var(--text-primary)] active:bg-[var(--overlay-20)] border-0",
        close:
          "w-[24px] h-[24px] p-0 rounded-[var(--r-xs)] text-[var(--text-secondary)] hover:bg-[var(--overlay-10)] hover:text-[var(--text-primary)] active:bg-[var(--overlay-20)] border-0",
        collapse:
          "w-[36px] h-[36px] p-0 rounded-[var(--r-lg)] bg-[var(--overlay-5)] text-[var(--text-tertiary)] hover:bg-[var(--overlay-10)] hover:text-[var(--text-primary)] active:bg-[var(--overlay-20)] border-0",
        notification:
          "w-[36px] h-[36px] p-0 rounded-full bg-[var(--overlay-5)] text-[var(--text-footer)] hover:bg-[var(--overlay-10)] hover:text-[var(--text-primary)] active:bg-[var(--overlay-20)] border-0",
      },
      size: {
        s: "h-7 px-2.5 text-xs",
        m: "h-8 px-3.5 text-sm",
        l: "h-10 px-4 text-sm",
        icon: "w-[24px] h-[24px] p-0",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "m",
    },
  }
);

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "ghost",
    size = "m",
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot.Root : "button";
  const resolvedVariant = variant === "default" || !variant ? "ghost" : variant;
  const resolvedSize = size ? String(size).toLowerCase() : "m";

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={resolvedVariant}
      className={cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize }), className)}
      {...props}
    />
  );
});

Button.displayName = "Button";
export { Button, buttonVariants };
export default Button;
