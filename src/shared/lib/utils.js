import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { api } from "@/shared/api/client";

const customTwMerge = extendTailwindMerge({
  extend: {
    theme: {
      colors: [
        "surface-canvas",
        "surface-panel",
        "surface-processing",
        "surface-card",
        "surface-base",
        "surface-elevated",
        "surface-highest",
        "surface-sunken",
        "surface-overlay",
        "content-base",
        "content-muted",
        "content-subtle",
        "line-subtle",
        "line-default",
        "line-interactive",
      ],
      radius: [
        "xxxs",
        "hairline",
        "sharp",
        "subtle",
        "comfortable",
        "generous",
      ],
      spacing: [
        "xxs",
        "xxl",
        "section",
        "section-lg",
        "section-xl",
        "section-xxl",
      ],
    },
  },
});

export function cn(...inputs) {
  return customTwMerge(clsx(inputs));
}

export function downloadBlob(blob, filename) {
  const blobUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

export async function downloadFile(url, filename) {
  try {
    const blob = await api.getBlob(url);
    downloadBlob(blob, filename);
  } catch (error) {
    console.error("❌ Download failed:", error);
    // Fallback: just open in new tab if blob fetch fails (e.g. CORS)
    window.open(url, "_blank");
  }
}
