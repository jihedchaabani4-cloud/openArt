"use client";

import * as React from "react";
import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";

const SPHERE_CENTER = 100;
const SPHERE_RADIUS = 86;
const MERIDIAN_DEGREES = [-60, -30, 0, 30, 60];
const LATITUDE_DEGREES = [-45, 0, 45];
const DRAG_SENSITIVITY_X = 1.2;
const DRAG_SENSITIVITY_Y = 0.9;
const NUDGE_STEP = 15;
const KEY_STEP = 5;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildStaticSphereWireframe() {
  const meridians = MERIDIAN_DEGREES.map((deg) => {
    const rx = Math.abs(Math.sin((deg * Math.PI) / 180)) * SPHERE_RADIUS;
    return { deg, rx: Math.max(0.5, rx) };
  });

  const latitudes = LATITUDE_DEGREES.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const cy = SPHERE_CENTER - Math.sin(rad) * SPHERE_RADIUS;
    const rx = Math.cos(rad) * SPHERE_RADIUS;
    const ry = rx * 0.22;
    return { deg, cy, rx, ry };
  });

  return { meridians, latitudes };
}

const STATIC_WIREFRAME = buildStaticSphereWireframe();

function describeCameraDirection(rotation, tilt) {
  const absRot = Math.abs(rotation);
  let horiz = "Front";
  if (absRot >= 155) horiz = "Back";
  else if (absRot >= 115) horiz = rotation > 0 ? "Back-Right" : "Back-Left";
  else if (absRot >= 65) horiz = rotation > 0 ? "Right Side" : "Left Side";
  else if (absRot >= 20) horiz = rotation > 0 ? "Front-Right" : "Front-Left";

  let vert = "Eye-Level";
  if (tilt >= 65) vert = "Top-Down";
  else if (tilt >= 20) vert = "High Angle";
  else if (tilt <= -65) vert = "Worm's-Eye";
  else if (tilt <= -20) vert = "Low Angle";

  return `${horiz} · ${vert}`;
}

function computeCameraOrbit(rotation, tilt, zoom) {
  const rotRad = (rotation * Math.PI) / 180;
  const tiltRad = (tilt * Math.PI) / 180;
  const clampedZoom = clamp(zoom, 0, 10);

  // Higher zoom pulls the camera radially closer to the fixed subject in the center
  const orbitRadius = SPHERE_RADIUS * (1 - clampedZoom * 0.045);

  // Spherical unit vector: (rot=0, tilt=0) => front center (0, 0, +1)
  const x = Math.cos(tiltRad) * Math.sin(rotRad);
  const y = Math.sin(tiltRad);
  const z = Math.cos(tiltRad) * Math.cos(rotRad);

  const sx = SPHERE_CENTER + orbitRadius * x;
  const sy = SPHERE_CENTER - orbitRadius * y;
  const isBack = z < 0;

  const leftPct = (sx / 200) * 100;
  const topPct = (sy / 200) * 100;
  const depthScale = 0.84 + ((z + 1) / 2) * 0.22 + clampedZoom * 0.012;

  const activeLatCy = SPHERE_CENTER - Math.sin(tiltRad) * orbitRadius;
  const activeLatRx = Math.cos(tiltRad) * orbitRadius;
  const activeLatRy = activeLatRx * 0.22;

  // Aiming vector from camera -> fixed center subject (100, 100)
  const vx = SPHERE_CENTER - sx;
  const vy = SPHERE_CENTER - sy;
  const dist = Math.hypot(vx, vy);

  let aim = null;
  if (dist > 4) {
    const ux = vx / dist;
    const uy = vy / dist;
    const px = -uy;
    const py = ux;

    // FOV viewing cone narrows as zoom increases
    const coneHalfWidth = Math.max(10, 26 - clampedZoom * 1.4);
    const leftWingX = SPHERE_CENTER + px * coneHalfWidth;
    const leftWingY = SPHERE_CENTER + py * coneHalfWidth;
    const rightWingX = SPHERE_CENTER - px * coneHalfWidth;
    const rightWingY = SPHERE_CENTER - py * coneHalfWidth;
    const conePoints = `${sx.toFixed(1)},${sy.toFixed(1)} ${leftWingX.toFixed(1)},${leftWingY.toFixed(1)} ${rightWingX.toFixed(1)},${rightWingY.toFixed(1)}`;

    // Arrowhead pointing directly into the center target dot
    const tipDist = Math.min(dist * 0.45, 7);
    const tipX = SPHERE_CENTER - ux * tipDist;
    const tipY = SPHERE_CENTER - uy * tipDist;
    const arrowLen = Math.min(8, dist * 0.35);
    const arrowHalfW = arrowLen * 0.55;
    const baseX = tipX - ux * arrowLen;
    const baseY = tipY - uy * arrowLen;
    const arrowPath = `M${(baseX + px * arrowHalfW).toFixed(1)},${(baseY + py * arrowHalfW).toFixed(1)} L${tipX.toFixed(1)},${tipY.toFixed(1)} L${(baseX - px * arrowHalfW).toFixed(1)},${(baseY - py * arrowHalfW).toFixed(1)}`;

    aim = {
      conePoints,
      arrowPath,
      angleDeg: (Math.atan2(vy, vx) * 180) / Math.PI,
    };
  }

  return {
    sx,
    sy,
    z,
    isBack,
    leftPct,
    topPct,
    depthScale,
    orbitRadius,
    activeLatCy,
    activeLatRx,
    activeLatRy,
    aim,
    zoomRingRadius: Math.max(14, 34 - clampedZoom * 1.7),
  };
}

/**
 * CameraAngleSphere
 * Interactive pure-SVG 3D orbit sphere where the center subject image stays fixed
 * and the virtual Camera node orbits around it with an explicit aiming line,
 * arrowhead, and FOV view cone pointing at the subject.
 *
 * Props:
 * - `rotation`: number (-180..180 degrees)
 * - `tilt`: number (-90..90 degrees)
 * - `zoom`: number (0..10)
 * - `previewUrl`: string | null — fixed active workflow Primary Media preview image
 * - `onChange`: ({ rotation, tilt, zoom }) => void
 * - `onReset`: () => void — invoked on double-click or keyboard 0/Home
 * - `disabled`: boolean — disables pointer/keyboard adjustments
 * - `className`: string — layout positioning only
 */
export function CameraAngleSphere({
  rotation = 0,
  tilt = 0,
  zoom = 0,
  previewUrl = null,
  onChange,
  onReset,
  disabled = false,
  className,
}) {
  const gradId = React.useId();
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOriginRef = React.useRef(null);

  const camera = React.useMemo(
    () => computeCameraOrbit(rotation, tilt, zoom),
    [rotation, tilt, zoom]
  );

  const directionLabel = React.useMemo(
    () => describeCameraDirection(rotation, tilt),
    [rotation, tilt]
  );

  const isMoved = rotation !== 0 || tilt !== 0 || zoom !== 0;

  const emitPose = React.useCallback(
    (next) => {
      if (disabled || !onChange) return;
      onChange({
        rotation: clamp(Math.round(next.rotation), -180, 180),
        tilt: clamp(Math.round(next.tilt), -90, 90),
        zoom: clamp(Math.round(next.zoom), 0, 10),
      });
    },
    [disabled, onChange]
  );

  const handlePointerDown = React.useCallback(
    (e) => {
      if (disabled) return;
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      dragOriginRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startRot: rotation,
        startTilt: tilt,
      };
      setIsDragging(true);
    },
    [disabled, rotation, tilt]
  );

  const handlePointerMove = React.useCallback(
    (e) => {
      const origin = dragOriginRef.current;
      if (!origin || disabled) return;
      const dx = e.clientX - origin.startX;
      const dy = e.clientY - origin.startY;
      emitPose({
        rotation: origin.startRot + dx * DRAG_SENSITIVITY_X,
        tilt: origin.startTilt - dy * DRAG_SENSITIVITY_Y,
        zoom,
      });
    },
    [disabled, emitPose, zoom]
  );

  const finishDrag = React.useCallback((e) => {
    const origin = dragOriginRef.current;
    if (!origin) return;
    if (e?.currentTarget?.hasPointerCapture?.(origin.pointerId)) {
      e.currentTarget.releasePointerCapture?.(origin.pointerId);
    }
    dragOriginRef.current = null;
    setIsDragging(false);
  }, []);

  const handleKeyDown = React.useCallback(
    (e) => {
      if (disabled) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          emitPose({ rotation: rotation - KEY_STEP, tilt, zoom });
          break;
        case "ArrowRight":
          e.preventDefault();
          emitPose({ rotation: rotation + KEY_STEP, tilt, zoom });
          break;
        case "ArrowUp":
          e.preventDefault();
          emitPose({ rotation, tilt: tilt + KEY_STEP, zoom });
          break;
        case "ArrowDown":
          e.preventDefault();
          emitPose({ rotation, tilt: tilt - KEY_STEP, zoom });
          break;
        case "+":
        case "=":
          e.preventDefault();
          emitPose({ rotation, tilt, zoom: zoom + 1 });
          break;
        case "-":
        case "_":
          e.preventDefault();
          emitPose({ rotation, tilt, zoom: zoom - 1 });
          break;
        case "0":
        case "Home":
          e.preventDefault();
          onReset?.();
          break;
        default:
          break;
      }
    },
    [disabled, emitPose, onReset, rotation, tilt, zoom]
  );

  const nudge = React.useCallback(
    (dRot, dTilt) => (e) => {
      e.stopPropagation();
      emitPose({ rotation: rotation + dRot, tilt: tilt + dTilt, zoom });
    },
    [emitPose, rotation, tilt, zoom]
  );

  const stopDragPropagation = (e) => e.stopPropagation();

  return (
    <div
      data-slot="camera-angle-sphere"
      className={cn(
        "flex flex-col items-center gap-1.5 select-none",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Full-Width Square 3D Stage */}
      <div className="relative w-full aspect-square rounded-comfortable bg-surface-card border border-border-subtle flex items-center justify-center">
        {/* Top Tilt Up Arrow */}
        <IconButton
          type="button"
          variant="ghost"
          size="xs"
          aria-label="Tilt camera up"
          disabled={disabled}
          onPointerDown={stopDragPropagation}
          onClick={nudge(0, NUDGE_STEP)}
          className="absolute top-1 left-1/2 -translate-x-1/2 z-30 text-text-secondary hover:text-text-primary"
        >
          <HugeIcon name="arrow-up-01" size="xs" />
        </IconButton>

        {/* Left Rotate Arrow */}
        <IconButton
          type="button"
          variant="ghost"
          size="xs"
          aria-label="Rotate camera left"
          disabled={disabled}
          onPointerDown={stopDragPropagation}
          onClick={nudge(-NUDGE_STEP, 0)}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-30 text-text-secondary hover:text-text-primary"
        >
          <HugeIcon name="arrow-left-01" size="xs" />
        </IconButton>

        {/* Interactive 3D Orbit Stage */}
        <div
          role="application"
          tabIndex={disabled ? -1 : 0}
          aria-label="Camera angle sphere. Drag or use arrow keys to move the camera around the image, double-click to reset."
          data-dragging={isDragging ? "true" : undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onDoubleClick={() => !disabled && onReset?.()}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative size-[74%] -translate-y-2 rounded-full flex items-center justify-center touch-none focus-workspace",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
        >
            {/* Base Layer (z-0): Fixed Reference Wireframe Sphere */}
            <svg
              viewBox="0 0 200 200"
              className="size-full text-white pointer-events-none"
              aria-hidden="true"
            >
              <circle
                cx={SPHERE_CENTER}
                cy={SPHERE_CENTER}
                r={SPHERE_RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.18"
              />

              {STATIC_WIREFRAME.meridians.map(({ deg, rx }) => (
                <ellipse
                  key={`m-${deg}`}
                  cx={SPHERE_CENTER}
                  cy={SPHERE_CENTER}
                  rx={rx}
                  ry={SPHERE_RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.9"
                  strokeOpacity="0.12"
                />
              ))}

              {STATIC_WIREFRAME.latitudes.map(({ deg, cy, rx, ry }) => (
                <ellipse
                  key={`l-${deg}`}
                  cx={SPHERE_CENTER}
                  cy={cy}
                  rx={rx}
                  ry={ry}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.9"
                  strokeOpacity={deg === 0 ? "0.18" : "0.1"}
                />
              ))}

              {/* Active Orbit Ring at Current Camera Tilt & Zoom */}
              {isMoved && (
                <ellipse
                  cx={SPHERE_CENTER}
                  cy={camera.activeLatCy}
                  rx={Math.max(1, camera.activeLatRx)}
                  ry={Math.max(1, camera.activeLatRy)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeOpacity="0.28"
                  strokeDasharray="3 3"
                />
              )}
            </svg>

            {/* Fixed Center Subject Thumbnail (z-10, never rotates or flips) */}
            <div
              data-slot="camera-subject-preview"
              className="pointer-events-none absolute z-10 flex items-center justify-center"
            >
              <div className="relative size-16 rounded-comfortable overflow-hidden border border-border-subtle bg-canvas-deep flex items-center justify-center">
                {previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewUrl}
                    alt="Fixed subject image"
                    draggable={false}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full bg-surface-tonal" />
                )}
              </div>
            </div>

            {/* Aiming Layer: FOV Cone + Bright Sightline + Arrowhead pointing directly at Subject */}
            <svg
              viewBox="0 0 200 200"
              className={cn(
                "pointer-events-none absolute inset-0 size-full text-white",
                camera.isBack ? "z-[5]" : "z-[15]"
              )}
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id={gradId}
                  gradientUnits="userSpaceOnUse"
                  x1={camera.sx}
                  y1={camera.sy}
                  x2={SPHERE_CENTER}
                  y2={SPHERE_CENTER}
                >
                  <stop offset="0%" stopColor="currentColor" stopOpacity={camera.isBack ? "0.16" : "0.32"} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.03" />
                </linearGradient>
              </defs>

              {/* Zoom framing ring when zooming straight ahead at (0°, 0°) */}
              {!camera.aim && zoom > 0 && (
                <circle
                  cx={SPHERE_CENTER}
                  cy={SPHERE_CENTER}
                  r={camera.zoomRingRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeOpacity="0.65"
                  strokeDasharray="4 3"
                />
              )}

              {camera.aim && (
                <>
                  {/* Camera FOV View Cone */}
                  <polygon
                    data-slot="camera-aim-cone"
                    points={camera.aim.conePoints}
                    fill={`url(#${gradId})`}
                  />

                  {/* Crisp Sightline from Camera -> Subject Center */}
                  <line
                    data-slot="camera-aim-line"
                    x1={camera.sx}
                    y1={camera.sy}
                    x2={SPHERE_CENTER}
                    y2={SPHERE_CENTER}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeOpacity={camera.isBack ? "0.5" : "0.95"}
                    strokeDasharray={camera.isBack ? "4 3" : undefined}
                  />

                  {/* Directional Arrowhead pointing into the Subject */}
                  <path
                    data-slot="camera-aim-arrow"
                    d={camera.aim.arrowPath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={camera.isBack ? "0.55" : "0.95"}
                  />

                  {/* Target Focus Reticle Dot at Exact Subject Center */}
                  <circle
                    cx={SPHERE_CENTER}
                    cy={SPHERE_CENTER}
                    r="3.2"
                    fill="currentColor"
                    fillOpacity={camera.isBack ? "0.5" : "0.95"}
                  />
                  <circle
                    cx={SPHERE_CENTER}
                    cy={SPHERE_CENTER}
                    r="6.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeOpacity={camera.isBack ? "0.25" : "0.55"}
                  />
                </>
              )}
            </svg>

            {/* Orbiting Camera Node (front z-20 / behind subject z-0) */}
            <div
              data-slot="camera-orbit-node"
              data-hemisphere={camera.isBack ? "back" : "front"}
              className={cn(
                "pointer-events-none absolute flex items-center justify-center transition-opacity duration-100",
                camera.isBack ? "z-0 opacity-60" : "z-20 opacity-100"
              )}
              style={{
                left: `${camera.leftPct.toFixed(2)}%`,
                top: `${camera.topPct.toFixed(2)}%`,
                transform: `translate(-50%, -50%) scale(${camera.depthScale.toFixed(3)})`,
              }}
            >
              <span
                className={cn(
                  "size-9 rounded-subtle border flex items-center justify-center shadow-lg",
                  camera.isBack
                    ? "bg-omni-bg border-border-subtle text-text-secondary"
                    : "bg-canvas-deep border-white/50 text-text-primary"
                )}
              >
                <HugeIcon name="camera-01" size="md" />
              </span>
            </div>
          </div>

        {/* Right Rotate Arrow */}
        <IconButton
          type="button"
          variant="ghost"
          size="xs"
          aria-label="Rotate camera right"
          disabled={disabled}
          onPointerDown={stopDragPropagation}
          onClick={nudge(NUDGE_STEP, 0)}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-30 text-text-secondary hover:text-text-primary"
        >
          <HugeIcon name="arrow-right-01" size="xs" />
        </IconButton>

        {/* Bottom Tilt Down Arrow */}
        <IconButton
          type="button"
          variant="ghost"
          size="xs"
          aria-label="Tilt camera down"
          disabled={disabled}
          onPointerDown={stopDragPropagation}
          onClick={nudge(0, -NUDGE_STEP)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 text-text-secondary hover:text-text-primary"
        >
          <HugeIcon name="arrow-down-01" size="xs" />
        </IconButton>

        {/* Bottom Centered Caption Inside Square */}
        <span
          data-slot="camera-direction-label"
          className="pointer-events-none absolute bottom-1.5 inset-x-3 z-30 text-center ds-type-micro-tag text-text-secondary truncate"
        >
          {directionLabel}
          {camera.isBack ? " (Behind)" : ""}
        </span>
      </div>
    </div>
  );
}

export default CameraAngleSphere;
