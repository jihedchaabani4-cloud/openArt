import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const SIZES = {
  square: "size-16",
  aspect: "h-[72px] w-24",
  default: "h-[72px] w-24",
};

const DashedUploadSlot = React.forwardRef(function DashedUploadSlot(
  { className, size = "default", disabled = false, asChild = false, children, ...props },
  ref
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : "button"}
      data-slot="dashed-upload-slot"
      data-size={size}
      disabled={disabled}
      className={cn(
        "ds-upload-slot focus-workspace flex-col gap-1 cursor-pointer disabled:pointer-events-none",
        SIZES[size] || SIZES.default,
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});

DashedUploadSlot.displayName = "DashedUploadSlot";

export { DashedUploadSlot, SIZES };
