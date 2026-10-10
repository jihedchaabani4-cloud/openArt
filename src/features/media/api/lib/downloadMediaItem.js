// [FSD Layer: features/media/api/lib] — Download media item helper (pure utility).
// Body copied VERBATIM from features/media/api/mediaApi.js downloadMediaItem.
import { api } from '@/shared/api/client';
import { downloadBlob } from '@/shared/lib/utils';

/**
 * Downloads a single media item.
 * @param {string} url - The absolute URL of the media
 * @param {string} filename - The output filename
 */
export async function downloadMediaItem(url, filename) {
  try {
    const blob = await api.getBlob(url);
    downloadBlob(blob, filename);
  } catch (error) {
    console.error("❌ Download failed:", error);
    // Fallback: just open in new tab if blob fetch fails (e.g. CORS)
    window.open(url, "_blank");
  }
}
