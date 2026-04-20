import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { useStudioStore } from "@/store/useStudioStore";
import { useEditStore } from "@/features/prompt-bar/model/useEditStore";
import { Button } from "@/shared/ui/button";
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

// ─── Camera Icon Component ───────────────────────────────────────────────────
const CameraIcon = memo(function CameraIcon({ rotX, rotY, zIndex = 10, isDragging = false }) {
  return (
    <div
      className="absolute inset-0"
      style={{ zIndex, pointerEvents: "none", transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute w-[160px] h-[160px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
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
              transform: "translateZ(90px)", // Slightly outside globe
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
                className="absolute bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                style={{
                  width: 1.5, height: 90,
                  transform: "translate(-50%, 0px) translateZ(-5px) rotateX(-90deg)",
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
  const meridians = useMemo(() => Array.from({ length: 18 }, (_, i) => i * 10), []);

  return (
    <div
      className="absolute w-[160px] h-[160px] rounded-full transition-all duration-500"
      style={{ 
        transformStyle: "preserve-3d",
        border: `1px solid rgba(255,255,255,${isDragging ? 0.2 : 0.05})`,
        backgroundColor: isDragging ? "rgba(255,255,255,0.02)" : "transparent",
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
              border: `0.5px solid rgba(255,255,255,${isDragging ? 0.15 : 0.05})`
            }}
          />
        ))}
        
        {/* Equator (Main) */}
        <div
          className="absolute size-full rounded-full"
          style={{ 
            transform: "rotateX(90deg)",
            border: `0.5px solid rgba(255,255,255,${isDragging ? 0.2 : 0.08})`,
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
              border: `0.5px solid rgba(255,255,255,${isDragging ? 0.15 : 0.05})`
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
  const { stagedDna, setCameraDna } = useStudioStore();
  const { editTarget, setCamera } = useEditStore();
  const generateMutation = useGenerateMutation();
  
  const activeImageUrl = previewImageUrl || editTarget?.primaryMediaUrl || editTarget?.url || editTarget?.thumbnail_url;
  
  const cameraDna = stagedDna?.camera_dna || { rotation: 0, tilt: 0, zoom: 0 }

  const [rotation, setRotation] = useState(cameraDna.rotation || 0);
  const [tilt, setTilt] = useState(cameraDna.tilt || 0);
  const [zoom, setZoom] = useState(cameraDna.zoom || 0);
  const [credits] = useState(2.4);
  const [snap, setSnap] = useState(false);

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

  const handleUpdateAngle = async () => {
    if (!editTarget) return;

    const payload = {
      rotation,
      tilt,
      zoom,
      project_id: editTarget.project_id,
      session_id: editTarget.session_id,
      ratio: editTarget.ratio,
      quality: editTarget.quality,
      workflow_id: editTarget.workflow_id,
      video_workflow_id: editTarget.workflow_id,
      reference_workflow_ids: [editTarget.workflow_id].filter(Boolean),
      model_name: "seedream-pro",
    };

    generateMutation.mutate({
      payload,
      isCamera: true
    });

    const newDna = { rotation, tilt, zoom };
    setCamera?.(newDna);
    setCameraDna?.(newDna);
    onGenerate?.(newDna);
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
      const newRot = (rotation + dx * 0.7 + 360) % 360;
      const newTilt = Math.max(-60, Math.min(60, tilt - dy * 0.7));
      setRotation(newRot);
      setTilt(newTilt);
      const newDna = { rotation: newRot, tilt: newTilt, zoom };
      setCamera?.(newDna);
      setCameraDna?.(newDna);
      onGenerate?.(newDna);
    },
    onDragEnd: ({ wasDragging }) => {
      if (wasDragging && snap) {
        const snappedRot = snapValue(rotation, 45) % 360;
        const snappedTilt = Math.max(-60, Math.min(60, snapValue(tilt, 30)));
        setRotation(snappedRot);
        setTilt(snappedTilt);
        const newDna = { rotation: snappedRot, tilt: snappedTilt, zoom };
        setCamera?.(newDna);
        setCameraDna?.(newDna);
        onGenerate?.(newDna);
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
    <div className="flex flex-col gap-4">
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
            {/* Depth Grid */}
            <div 
              className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)`,
                backgroundSize: "20px 20px",
                maskImage: "radial-gradient(circle at 50% 50%, black, transparent 80%)"
              }}
            />
            
            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] z-1" />

          {activeImageUrl && (
            <div 
              className="absolute pointer-events-none transition-all duration-300" 
              style={{ 
                zIndex: 5, 
                left: "50%", 
                top: "50%",
                transform: `translate(-50%, -50%) `,
                filter: globeDrag.isDragging ? "brightness(1.2) drop-shadow(0 0 20px rgba(212,255,0,0.3))" : "none"
              }}
            >
              <img
                src={activeImageUrl}
                className="max-w-[80px] max-h-[80px] w-auto h-auto object-contain rounded-md border border-white/20 shadow-2xl relative"
                style={{ backgroundColor: "#0f0f0f" }}
                alt="subject"
              />
            </div>
          )}

          <Globe viewRotation={180 + rotation} viewTilt={tilt} isDragging={globeDrag.isDragging} />

   
          <CameraIcon
            rotX={tilt}
            rotY={rotation}
            zIndex={10}
            isDragging={globeDrag.isDragging}
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
                // Also trigger update
                setTimeout(() => {
                  const newDna = { rotation, tilt, zoom };
                  setCamera?.(newDna);
                  setCameraDna?.(newDna);
                  onGenerate?.(newDna);
                }, 0);
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


          <div className="flex flex-col gap-2">
            <RangeSlider label="Rotation" min={0} max={360} step={snap ? 45 : 1} value={rotation} onChange={(val) => { setRotation(val); const newDna = { rotation: val, tilt, zoom }; setCamera?.(newDna); setCameraDna?.(newDna); onGenerate?.(newDna); }} displayValue={Math.round(rotation)} />
            <RangeSlider label="Tilt" min={-60} max={60} step={snap ? 30 : 1} value={tilt} onChange={(val) => { setTilt(val); const newDna = { rotation, tilt: val, zoom }; setCamera?.(newDna); setCameraDna?.(newDna); onGenerate?.(newDna); }} displayValue={Math.round(tilt)} />
            <RangeSlider label="Zoom" min={0} max={10} step={5} value={zoom} onChange={(val) => { setZoom(val); const newDna = { rotation, tilt, zoom: val }; setCamera?.(newDna); setCameraDna?.(newDna); onGenerate?.(newDna); }} displayValue={Math.round(zoom)} />
          </div>
          <div className="flex items-center justify-end">
            <Button
              variant="studio-white"
              onClick={handleUpdateAngle}
              disabled={generateMutation.isPending}
              className="h-8 px-4 rounded-full text-xs"
            >
              {generateMutation.isPending ? "Generating..." : "Update Angle"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
