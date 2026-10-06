import { useWorkflowsStore } from "./useWorkflowsStore";
import { useToggleWorkflowLike, useRemoveWorkflow } from "../api/workflowsApi";
import { getItemMetadata, getPrimaryMedia, getPrimaryMediaConfig, getGenerationConfig } from "@/shared/lib/generationUtils";
import { downloadFile } from "@/shared/lib/utils";
import { useRemoveAsset } from "@/features/media/api/mediaApi";
import { usePathname, useRouter } from "next/navigation";

import { useEditStore } from "@/features/prompt-bar/model/useEditStore";
import { useElementStore } from "@/features/prompt-bar/model/useElementStore";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";
import { buildElementSheetDraft } from "./elementSheetConfig";
import {
  addMediaToPrompt,
  animateMedia,
  setPendingPromptAction,
  canAnyModelAcceptEntity,
  getActivePromptBarStore,
} from "@/features/studio";
import { useRealBackendModels } from "@/features/prompt-bar/core/useRealBackendModels";

/**
 * useWorkflowActions
 * Centralized hook for actions performed on a Workflow or a specific Media Item.
 * @param {Object} workflow - The parent workflow object.
 * @param {Object} item - (Optional) Specific media item to perform actions on. 
 *                        If not provided, defaults to the workflow's primary media.
 */
export function useWorkflowActions(workflow, item = null) {
  const pathname = usePathname();
  const router = useRouter();
  const isEditPage =
    pathname?.includes("/generations/edit/") ||
    pathname?.includes("/elements/edit/");

  const { 
    activeSessionId,
  } = useWorkflowsStore();

  const { mutate: toggleLike } = useToggleWorkflowLike();
  const { mutate: removeWorkflow } = useRemoveWorkflow();
  const { mutate: removeAsset } = useRemoveAsset();

  // If item is provided, use it. Otherwise, use the primary item of the workflow.
  const targetItem = item || getPrimaryMedia(workflow);
  // When there's no media yet (placeholder workflow), treat as processing so the
  // UI shows a spinner rather than a blank or disappearing card.
  const metadata = targetItem 
    ? getItemMetadata(targetItem)
    : { status: 'processing', url: null, isVideo: false, isAudio: false, aspect: '1/1', ratioStr: null, prompt: '' };
  const { isVideo, url } = metadata;

  const workflowSessionId = workflow?.metadata?.sessionId ?? workflow?.session_id ?? null;
  const isSameSession = !activeSessionId || !workflowSessionId || workflowSessionId === activeSessionId;
  const isInProgress = ["processing", "pending", "uploading"].includes(metadata?.status);
  const isFailed = ["failed", "rejected", "error"].includes(metadata?.status);

  const prompt = targetItem?.params?.prompt 
                || targetItem?.prompt
                || targetItem?.mediaMetadata?.requestData?.promptInputs?.[0]?.textInput 
                || workflow?.prompt
                || workflow?.metadata?.prompt
                || workflow?.metadata?.generationConfig?.prompt
                || targetItem?.generationConfig?.prompt
                || workflow?.display_name
                || workflow?.metadata?.displayName 
                || "";

  const isUpload = targetItem?.workflowStepId === "upload" || (!isFailed && !targetItem?.generationConfig && !workflow?.metadata?.generationConfig && !prompt);
  const canUseAsInput = isSameSession && metadata?.status === "completed" && !!url;
  const canReuseSettings = !isInProgress && !isUpload;
  const canEnterEdit = isSameSession && (metadata?.status === "completed" || isInProgress);
  // Delete is allowed cross-session in UI (server enforces auth separately);
  // only block while a job is in progress to avoid race/confusion.
  const canDelete = !isInProgress;
  const isElementSheet = workflow?.workflow_type === "ELEMENT_SHEET";
  const isCharacter = workflow?.workflow_type === "CHARACTER_SHEET" || Boolean(workflow?.is_character) || workflow?.entity_type === "character";
  const projectId = workflow?.projectId || workflow?.project_id;
  const { data: modelsData } = useRealBackendModels({ projectId });
  const models = modelsData?.models || [];

  const isEntity = isElementSheet || isCharacter;
  const canAcceptEntity = isEntity ? canAnyModelAcceptEntity(workflow || targetItem, models) : true;
  const canAddToPrompt = canUseAsInput && canAcceptEntity;

  const handleLike = () => {
    if (workflow.id || workflow.name) {
      toggleLike({ 
        workflowId: workflow.id || workflow.name,
        projectId: workflow.projectId || workflow.project_id
      });
    }
  };

  const handleDelete = () => {
    if (!canDelete) return;
    const projectId = workflow.projectId || workflow.project_id;
    if (item) {
      removeAsset({ assetId: item.name || item.id, projectId });
    } else {
      removeWorkflow({ workflowId: workflow.name || workflow.id, projectId });
    }
  };

  const handleDownload = () => {
    downloadFile(url, isVideo ? "video.mp4" : "image.png");
  };

  const handleReuseSettings = () => {
    if (!canReuseSettings) return;

    if (isElementSheet) {
      const draft = buildElementSheetDraft(workflow, targetItem);
      if (!draft) return;

      const elementStore = useElementStore.getState();
      const promptStore = usePromptStore.getState();
      const editStore = useEditStore.getState();

      elementStore.hydrateElementDraft({
        mode: draft.mode,
        prompt: draft.prompt,
        references: draft.references,
        features: draft.features,
      });

      promptStore.setGenerationMode(draft.isVideo ? "keyframe" : "image");
      if (draft.promptConfig.model) promptStore.setModelId(draft.promptConfig.model);
      if (draft.promptConfig.ratio) promptStore.setRatio(draft.promptConfig.ratio);
      if (draft.promptConfig.quality) promptStore.setQuality(draft.promptConfig.quality);
      if (draft.promptConfig.videoResolution) {
        promptStore.setVideoResolution(draft.promptConfig.videoResolution);
      }

      if (isEditPage) {
        editStore.setEditTarget({
          workflow_id: draft.workflowId,
          workflow_type: draft.workflowType,
          media_id: draft.mediaId,
          primaryMediaId: draft.primaryMediaId,
          primaryMediaUrl: draft.primaryMediaUrl,
          url: draft.url,
          dna: draft.dna,
          elementMode: draft.mode,
          isElementSheet: true,
          isVideo: draft.isVideo,
          prompt: draft.prompt,
          ratio: draft.promptConfig.ratio,
          quality: draft.promptConfig.quality,
          videoResolution: draft.promptConfig.videoResolution,
        });
      }
      return;
    }

    const config = getGenerationConfig(targetItem, workflow) || {};
    const params = targetItem?.params || {};
    const modelName = config.model_name || config.model || params.model_name || params.model || "";
    
    // Extract other settings from both config and params
    const ratioVal = config.ratio || config.aspectRatio || config.aspect_ratio || params.ratio || params.aspectRatio || params.aspect_ratio || "1:1";
    const qualityVal = config.quality || params.quality;
    const videoResVal = config.videoResolution || params.videoResolution;
    const durationVal = config.duration || params.duration;
    const motionVal = config.motion || params.motion;
    const countVal = config.count || params.count || params.num_images || 1;
    
    const refs = (config.references || []).map(r => ({
      ...r,
      type: r.url?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image"
    }));

    const effectivePrompt = prompt || config.prompt || params.prompt || targetItem?.prompt || workflow?.prompt || "";

    if (isEditPage) {
      const editStore = useEditStore.getState();
      // In edit page, reuse settings might mean setting up the edit bar
      editStore.setPrompt(effectivePrompt);
      editStore.setModelId(modelName || "nanobana_pro");
      editStore.setRatio(ratioVal);
      editStore.setReferenceImages(refs);

      if (editStore.setQuality) editStore.setQuality(qualityVal || "2K");
      if (editStore.setVideoResolution) editStore.setVideoResolution(videoResVal || "1080p");
      if (editStore.setDuration) editStore.setDuration(durationVal || "5s");
      if (editStore.setMotion) editStore.setMotion(motionVal ?? 50);
      if (editStore.setCount) editStore.setCount(countVal);
    } else {
      // 1. Sync with Platform PromptBar store (if active on screen)
      const activeBarStore = getActivePromptBarStore();
      if (activeBarStore) {
        const barState = activeBarStore.getState();
        if (effectivePrompt && barState.setPrompt) {
          barState.setPrompt(effectivePrompt);
        }
        if (modelName && barState.selectModel) {
          barState.selectModel(modelName);
        }
        if (ratioVal && barState.setParameter) {
          barState.setParameter("ratio", ratioVal);
          barState.setParameter("aspect_ratio", ratioVal);
        }
        if (barState.setActiveMode) {
          barState.setActiveMode(isVideo ? "video" : "image");
        }
      }

      // 2. Sync with Legacy / Global Prompt store
      const promptStore = usePromptStore.getState();
      promptStore.setGenerationMode(isVideo ? "keyframe" : "image");
      if (effectivePrompt) promptStore.setPrompt(effectivePrompt);
      if (modelName) promptStore.setModelId(modelName);
      if (ratioVal) promptStore.setRatio(ratioVal);
      if (refs.length) promptStore.setReferenceImages(refs);

      if (promptStore.setQuality) promptStore.setQuality(qualityVal || "2K");
      if (promptStore.setVideoResolution) promptStore.setVideoResolution(videoResVal || "1080p");
      if (promptStore.setDuration) promptStore.setDuration(durationVal || "5s");
      if (promptStore.setMotion) promptStore.setMotion(motionVal ?? 50);
      if (promptStore.setCount) promptStore.setCount(countVal);

      // 3. Smooth scroll and focus on prompt bar input for instant visual feedback
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          const editor = document.querySelector('[contenteditable="true"]') || document.querySelector('textarea[name="prompt"]');
          if (editor) {
            editor.focus();
            editor.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
      }
    }
  };

  const handleEdit = () => {
    if (!canEnterEdit) return;
    const config = (targetItem?.generationConfig) || getPrimaryMediaConfig(workflow) || {};
    const modelName = config.model_name || config.model || "";
    const assetId = targetItem?.asset_id || targetItem?.name || targetItem?.id || "";

    const editStore = useEditStore.getState();

    // Set edit target
    editStore.setEditTarget({ 
      workflow_id: workflow.id || workflow.name,
      media_id:    assetId,
      prompt:      prompt || config.prompt || "",
      model_name:  modelName,
      ratio:       config.ratio || config.aspectRatio || "",
    });
    
    // Redirect to edit page
    const projectId = workflow.projectId || workflow.project_id;
    if (projectId) {
      router.push(`/projects/${projectId}/generations/edit/${assetId}`);
    }
  };

  const handleAnimate = () => {
    if (!canUseAsInput) return;
    const media = targetItem || workflow;
    const handled = animateMedia({ media });
    if (!handled) {
      if (projectId && !pathname?.includes("/generations")) {
        setPendingPromptAction({ type: "animate", media, projectId });
        router.push(`/cinema-studio/${projectId}/generations`);
        return;
      }
      const assetId = targetItem?.asset_id || targetItem?.name || targetItem?.id || "";
      if (!isEditPage) {
        const promptStore = usePromptStore.getState();
        promptStore.setGenerationMode("keyframe");
        promptStore.clearReferences();
        const workflowId = workflow?.id || targetItem?.workflow_id || targetItem?.workflowId || null;
        promptStore.addReference({
          url,
          workflow_id: workflowId,
          asset_id: workflowId || assetId,
          id: workflowId || assetId,
          is_video: false
        }, "start");
      }
    }
  };

  const handleAddToPrompt = () => {
    if (!canAddToPrompt) return;
    const media = targetItem || workflow;
    const handled = addMediaToPrompt({ media });
    if (!handled) {
      if (projectId && !pathname?.includes("/generations")) {
        setPendingPromptAction({ type: "add_reference", media, projectId });
        router.push(`/cinema-studio/${projectId}/generations`);
        return;
      }
      const workflowId = workflow?.id || targetItem?.workflow_id || targetItem?.workflowId || null;
      const assetId = targetItem?.asset_id || targetItem?.name || targetItem?.id || "";
      const asset = { 
        url,
        workflow_id: workflowId,
        asset_id: workflowId || assetId,
        id: workflowId || assetId,
        is_video: isVideo,
        workflow_type: workflow?.workflow_type
      };
      
      const activeStore = isEditPage ? useEditStore.getState() : usePromptStore.getState();
      activeStore.addReference(asset, "normal");
    }
  };

  const handleSetParameters = () => {
    handleReuseSettings();
  };

  return {
    handleLike,
    handleDelete,
    handleDownload,
    handleReuseSettings,
    handleEdit,
    handleAnimate,
    handleAddToPrompt,
    handleSetParameters,
    canDelete,
    canReuseSettings,
    canAddToPrompt,
    isVideo,
    url,
    aspect: metadata.aspect,
    status: metadata.status,
    prompt,
    isLiked: workflow.metadata?.favorited || false,
    isElementSheet,
    item: targetItem, // return the resolved item
  };
}
