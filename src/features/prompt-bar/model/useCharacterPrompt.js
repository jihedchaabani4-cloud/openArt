import React, { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateCharacterMutation } from "@/features/workflows/api/workflowsApi";
import { characterService } from "@/features/characters/services/characterService";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { queryKeys } from "@/shared/api/queryKeys";
import { useCharacterStore } from "./useCharacterStore";
import { useMediaLibrary } from "@/features/media/model/useMediaLibrary";
import { useMediaUpload } from "./useMediaUpload";

/**
 * [Prompt Bar Feature - Character Domain Hook]
 * Dedicated, lightweight prompt bar hook for Character Creation.
 * Sends ONLY workflow_id / asset_id references to backend.
 * All media URLs and metadata are resolved strictly on the Backend.
 */
export function useCharacterPrompt() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [internalMode, setInternalMode] = useState("image");
  const [targetRole, setTargetRole] = useState("normal");
  const [mentionCallback, setMentionCallback] = useState(null);

  const { selectedProjectId: storeProjectId, activeSessionId } = useWorkflowsStore();
  const projectId = params?.projectId || storeProjectId;

  const { mutateAsync: createCharacter, isPending: isCreating } = useCreateCharacterMutation();

  const {
    prompt,
    setPrompt,
    references: referenceImages,
    addReference: addCharacterReference,
    removeReference: removeCharacterReference,
    clearReferences: clearCharacterReferences,
  } = useCharacterStore();

  const maxRefs = 4;

  // Media Library for the ImportMediaPopover
  const library = useMediaLibrary(projectId);

  // Dedicated Media Upload logic
  const {
    handleUpload: handleUploadFromPC,
    handleDrop: handleGalleryDrop,
    isDragging: isDraggingGalleryItem,
    uploadError: dragError,
  } = useMediaUpload({
    projectId,
    activeSessionId,
    addReference: (asset, role, max) => addCharacterReference(asset, role, max),
    referenceImages,
    maxRefs,
    allowedType: "image",
  });

  const openDialog = useCallback((mode = "image", role = "normal", callback = null) => {
    setInternalMode(mode);
    setTargetRole(role);
    setMentionCallback(() => callback);
    if (library.handleOpen) library.handleOpen(mode);
    setDialogOpen(true);
  }, [library]);

  const handleAddClick = useCallback(() => {
    if (dialogOpen) {
      setDialogOpen(false);
      return;
    }
    openDialog("image", "normal");
  }, [dialogOpen, openDialog]);

  const handleSelectMedia = useCallback((assets) => {
    const items = Array.isArray(assets) ? assets : [assets];
    items.forEach((asset) => {
      addCharacterReference(asset, targetRole, maxRefs);
    });
    if (mentionCallback) mentionCallback(items);
    setDialogOpen(false);
    setMentionCallback(null);
  }, [addCharacterReference, targetRole, maxRefs, mentionCallback]);

  const handleRemoveReference = useCallback((indexOrAssetId) => {
    if (typeof indexOrAssetId === "string") {
      removeCharacterReference(indexOrAssetId);
    } else if (typeof indexOrAssetId === "number" && referenceImages[indexOrAssetId]) {
      const target = referenceImages[indexOrAssetId];
      const assetId = target.asset_id || target.id || target.workflow_id;
      if (assetId) removeCharacterReference(assetId);
    }
  }, [removeCharacterReference, referenceImages]);

  const handleGenerateCharacter = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!prompt.trim() || isCreating) return;

    try {
      // Extract ONLY workflow_ids to send to the backend
      const referenceWorkflowIds = referenceImages
        .map((r) => (typeof r === "string" ? r : r?.workflow_id || r?.workflowId || r?.workflow?.id || r?.id || r?.asset_id))
        .filter(Boolean);

      console.log("🚀 [useCharacterPrompt] Submitting character create payload with workflow IDs ONLY:", referenceWorkflowIds);

      const payload = characterService.buildCreatePayload({
        name: prompt.slice(0, 45),
        prompt,
        references: referenceWorkflowIds,
        projectId,
      });

      const res = await createCharacter({ payload });

      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        router.push(`/cinema-studio/${projectId}/characters`);
      }

      setPrompt("");
      if (clearCharacterReferences) clearCharacterReferences();
      return res;
    } catch (err) {
      console.error("Failed to create character via prompt bar:", err);
      throw err;
    }
  };

  return {
    prompt,
    setPrompt,
    referenceImages,
    maxRefs,
    dialogOpen,
    setDialogOpen,
    internalMode,
    openDialog,
    handleAddClick,
    handleSelectMedia,
    handleRemoveReference,
    handleUploadFromPC,
    handleGalleryDrop,
    isDraggingGalleryItem,
    dragError,
    isCreating,
    generating: isCreating,
    handleGenerate: handleGenerateCharacter,
    library: library.items || [],
    libraryLoading: library.loading,
    generationMode: "image",
    placeholder: "Describe the character you want to create or pick traits from Form...",
  };
}

export default useCharacterPrompt;

