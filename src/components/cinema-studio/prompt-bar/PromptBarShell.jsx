"use client";

import { cn } from "@/shared/lib/utils";
import {
  getPromptBarContainerClassName,
  getPromptBarContentClassName,
  getPromptBarVariant,
} from "@/features/prompt-bar/model/core/promptBarLayout";

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
          <div
            className={cn(
              variantConfig.cardClassName,
              variantConfig.innerClassName,
              cardClassName,
              innerClassName
            )}
          >
            {children}
          </div>
        )}
      </div>
      {popover}
    </div>
  );
}
