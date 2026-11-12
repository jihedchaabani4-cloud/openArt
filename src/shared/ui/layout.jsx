/**
 * Layout Primitives — OpenArt / Labveil Unified Design System
 * 
 * Layer 3 Layout Primitives:
 * - Container: Page-level responsive width constraints (cinema, editorial, compact, full).
 * - Section: Vertical page slices with rhythm tokens (none, sm, default, lg, xl, xxl).
 * - Stack: Vertical flex composition layout with semantic gaps.
 * - Inline: Horizontal flex composition layout with alignment and wrap controls.
 */

"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

const containerVariants = cva(
  "w-full mx-auto px-4 sm:px-6",
  {
    variants: {
      size: {
        cinema: "max-w-7xl 2xl:max-w-400 lg:px-8",
        editorial: "max-w-6xl",
        compact: "max-w-4xl",
        full: "max-w-full",
      },
    },
    defaultVariants: {
      size: "editorial",
    },
  }
);

export const Container = React.forwardRef(({
  as: Component = "div",
  size = "editorial",
  className,
  ...props
}, ref) => {
  return (
    <Component
      ref={ref}
      data-slot="layout-container"
      data-size={size}
      className={cn(containerVariants({ size }), className)}
      {...props}
    />
  );
});
Container.displayName = "Container";

const sectionVariants = cva(
  "w-full relative",
  {
    variants: {
      spacing: {
        none: "py-0",
        sm: "py-4 sm:py-6",
        default: "py-8 sm:py-10",
        lg: "py-12 sm:py-16",
        xl: "py-16 sm:py-20",
        xxl: "py-20 sm:py-24",
      },
      variant: {
        default: "bg-transparent text-on-surface",
        dark: "bg-surface-container-low text-on-surface border-y border-outline-variant",
        light: "bg-white text-black",
      },
    },
    defaultVariants: {
      spacing: "default",
      variant: "default",
    },
  }
);

export const Section = React.forwardRef(({
  as: Component = "section",
  spacing = "default",
  variant = "default",
  className,
  ...props
}, ref) => {
  return (
    <Component
      ref={ref}
      data-slot="layout-section"
      data-spacing={spacing}
      data-variant={variant}
      className={cn(sectionVariants({ spacing, variant }), className)}
      {...props}
    />
  );
});
Section.displayName = "Section";

const stackVariants = cva(
  "flex flex-col",
  {
    variants: {
      gap: {
        none: "gap-0",
        xs: "gap-1",
        sm: "gap-2",
        md: "gap-3",
        default: "gap-4",
        lg: "gap-6",
        xl: "gap-8",
      },
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        stretch: "items-stretch",
      },
      justify: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
      },
    },
    defaultVariants: {
      gap: "default",
      align: "stretch",
      justify: "start",
    },
  }
);

export const Stack = React.forwardRef(({
  as: Component = "div",
  gap = "default",
  align = "stretch",
  justify = "start",
  className,
  ...props
}, ref) => {
  return (
    <Component
      ref={ref}
      data-slot="layout-stack"
      data-gap={gap}
      className={cn(stackVariants({ gap, align, justify }), className)}
      {...props}
    />
  );
});
Stack.displayName = "Stack";

const inlineVariants = cva(
  "flex flex-row items-center",
  {
    variants: {
      gap: {
        none: "gap-0",
        xs: "gap-1",
        sm: "gap-2",
        md: "gap-3",
        default: "gap-4",
        lg: "gap-6",
        xl: "gap-8",
      },
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        baseline: "items-baseline",
      },
      justify: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
      },
      wrap: {
        true: "flex-wrap",
        false: "flex-nowrap",
      },
    },
    defaultVariants: {
      gap: "default",
      align: "center",
      justify: "start",
      wrap: true,
    },
  }
);

export const Inline = React.forwardRef(({
  as: Component = "div",
  gap = "default",
  align = "center",
  justify = "start",
  wrap = true,
  className,
  ...props
}, ref) => {
  return (
    <Component
      ref={ref}
      data-slot="layout-inline"
      data-gap={gap}
      className={cn(inlineVariants({ gap, align, justify, wrap }), className)}
      {...props}
    />
  );
});
Inline.displayName = "Inline";
