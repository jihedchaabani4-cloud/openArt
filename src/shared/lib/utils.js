import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { api } from "@/shared/api/client";

const customTwMerge = extendTailwindMerge({
  extend: {
    theme: {
      colors: [
        "bg-root",
        "bg-page",
        "bg-surface",
        "bg-surface-2",
        "bg-surface-elevated",
        "overlay-3",
        "overlay-5",
        "overlay-8",
        "overlay-10",
        "overlay-20",
        "text-primary",
        "text-body",
        "text-secondary",
        "text-tertiary",
        "text-footer",
        "text-disabled",
        "text-on-brand",
        "brand",
        "brand-edge",
        "brand-glow",
        "border-subtle",
        "border-default",
        "border-strong",
        "border-glass",
      ],
      radius: [
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "2xl",
        "3xl",
        "full",
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
