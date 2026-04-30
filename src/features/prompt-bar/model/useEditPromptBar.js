// src/features/prompt-bar/model/useEditPromptBar.js
import React, { useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useWorkflowsStore } from "@/features/workflows";
import { useEditStore } from "./useEditStore";
import { 
  useProjectData, 
  useGenerateMutation, 
  useExtendVideoMutation,
} from "@/features/workflows/api/workflowsApi";
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
  const params = useParams();
  const {
    selectedProjectId: storeProjectId,
    activeSessionId,
  } = useWorkflowsStore();

  const projectId = params?.projectId || storeProjectId;

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

  const rawModels = projectData?.modelConfig?.models;
  const studioModels = React.useMemo(() => {
    return (rawModels || []).filter(m => m.supportsEdit === true);
  }, [rawModels]);
  const studioFamilies = projectData?.modelConfig?.families ?? [];

  const generationMode = editTarget?.isVideo ? "video" : "image";
  const { model, setModel, selectedModel, maxRefs } = useModelSync(
    studioModels,
    studioModelsLoading,
    generationMode
  );

  // Synchronize local model state with store model state
  useEffect(() => {
    if (model?.id && modelId !== model.id) {
      setModelId(model.id);
    }
  }, [model?.id, modelId, setModelId]);

  const upload = useMediaUpload({
    projectId,
    activeSessionId,
    addReference: (asset, role) => addReference(asset, role, maxRefs),
    referenceImages,
    maxRefs,
    allowedType: "image",
  });

  const textareaRef = useRef(null);

  const { mutateAsync: runGenerate, isPending: generating } = useGenerateMutation({
    onError: (err) => console.error(err.message),
  });

  const { mutateAsync: runExtendVideo, isPending: extendingVideo } = useExtendVideoMutation({
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
              workflow_id:      editTarget?.workflow_id,
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

      if (activeTab === "camera" && editTarget?.isVideo) {
          if (generating) return;
          const payload = {
              prompt:           "", // Always empty as requested
              camera_text:      camera, // Use the selected preset
              model:            model?.id ?? "kling_o3",
              ratio,
              edit_type:        "camera",
              project_id:       projectId,
              session_id:       activeSessionId || editTarget?.session_id,
              workflow_id:      editTarget?.workflow_id,
              video_workflow_id: editTarget?.workflow_id,
              reference_workflow_ids: referenceImages.map(r => r.workflowId || r.workflow_id || r.id || r.asset_id).filter(Boolean),
          };

          try {
              const res = await runGenerate({ payload, isVideo: true, isCamera: true });
              const finalProj = res.project_id ?? projectId;
              const finalSess = res.session_id ?? activeSessionId;
              if (finalProj) {
                  queryClient.invalidateQueries({ queryKey: queryKeys.assets.byProject(finalProj, finalSess) });
                  queryClient.invalidateQueries({ queryKey: queryKeys.generations.byProject(finalProj, finalSess) });
              }
          } catch (err) {
              console.error("❌ Camera edit failed:", err);
          }
          return;
      }

      if (activeTab === "camera" && !editTarget?.isVideo) {
          if (generating) return;
          const cameraState = camera || {};
          const payload = {
              rotation:                cameraState.rotation ?? 0,
              tilt:                    cameraState.tilt    ?? 0,
              zoom:                    cameraState.zoom    ?? 6,
              project_id:       projectId,
              session_id:       activeSessionId || editTarget?.session_id,
              workflow_id:             editTarget?.workflow_id,
              ratio,
              quality:                 resolution,
              model_name:              "gpt-image-2",
              reference_workflow_ids:  referenceImages.map(r => r.workflowId || r.workflow_id || r.id || r.asset_id).filter(Boolean),
          };

          try {
              const res = await runGenerate({ payload, isCamera: true });
              const finalProj = res.project_id ?? projectId;
              const finalSess = res.session_id ?? activeSessionId;
              if (finalProj) {
                  queryClient.invalidateQueries({ queryKey: queryKeys.assets.byProject(finalProj, finalSess) });
                  queryClient.invalidateQueries({ queryKey: queryKeys.generations.byProject(finalProj, finalSess) });
              }
          } catch (err) {
              console.error("❌ Image camera edit failed:", err);
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
        session_id:       activeSessionId || editTarget?.session_id,
        workflow_id:      editTarget?.workflow_id,
        video_workflow_id: editTarget?.workflow_id,
        reference_workflow_ids: referenceImages.map(r => r.workflowId || r.workflow_id || r.id || r.asset_id).filter(Boolean),
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
      prompt, camera, generating, model, resolution, ratio, projectId, activeSessionId,
      referenceImages, editTarget, runGenerate, queryClient, setPrompt,
      activeTab, upscaleScale, selection
    ]
  );

  const handleExtendVideo = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (editTarget?.session_id && activeSessionId && editTarget.session_id !== activeSessionId) return;
      if (editTarget?.media_status && editTarget.media_status !== "completed") return;
      if (!editTarget?.media_id || !editTarget?.workflow_id) return;
      
      if (extendingVideo) return;

      const payload = {
        prompt:           prompt || "extend", // fallback
        model:            model?.id ?? "nanobana_pro",
        model_name:       model?.id ?? "nanobana_pro",
        quality:          resolution,
        ratio,
        num_images:       1,
        edit_type:        "extend",
        section:          "video_generator",
        project_id:       projectId,
        session_id:       activeSessionId,
        workflow_id:       editTarget?.workflow_id,
        video_workflow_id: editTarget?.workflow_id,
      };

      try {
        const res = await runExtendVideo({ payload });
        const finalProj = res.project_id ?? projectId;
        const finalSess = res.session_id ?? activeSessionId;
        
        if (finalProj) {
          queryClient.invalidateQueries({ queryKey: queryKeys.assets.byProject(finalProj, finalSess) });
          queryClient.invalidateQueries({ queryKey: queryKeys.generations.byProject(finalProj, finalSess) });
        }

        setPrompt("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      } catch (err) {
        console.error("❌ Video extend failed:", err);
      }
    },
    [
      prompt, extendingVideo, model, resolution, ratio, projectId, activeSessionId,
      editTarget, runExtendVideo, queryClient, setPrompt
    ]
  );

  // Extract sessions directly from already-loaded projectData
  // Backend schema: { name: "uuid", metadata: { displayName: "human name" } }
  const projectSessions = React.useMemo(() => {
    const raw = projectData?.projectContents?.sessions ?? [];
    return raw.map(s => ({
      session_id:   s.name,
      session_name: s.metadata?.displayName || s.name || "Untitled Session",
    }));
  }, [projectData]);

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
    projectSessions,
    editTarget,
    setEditTarget,
    resetEditStore,
    extendingVideo,
    handleExtendVideo,
  };
}
