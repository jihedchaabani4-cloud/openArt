// src/features/prompt-bar/model/usePromptBar.js
// ✅ Slim orchestrator: composes small hooks, owns generate logic only.

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkflowsStore, useGenerationsStore } from "@/features/workflows";
import { usePromptStore } from "./usePromptStore";
import { useProjectData, useGenerateMutation } from "@/features/workflows/api/workflowsApi";
import { queryKeys } from "@/shared/api/queryKeys";
import { buildReferencesPayload } from "@/shared/lib/referenceUtils";
import { useModelSync } from "./useModelSync";
import { useMediaUpload } from "./useMediaUpload";
import { useMediaLibrary } from "@/features/media/model/useMediaLibrary";

export function usePromptBar({ isNewProject = false } = {}) {
  // ─── Global store (Project context) ─────────────────────────────────────────
  const {
    selectedProjectId: projectId,
    activeSessionId,
    setActiveSessionId,
  } = useWorkflowsStore();

  // ─── Prompt Bar Store (Independent) ────────────────────────────────────────
  const {
    prompt,
    setPrompt,
    generationMode,
    setGenerationMode,
    modelId,
    setModelId,
    ratio,
    setRatio,
    quality: resolution,
    setQuality: setResolution,
    count,
    setCount,
    duration,
    setDuration,
    videoResolution,
    setVideoResolution,
    referenceImages,
    addReference,
    removeReference,
    clearReferences,
    setReferenceImages,
    swapFrames,
    popoverOpen,
    setPopoverOpen,
    togglePopover,
    motion,
    setMotion,
  } = usePromptStore();

  const queryClient = useQueryClient();

  // ─── Remote data ──────────────────────────────────────────────────────────
  const lib = useMediaLibrary(projectId);

  // Fetch everything from the unified endpoint
  const { data: projectData, isLoading: studioModelsLoading } = useProjectData(projectId);

  const studioModels = useMemo(
    () => projectData?.modelConfig?.models ?? [],
    [projectData?.modelConfig?.models]
  );
  const studioFamilies = useMemo(
    () => projectData?.modelConfig?.families ?? [],
    [projectData?.modelConfig?.families]
  );

  // ─── Model sync (extracted hook) ──────────────────────────────────────────
  const { model, setModel, selectedModel, maxRefs } = useModelSync(
    studioModels,
    studioModelsLoading,
    generationMode,
    modelId
  );

  // Synchronize local model state with store model state
  useEffect(() => {
    if (model?.id && modelId !== model.id) {
      setModelId(model.id);
    }
  }, [model?.id, modelId, setModelId]);

  // ─── Upload + drag-drop (extracted hook) ──────────────────────────────────
  const upload = useMediaUpload({
    projectId,
    activeSessionId,
    addReference,
    referenceImages,
    maxRefs,
  });

  // ─── Local UI state (Error only) ───────────────────────────────────────────
  const [generationError, setGenerationError] = useState(null);
  const textareaRef = useRef(null);

  const { mutateAsync: runGenerate, isPending: generating } = useGenerateMutation({
    onError: (err) => setGenerationError(err.message),
  });

  // ─── Sync ratio/resolution & Prune References when model changes ─────────
  useEffect(() => {
    if (!selectedModel) return;
    const support = selectedModel.support || {};
    
    // 1. Prune references if they exceed the new model's max allowed
    // Note: maxRefs is properly overridden for motion models in useModelSync
    if (referenceImages.length > maxRefs) {
      setReferenceImages(referenceImages.slice(0, maxRefs));
    }

    // 2. Sync ratio and resolution
    const extractVal = (raw) => {
      if (Array.isArray(raw)) {
        const first = raw[0];
        return (first && typeof first === 'object') ? first.value : first;
      }
      return raw?.default ?? null;
    };

    const extractOptions = (raw) => {
      if (!raw) return [];
      if (Array.isArray(raw)) {
        return raw.map((item) => (typeof item === "object" ? item.value : item)).filter(Boolean);
      }
      if (Array.isArray(raw.items)) {
        return raw.items.map((item) => (typeof item === "object" ? item.value : item)).filter(Boolean);
      }
      if (Array.isArray(raw.options)) {
        return raw.options.map((item) => (typeof item === "object" ? item.value : item)).filter(Boolean);
      }
      return [];
    };

    const defRatio = extractVal(support.ratio) ?? "1:1";
    const defQual  = extractVal(support.quality) ?? "2K";
    const defVid   = extractVal(support.resolution) ?? "1080p";

    const ratioOptions = extractOptions(support.ratio);
    const qualityOptions = extractOptions(support.quality);
    const videoResolutionOptions = extractOptions(support.resolution);

    const nextRatio = ratioOptions.includes(ratio) ? ratio : defRatio;
    const nextResolution = qualityOptions.includes(resolution) ? resolution : defQual;
    const nextVideoResolution = videoResolutionOptions.includes(videoResolution) ? videoResolution : defVid;

    if (nextRatio !== ratio) {
      setRatio(nextRatio);
    }
    if (nextResolution !== resolution) {
      setResolution(nextResolution);
    }
    if (nextVideoResolution !== videoResolution) {
      setVideoResolution(nextVideoResolution);
    }
  }, [
    referenceImages,
    ratio,
    resolution,
    selectedModel,
    selectedModel?.key,
    setRatio,
    setReferenceImages,
    setResolution,
    setVideoResolution,
    videoResolution,
    maxRefs,
  ]);

  // ─── Library ──────────────────────────────────────────────────────────────
  const library = lib.items;

  // ─── Reset ────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPrompt("");
    const defaultModel = studioModels[0];
    if (defaultModel) {
      setModel({ id: defaultModel.key });
      setResolution(defaultModel.support?.quality?.default ?? "2K");
      setRatio(defaultModel.support?.ratio?.default        ?? "1:1");
    }
    setCount(1);
    setDuration("5s");
    setVideoResolution("1080p");
    setReferenceImages([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [
    setCount,
    setDuration,
    setModel,
    setPrompt,
    setRatio,
    setReferenceImages,
    setResolution,
    setVideoResolution,
    studioModels,
  ]);

  // ─── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (!prompt.trim() || generating) return;

      setGenerationError(null);
      const isVideo = generationMode !== "image";

      const payload = {
        prompt,
        model:            model?.id ?? "nanobana_pro",
        model_name:       model?.id ?? "nanobana_pro",
        quality:          resolution,
        ratio,
        num_images:       count,
        duration,
        video_resolution: videoResolution,
        section:          (generationMode === "motion" || generationMode === "motion-control") ? "motion" : (isVideo ? "video_studio" : "image_generator"),
        project_id:       isNewProject ? null : projectId,
        session_id:       isNewProject ? null : activeSessionId,
        references:       buildReferencesPayload(referenceImages),
      };

      console.log("🚀 [usePromptBar] Sending Generation Payload:", payload);

      try {
        const res = await runGenerate({ payload, isVideo });

        if (res.project_id && res.session_id) {
          if (!projectId || projectId !== res.project_id) {
            useGenerationsStore.getState().setSelectedProjectId(res.project_id);
          }
          if (!activeSessionId || activeSessionId !== res.session_id) {
            setActiveSessionId(res.session_id);
          }
          if (isNewProject && window.location.pathname.includes("/project/new")) {
            window.location.href = `/projects/${res.project_id}`;
          }
        }

        const finalProj = res.project_id ?? projectId;
        const finalSess = res.session_id  ?? activeSessionId;
        if (finalProj) {
          queryClient.invalidateQueries({ queryKey: queryKeys.assets.byProject(finalProj, finalSess) });
          queryClient.invalidateQueries({ queryKey: queryKeys.generations.byProject(finalProj, finalSess) });
        }

        setPrompt("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      } catch {
        // Error is set via onError callback in useGenerateMutation
      }
    },
    [
      prompt, generating, generationMode, model, resolution, ratio, count,
      duration, videoResolution, isNewProject, projectId, activeSessionId,
      referenceImages, runGenerate, setActiveSessionId, queryClient, setPrompt,
    ]
  );

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    // Prompt
    prompt,       setPrompt,
    textareaRef,
    hasChanges:   prompt.trim().length > 0 || referenceImages.length > 0,

    // Model
    model,        setModel,
    selectedModel,
    studioModels, studioModelsLoading,
    studioFamilies,

    // Generation params
    resolution,     setResolution,
    ratio,          setRatio,
    count,          setCount,
    duration,       setDuration,
    videoResolution, setVideoResolution,
    generationMode, setGenerationMode,
    motion,         setMotion,

    // References
    referenceImages,
    handleAddReference:   (asset, role = "normal") => {
      if (!asset?.url) return;
      return addReference(asset, role, maxRefs);
    },
    handleRemoveReference: removeReference,
    handleClearReferences: clearReferences,
    handleSwapFrames:      swapFrames,
    maxRefs,

    // Upload / drag-drop (delegated)
    ...upload,

    // Library (project-level assets only)
    library,
    libraryLoading: lib.loading,
    libraryHasMore: lib.hasMore,
    assetSource: lib.source,    
    setAssetSource: lib.setSource,
    assetMode: lib.mediaType,      
    setAssetMode: lib.setMediaType,
    handleOpenLibrary: lib.handleOpen,
    handleLoadMoreAssets: lib.handleLoadMore,

    // Popover
    popoverOpen,
    togglePopover,
    closePopover: () => setPopoverOpen(false),

    // Generation
    generating,
    generationError,
    clearGenerationError: () => setGenerationError(null),
    handleGenerate,

    // Session
    projectId,
    activeSessionId,
    handleReset,
  };
}
