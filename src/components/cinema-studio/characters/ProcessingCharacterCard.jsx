"use client";

import { ProcessingCard } from "@/shared/ui/ProcessingCard";

/**
 * ProcessingCharacterCard Component
 * Ultra-minimalist, sleek, text-less & spinner-less processing card layer
 * powered by the Aurora blur drift animation.
 */
export function ProcessingCharacterCard({
  aspectRatio = "370/240",
  progress,
  className = "",
}) {
  return (
    <div className="relative flex w-full flex-col justify-between overflow-hidden select-none outline-none">
      <ProcessingCard
        aspectRatio={aspectRatio}
        progress={progress}
        className={className}
      />
    </div>
  );
}

export default ProcessingCharacterCard;
