"use client";

import { cn } from "@/shared/lib/utils";
import "./ShineText.css";

/** One sweep cycle in ms — the Prompt Bar editor uses this for its one-shot fill timer. */
export const SHINE_TEXT_SWEEP_MS = 2600;

/**
 * ShineText Component
 * "Aurora shine" processing text — the text sibling of ProcessingCard.
 *
 * Spec:
 * - Dim neutral glyphs (white/38% over dark surfaces)
 * - White light streak sweeping start → end (left → right)
 * - Sweep finishes with a soft hold, then loops (indeterminate processing)
 * - Glint luminosity matches the ProcessingCard aurora family (~245-250/255)
 * - Subtle static glow aura behind the glyphs
 * - active = false → static dim text (processing done), animation removed
 * - Zero skeleton shimmer, zero spinners, zero framer-motion
 *
 * Owns: the ShineText span; styles live in ShineText.css (single source,
 * shared with the Prompt Bar editor one-shot prompt fill).
 */
export function ShineText({
  children,
  active = true,
  duration = 2.6,
  className,
  style,
  ...rest
}) {
  const sweepStyle = active
    ? { animationDuration: `${duration}s`, ...style }
    : { ...style };

  return (
    <span
      className={cn(
        "shine-text",
        active ? "shine-text--sweep" : "shine-text--idle",
        className
      )}
      style={sweepStyle}
      {...rest}
    >
      {children}
    </span>
  );
}

export default ShineText;
