"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";
import {
  getWorkflowId,
  getWorkflowThumbInfo,
} from "@/features/workflows/lib/assetEditHelpers";

const FILMSTRIP_CENTER_X = 220;
const FILMSTRIP_STRIDE = 44;
const FILMSTRIP_DRAG_THRESHOLD = 5;
const FILMSTRIP_WHEEL_STEP = 40;

/**
 * AssetSwitchBar
 * Centered sliding project/folder workflow filmstrip on the Asset Edit Page.
 * Supports prev/next arrow buttons, pointer drag-to-scrub, non-passive
 * wheel/trackpad scrolling, click suppression after drag, video play badge,
 * and an animated active spring ring (`layoutId="edit-switch-active-ring"`).
 */
export function AssetSwitchBar({
  workflows = [],
  activeWorkflowId = null,
  currentIndex = 0,
  onSelectWorkflow,
  className,
}) {
  const filmstripViewportRef = React.useRef(null);
  const filmstripDragRef = React.useRef(null);
  const suppressFilmstripClickRef = React.useRef(false);
  const wheelAccumRef = React.useRef(0);
  const wheelResetTimerRef = React.useRef(null);
  const [dragTrackX, setDragTrackX] = React.useState(null);

  const clampedWorkflowIndex = Math.max(0, currentIndex);
  const restingTrackX = FILMSTRIP_CENTER_X - clampedWorkflowIndex * FILMSTRIP_STRIDE;

  const prevWorkflow = currentIndex > 0 ? workflows[currentIndex - 1] : null;
  const nextWorkflow =
    currentIndex >= 0 && currentIndex < workflows.length - 1
      ? workflows[currentIndex + 1]
      : null;

  // Non-passive wheel listener so vertical mouse wheel & horizontal trackpad swipe step smoothly
  React.useEffect(() => {
    const el = filmstripViewportRef.current;
    if (!el || workflows.length <= 1) return;

    const handleWheel = (e) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();

      wheelAccumRef.current += delta;
      clearTimeout(wheelResetTimerRef.current);
      wheelResetTimerRef.current = setTimeout(() => {
        wheelAccumRef.current = 0;
      }, 180);

      if (Math.abs(wheelAccumRef.current) >= FILMSTRIP_WHEEL_STEP) {
        const step = wheelAccumRef.current > 0 ? 1 : -1;
        wheelAccumRef.current = 0;
        const nextIdx = Math.min(
          workflows.length - 1,
          Math.max(0, clampedWorkflowIndex + step)
        );
        if (nextIdx !== clampedWorkflowIndex && workflows[nextIdx]) {
          onSelectWorkflow?.(workflows[nextIdx]);
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      clearTimeout(wheelResetTimerRef.current);
    };
  }, [workflows, clampedWorkflowIndex, onSelectWorkflow]);

  const handleFilmstripPointerDown = React.useCallback(
    (e) => {
      if (e.button !== 0 || workflows.length <= 1) return;
      suppressFilmstripClickRef.current = false;
      filmstripDragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startIndex: clampedWorkflowIndex,
        baseX: FILMSTRIP_CENTER_X - clampedWorkflowIndex * FILMSTRIP_STRIDE,
        lastIndex: clampedWorkflowIndex,
        dragged: false,
      };
    },
    [workflows.length, clampedWorkflowIndex]
  );

  const handleFilmstripPointerMove = React.useCallback(
    (e) => {
      const drag = filmstripDragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;

      if (!drag.dragged) {
        if (Math.abs(dx) < FILMSTRIP_DRAG_THRESHOLD) return;
        drag.dragged = true;
        suppressFilmstripClickRef.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }

      const maxX = FILMSTRIP_CENTER_X;
      const minX = FILMSTRIP_CENTER_X - (workflows.length - 1) * FILMSTRIP_STRIDE;
      const nextX = Math.min(maxX, Math.max(minX, drag.baseX + dx));
      setDragTrackX(nextX);

      const hoveredIdx = Math.min(
        workflows.length - 1,
        Math.max(0, Math.round((FILMSTRIP_CENTER_X - nextX) / FILMSTRIP_STRIDE))
      );
      if (hoveredIdx !== drag.lastIndex && workflows[hoveredIdx]) {
        drag.lastIndex = hoveredIdx;
        onSelectWorkflow?.(workflows[hoveredIdx]);
      }
    },
    [workflows, onSelectWorkflow]
  );

  const finishFilmstripDrag = React.useCallback((e) => {
    const drag = filmstripDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.dragged) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      setTimeout(() => {
        suppressFilmstripClickRef.current = false;
      }, 0);
    }
    filmstripDragRef.current = null;
    setDragTrackX(null);
  }, []);

  if (workflows.length <= 1) {
    return <div aria-hidden="true" />;
  }

  return (
    <div
      className={cn(
        "hidden md:flex items-center justify-center transition-opacity duration-200",
        className
      )}
      role="navigation"
      aria-label="Project assets"
    >
      <IconButton
        type="button"
        variant="ghost"
        disabled={!prevWorkflow}
        aria-label="Previous asset"
        onClick={() => prevWorkflow && onSelectWorkflow?.(prevWorkflow)}
        className="size-9 rounded-subtle shrink-0 text-icon-secondary hover:text-text-primary disabled:opacity-40"
      >
        <HugeIcon name="arrow-left-01" size="sm" />
      </IconButton>

      <div
        ref={filmstripViewportRef}
        onPointerDown={handleFilmstripPointerDown}
        onPointerMove={handleFilmstripPointerMove}
        onPointerUp={finishFilmstripDrag}
        onPointerCancel={finishFilmstripDrag}
        className={cn(
          "relative w-120 h-10 overflow-hidden select-none touch-none",
          dragTrackX !== null ? "cursor-grabbing" : "cursor-grab"
        )}
      >
        {/* Left & Right edge fade masks */}
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"
        />

        {/* Sliding track: 40px item + 4px gap = 44px stride; live-follows drag, springs to 220px center on snap */}
        <motion.div
          className="absolute top-0 left-0 flex gap-x-1"
          initial={false}
          animate={{ x: dragTrackX !== null ? dragTrackX : restingTrackX }}
          transition={
            dragTrackX !== null
              ? { duration: 0 }
              : { type: "spring", stiffness: 380, damping: 34, mass: 0.8 }
          }
        >
          {workflows.map((wf) => {
            const wfId = getWorkflowId(wf);
            const isCurrent = wfId === activeWorkflowId;
            const { isVideo, posterUrl, url } = getWorkflowThumbInfo(wf);
            const imgSrc = posterUrl || (!isVideo ? url : null);
            return (
              <button
                key={wfId}
                type="button"
                aria-current={isCurrent ? "page" : undefined}
                aria-label={wf.display_name || "Asset"}
                onClick={() => {
                  if (suppressFilmstripClickRef.current) {
                    suppressFilmstripClickRef.current = false;
                    return;
                  }
                  onSelectWorkflow?.(wf);
                }}
                className={cn(
                  "group relative size-10 shrink-0 rounded-sharp overflow-hidden bg-surface-tonal cursor-pointer transition-opacity duration-200 focus-workspace",
                  isCurrent ? "opacity-100" : "opacity-50 hover:opacity-80"
                )}
              >
                {imgSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imgSrc}
                    alt=""
                    className="w-full h-full pointer-events-none absolute inset-0 object-cover"
                  />
                ) : isVideo && url ? (
                  <video
                    src={url}
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full pointer-events-none absolute inset-0 object-cover"
                  />
                ) : (
                  <span className="size-full flex items-center justify-center text-text-secondary">
                    <HugeIcon name={isVideo ? "video-01" : "image-01"} size="xs" />
                  </span>
                )}
                {isVideo && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0.5 right-0.5 flex size-4 items-center justify-center rounded-sharp bg-canvas-deep/60 text-text-primary"
                  >
                    <HugeIcon name="play" size="2xs" />
                  </span>
                )}
                {isCurrent && (
                  <motion.span
                    layoutId="edit-switch-active-ring"
                    aria-hidden="true"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="pointer-events-none absolute inset-0 rounded-sharp ring-1 ring-inset ring-text-primary/50"
                  />
                )}
              </button>
            );
          })}
        </motion.div>
      </div>

      <IconButton
        type="button"
        variant="ghost"
        disabled={!nextWorkflow}
        aria-label="Next asset"
        onClick={() => nextWorkflow && onSelectWorkflow?.(nextWorkflow)}
        className="size-9 rounded-subtle shrink-0 text-icon-secondary hover:text-text-primary disabled:opacity-40"
      >
        <HugeIcon name="arrow-right-01" size="sm" />
      </IconButton>
    </div>
  );
}

export default AssetSwitchBar;
