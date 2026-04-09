// src/features/prompt-bar/model/useEditPromptBar.js
import React, { useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkflowsStore } from "@/features/workflows";
import { useEditStore } from "./useEditStore";
import { useProjectData, useGenerateMutation } from "@/features/workflows/api/workflowsApi";
import { queryKeys } from "@/shared/api/queryKeys";
import { buildReferencesPayload } from "@/shared/lib/referenceUtils";
import { useModelSync } from "./useModelSync";
import { useMediaUpload } from "./useMediaUpload";
import { useMediaLibrary } from "@/features/media/model/useMediaLibrary";

/**
 * useEditPromptBar
 * Dedicated hook for the EditPromptBar component.
 * Now fully isolated using useEditStore.
 */
export function useEditPromptBar() {
  const {
    selectedProjectId: projectId,
    activeSessionId,
  } = useWorkflowsStore();

  const {
    editTarget,
    setEditTarget,
    prompt,
    setPrompt,
    ratio,
    setRatio,
    quality: resolution,
    setQuality: setResolution,
    modelId,
    setModelId,
    referenceImages,
    addReference,
    removeReference,
    clearReferences,
    setReferenceImages,
    selection,
    setSelection,
    clearSelection,
    activeTab,
    setActiveTab,
    camera,
    setCamera,
    lighting,
    setLighting,
    upscaleScale,
    setUpscaleScale,
    resetEditStore,
  } = useEditStore();

  // Note: resetEditStore is exclusively handled by page.js to prevent race conditions
  // when swapping between EditPromptBarImage and EditPromptBarVideo.

  const queryClient = useQueryClient();
  const lib = useMediaLibrary(projectId);
  const { data: projectData, isLoading: studioModelsLoading } = useProjectData(projectId);

  const studioModels = projectData?.modelConfig?.models ?? [];
  const studioFamilies = projectData?.modelConfig?.families ?? [];

  const generationMode = editTarget?.isVideo ? "motion" : "image";
  const { model, setModel, selectedModel, maxRefs } = useModelSync(
    studioModels,
    studioModelsLoading,
    generationMode
  );

  // Synchronize local model state with store model state
  useEffect(() => {
    if (model?.id) setModelId(model.id);
  }, [model, setModelId]);

  const upload = useMediaUpload({
    projectId,
    activeSessionId,
    addReference: (asset, role) => addReference(asset, role, maxRefs),
    referenceImages,
    maxRefs,
  });

  const textareaRef = useRef(null);

  const { mutateAsync: runGenerate, isPending: generating } = useGenerateMutation({
    onError: (err) => console.error(err.message),
  });

  const handleGenerate = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      // Security/UX guard: do not allow edit/upscale/treatments if the target
      // media isn't completed or doesn't belong to the active session.
      if (editTarget?.session_id && activeSessionId && editTarget.session_id !== activeSessionId) return;
      if (editTarget?.media_status && editTarget.media_status !== "completed") return;
      if (!editTarget?.media_id || !editTarget?.workflow_id) return;
      
      if (activeTab === "upscale") {
          if (generating) return;
          const payload = {
              media_id:         editTarget?.media_id,
              upscaleScale:     upscaleScale,
          };
          
          try {
            const res = await runGenerate({ payload, isUpscale: true, isVideo: editTarget?.isVideo });
            const finalProj = res.project_id ?? projectId;
            const finalSess = res.session_id ?? activeSessionId;
            
            if (finalProj) {
              queryClient.invalidateQueries({ queryKey: queryKeys.assets.byProject(finalProj, finalSess) });
              queryClient.invalidateQueries({ queryKey: queryKeys.generations.byProject(finalProj, finalSess) });
            }
          } catch (err) {
            console.error("❌ Upscale failed:", err);
          }
          return;
      }

      if (!prompt.trim() || generating) return;

      const payload = {
        prompt,
        model:            model?.id ?? "nanobana_pro",
        model_name:       model?.id ?? "nanobana_pro",
        quality:          resolution,
        ratio,
        num_images:       1,
        edit_type:        "edit",
        section:          "image_generator",
        project_id:       projectId,
        session_id:       activeSessionId,
        workflow_id:      editTarget?.workflow_id,
        media_id:         editTarget?.media_id,
        references:       buildReferencesPayload(referenceImages),
        mask_selection:   selection,
        activeTab:        activeTab,
        upscaleScale:     upscaleScale,
      };

      try {
        const res = await runGenerate({ payload, isVideo: !!editTarget?.isVideo });
        const finalProj = res.project_id ?? projectId;
        const finalSess = res.session_id ?? activeSessionId;
        
        if (finalProj) {
          queryClient.invalidateQueries({ queryKey: queryKeys.assets.byProject(finalProj, finalSess) });
          queryClient.invalidateQueries({ queryKey: queryKeys.generations.byProject(finalProj, finalSess) });
        }

        setPrompt("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      } catch (err) {
        console.error("❌ Edit failed:", err);
      }
    },
    [
      prompt, generating, model, resolution, ratio, projectId, activeSessionId,
      referenceImages, editTarget, runGenerate, queryClient, setPrompt,
      activeTab, upscaleScale, selection
    ]
  );

  return {
    prompt, setPrompt,
    textareaRef,
    model, setModel,
    selectedModel,
    studioModels, studioModelsLoading,
    studioFamilies,
    resolution, setResolution,
    ratio, setRatio,
    referenceImages,
    handleAddReference: (asset, role = "normal") => {
      if (!asset?.url) return;
      return addReference(asset, role, maxRefs);
    },
    handleRemoveReference: removeReference,
    handleClearReferences: clearReferences,
    maxRefs,
    ...upload,
    library: lib.items,
    libraryLoading: lib.loading,
    libraryHasMore: lib.hasMore,
    assetSource: lib.source,
    setAssetSource: lib.setSource,
    handleOpenLibrary: lib.handleOpen,
    handleLoadMoreAssets: lib.handleLoadMore,
    generating,
    handleGenerate,
    selection,
    setSelection,
    clearSelection,
    activeTab,
    setActiveTab,
    camera,
    setCamera,
    lighting,
    setLighting,
    upscaleScale,
    setUpscaleScale,
    projectId,
    activeSessionId,
    editTarget,
    setEditTarget,
    resetEditStore,
  };
}
