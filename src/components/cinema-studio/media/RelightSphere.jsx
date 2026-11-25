"use client";

import * as React from "react";
import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { normalizeRelightHexColor } from "@/features/workflows/api/mutations/useImageRelightEdit";
import { cn } from "@/shared/lib/utils";

const VIEW_CENTER = 100;
const SPHERE_WORLD_RADIUS = 84;
const VIEW_PITCH_RAD = (14 * Math.PI) / 180; // gentle elevated view so top & bottom sphere poles show clearly
const CAM_Z = 340;
const FOCAL = 310;
const MERIDIAN_COUNT = 12;
const LATITUDE_DEGREES = [-60, -30, 0, 30, 60];
const DRAG_SENSITIVITY_X = 1.2;
const DRAG_SENSITIVITY_Y = 0.9;
const NUDGE_STEP = 15;
const KEY_STEP = 5;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalize3(v) {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross3(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function addScaled3(base, dir, scalar) {
  return {
    x: base.x + dir.x * scalar,
    y: base.y + dir.y * scalar,
    z: base.z + dir.z * scalar,
  };
}

function project3D(p) {
  // Tilt world gently forward so viewer looks slightly down at the 3D globe
  const cosP = Math.cos(VIEW_PITCH_RAD);
  const sinP = Math.sin(VIEW_PITCH_RAD);
  const vx = p.x;
  const vy = p.y * cosP - p.z * sinP;
  const vz = p.y * sinP + p.z * cosP;

  const scale = FOCAL / Math.max(80, CAM_Z - vz);
  return {
    sx: VIEW_CENTER + vx * scale,
    sy: VIEW_CENTER - vy * scale,
    vz,
    scale,
  };
}

function pointsToSvgPath(pts, closed = false) {
  if (!pts.length) return "";
  const d = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.sx.toFixed(1)},${p.sy.toFixed(1)}`)
    .join(" ");
  return closed ? `${d} Z` : d;
}

function pointsToPolygon(pts) {
  return pts.map((p) => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");
}

function build3DWireframeGlobe() {
  const meridians = [];
  const latitudes = [];
  const segs = 36;

  for (let m = 0; m < MERIDIAN_COUNT; m += 1) {
    const lon = (m / MERIDIAN_COUNT) * Math.PI * 2;
    const pts = [];
    for (let i = 0; i <= segs; i += 1) {
      const lat = -Math.PI / 2 + (i / segs) * Math.PI;
      pts.push(
        project3D({
          x: SPHERE_WORLD_RADIUS * Math.cos(lat) * Math.sin(lon),
          y: SPHERE_WORLD_RADIUS * Math.sin(lat),
          z: SPHERE_WORLD_RADIUS * Math.cos(lat) * Math.cos(lon),
        })
      );
    }
    meridians.push(pointsToSvgPath(pts, false));
  }

  for (const deg of LATITUDE_DEGREES) {
    const lat = (deg * Math.PI) / 180;
    const pts = [];
    for (let i = 0; i <= segs; i += 1) {
      const lon = (i / segs) * Math.PI * 2;
      pts.push(
        project3D({
          x: SPHERE_WORLD_RADIUS * Math.cos(lat) * Math.sin(lon),
          y: SPHERE_WORLD_RADIUS * Math.sin(lat),
          z: SPHERE_WORLD_RADIUS * Math.cos(lat) * Math.cos(lon),
        })
      );
    }
    latitudes.push({ deg, d: pointsToSvgPath(pts, true) });
  }

  return { meridians, latitudes };
}

const GLOBE_WIREFRAME = build3DWireframeGlobe();

function describeLightDirection(rotation, tilt, lightType) {
  const absRot = Math.abs(rotation);
  let horiz = "Front";
  if (absRot >= 155) horiz = "Back Rim";
  else if (absRot >= 115) horiz = rotation > 0 ? "Back-Right Rim" : "Back-Left Rim";
  else if (absRot >= 65) horiz = rotation > 0 ? "Right Side" : "Left Side";
  else if (absRot >= 20) horiz = rotation > 0 ? "Front-Right" : "Front-Left";

  let vert = "Eye-Level";
  if (tilt >= 65) vert = "Top-Down";
  else if (tilt >= 20) vert = "High";
  else if (tilt <= -65) vert = "Under";
  else if (tilt <= -20) vert = "Low";

  const typeLabel = lightType === "hard" ? "Hard Spot" : "Softbox";
  return `${horiz} · ${vert} · ${typeLabel}`;
}

/**
 * Finds the two extreme 2D points along an axis perpendicular to (dx, dy)
 * so the volumetric beam wraps cleanly around the 3D lamp's front face from any angle.
 */
function findSpanExtrema(pts, px, py) {
  let minPt = pts[0];
  let maxPt = pts[0];
  let minDot = Infinity;
  let maxDot = -Infinity;
  for (const pt of pts) {
    const dot = pt.sx * px + pt.sy * py;
    if (dot < minDot) {
      minDot = dot;
      minPt = pt;
    }
    if (dot > maxDot) {
      maxDot = dot;
      maxPt = pt;
    }
  }
  return { minPt, maxPt };
}

function compute3DLampAndBeam({ rotation, tilt, distance, size, brightness, lightType }) {
  const rotRad = (rotation * Math.PI) / 180;
  const tiltRad = (tilt * Math.PI) / 180;
  const clampedDistance = clamp(distance, 0, 100);
  const clampedSize = clamp(size, 0, 100);
  const clampedBrightness = clamp(brightness, 0, 100);
  const isHard = lightType === "hard";

  // Orbit radius in 3D world space: always stays cleanly outside the subject center
  const orbitR = 54 + (clampedDistance / 100) * 30;

  // Lamp 3D position on sphere: (rot=0, tilt=0) => directly in front (+Z)
  const pos = {
    x: orbitR * Math.cos(tiltRad) * Math.sin(rotRad),
    y: orbitR * Math.sin(tiltRad),
    z: orbitR * Math.cos(tiltRad) * Math.cos(rotRad),
  };

  // Strict lookAt(0, 0, 0) basis — the lamp ALWAYS aims directly at the fixed media center!
  const forward = normalize3({ x: -pos.x, y: -pos.y, z: -pos.z });
  const upRef =
    Math.abs(forward.y) > 0.96
      ? { x: 0, y: 0, z: forward.y > 0 ? -1 : 1 }
      : { x: 0, y: 1, z: 0 };
  const right = normalize3(cross3(upRef, forward));
  const up = normalize3(cross3(forward, right));

  // Soft Light = wide slim softbox panel; Hard Light = compact deeper studio spotlight cube
  const hw = isHard ? 8 + (clampedSize / 100) * 4 : 11 + (clampedSize / 100) * 6;
  const hh = isHard ? 8 + (clampedSize / 100) * 4 : 11 + (clampedSize / 100) * 6;
  const hd = isHard ? 8.5 : 5.5;

  const corner = (sr, su, sf) =>
    addScaled3(addScaled3(addScaled3(pos, right, sr * hw), up, su * hh), forward, sf * hd);

  // 8 cube vertices (f = glowing front face pointing at center, b = dark back housing)
  const fTL = project3D(corner(-1, 1, 1));
  const fTR = project3D(corner(1, 1, 1));
  const fBR = project3D(corner(1, -1, 1));
  const fBL = project3D(corner(-1, -1, 1));

  const bTL = project3D(corner(-1, 1, -1));
  const bTR = project3D(corner(1, 1, -1));
  const bBR = project3D(corner(1, -1, -1));
  const bBL = project3D(corner(-1, -1, -1));

  const frontCenter = project3D(addScaled3(pos, forward, hd));
  const lampCenter = project3D(pos);
  const targetCenter = project3D({ x: 0, y: 0, z: 0 });

  // Inner glowing bulb/diffuser inset on the front face
  const inset = isHard ? 0.52 : 0.78;
  const innerCorner = (sr, su) =>
    project3D(
      addScaled3(addScaled3(addScaled3(pos, right, sr * hw * inset), up, su * hh * inset), forward, hd + 0.3)
    );
  const emitterQuad = [innerCorner(-1, 1), innerCorner(1, 1), innerCorner(1, -1), innerCorner(-1, -1)];

  // 6 cube faces sorted back-to-front (Painter's algorithm)
  const makeFace = (id, verts, shade) => ({
    id,
    verts,
    points: pointsToPolygon(verts),
    avgZ: (verts[0].vz + verts[1].vz + verts[2].vz + verts[3].vz) / 4,
    shade,
  });

  const faces = [
    makeFace("back", [bTL, bTR, bBR, bBL], "back"),
    makeFace("top", [bTL, bTR, fTR, fTL], "top"),
    makeFace("bottom", [bBL, bBR, fBR, fBL], "bottom"),
    makeFace("left", [bTL, fTL, fBL, bBL], "side"),
    makeFace("right", [bTR, fTR, fBR, bBR], "side"),
    makeFace("front", [fTL, fTR, fBR, fBL], "front"),
  ].sort((a, b) => a.avgZ - b.avgZ);

  // World-space hemisphere (matches physical front vs back of the subject)
  const isBack = pos.z < 0;
  // View-space z determines whether the 3D lamp cube renders in front of or behind the fixed image
  const isLampInFront = lampCenter.vz >= 0;

  const intensity = 0.2 + (clampedBrightness / 100) * 0.8;

  // Volumetric 3D light beam connecting front face -> subject center (0, 0, 0)
  const dx = targetCenter.sx - frontCenter.sx;
  const dy = targetCenter.sy - frontCenter.sy;
  const dist2D = Math.hypot(dx, dy);

  let beam = null;
  if (dist2D > 5) {
    const ux = dx / dist2D;
    const uy = dy / dist2D;
    const px = -uy;
    const py = ux;

    const frontFaceVerts = [fTL, fTR, fBR, fBL];
    const { minPt: fMin, maxPt: fMax } = findSpanExtrema(frontFaceVerts, px, py);

    // Beam spread at the fixed subject center
    const outerSpread = isHard
      ? 15 + (clampedSize / 100) * 10
      : 28 + (clampedSize / 100) * 20;
    const coreSpread = isHard
      ? 9 + (clampedSize / 100) * 6
      : 16 + (clampedSize / 100) * 10;

    const tOuterMin = { sx: targetCenter.sx - px * outerSpread, sy: targetCenter.sy - py * outerSpread };
    const tOuterMax = { sx: targetCenter.sx + px * outerSpread, sy: targetCenter.sy + py * outerSpread };
    const tCoreMin = { sx: targetCenter.sx - px * coreSpread, sy: targetCenter.sy - py * coreSpread };
    const tCoreMax = { sx: targetCenter.sx + px * coreSpread, sy: targetCenter.sy + py * coreSpread };

    const fCoreMin = {
      sx: frontCenter.sx + (fMin.sx - frontCenter.sx) * 0.55,
      sy: frontCenter.sy + (fMin.sy - frontCenter.sy) * 0.55,
    };
    const fCoreMax = {
      sx: frontCenter.sx + (fMax.sx - frontCenter.sx) * 0.55,
      sy: frontCenter.sy + (fMax.sy - frontCenter.sy) * 0.55,
    };

    // Volumetric light streaks matching the reference screenshots
    const ray1End = { sx: targetCenter.sx - px * (coreSpread * 0.55), sy: targetCenter.sy - py * (coreSpread * 0.55) };
    const ray2End = { sx: targetCenter.sx + px * (coreSpread * 0.55), sy: targetCenter.sy + py * (coreSpread * 0.55) };

    beam = {
      x1: frontCenter.sx,
      y1: frontCenter.sy,
      x2: targetCenter.sx,
      y2: targetCenter.sy,
      outerPoints: pointsToPolygon([fMin, tOuterMin, tOuterMax, fMax]),
      corePoints: pointsToPolygon([fCoreMin, tCoreMin, tCoreMax, fCoreMax]),
      edgeA: { x1: fMin.sx, y1: fMin.sy, x2: tOuterMin.sx, y2: tOuterMin.sy },
      edgeB: { x1: fMax.sx, y1: fMax.sy, x2: tOuterMax.sx, y2: tOuterMax.sy },
      rays: [
        { x1: frontCenter.sx, y1: frontCenter.sy, x2: ray1End.sx, y2: ray1End.sy },
        { x1: frontCenter.sx, y1: frontCenter.sy, x2: ray2End.sx, y2: ray2End.sy },
      ],
    };
  }

  // Directional sheen over the fixed subject thumbnail
  const unitPos = normalize3(pos);
  const sheenX = clamp(50 + unitPos.x * 45, 5, 95);
  const sheenY = clamp(50 - unitPos.y * 45, 5, 95);
  const sheenAlpha = Math.min(0.5, (clampedBrightness / 100) * (isBack ? 0.16 : isHard ? 0.45 : 0.34));
  const sheenSpread = isHard ? "45%" : "82%";

  return {
    faces,
    emitterPoints: pointsToPolygon(emitterQuad),
    frontCenter,
    isBack,
    isLampInFront,
    isHard,
    intensity,
    beam,
    sheenX,
    sheenY,
    sheenAlpha,
    sheenSpread,
  };
}

const FACE_FILL_BY_SHADE = {
  back: "rgba(22, 22, 25, 0.96)",
  top: "rgba(44, 44, 48, 0.95)",
  bottom: "rgba(16, 16, 18, 0.96)",
  side: "rgba(30, 30, 34, 0.96)",
  front: "rgba(28, 28, 32, 0.96)",
};

/**
 * RelightSphere
 * True 3D `lookAt(center)` studio lamp & volumetric beam orbit control (pure SVG, zero dependencies).
 * - The 3D lamp cube ALWAYS aims directly at the fixed center subject image.
 * - Front positions show the dark 3D lamp back hovering IN FRONT (`z-20`) pouring volumetric rays onto the subject.
 * - Rear/top-rear positions show the glowing emitter face aiming at the subject from behind (`z-[5]`).
 * - Distinct Softbox (wide diffused blurred glow) vs Hard Spot (compact sharp-edged crisp rays) rendering.
 */
export function RelightSphere({
  rotation = 0,
  tilt = 0,
  distance = 50,
  size = 50,
  brightness = 50,
  color = "#FFFFFF",
  lightType = "soft",
  previewUrl = null,
  onChange,
  onReset,
  disabled = false,
  className,
}) {
  const uid = React.useId();
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOriginRef = React.useRef(null);

  const safeColor = normalizeRelightHexColor(color, "#FFFFFF");

  const scene = React.useMemo(
    () => compute3DLampAndBeam({ rotation, tilt, distance, size, brightness, lightType }),
    [rotation, tilt, distance, size, brightness, lightType]
  );

  const directionLabel = React.useMemo(
    () => describeLightDirection(rotation, tilt, lightType),
    [rotation, tilt, lightType]
  );

  const emitPosition = React.useCallback(
    (next) => {
      if (disabled || !onChange) return;
      onChange({
        rotation: clamp(Math.round(next.rotation), -180, 180),
        tilt: clamp(Math.round(next.tilt), -90, 90),
        distance: clamp(Math.round(next.distance), 0, 100),
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
      emitPosition({
        rotation: origin.startRot + dx * DRAG_SENSITIVITY_X,
        tilt: origin.startTilt - dy * DRAG_SENSITIVITY_Y,
        distance,
      });
    },
    [disabled, distance, emitPosition]
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
          emitPosition({ rotation: rotation - KEY_STEP, tilt, distance });
          break;
        case "ArrowRight":
          e.preventDefault();
          emitPosition({ rotation: rotation + KEY_STEP, tilt, distance });
          break;
        case "ArrowUp":
          e.preventDefault();
          emitPosition({ rotation, tilt: tilt + KEY_STEP, distance });
          break;
        case "ArrowDown":
          e.preventDefault();
          emitPosition({ rotation, tilt: tilt - KEY_STEP, distance });
          break;
        case "+":
        case "=":
          e.preventDefault();
          emitPosition({ rotation, tilt, distance: distance - 5 });
          break;
        case "-":
        case "_":
          e.preventDefault();
          emitPosition({ rotation, tilt, distance: distance + 5 });
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
    [disabled, distance, emitPosition, onReset, rotation, tilt]
  );

  const nudge = React.useCallback(
    (dRot, dTilt) => (e) => {
      e.stopPropagation();
      emitPosition({ rotation: rotation + dRot, tilt: tilt + dTilt, distance });
    },
    [distance, emitPosition, rotation, tilt]
  );

  const stopDragPropagation = (e) => e.stopPropagation();

  const outerGradId = `${uid}-outer`;
  const coreGradId = `${uid}-core`;
  const softBlurId = `${uid}-blur`;
  const lampDim = scene.isLampInFront ? 1 : 0.85;

  return (
    <div
      data-slot="relight-sphere"
      className={cn(
        "flex flex-col items-center gap-1.5 select-none",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Full-Width Square 3D Studio Light Stage */}
      <div className="relative w-full aspect-square rounded-comfortable bg-surface-card border border-border-subtle flex items-center justify-center">
        {/* Top Tilt Up Arrow */}
        <IconButton
          type="button"
          variant="ghost"
          size="xs"
          aria-label="Move light up"
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
          aria-label="Move light left"
          disabled={disabled}
          onPointerDown={stopDragPropagation}
          onClick={nudge(-NUDGE_STEP, 0)}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-30 text-text-secondary hover:text-text-primary"
        >
          <HugeIcon name="arrow-left-01" size="xs" />
        </IconButton>

        {/* Interactive 3D Studio Light Stage */}
        <div
          role="application"
          tabIndex={disabled ? -1 : 0}
          aria-label="Light position sphere. Drag or use arrow keys to move the light source around the image, double-click to reset."
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
            {/* 3D Perspective Wireframe Sphere (z-0) */}
            <svg
              viewBox="0 0 200 200"
              className="size-full text-white pointer-events-none"
              aria-hidden="true"
            >
              {GLOBE_WIREFRAME.meridians.map((d, i) => (
                <path
                  key={`m-${i}`}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.75"
                  strokeOpacity="0.1"
                />
              ))}
              {GLOBE_WIREFRAME.latitudes.map(({ deg, d }) => (
                <path
                  key={`l-${deg}`}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.75"
                  strokeOpacity={deg === 0 ? "0.14" : "0.08"}
                />
              ))}
            </svg>

            {/* Fixed Center Subject Thumbnail (z-10, upright and never flips) */}
            <div
              data-slot="relight-subject-preview"
              className="pointer-events-none absolute z-10 flex items-center justify-center"
            >
              <div className="relative size-16 rounded-comfortable overflow-hidden border border-border-subtle bg-canvas-deep flex items-center justify-center shadow-lg">
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
                {/* Live Soft vs Hard directional sheen */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at ${scene.sheenX.toFixed(0)}% ${scene.sheenY.toFixed(0)}%, ${safeColor}, transparent ${scene.sheenSpread})`,
                    opacity: scene.sheenAlpha,
                    mixBlendMode: "screen",
                  }}
                />
              </div>
            </div>

            {/* Volumetric 3D Light Beam (z-[14] screen-blended so rays visibly illuminate the fixed image) */}
            {scene.beam && (
              <svg
                viewBox="0 0 200 200"
                className="pointer-events-none absolute inset-0 size-full overflow-visible z-[14]"
                style={{ mixBlendMode: "screen" }}
                aria-hidden="true"
              >
                <defs>
                  <filter id={softBlurId} x="-35%" y="-35%" width="170%" height="170%">
                    <feGaussianBlur stdDeviation="3.6" />
                  </filter>

                  <linearGradient
                    id={outerGradId}
                    gradientUnits="userSpaceOnUse"
                    x1={scene.beam.x1}
                    y1={scene.beam.y1}
                    x2={scene.beam.x2}
                    y2={scene.beam.y2}
                  >
                    <stop
                      offset="0%"
                      stopColor={safeColor}
                      stopOpacity={(scene.isHard ? 0.5 : 0.4) * scene.intensity * lampDim}
                    />
                    <stop
                      offset="75%"
                      stopColor={safeColor}
                      stopOpacity={(scene.isHard ? 0.16 : 0.12) * scene.intensity * lampDim}
                    />
                    <stop offset="100%" stopColor={safeColor} stopOpacity="0" />
                  </linearGradient>

                  <linearGradient
                    id={coreGradId}
                    gradientUnits="userSpaceOnUse"
                    x1={scene.beam.x1}
                    y1={scene.beam.y1}
                    x2={scene.beam.x2}
                    y2={scene.beam.y2}
                  >
                    <stop
                      offset="0%"
                      stopColor={safeColor}
                      stopOpacity={(scene.isHard ? 0.92 : 0.68) * scene.intensity * lampDim}
                    />
                    <stop
                      offset="65%"
                      stopColor={safeColor}
                      stopOpacity={(scene.isHard ? 0.36 : 0.24) * scene.intensity * lampDim}
                    />
                    <stop offset="100%" stopColor={safeColor} stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Outer Volumetric Cone (feathered blur in Softbox, razor-sharp in Hard Spot) */}
                <polygon
                  data-slot="relight-aim-cone"
                  data-light-type={lightType}
                  points={scene.beam.outerPoints}
                  fill={`url(#${outerGradId})`}
                  filter={scene.isHard ? undefined : `url(#${softBlurId})`}
                />

                {/* Inner Bright Beam */}
                <polygon
                  data-slot="relight-aim-line"
                  points={scene.beam.corePoints}
                  fill={`url(#${coreGradId})`}
                />

                {/* Subtle Volumetric Light Rays */}
                {scene.beam.rays.map((ray, idx) => (
                  <line
                    key={idx}
                    x1={ray.x1}
                    y1={ray.y1}
                    x2={ray.x2}
                    y2={ray.y2}
                    stroke={safeColor}
                    strokeWidth={scene.isHard ? "1.1" : "0.9"}
                    strokeOpacity={(scene.isHard ? 0.45 : 0.25) * scene.intensity * lampDim}
                  />
                ))}

                {/* Hard Light Sharp Silhouette Boundaries */}
                {scene.isHard && (
                  <>
                    <line
                      x1={scene.beam.edgeA.x1}
                      y1={scene.beam.edgeA.y1}
                      x2={scene.beam.edgeA.x2}
                      y2={scene.beam.edgeA.y2}
                      stroke={safeColor}
                      strokeWidth="1.2"
                      strokeOpacity={0.7 * scene.intensity * lampDim}
                    />
                    <line
                      x1={scene.beam.edgeB.x1}
                      y1={scene.beam.edgeB.y1}
                      x2={scene.beam.edgeB.x2}
                      y2={scene.beam.edgeB.y2}
                      stroke={safeColor}
                      strokeWidth="1.2"
                      strokeOpacity={0.7 * scene.intensity * lampDim}
                    />
                  </>
                )}
              </svg>
            )}

            {/* True 3D `lookAt(center)` Studio Lamp Cube (z-20 in front of image, z-[5] when behind) */}
            <svg
              viewBox="0 0 200 200"
              className={cn(
                "pointer-events-none absolute inset-0 size-full overflow-visible",
                scene.isLampInFront ? "z-20" : "z-[5]"
              )}
              aria-hidden="true"
            >
              <g
                data-slot="relight-orbit-node"
                data-hemisphere={scene.isBack ? "back" : "front"}
                data-light-type={lightType}
                opacity={lampDim}
              >
                {scene.faces.map((face) => (
                  <React.Fragment key={face.id}>
                    <polygon
                      points={face.points}
                      fill={FACE_FILL_BY_SHADE[face.shade]}
                      stroke={
                        face.id === "front"
                          ? safeColor
                          : "rgba(255, 255, 255, 0.22)"
                      }
                      strokeWidth={face.id === "front" ? "1.2" : "0.9"}
                      strokeOpacity={face.id === "front" ? 0.85 : 1}
                      strokeLinejoin="round"
                    />
                    {face.id === "front" && (
                      <polygon
                        data-slot="relight-aim-arrow"
                        points={scene.emitterPoints}
                        fill={safeColor}
                        fillOpacity={0.92 * scene.intensity}
                      />
                    )}
                  </React.Fragment>
                ))}
              </g>
            </svg>
          </div>

        {/* Right Rotate Arrow */}
        <IconButton
          type="button"
          variant="ghost"
          size="xs"
          aria-label="Move light right"
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
          aria-label="Move light down"
          disabled={disabled}
          onPointerDown={stopDragPropagation}
          onClick={nudge(0, -NUDGE_STEP)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 text-text-secondary hover:text-text-primary"
        >
          <HugeIcon name="arrow-down-01" size="xs" />
        </IconButton>

        {/* Bottom Centered Caption Inside Square */}
        <span
          data-slot="relight-direction-label"
          className="pointer-events-none absolute bottom-1.5 inset-x-3 z-30 text-center ds-type-micro-tag text-text-secondary truncate"
        >
          {directionLabel}
          {scene.isBack ? " (Behind)" : ""}
        </span>
      </div>
    </div>
  );
}

export default RelightSphere;
