import { api } from '@/shared/api/client';
import { downloadBlob } from '@/shared/lib/utils';
import { logger } from '@/shared/lib/logger';

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
    logger.error('download_failed', {
      filename,
      error,
    });
    // Fallback: just open in new tab if blob fetch fails (e.g. CORS)
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }
}


