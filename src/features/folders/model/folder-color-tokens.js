/**
 * Collection / Folder Color Tokens
 * Sourced from openart/labveil color specification.
 */
export const FOLDER_COLOR_OPTIONS = [
  {
    id: "lime",
    label: "Lime",
    hex: "#d1fe17",
    bgClass: "bg-lime",
    backTab: "#a3cc00",
    frontTop: "#efff99",
    frontBottom: "#d1fe17",
    frontStroke: "#ffffff40",
  },
  {
    id: "cyan",
    label: "Cyan",
    hex: "#67e8f9",
    bgClass: "bg-cyan-300",
    backTab: "#38bdf8",
    frontTop: "#cffafe",
    frontBottom: "#67e8f9",
    frontStroke: "#ffffff40",
  },
  {
    id: "slate",
    label: "Slate",
    hex: "#e2e8f0",
    bgClass: "bg-slate-200",
    backTab: "#94a3b8",
    frontTop: "#f8fafc",
    frontBottom: "#cbd5e1",
    frontStroke: "#ffffff40",
  },
  {
    id: "violet",
    label: "Violet",
    hex: "#a78bfa",
    bgClass: "bg-violet-400",
    backTab: "#7c3aed",
    frontTop: "#ede9fe",
    frontBottom: "#a78bfa",
    frontStroke: "#ffffff40",
  },
  {
    id: "purple",
    label: "Purple",
    hex: "#c084fc",
    bgClass: "bg-purple-400",
    backTab: "#9333ea",
    frontTop: "#f3e8ff",
    frontBottom: "#c084fc",
    frontStroke: "#ffffff40",
  },
  {
    id: "pink",
    label: "Pink",
    hex: "#f472b6",
    bgClass: "bg-pink-400",
    backTab: "#db2777",
    frontTop: "#fce7f3",
    frontBottom: "#f472b6",
    frontStroke: "#ffffff40",
  },
  {
    id: "yellow",
    label: "Yellow",
    hex: "#fef08a",
    bgClass: "bg-yellow-200",
    backTab: "#eab308",
    frontTop: "#fefce8",
    frontBottom: "#fef08a",
    frontStroke: "#ffffff40",
  },
];

export const DEFAULT_FOLDER_COLOR = FOLDER_COLOR_OPTIONS[0].hex;

export const WHITE_FOLDER_GRADIENT = {
  id: "white",
  label: "White",
  hex: "#ffffff",
  bgClass: "bg-white",
  backTab: "#d4d4d8",
  frontTop: "#ffffff",
  frontBottom: "#e4e4e7",
  frontStroke: "#ffffff80",
};

export const DEFAULT_FOLDER_GRADIENT = WHITE_FOLDER_GRADIENT;

/**
 * Returns gradient shades for a folder color (custom hex or mapped preset).
 * Defaults to crisp 3D white when no color is provided.
 */
export function getFolderColorGradient(colorHex) {
  if (!colorHex) return DEFAULT_FOLDER_GRADIENT;
  const match = FOLDER_COLOR_OPTIONS.find(
    (c) => c.hex.toLowerCase() === colorHex.toLowerCase() || c.id === colorHex
  );
  if (match) return match;

  if (colorHex.toLowerCase() === "#ffffff" || colorHex.toLowerCase() === "white") {
    return DEFAULT_FOLDER_GRADIENT;
  }

  // Fallback dynamic styling for any arbitrary hex color
  return {
    backTab: colorHex,
    frontTop: "#ffffff",
    frontBottom: colorHex,
    frontStroke: "#ffffff40",
  };
}
