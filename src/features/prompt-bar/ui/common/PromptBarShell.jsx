"use client";

import { cn } from "@/shared/lib/utils";
import {
  getPromptBarContainerClassName,
  getPromptBarContentClassName,
  getPromptBarVariant,
} from "../../model/core/promptBarLayout";

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
        getPromptBarContainerClassName(hideBackground),
        className
      )}
    >
      <div className={cn(getPromptBarContentClassName(), contentClassName)}>
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
