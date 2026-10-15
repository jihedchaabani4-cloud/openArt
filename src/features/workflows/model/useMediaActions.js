import { useWorkflowsStore } from "./useWorkflowsStore";
import { useToggleWorkflowLike, useRemoveWorkflow } from "../api/workflowsApi";
import { getItemMetadata, getPrimaryMedia, getPrimaryMediaConfig, getGenerationConfig } from "@/shared/lib/generationUtils";
import { downloadFile } from "@/shared/lib/utils";
import { useRemoveAsset } from "@/features/media/api/mediaApi";
import { usePathname, useRouter } from "next/navigation";
import { useElementStore } from "@/features/prompt-bar/model/useElementStore";
import { buildElementSheetDraft, syncElementDraft } from "./elementSheetConfig";
import { canAnyModelAcceptEntity } from "@/features/studio";
import { promptBarService } from "@/features/prompt-bar/api/promptBarService";
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

  const { mutate: toggleLike } = useToggleWorkflowLike();
  const { mutate: removeWorkflow } = useRemoveWorkflow();
  const { mutate: removeAsset } = useRemoveAsset();

  // If item is provided, use it (or resolve by id if it's a mediaId string). Otherwise, use the primary item of the workflow.
  const effectiveMediaId = typeof item === "string" ? item : (item?.id || item?.name || item?.asset_id);
  const targetItem = (typeof item === "object" && item !== null)
    ? item
    : (workflow?.items?.find((i) => (i.id || i.name || i.asset_id) === effectiveMediaId) || (effectiveMediaId ? { id: effectiveMediaId } : null) || getPrimaryMedia(workflow));
  // When there's no media yet (placeholder workflow), treat as processing so the
  // UI shows a spinner rather than a blank or disappearing card.
  const metadata = targetItem 
    ? getItemMetadata(targetItem, workflow)
    : { status: 'processing', url: null, isVideo: false, isAudio: false, aspect: '1/1', ratioStr: null, prompt: '' };
  const { isVideo, url } = metadata;

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
  const canUseAsInput = metadata?.status === "completed" && !!url;
  const canReuseSettings = !isInProgress && !isUpload;
  const canEnterEdit = metadata?.status === "completed" || isInProgress;
  // Delete is allowed in UI (server enforces auth separately);
  // only block while a job is in progress to avoid race/confusion.
  const canDelete = !isInProgress;
  const isElementSheet = workflow?.workflow_type === "ELEMENT_SHEET";
  const isCharacter = workflow?.workflow_type === "CHARACTER_SHEET" || Boolean(workflow?.is_character) || workflow?.entity_type === "character";
  const projectId = workflow?.projectId || workflow?.project_id;
  const { data: modelsData } = useRealBackendModels({ projectId });
  const models = modelsData?.models || [];

  const isEntity = isElementSheet || isCharacter;
  const canAcceptEntity = isEntity ? canAnyModelAcceptEntity(workflow || targetItem, models) : true;
  const canAddToPrompt = canUseAsInput && canAcceptEntity && !isVideo;

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
      syncElementDraft(draft, {
        elementStore,
        projectId,
      });
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

    const service = promptBarService({
      templateId: "generated-media",
      projectId: projectId || "global",
    });

    service.applyGeneration({
      mode: isVideo ? "video" : "image",
      subMode: "frames",
      modelId: modelName,
      prompt: effectivePrompt,
      parameters: {
        ratio: ratioVal,
        aspect_ratio: ratioVal,
        quality: qualityVal,
        videoResolution: videoResVal,
        duration: durationVal,
        motion: motionVal,
        count: countVal,
      },
    });

    service.focus();
  };

  const handleEdit = () => {
    if (!canEnterEdit) return;
    const assetId = targetItem?.asset_id || targetItem?.name || targetItem?.id || "";

    // Redirect to edit page
    const projectId = workflow.projectId || workflow.project_id;
    if (projectId) {
      router.push(`/projects/${projectId}/generations/edit/${assetId}`);
    }
  };

  const handleAnimate = () => {
    if (!canUseAsInput) return;
    const media = targetItem || workflow;
    const service = promptBarService({
      templateId: "generated-media",
      projectId: projectId || "global",
    });

    const res = service.animateMedia(media);
    if (!res.ok) {
      if (
        projectId &&
        !pathname?.includes("/assets") &&
        !pathname?.includes("/generations") &&
        !pathname?.includes("/collection")
      ) {
        router.push(`/cinema-studio/${projectId}/assets`);
        return;
      }
    }

    service.focus();
  };

  const handleAddToPrompt = () => {
    if (!canAddToPrompt) return;
    const media = targetItem || workflow;
    const service = promptBarService({
      templateId: "generated-media",
      projectId: projectId || "global",
    });

    const res = service.addReference(media);
    if (!res.ok) {
      if (
        projectId &&
        !pathname?.includes("/assets") &&
        !pathname?.includes("/generations")
      ) {
        router.push(`/cinema-studio/${projectId}/assets`);
        return;
      }
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
    isLiked: Boolean(
      workflow?.metadata?.favorited ||
      workflow?.favorited ||
      workflow?.is_liked ||
      targetItem?.is_liked ||
      targetItem?.favorited
    ),
    isElementSheet,
    item: targetItem, // return the resolved item
  };
}
