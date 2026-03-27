import { useMemo } from 'react';
import { useGenerations } from '@/features/generations/api/generationsApi';
import { useGenerationsStore } from './useGenerationsStore';

/**
 * [FSD Layer: features/generations]
 * A specialized hook that wraps useGenerations and applies client-side 
 * filtering and sorting based on the global filter store.
 */
export function useFilteredGenerations(projectId, sessionId) {
  const { data: generations = [], ...queryState } = useGenerations(projectId, sessionId);
  const { filters, showUploadedMedia } = useGenerationsStore();

  // All models present in the current data (for the dropdown)
  const availableModels = useMemo(() =>
    [...new Set(generations.map(g => g.model).filter(Boolean))],
    [generations]
  );

  const filtered = useMemo(() => {
    let result = [...generations];

    // Global Uploads Visibility Toggle
    if (!showUploadedMedia) {
      result = result.filter(g => g.feed_type !== 'upload');
    }

    // Filter by model
    if (filters.models?.length > 0) {
      result = result.filter(g => filters.models.includes(g.model));
    }

    // Filter by type (image / video)
    if (filters.types?.length > 0) {
      result = result.filter(g => filters.types.includes(g.type));
    }

    // Filter by aspect ratio
    if (filters.aspectRatios?.length > 0) {
      result = result.filter(g => {
        const ratio = g.params?.aspect_ratio || g.params?.ratio;
        return filters.aspectRatios.includes(ratio);
      });
    }

    // Filter by Source (Généré vs Importé)
    if (filters.showGenerated && !filters.showImported) {
      result = result.filter(g => g.feed_type === 'generation');
    } else if (filters.showImported && !filters.showGenerated) {
      result = result.filter(g => g.feed_type === 'upload');
    }

    // Filter by liked
    if (filters.liked) {
      result = result.filter(group => 
        group.items?.some(item => item.is_liked === true)
      );
    }

    // Filter by prompt text
    if (filters.prompt?.trim()) {
      const q = filters.prompt.toLowerCase();
      result = result.filter(g => {
        const groupPrompt = g.params?.prompt?.toLowerCase() || "";
        // Also search in individual items if they have different prompts (mentions etc)
        const hasMatchingItem = g.items?.some(i => i.prompt?.toLowerCase().includes(q));
        return groupPrompt.includes(q) || hasMatchingItem;
      });
    }

    // Sort
    result.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return filters.sort === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [generations, filters, showUploadedMedia]);

  return {
    ...queryState,
    data: filtered,
    total: generations.length,
    filteredCount: filtered.length,
    availableModels,
  };
}
