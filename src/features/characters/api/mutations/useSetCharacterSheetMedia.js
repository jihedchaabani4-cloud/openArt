// [FSD Layer: features/characters/hooks] — Set primary character sheet media mutation (1 hook/file).
// Optimistically previews blob image with status "uploading", revokes URL on settled.
import { queryKeys } from "@/shared/api/queryKeys";
import { characterService } from "../characterService";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";

/**
 * useSetCharacterSheetMedia
 * Replaces or uploads the primary turnaround sheet media for the character.
 * When a file is provided, shows a blob preview (status:"uploading") immediately.
 */
export function useSetCharacterSheetMedia() {
  return useOptimisticMutation({
    mutationFn: async (params) => {
      return await characterService.setSheetMedia(params);
    },

    getCacheKeys: ({ projectId }) =>
      projectId ? [queryKeys.projectData.byProject(projectId)] : [],

    onMutate: (variables) => {
      if (!variables.file) return {};
      const localUrl = URL.createObjectURL(variables.file);
      variables._localUrl = localUrl;
      return { localUrl };
    },

    applyOptimistic: (oldData, { characterId, _localUrl }) => {
      if (!oldData?.projectContents || !_localUrl) return oldData;
      const optimisticId = `optimistic-sheet-media-${Date.now()}`;
      const optimisticMedia = {
        id: optimisticId,
        file_url: _localUrl,
        status: "uploading",
        feed_type: "upload",
        characterId,
        character_id: characterId,
        is_sheet: true,
        created_at: new Date().toISOString(),
      };
      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          media: [optimisticMedia, ...(oldData.projectContents.media || [])],
        },
      };
    },

    invalidateKeys: ({ projectId }) =>
      projectId
        ? [queryKeys.projectData.byProject(projectId)]
        : [["projectData"]],

    onSettled: (_data, _err, variables, context) => {
      if (context?.localUrl) URL.revokeObjectURL(context.localUrl);
    },

    errorMessage: "Failed to update character sheet. Changes were reverted.",
  });
}

export default useSetCharacterSheetMedia;
