import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-sans transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none select-none",
  {
    variants: {
      variant: {
        primary:
          "h-9.5 px-4 rounded-[10px] bg-white text-black text-base font-medium shadow hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70",
        secondary:
          "h-9.5 px-4 rounded-[10px] bg-[#27272A] text-[#FAFAFA] text-base font-medium shadow hover:bg-[#27272A]/80 focus-visible:ring-2 focus-visible:ring-white/70",
        tonal:
          "h-9.5 px-3 rounded-[10px] bg-white/10 text-[#FAFAFA] text-base font-medium shadow-sm hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70",
        pill:
          "h-8 rounded-full bg-white/10 pl-3 pr-2 text-sm text-white hover:bg-white/[0.18]",
        ghost:
          "h-9 px-4 rounded-[10px] bg-transparent text-white text-sm font-medium hover:bg-white/10",
        outline:
          "h-[34px] p-2 rounded-[10px] border border-[#27272A] bg-transparent text-sm font-medium text-[#FAFAFA] shadow-sm hover:bg-[#27272A]/50 focus-visible:ring-2 focus-visible:ring-white/70",
        link:
          "p-0 h-auto bg-transparent text-sm text-white/50 hover:text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-11 px-6 text-base rounded-xl",
        icon: "size-9.5 rounded-[10px] p-2.5",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
