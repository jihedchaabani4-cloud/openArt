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
  const metadata = getItemMetadata(targetItem);
  const { isVideo, url } = metadata;

  const workflowSessionId = workflow?.metadata?.sessionId ?? workflow?.session_id ?? null;
  const isSameSession = !activeSessionId || !workflowSessionId || workflowSessionId === activeSessionId;
  const isInProgress = ["processing", "pending", "uploading"].includes(metadata?.status);
  const isUpload = targetItem?.workflowStepId === "upload" || !targetItem?.generationConfig;
  const canUseAsInput = isSameSession && metadata?.status === "completed" && !!url;
  const canReuseSettings = isSameSession && !isInProgress && !isUpload;
  const canEnterEdit = isSameSession && (metadata?.status === "completed" || isInProgress);
  // Delete is allowed cross-session in UI (server enforces auth separately);
  // only block while a job is in progress to avoid race/confusion.
  const canDelete = !isInProgress;
  const isElementSheet = workflow?.workflow_type === "ELEMENT_SHEET";

  const prompt = targetItem?.params?.prompt 
                || targetItem?.mediaMetadata?.requestData?.promptInputs?.[0]?.textInput 
                || workflow.metadata?.displayName 
                || "";

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

    if (isEditPage) {
      const editStore = useEditStore.getState();
      // In edit page, reuse settings might mean setting up the edit bar
      editStore.setPrompt(prompt || config.prompt || params.prompt || "");
      editStore.setModelId(modelName || "nanobana_pro");
      editStore.setRatio(ratioVal);
      editStore.setReferenceImages(refs);

      if (editStore.setQuality) editStore.setQuality(qualityVal || "2K");
      if (editStore.setVideoResolution) editStore.setVideoResolution(videoResVal || "1080p");
      if (editStore.setDuration) editStore.setDuration(durationVal || "5s");
      if (editStore.setMotion) editStore.setMotion(motionVal ?? 50);
      if (editStore.setCount) editStore.setCount(countVal);
    } else {
      const promptStore = usePromptStore.getState();
      // In normal page, reuse settings for the generation bar
      promptStore.setGenerationMode(isVideo ? "keyframe" : "image");
      promptStore.setPrompt(prompt || config.prompt || params.prompt || "");
      promptStore.setModelId(modelName || "nanobana_pro");
      promptStore.setRatio(ratioVal);
      promptStore.setReferenceImages(refs);

      if (promptStore.setQuality) promptStore.setQuality(qualityVal || "2K");
      if (promptStore.setVideoResolution) promptStore.setVideoResolution(videoResVal || "1080p");
      if (promptStore.setDuration) promptStore.setDuration(durationVal || "5s");
      if (promptStore.setMotion) promptStore.setMotion(motionVal ?? 50);
      if (promptStore.setCount) promptStore.setCount(countVal);
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
    const assetId = targetItem?.asset_id || targetItem?.name || targetItem?.id || "";

    if (isEditPage) {
      // If we are in edit page, animate might not be directly supported in the edit bar,
      // but we can add as reference if needed. For now, let's keep it consistent.
    } else {
      const promptStore = usePromptStore.getState();
      promptStore.setGenerationMode("keyframe");
      promptStore.clearReferences();
      promptStore.addReference({
        url,
        asset_id: assetId,
        is_video: false
      }, "start");
    }
  };

  const handleAddToPrompt = () => {
    if (!canUseAsInput) return;
    const assetId = targetItem?.asset_id || targetItem?.name || targetItem?.id || "";
    const asset = { 
      url, 
      asset_id: assetId, 
      is_video: isVideo,
      workflow_type: workflow?.workflow_type
    };
    
    const activeStore = isEditPage ? useEditStore.getState() : usePromptStore.getState();
    activeStore.addReference(asset, "normal");
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
