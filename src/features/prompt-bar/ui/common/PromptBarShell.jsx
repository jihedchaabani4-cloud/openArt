"use client";

import { cn } from "@/shared/lib/utils";
import { getPromptBarVariant } from "./promptBarVariants";

export function PromptBarShell({
  variant = "generation",
  hideBackground = false,
  containerRef,
  isDragging = false,
  dragOverlay = null,
  children,
  popover = null,
  className,
  contentClassName,
  cardClassName,
  innerClassName,
}) {
  const variantConfig = getPromptBarVariant(variant);

  return (
    <div
      ref={containerRef}
      className={cn(
        hideBackground
          ? "relative w-full flex flex-col"
          : "fixed bottom-8 left-1/2 -translate-x-1/2 w-full z-50 flex items-center justify-center max-w-[650px] px-6",
        className
      )}
    >
      <div className={cn("w-full flex flex-col items-end justify-end", contentClassName)}>
        {isDragging ? (
          dragOverlay
        ) : (
          <div className={cn(variantConfig.cardClassName, cardClassName)}>
            <div className={cn(variantConfig.innerClassName, innerClassName)}>{children}</div>
          </div>
        )}
      </div>
      {popover}
    </div>
  );
}
