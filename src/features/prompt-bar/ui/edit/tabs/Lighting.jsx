import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { useEditStore } from "@/features/prompt-bar/model/useEditStore";
import { Button } from "@/shared/ui/button";
import { Sun, Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useGenerateMutation } from "@/features/workflows/api/workflowsApi";

const LATITUDE_RINGS = [
  { w: 158, translateY: 10 },
  { w: 158, translateY: -10 },
  { w: 154, translateY: 25 },
  { w: 154, translateY: -25 },
  { w: 145, translateY: 40 },
  { w: 145, translateY: -40 },
  { w: 130, translateY: 55 },
  { w: 130, translateY: -55 },
  { w: 100, translateY: 68 },
  { w: 100, translateY: -68 },
  { w: 60, translateY: 76 },
  { w: 60, translateY: -76 },
];

// ─── Pro Drag Hook ────────────────────────────────────────────────────────────
function useDrag({ onDrag, onDragEnd, threshold = 4 } = {}) {
  const state = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    dragging: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const s = state.current;
    s.active = true;
    s.pointerId = e.pointerId;
    s.startX = e.clientX;
    s.startY = e.clientY;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.dragging = false;
  }, []);

  const onPointerMove = useCallback((e) => {
    const s = state.current;
    if (!s.active || s.pointerId !== e.pointerId) return;

    const dx = e.clientX - s.lastX;
    const dy = e.clientY - s.lastY;

    if (!s.dragging) {
      const totalDx = e.clientX - s.startX;
      const totalDy = e.clientY - s.startY;
      if (Math.hypot(totalDx, totalDy) < threshold) return;
      s.dragging = true;
      setIsDragging(true);
    }

    s.lastX = e.clientX;
    s.lastY = e.clientY;
    onDrag?.({ dx, dy, e });
  }, [onDrag, threshold]);

  const onPointerUp = useCallback((e) => {
    const s = state.current;
    if (s.pointerId !== e.pointerId) return;
    const wasDragging = s.dragging;
    s.active = false;
    s.dragging = false;
    setIsDragging(false);
    onDragEnd?.({ wasDragging, e });
  }, [onDragEnd]);

  return { onPointerDown, onPointerMove, onPointerUp, isDragging };
}

// ─── Shared Utilities ────────────────────────────────────────────────────────
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#ffffff');
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
};

// ─── Light Source Icon Component ─────────────────────────────────────────────
const LightIcon = memo(function LightIcon({ rotX, rotY, zIndex = 10, isDragging = false, type = 'soft', brightness = 40, color = '#ffffff' }) {
  const rgb = hexToRgb(color);
  const opacityMult = Math.max(0.05, brightness / 100);
  
  const isHard = type === 'hard';
  const sunScale = 1 + (brightness * 0.005);
  
  const gradientStops = isHard 
    ? `rgba(${rgb}, ${0.8 * opacityMult}) 0%, rgba(${rgb}, ${0.4 * opacityMult}) 90%, rgba(${rgb}, 0) 100%`
    : `rgba(${rgb}, ${0.4 * opacityMult}) 0%, rgba(${rgb}, ${0.05 * opacityMult}) 80%, rgba(${rgb}, 0) 100%`;
  
  const clipPolygon = `polygon(35% 0%, 65% 0%, ${isHard ? '65% 100%, 35% 100%' : '80% 100%, 20% 100%'})`;
  const sunGlow = `0 0 ${isHard ? 4 : 8 + brightness * 0.2}px rgba(${rgb}, 0.8), inset 0 0 4px rgba(${rgb}, ${0.5 * opacityMult})`;

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex, pointerEvents: "none", transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute w-[160px] h-[160px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${-rotX}deg) rotateY(${-rotY}deg)`,
        }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: "translateZ(80px)",
            pointerEvents: "none",
          }}
        >
            <div className="relative" style={{ transformStyle: "preserve-3d" }}>
              {/* Hollow Box Light Source */}
              <div 
                className="absolute transition-all duration-300"
                style={{ 
                  border: `1.5px solid ${color}`,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  boxShadow: sunGlow,
                  width: 14 * sunScale, height: 14 * sunScale, 
                  left: "50%", top: "50%", transform: "translate(-50%, -50%) rotate(45deg)" 
                }}
              />
              
              {/* Volumetric Light Beam - 3D Crossed Planes */}
              {[0, 60, 120].map((deg) => (
                <div
                  key={deg}
                  className="absolute pointer-events-none transition-all duration-300"
                  style={{
                    width: 80, height: 90,
                    left: "50%", top: "50%",
                    transform: `translate(-50%, 0px) rotateX(-90deg) rotateY(${deg}deg)`,
                    transformOrigin: "center top",
                    background: `linear-gradient(to bottom, ${gradientStops})`,
                    clipPath: clipPolygon,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
  );
});

// ─── Globe Component ─────────────────────────────────────────────────────────
const Globe = memo(function Globe({ viewRotation = 180, viewTilt = 30, isDragging = false, color = '#ffffff' }) {
  const meridians = useMemo(() => Array.from({ length: 18 }, (_, i) => i * 10), []);
  const rgb = hexToRgb(color);

  return (
    <div
      className="absolute w-[160px] h-[160px] rounded-full transition-all duration-500"
      style={{ 
        transformStyle: "preserve-3d",
        border: `1px solid rgba(${rgb},${isDragging ? 0.3 : 0.08})`,
        backgroundColor: isDragging ? `rgba(${rgb},0.02)` : "transparent",
      }}
    >
      <div
        className="relative size-full"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${viewTilt}deg) rotateY(${viewRotation}deg)`,
        }}
      >
        {meridians.map((deg, i) => (
          <div
            key={i}
            className="absolute size-full rounded-full"
            style={{ 
              transform: `rotateY(${deg}deg)`,
              border: `0.5px solid rgba(${rgb},${isDragging ? 0.15 : 0.05})`
            }}
          />
        ))}
        
        {/* Equator (Main) */}
        <div
          className="absolute size-full rounded-full"
          style={{ 
            transform: "rotateX(90deg)",
            border: `0.5px solid rgba(${rgb},${isDragging ? 0.2 : 0.08})`,
          }}
        />

        {LATITUDE_RINGS.map((ring, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: ring.w,
              height: ring.w,
              transform: `translate(-50%, -50%) translateY(${ring.translateY}px) rotateX(90deg)`,
              border: `0.5px solid rgba(${rgb},${isDragging ? 0.15 : 0.05})`
            }}
          />
        ))}
      </div>
    </div>
  );
});

const RangeSlider = memo(function RangeSlider({ label, min, max, step, value, onChange, disabled, displayValue }) {
  const [isDragging, setIsDragging] = useState(false);
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div
      className="relative overflow-hidden flex items-center rounded-lg h-9 px-3 transition-colors border border-white/10"
      style={{ 
        borderColor: disabled ? "rgb(46,48,49)" : (isDragging ? "rgba(255,255,255,0.4)" : "rgb(60,62,63)"),
        backgroundColor: "rgba(0,0,0,0.2)"
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none rounded"
        style={{
          background: disabled
            ? "transparent"
            : `linear-gradient(to right, rgb(46,48,49) 0%, rgb(46,48,49) ${percent}%, rgba(0,0,0,0) ${percent}%, rgba(0,0,0,0) 100%)`,
        }}
      />
      <div
        className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-10 rounded-full transition-transform"
        style={{
          left: `calc(${percent}% - 1px)`,
          backgroundColor: disabled ? "rgb(46,48,49)" : (isDragging ? "#ffffff" : "white"),
          transform: isDragging ? "scaleY(1.2)" : "scaleY(1)",
          boxShadow: isDragging ? "0 0 10px rgba(255,255,255,0.5)" : "none",
        }}
      />
      <div className="relative z-10 flex items-center justify-between w-full pointer-events-none">
        <span className="text-xs font-medium" style={{ color: disabled ? "rgb(80,82,84)" : "rgb(160,162,164)" }}>
          {label}
        </span>
        <span className="text-xs font-medium font-mono" style={{ color: disabled ? "rgb(80,82,84)" : "white" }}>
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onBlur={() => setIsDragging(false)}
        onChange={(e) => onChange?.(Number(e.target.value))}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
    </div>
  );
});

export default function LightingPanel({ onClose, onGenerate, previewImageUrl }) {
  const { stagedDna, setLightingDna } = useEditStore()
  const { editTarget, setLighting } = useEditStore()
  const generateMutation = useGenerateMutation();
  
  const activeImageUrl = previewImageUrl || editTarget?.primaryMediaUrl || editTarget?.url || editTarget?.thumbnail_url;
  
  const lightingDna = stagedDna?.lighting_dna || { 
    angle: 0, 
    elevation: 0, 
    intensity: 5, 
    type: 'soft', 
    brightness: 40, 
    color: '#ffffff' 
  }

  const [angle, setAngle] = useState(lightingDna.angle || 0);
  const [elevation, setElevation] = useState(lightingDna.elevation || 0);
  const [intensity, setIntensity] = useState(lightingDna.intensity || 5);
  const [type, setType] = useState(lightingDna.type || 'soft');
  const [brightness, setBrightness] = useState(lightingDna.brightness || 40);
  const [color, setColor] = useState(lightingDna.color || '#ffffff');
  const [snap, setSnap] = useState(true);

  useEffect(() => {
    setAngle(lightingDna.angle || 0);
    setElevation(lightingDna.elevation || 0);
    setIntensity(lightingDna.intensity || 5);
    setType(lightingDna.type || 'soft');
    setBrightness(lightingDna.brightness || 40);
    setColor(lightingDna.color || '#ffffff');
  }, [lightingDna]);

  const snapValue = (val, step = 45) => {
    return Math.round(val / step) * step;
  };

  const handleUpdateLighting = () => {
    if (!editTarget) return;
    const payload = {
      angle,
      elevation,
      intensity,
      type,
      brightness,
      color,
      project_id: editTarget.project_id,
      session_id: editTarget.session_id,
      ratio: editTarget.ratio,
      quality: editTarget.quality,
      workflow_id: editTarget.workflow_id,
      model_name: "seedream-pro",
    };
    generateMutation.mutate({ payload, isLighting: true });
  };

  const updateLighting = (params) => {
    const newDna = {
      angle,
      elevation,
      intensity,
      type,
      brightness,
      color,
      ...params
    };
    setLighting?.(newDna);
    setLightingDna?.(newDna);
    onGenerate?.(newDna);
  };

  const handleArrowClick = (dir) => {
    let newElev = elevation;
    let newAngle = angle;
    switch(dir) {
      case 'up': newElev = Math.min(90, elevation + 30); setElevation(newElev); break;
      case 'down': newElev = Math.max(-90, elevation - 30); setElevation(newElev); break;
      case 'left': newAngle = (angle - 45 + 360) % 360; setAngle(newAngle); break;
      case 'right': newAngle = (angle + 45) % 360; setAngle(newAngle); break;
    }
    updateLighting({ angle: newAngle, elevation: newElev });
  };

  const globeDrag = useDrag({
    onDrag: ({ dx, dy }) => {
      const newAngle = (angle + dx * 0.5 + 360) % 360;
      const newElevation = Math.max(-90, Math.min(90, elevation - dy * 0.5));
      setAngle(newAngle);
      setElevation(newElevation);
      updateLighting({ angle: newAngle, elevation: newElevation });
    },
    onDragEnd: ({ wasDragging }) => {
      if (wasDragging && snap) {
        const snappedAngle = snapValue(angle, 45) % 360;
        const snappedElevation = Math.max(-90, Math.min(90, snapValue(elevation, 30)));
        setAngle(snappedAngle);
        setElevation(snappedElevation);
        updateLighting({ angle: snappedAngle, elevation: snappedElevation });
      }
    }
  });

  const globeContainerHandlers = {
    onPointerDown: globeDrag.onPointerDown,
    onPointerMove: globeDrag.onPointerMove,
    onPointerUp: globeDrag.onPointerUp,
  };

  return (
    <div className="flex flex-col gap-4 p-1.5  bg-(--color-imagine-grey-2) backdrop-blur-[80px] rounded-xl w-full min-w-[400px]">
      <div className="flex flex-row gap-4">
        <div
          className="relative flex items-center justify-center w-[70%] rounded-xl overflow-hidden group/viewport"
          style={{
            backgroundColor: "rgb(12,12,12)",
            minHeight: 240,
            cursor: globeDrag.isDragging ? "grabbing" : "grab",
            touchAction: "none",
            userSelect: "none",
          }}
          {...globeContainerHandlers}
          >
            <div 
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)`,
                backgroundSize: "20px 20px",
                maskImage: "radial-gradient(circle at 50% 50%, black, transparent 80%)"
              }}
            />
            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] z-[1]" />

          {activeImageUrl && (
            <div 
              className="absolute pointer-events-none transition-all duration-300" 
              style={{ 
                zIndex: 5, 
                left: "50%", 
                top: "50%",
                transform: "translate(-50%, -50%)",
                filter: globeDrag.isDragging ? "brightness(1.2) drop-shadow(0 0 20px rgba(255,255,255,0.3))" : "none"
              }}
            >
              <img
                src={activeImageUrl}
                className="max-w-[50px] max-h-[50px] w-auto h-auto object-contain rounded-md border border-white/20 shadow-2xl relative"
                style={{ backgroundColor: "#0f0f0f" }}
                alt="subject"
              />
            </div>
          )}

          <Globe 
            viewRotation={angle} 
            viewTilt={-elevation} 
            isDragging={globeDrag.isDragging}
            color={color} 
          />

 

          <LightIcon
            rotX={elevation}
            rotY={angle}
            zIndex={10}
            isDragging={globeDrag.isDragging}
            type={type}
            brightness={brightness}
            color={color}
          />

          {[
            { dir: 'up', style: { top: "calc(50% - 90px)", left: "50%", transform: "translate(-50%, -50%)" }, d: "M8 13.9999L11.6464 10.3535C11.8417 10.1582 12.1583 10.1582 12.3536 10.3535L16 13.9999" },
            { dir: 'down', style: { top: "calc(50% + 90px)", left: "50%", transform: "translate(-50%, -50%)" }, d: "M8 10L11.6464 13.6464C11.8417 13.8417 12.1583 13.8417 12.3536 13.6464L16 10" },
            { dir: 'left', style: { top: "50%", left: "calc(50% - 90px)", transform: "translate(-50%, -50%)" }, d: "M13.7929 16L10.1464 12.3536C9.95118 12.1583 9.95118 11.8417 10.1464 11.6464L13.7929 8" },
            { dir: 'right', style: { top: "50%", left: "calc(50% + 90px)", transform: "translate(-50%, -50%)" }, d: "M10 16L13.6464 12.3536C13.8417 12.1583 13.8417 11.8417 13.6464 11.6464L10 8" },
          ].map((arrow, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                handleArrowClick(arrow.dir);
              }}
              className="absolute group z-20"
              style={{ ...arrow.style, background: "none", border: "none", padding: 8, cursor: "pointer" }}
            >
              <svg className="w-5 h-5 transition-all group-hover:scale-110 group-active:scale-95" viewBox="0 0 24 24" fill="none">
                <path d={arrow.d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                  style={{ color: "rgb(100,102,104)" }}
                  className="group-hover:stroke-white"
                />
              </svg>
            </button>
          ))}
        </div>

        <div className="flex w-full flex-col gap-3 px-1">

          <div className="flex gap-2">
            {[
              {
                value: 'soft',
                label: 'Soft',
                badge: 'Diffuse',
                desc: 'Wide · gradual falloff',
                beam: (
                  <svg width="64" height="44" viewBox="0 0 64 44" fill="none">
                    <defs>
                      <linearGradient id="soft-beam" x1="32" y1="6" x2="32" y2="38" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="white" stopOpacity="0.35"/>
                        <stop offset="100%" stopColor="white" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {/* wide fan beam */}
                    <polygon points="32,6 4,38 60,38" fill="url(#soft-beam)" style={{ filter: 'blur(4px)' }}/>
                    {/* soft edge on subject */}
                    <ellipse cx="32" cy="38" rx="22" ry="3" fill="white" fillOpacity="0.07"/>
                    {/* source */}
                    <circle cx="32" cy="6" r="3.5" fill="white" fillOpacity="0.9"/>
                    {/* subject */}
                    <ellipse cx="32" cy="39" rx="8" ry="3.5" fill="rgb(50,52,54)" stroke="white" strokeOpacity="0.2" strokeWidth="1"/>
                  </svg>
                ),
              },
              {
                value: 'hard',
                label: 'Hard',
                badge: 'Focused',
                desc: 'Narrow · sharp cutoff',
                beam: (
                  <svg width="64" height="44" viewBox="0 0 64 44" fill="none">
                    <defs>
                      <linearGradient id="hard-beam" x1="32" y1="6" x2="32" y2="38" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="white" stopOpacity="0.7"/>
                        <stop offset="100%" stopColor="white" stopOpacity="0.08"/>
                      </linearGradient>
                      <linearGradient id="hard-core" x1="32" y1="6" x2="32" y2="38" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="white" stopOpacity="1"/>
                        <stop offset="100%" stopColor="white" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {/* narrow hard beam */}
                    <polygon points="32,6 20,38 44,38" fill="url(#hard-beam)"/>
                    {/* bright core ray */}
                    <polygon points="32,6 29,38 35,38" fill="url(#hard-core)"/>
                    {/* sharp edge on subject */}
                    <rect x="20" y="37" width="24" height="2" rx="1" fill="white" fillOpacity="0.35"/>
                    {/* source */}
                    <circle cx="32" cy="6" r="3.5" fill="white" fillOpacity="0.9"/>
                    {/* subject */}
                    <ellipse cx="32" cy="39" rx="8" ry="3.5" fill="rgb(50,52,54)" stroke="white" strokeOpacity="0.2" strokeWidth="1"/>
                  </svg>
                ),
              },
            ].map(({ value, label, badge, desc, beam }) => (
              <button
                key={value}
                onClick={() => { setType(value); updateLighting({ type: value }); }}
                className={cn(
                  "flex-1 flex flex-col items-center rounded-xl border transition-all duration-200 overflow-hidden pt-3 pb-2 px-2 gap-1",
                  type === value
                    ? "border-white bg-white/5"
                    : "border-white/10 bg-white/3 hover:border-white/25"
                )}
              >
                {/* beam preview */}
                <div className="flex items-center justify-center h-11">
                  {beam}
                </div>

                {/* label + badge */}
                <div className="flex items-center justify-between w-full px-0.5 mt-1">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    type === value ? "text-white" : "text-white/30"
                  )}>
                    {label}
                  </span>
                  <span className={cn(
                    "text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded",
                    type === value ? "bg-white/10 text-white/60" : "bg-white/5 text-white/20"
                  )}>
                    {badge}
                  </span>
                </div>

                {/* desc */}
                <p className={cn(
                  "text-[9px] w-full px-0.5 text-left leading-tight",
                  type === value ? "text-white/40" : "text-white/15"
                )}>
                  {desc}
                </p>
              </button>
            ))}
          </div>

          <RangeSlider 
            label="Brightness" 
            min={0} max={100} step={1} 
            value={brightness} 
            onChange={(val) => { setBrightness(val); updateLighting({ brightness: val }); }} 
            displayValue={`${brightness}%`} 
          />

          <div className="flex items-center justify-between px-1 mt-1">
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Color</span>
            <div className="relative">
              <input 
                type="color" 
                value={color} 
                onChange={(e) => { setColor(e.target.value); updateLighting({ color: e.target.value }); }}
                className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
              />
              <div 
                className="w-8 h-8 rounded-lg border border-white/20 shadow-lg" 
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
          <div className="flex items-end justify-end">
            <Button
              onClick={handleUpdateLighting}
              disabled={generateMutation.isPending}
              variant="studio-white"
              className="w-fit"
            >
              {generateMutation.isPending ? "Generating..." : "Update Lighting"}
            </Button>
          </div>
  
        </div>
      </div>
    </div>
  );
}
