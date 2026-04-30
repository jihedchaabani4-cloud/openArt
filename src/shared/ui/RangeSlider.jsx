import { memo, useState } from "react";

/**
 * RangeSlider
 * A styled range input with a fill track and dragging indicator.
 *
 * @param {string}   label        — Left label text
 * @param {number}   min          — Minimum value
 * @param {number}   max          — Maximum value
 * @param {number}   step         — Step increment
 * @param {number}   value        — Controlled value
 * @param {function} onChange     — Callback (number) => void
 * @param {boolean}  disabled     — Disabled state
 * @param {string}   displayValue — Optional override for the right label (e.g. "5s")
 */
export const RangeSlider = memo(function RangeSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  displayValue,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div
      className="relative overflow-hidden flex items-center rounded-lg h-9 px-3 transition-colors border border-white/10"
      style={{
        borderColor: disabled
          ? "rgb(46,48,49)"
          : isDragging
          ? "rgba(255,255,255,0.4)"
          : "rgb(60,62,63)",
        backgroundColor: "rgba(0,0,0,0.2)",
      }}
    >
      {/* Fill track */}
      <div
        className="absolute inset-0 pointer-events-none rounded"
        style={{
          background: disabled
            ? "transparent"
            : `linear-gradient(to right, rgb(46,48,49) 0%, rgb(46,48,49) ${percent}%, rgba(0,0,0,0) ${percent}%, rgba(0,0,0,0) 100%)`,
        }}
      />

      {/* Thumb indicator */}
      <div
        className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-10 rounded-full transition-transform"
        style={{
          left: `calc(${percent}% - 1px)`,
          backgroundColor: disabled ? "rgb(46,48,49)" : isDragging ? "#ffffff" : "white",
          transform: isDragging ? "scaleY(1.2)" : "scaleY(1)",
          boxShadow: isDragging ? "0 0 10px rgba(255,255,255,0.5)" : "none",
        }}
      />

      {/* Labels */}
      <div className="relative z-10 flex items-center justify-between w-full pointer-events-none">
        <span
          className="text-xs font-medium"
          style={{ color: disabled ? "rgb(80,82,84)" : "rgb(160,162,164)" }}
        >
          {label}
        </span>
        <span
          className="text-xs font-medium font-mono"
          style={{ color: disabled ? "rgb(80,82,84)" : "white" }}
        >
          {displayValue ?? value}
        </span>
      </div>

      {/* Native input (invisible) */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onBlur={() => setIsDragging(false)}
        onChange={(e) => onChange?.(Number(e.target.value))}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
    </div>
  );
});
