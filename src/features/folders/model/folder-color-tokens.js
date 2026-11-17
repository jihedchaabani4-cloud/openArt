/**
 * Collection / Folder Color Tokens
 * Aligned with SaaS Dark UI Design System (DESIGN.md)
 */
const h = (c) => `#${c}`;

export const FOLDER_COLOR_OPTIONS = [
  {
    id: "amber",
    label: "Amber",
    hex: h("FFC241"),
    bgClass: "bg-accent-yellow",
    backTab: h("d97706"),
    frontTop: h("fef3c7"),
    frontBottom: h("FFC241"),
    frontStroke: "rgba(255, 255, 255, 0.25)",
  },
  {
    id: "cyan",
    label: "Cyan",
    hex: h("67e8f9"),
    bgClass: "bg-cyan-300",
    backTab: h("38bdf8"),
    frontTop: h("cffafe"),
    frontBottom: h("67e8f9"),
    frontStroke: "rgba(255, 255, 255, 0.25)",
  },
  {
    id: "zinc",
    label: "Zinc",
    hex: h("e4e4e7"),
    bgClass: "bg-white/80",
    backTab: h("a1a1aa"),
    frontTop: h("fafafa"),
    frontBottom: h("d4d4d8"),
    frontStroke: "rgba(255, 255, 255, 0.25)",
  },
  {
    id: "violet",
    label: "Violet",
    hex: h("a78bfa"),
    bgClass: "bg-violet-400",
    backTab: h("7c3aed"),
    frontTop: h("ede9fe"),
    frontBottom: h("a78bfa"),
    frontStroke: "rgba(255, 255, 255, 0.25)",
  },
  {
    id: "purple",
    label: "Purple",
    hex: h("c084fc"),
    bgClass: "bg-purple-400",
    backTab: h("9333ea"),
    frontTop: h("f3e8ff"),
    frontBottom: h("c084fc"),
    frontStroke: "rgba(255, 255, 255, 0.25)",
  },
  {
    id: "pink",
    label: "Pink",
    hex: h("f472b6"),
    bgClass: "bg-pink-400",
    backTab: h("db2777"),
    frontTop: h("fce7f3"),
    frontBottom: h("f472b6"),
    frontStroke: "rgba(255, 255, 255, 0.25)",
  },
  {
    id: "yellow",
    label: "Yellow",
    hex: h("fef08a"),
    bgClass: "bg-yellow-200",
    backTab: h("eab308"),
    frontTop: h("fefce8"),
    frontBottom: h("fef08a"),
    frontStroke: "rgba(255, 255, 255, 0.25)",
  },
];

export const DEFAULT_FOLDER_COLOR = FOLDER_COLOR_OPTIONS[0].hex;

export const WHITE_FOLDER_GRADIENT = {
  id: "white",
  label: "White",
  hex: h("ffffff"),
  bgClass: "bg-white",
  backTab: h("d4d4d8"),
  frontTop: h("ffffff"),
  frontBottom: h("e4e4e7"),
  frontStroke: "rgba(255, 255, 255, 0.5)",
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

  if (colorHex.toLowerCase() === h("ffffff") || colorHex.toLowerCase() === "white") {
    return DEFAULT_FOLDER_GRADIENT;
  }

  // Fallback dynamic styling for any arbitrary hex color
  return {
    backTab: colorHex,
    frontTop: h("ffffff"),
    frontBottom: colorHex,
    frontStroke: "rgba(255, 255, 255, 0.25)",
  };
}
