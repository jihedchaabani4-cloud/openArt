import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const VARIANTS = {
  compact: "ds-list-row justify-between cursor-pointer",
  thumbnail: "ds-list-row h-auto group justify-between gap-3 p-2 cursor-pointer",
  preview: "ds-list-row h-auto group justify-between gap-3 p-2 cursor-pointer",
};

const InteractiveListRow = React.forwardRef(function InteractiveListRow(
  { className, variant = "compact", asChild = false, children, ...props },
  ref
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      ref={ref}
      data-slot="interactive-list-row"
      data-variant={variant}
      className={cn(VARIANTS[variant] || VARIANTS.compact, className)}
      {...props}
    >
      {children}
    </Comp>
  );
});

InteractiveListRow.displayName = "InteractiveListRow";

export { InteractiveListRow, VARIANTS };
