import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { useStudioStore } from "@/store/useStudioStore";

const LATITUDE_RINGS = [
  { w: 193, translateY: 26 },
  { w: 193, translateY: -26 },
  { w: 173, translateY: 50 },
  { w: 173, translateY: -50 },
  { w: 141, translateY: 71 },
  { w: 141, translateY: -71 },
  { w: 100, translateY: 87 },
  { w: 100, translateY: -87 },
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

// ─── Camera Icon Component ───────────────────────────────────────────────────
const CameraIcon = memo(function CameraIcon({ rotX, rotY, zIndex = 10, isDragging = false }) {
  return (
    <div
      className="absolute inset-0"
      style={{ zIndex, pointerEvents: "none", transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute w-[200px] h-[200px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateY(180deg)", // Point lens towards center
          }}
        >
          <div
            className="absolute"
            style={{
              transformStyle: "preserve-3d",
              transform: "translateZ(110px)", // Slightly outside globe
              pointerEvents: "none",
            }}
          >
            <div className="relative" style={{ transformStyle: "preserve-3d" }}>
              <div
                className="absolute rounded bg-[rgb(26,26,26)] border-[1.5px] border-white/25 shadow-[inset_0_0_4px_rgba(0,0,0,0.5)]"
                style={{ width: 24, height: 18, transform: "translate(-50%, -50%) translateZ(-8px)" }}
              >
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(42,42,42)] border-2 border-white/40 shadow-[0_0_6px_rgba(255,255,255,0.25)]"
                  style={{ width: 14, height: 14 }}
                >
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(10,10,10)] border border-white shadow-[inset_0_0_4px_white,0_0_8px_rgba(255,255,255,0.5)]"
                    style={{ width: 10, height: 10 }}
                  />
                </div>
                <div
                  className="absolute rounded-full bg-[rgb(255,68,68)] shadow-[0_0_2px_red]"
                  style={{ width: 4, height: 4, top: 3, right: 3 }}
                />
              </div>

              <div
                className="absolute rounded bg-[rgb(37,37,37)] border border-white/20"
                style={{ width: 24, height: 18, transform: "translate(-50%, -50%) translateZ(8px)" }}
              >
                <div
                  className="absolute rounded-sm bg-[rgb(26,26,42)] border border-[rgb(51,51,51)]"
                  style={{ width: 18, height: 12, top: 3, left: 3 }}
                />
              </div>

              <div
                className="absolute bg-[rgb(31,31,31)] border border-white/20"
                style={{ width: 24, height: 16, transform: "translate(-50%, -50%) rotateX(90deg) translateZ(9px)" }}
              >
                <div
                  className="absolute rounded-full bg-[rgb(68,68,68)] border border-[rgb(85,85,85)] shadow-[inset_0_-1px_2px_rgba(0,0,0,0.5)]"
                  style={{ width: 5, height: 5, right: 4, top: 4 }}
                />
              </div>

              <div
                className="absolute bg-[rgb(26,26,26)] border border-white/20"
                style={{ width: 24, height: 16, transform: "translate(-50%, -50%) rotateX(-90deg) translateZ(9px)" }}
              />
              <div
                className="absolute bg-[rgb(28,28,28)] border border-white/20"
                style={{ width: 16, height: 18, transform: "translate(-50%, -50%) rotateY(-90deg) translateZ(12px)" }}
              />
              <div
                className="absolute bg-[rgb(28,28,28)] border border-white/20"
                style={{ width: 16, height: 18, transform: "translate(-50%, -50%) rotateY(90deg) translateZ(12px)" }}
              />

              <div
                className="absolute"
                style={{ transformStyle: "preserve-3d", transform: "translate(-50%, -50%) translateY(-12px)" }}
              >
                <div
                  className="absolute rounded-t bg-[rgb(26,26,26)] border border-white/20"
                  style={{ width: 10, height: 6, transform: "translate(-50%, -50%) translateZ(2px)" }}
                >
                  <div
                    className="absolute rounded-sm bg-[rgb(10,10,10)] border border-[rgb(51,51,51)]"
                    style={{ width: 6, height: 3, bottom: 1, left: "50%", transform: "translateX(-50%)" }}
                  />
                </div>
              </div>

              <div
                className="absolute bg-white/60 shadow-[0_0_3px_white]"
                style={{
                  width: 2, height: 92,
                  transform: "translate(-50%, 0px) translateZ(-8px) rotateX(-90deg)",
                  transformOrigin: "center top",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Globe Component ─────────────────────────────────────────────────────────
const Globe = memo(function Globe({ viewRotation = 180, viewTilt = 30, isDragging = false }) {
  const meridians = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 15), []);

  return (
    <div
      className="absolute w-[200px] h-[200px] rounded-full transition-all duration-500"
      style={{ 
        transformStyle: "preserve-3d",
        border: `1px solid rgba(255,255,255,${isDragging ? 0.4 : 0.15})`,
        backgroundColor: isDragging ? "rgba(212,255,0,0.03)" : "rgba(255,255,255,0.02)",
        boxShadow: isDragging 
          ? "0 0 50px rgba(212,255,0,0.1), inset 0 0 30px rgba(212,255,0,0.05)" 
          : "inset 0 0 20px rgba(255,255,255,0.02)"
      }}
    >
      {/* Sphere lighting effect */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: isDragging
            ? "radial-gradient(circle at 30% 30%, rgba(212,255,0,0.15) 0%, transparent 70%)"
            : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 70%)",
          zIndex: 1
        }}
      />

      <div
        className="relative size-full"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${viewTilt}deg) rotateY(${viewRotation}deg)`,
        }}
      >
        {/* Poles */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/20" style={{ transform: "rotateX(-90deg) translateZ(100px)" }} />
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/20" style={{ transform: "rotateX(90deg) translateZ(100px)" }} />

        {meridians.map((deg, i) => (
          <div
            key={i}
            className="absolute size-full rounded-full transition-colors duration-300"
            style={{ 
              transform: `rotateY(${deg}deg)`,
              border: `1px solid rgba(255,255,255,${isDragging ? 0.25 : 0.1})`
            }}
          >
            {/* Degree marks on equator */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/10 rounded-full" style={{ transform: "translateZ(100px)" }} />
          </div>
        ))}
        
        {/* Equator (Main) */}
        <div
          className="absolute size-full rounded-full transition-all duration-300"
          style={{ 
            transform: "rotateX(90deg)",
            border: isDragging ? "1.5px solid rgba(212,255,0,0.3)" : "1px solid rgba(255,255,255,0.15)",
            boxShadow: isDragging ? "0 0 15px rgba(212,255,0,0.2)" : "none"
          }}
        />

        {LATITUDE_RINGS.map((ring, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full transition-colors duration-300"
            style={{
              width: ring.w,
              height: ring.w,
              transform: `translate(-50%, -50%) translateY(${ring.translateY}px) rotateX(90deg)`,
              border: `1px solid rgba(255,255,255,${isDragging ? 0.2 : 0.08})`
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
          backgroundColor: disabled ? "rgb(46,48,49)" : (isDragging ? "#D4FF00" : "white"),
          transform: isDragging ? "scaleY(1.2)" : "scaleY(1)",
          boxShadow: isDragging ? "0 0 10px rgba(212,255,0,0.5)" : "none",
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

export default function AnglesPanel({ onClose, onGenerate, previewImageUrl }) {
  const { stagedDna } = useStudioStore()
  const cameraDna = stagedDna?.camera_dna || { rotation: 0, tilt: 0, zoom: 0 }

  const [rotation, setRotation] = useState(cameraDna.rotation || 0);
  const [tilt, setTilt] = useState(cameraDna.tilt || 0);
  const [zoom, setZoom] = useState(cameraDna.zoom || 0);
  const [credits] = useState(2.4);
  const [snap, setSnap] = useState(true);

  // Sync with store if it changes (e.g. node change)
  useEffect(() => {
    setRotation(cameraDna.rotation || 0);
    setTilt(cameraDna.tilt || 0);
    setZoom(cameraDna.zoom || 0);
  }, [cameraDna.rotation, cameraDna.tilt, cameraDna.zoom]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const snapValue = (val, step = 45) => {
    return Math.round(val / step) * step;
  };

  const handleArrowClick = (dir) => {
    switch(dir) {
      case 'up': setTilt(prev => Math.min(60, prev + 30)); break;
      case 'down': setTilt(prev => Math.max(-60, prev - 30)); break;
      case 'left': setRotation(prev => (prev - 45 + 360) % 360); break;
      case 'right': setRotation(prev => (prev + 45) % 360); break;
    }
  };

  // ── Globe Drag (Controls the camera rotation/tilt directly) ──────────────
  const globeDrag = useDrag({
    onDrag: ({ dx, dy }) => {
      // Invert signs to follow mouse direction
      setRotation((prev) => (prev + dx * 0.5 + 360) % 360);
      setTilt((prev) => Math.max(-60, Math.min(60, prev - dy * 0.5)));
    },
    onDragEnd: ({ wasDragging }) => {
      if (wasDragging && snap) {
        setRotation(prev => snapValue(prev, 45) % 360);
        setTilt(prev => Math.max(-60, Math.min(60, snapValue(prev, 30))));
      }
    }
  });

  // Handlers to pass to the globe container
  const globeContainerHandlers = {
    onPointerDown: globeDrag.onPointerDown,
    onPointerMove: globeDrag.onPointerMove,
    onPointerUp: globeDrag.onPointerUp,
  };

  return (
    <div
      className="flex flex-col h-full max-h-full"
      style={{ backgroundColor: "#0f0f0f", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-2 p-3 pb-1.5" style={{ color: "white" }}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M4 5C3.44772 5 3 4.55228 3 4C3 3.44772 3.44772 3 4 3C4.55228 3 5 3.44772 5 4C5 4.55228 4.55228 5 4 5Z" fill="currentColor" />
          <path d="M20 5C19.4477 5 19 4.55228 19 4C19 3.44772 19.4477 3 20 3C20.5523 3 21 3.44772 21 4C21 4.55228 20.5523 5 20 5Z" fill="currentColor" />
          <path d="M20 21C19.4477 21 19 20.5523 19 20C19 19.4477 19.4477 19 20 19C20.5523 19 21 19.4477 21 20C21 20.5523 20.5523 21 20 21Z" fill="currentColor" />
          <path d="M4 21C3.44772 21 3 20.5523 3 20C3 19.4477 3.44772 19 4 19C4.55228 19 5 19.4477 5 20C5 20.5523 4.55228 21 4 21Z" fill="currentColor" />
          <path d="M12.8682 5.63231C12.3302 5.32488 11.6698 5.32487 11.1318 5.63231L6.88176 8.06088C6.83858 8.08555 6.7967 8.11191 6.7562 8.13984L11.9998 11.1362L17.2436 8.13972C17.2032 8.11184 17.1614 8.08552 17.1182 8.06088L12.8682 5.63231Z" fill="currentColor" />
          <path d="M6 9.58031C6 9.53277 6.00193 9.48551 6.00573 9.43863L11.2498 12.4352V18.4293C11.2099 18.4103 11.1705 18.3898 11.1318 18.3677L6.88176 15.9391C6.3365 15.6275 6 15.0477 6 14.4197V9.58031Z" fill="currentColor" />
          <path d="M12.8682 18.3677C12.8294 18.3899 12.7899 18.4105 12.7498 18.4295V12.4352L17.9943 9.43841C17.9981 9.48537 18 9.5327 18 9.58031V14.4197C18 15.0477 17.6635 15.6275 17.1182 15.9391L12.8682 18.3677Z" fill="currentColor" />
        </svg>
        <h2 className="text-sm font-semibold">Camera Angle</h2>
        <button
          onClick={onClose}
          className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ color: "rgb(120,122,124)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgb(120,122,124)")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M4.75 4.75L19.25 19.25M19.25 4.75L4.75 19.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto px-3 flex flex-col gap-4 py-2">
        <div
          className="relative flex items-center justify-center rounded-2xl overflow-hidden group/viewport"
          style={{
            backgroundColor: "rgb(18,18,18)",
            minHeight: 360,
            cursor: globeDrag.isDragging ? "grabbing" : "grab",
            touchAction: "none",
            userSelect: "none",
          }}
          {...globeContainerHandlers}
          >
            {/* Depth Grid */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: "24px 24px",
                maskImage: "radial-gradient(circle at 50% 50%, black, transparent 80%)"
              }}
            />
            <div 
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                backgroundSize: "80px 80px",
                maskImage: "radial-gradient(circle at 50% 50%, black, transparent 70%)"
              }}
            />
            
            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] z-[1]" />
          {previewImageUrl && (
            <div 
              className="absolute pointer-events-none transition-all duration-300" 
              style={{ 
                zIndex: 5, 
                left: "50%", 
                top: "50%",
                transform: `translate(-50%, -50%) scale(${globeDrag.isDragging ? 1.1 : 1})`,
                filter: globeDrag.isDragging ? "brightness(1.2) drop-shadow(0 0 20px rgba(212,255,0,0.3))" : "none"
              }}
            >
              <img
                src={previewImageUrl}
                className="w-[60px] h-[60px] object-cover rounded-md border border-white/20 shadow-2xl relative"
                style={{ backgroundColor: "#0f0f0f" }}
                alt="subject"
              />
            </div>
          )}

          <Globe viewRotation={180 + rotation} viewTilt={tilt} isDragging={globeDrag.isDragging} />

          {/* Drag HUD */}
          {globeDrag.isDragging && (
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Rot</span>
                  <span className="text-xs font-mono text-[#D4FF00] w-7 text-right">{Math.round(rotation)}°</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Tilt</span>
                  <span className="text-xs font-mono text-[#D4FF00] w-7 text-right">{Math.round(tilt)}°</span>
                </div>
              </div>
              <span className="text-[9px] text-white/20 uppercase tracking-widest mr-1">
                Rotating Camera
              </span>
            </div>
          )}

          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none select-none">
            <span className="text-[10px] text-white/20 uppercase tracking-widest bg-black/40 px-2 py-1 rounded-full">
              Drag Globe to Rotate Camera
            </span>
          </div>

          <CameraIcon
            rotX={tilt}
            rotY={rotation}
            zIndex={10}
            isDragging={globeDrag.isDragging}
          />

          {[
            { dir: 'up', style: { top: "calc(50% - 115px)", left: "50%", transform: "translate(-50%, -50%)" }, d: "M8 13.9999L11.6464 10.3535C11.8417 10.1582 12.1583 10.1582 12.3536 10.3535L16 13.9999" },
            { dir: 'down', style: { top: "calc(50% + 115px)", left: "50%", transform: "translate(-50%, -50%)" }, d: "M8 10L11.6464 13.6464C11.8417 13.8417 12.1583 13.8417 12.3536 13.6464L16 10" },
            { dir: 'left', style: { top: "50%", left: "calc(50% - 115px)", transform: "translate(-50%, -50%)" }, d: "M13.7929 16L10.1464 12.3536C9.95118 12.1583 9.95118 11.8417 10.1464 11.6464L13.7929 8" },
            { dir: 'right', style: { top: "50%", left: "calc(50% + 115px)", transform: "translate(-50%, -50%)" }, d: "M10 16L13.6464 12.3536C13.8417 12.1583 13.8417 11.8417 13.6464 11.6464L10 8" },
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
              <svg className="w-6 h-6 transition-all group-hover:scale-110 group-active:scale-95" viewBox="0 0 24 24" fill="none">
                <path d={arrow.d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                  style={{ color: "rgb(100,102,104)" }}
                  className="group-hover:stroke-white"
                />
              </svg>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Manual Adjustment</span>
            <button 
              onClick={() => setSnap(!snap)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${snap ? 'bg-[#D4FF00]/10 text-[#D4FF00]' : 'bg-white/5 text-white/40'}`}
            >
              <div className={`w-2 h-2 rounded-full ${snap ? 'bg-[#D4FF00] animate-pulse' : 'bg-white/20'}`} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Snap Grid</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <RangeSlider label="Rotation" min={0} max={360} step={snap ? 45 : 1} value={rotation} onChange={setRotation} displayValue={Math.round(rotation)} />
            <RangeSlider label="Tilt" min={-60} max={60} step={snap ? 30 : 1} value={tilt} onChange={setTilt} displayValue={Math.round(tilt)} />
            <RangeSlider label="Zoom" min={0} max={10} step={5} value={zoom} onChange={setZoom} displayValue={Math.round(zoom)} />
          </div>
        </div>
      </div>

      <div className="p-3 pt-1.5">
        <button
          onClick={() => onGenerate?.({ rotation, tilt, zoom })}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-opacity"
          style={{
            backgroundColor: "#EFFE17",
            color: "#000",
            border: "none",
            boxShadow: "inset 0px -3px rgba(0,0,0,0.43)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseDown={(e) => (e.currentTarget.style.opacity = "0.6")}
          onMouseUp={(e) => (e.currentTarget.style.opacity = "0.8")}
        >
          <span className="text-base font-semibold">Generate</span>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M11.8525 4.21651L11.7221 3.2387C11.6906 3.00226 11.4889 2.82568 11.2504 2.82568C11.0118 2.82568 10.8102 3.00226 10.7786 3.23869L10.6483 4.21651C10.2658 7.0847 8.00939 9.34115 5.14119 9.72358L4.16338 9.85396C3.92694 9.88549 3.75037 10.0872 3.75037 10.3257C3.75037 10.5642 3.92694 10.7659 4.16338 10.7974L5.14119 10.9278C8.00938 11.3102 10.2658 13.5667 10.6483 16.4349L10.7786 17.4127C10.8102 17.6491 11.0118 17.8257 11.2504 17.8257C11.4889 17.8257 11.6906 17.6491 11.7221 17.4127L11.8525 16.4349C12.2349 13.5667 14.4913 11.3102 17.3595 10.9278L18.3374 10.7974C18.5738 10.7659 18.7504 10.5642 18.7504 10.3257C18.7504 10.0872 18.5738 9.88549 18.3374 9.85396L17.3595 9.72358C14.4913 9.34115 12.2349 7.0847 11.8525 4.21651Z" fill="currentColor" />
            <path d="M4.6519 14.7568L4.82063 14.2084C4.84491 14.1295 4.91781 14.0757 5.00037 14.0757C5.08292 14.0757 5.15582 14.1295 5.1801 14.2084L5.34883 14.7568C5.56525 15.4602 6.11587 16.0108 6.81925 16.2272L7.36762 16.3959C7.44652 16.4202 7.50037 16.4931 7.50037 16.5757C7.50037 16.6582 7.44652 16.7311 7.36762 16.7554L6.81926 16.9241C6.11587 17.1406 5.56525 17.6912 5.34883 18.3946L5.1801 18.9429C5.15582 19.0218 5.08292 19.0757 5.00037 19.0757C4.91781 19.0757 4.84491 19.0218 4.82063 18.9429L4.65191 18.3946C4.43548 17.6912 3.88486 17.1406 3.18147 16.9241L2.63311 16.7554C2.55421 16.7311 2.50037 16.6582 2.50037 16.5757C2.50037 16.4931 2.55421 16.4202 2.63311 16.3959L3.18148 16.2272C3.88486 16.0108 4.43548 15.4602 4.6519 14.7568Z" fill="currentColor" />
          </svg>
          <span className="text-base font-semibold">{credits}</span>
        </button>
      </div>
    </div>
  );
}
