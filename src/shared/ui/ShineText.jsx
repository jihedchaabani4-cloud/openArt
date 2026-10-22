"use client";

import { cn } from "@/shared/lib/utils";

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
 * Owns: the ShineText span + its sweeping keyframes.
 * Changes state outside a parent store; it is pure presentational.
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
      <style>{`
        @keyframes shineTextSweep {
          0%, 10% {
            background-position: 100% 0;
          }
          60%, 100% {
            background-position: 0% 0;
          }
        }

        .shine-text {
          -webkit-background-clip: text;
          background-clip: text;
        }

        .shine-text--sweep {
          background-image: linear-gradient(90deg,
            rgba(255, 255, 255, 0.38) 0%,
            rgba(255, 255, 255, 0.38) 38%,
            rgba(255, 255, 255, 0.96) 50%,
            rgba(255, 255, 255, 0.38) 62%,
            rgba(255, 255, 255, 0.38) 100%);
          background-size: 250% 100%;
          background-repeat: no-repeat;
          color: transparent;
          text-shadow: 0 0 16px rgba(255, 255, 255, 0.12);
          animation-name: shineTextSweep;
          animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
          animation-iteration-count: infinite;
          will-change: background-position;
        }

        .shine-text--idle {
          color: rgba(255, 255, 255, 0.38);
        }
      `}</style>
      {children}
    </span>
  );
}

export default ShineText;
