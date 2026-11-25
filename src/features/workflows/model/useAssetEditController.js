"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFilteredWorkflows } from "@/features/workflows/model/useFilteredWorkflows";
import { useProjectFolders } from "@/features/folders";
import { resolveEditNavbarBackDestination } from "@/components/layout/EditNavbar";
import { getItemMetadata } from "@/shared/lib/generationUtils";
import {
  filterWorkflowsByFolderScope,
  getWorkflowFolderId,
} from "@/shared/lib/displayUtils";
import { downloadFile } from "@/shared/lib/utils";
import { resolveMainMedia } from "@/features/workflows/core/resolveMediaRef";
import {
  useDeleteMedia,
  useDetachMedia,
  useImageAnglesEdit,
  useImageRelightEdit,
  useImageRemoveBackgroundEdit,
  useRemoveBackgroundModels,
  useSetPrimaryMedia,
  useUpdateWorkflow,
} from "@/features/workflows/api/workflowsApi";
import {
  getMediaItemId,
  getWorkflowId,
  isWorkflowTrashed,
  resolveActiveWorkflowItem,
  resolveEditPreviewUrl,
  resolveWorkflowDisplayTitle,
} from "@/features/workflows/lib/assetEditHelpers";

export function useAssetEditController({
  projectId,
  routeWorkflowId,
  queryCollectionId,
}) {
  const router = useRouter();

  const [activeWorkflowId, setActiveWorkflowId] = React.useState(routeWorkflowId);
  const workflowId = activeWorkflowId || routeWorkflowId;

  const setPrimaryMediaMutation = useSetPrimaryMedia();
  const { mutateAsync: updateWorkflow } = useUpdateWorkflow();
  const { mutateAsync: deleteMedia } = useDeleteMedia();
  const { mutateAsync: detachMedia } = useDetachMedia();

  const imageAnglesMutation = useImageAnglesEdit({
    onError: (err) => {
      toast.error(err?.message || "Failed to adjust camera angle.");
    },
  });
  const imageRelightMutation = useImageRelightEdit({
    onError: (err) => {
      toast.error(err?.message || "Failed to relight image.");
    },
  });
  const imageRemoveBackgroundMutation = useImageRemoveBackgroundEdit({
    onError: (err) => {
      toast.error(err?.message || "Failed to remove background.");
    },
  });

  // Find workflow in the project cache
  const { data: fetchResult, isLoading } = useFilteredWorkflows(projectId);
  const { data: rawFolders = [] } = useProjectFolders(projectId);

  const folders = React.useMemo(() => {
    if (Array.isArray(rawFolders)) return rawFolders;
    if (Array.isArray(rawFolders?.items)) return rawFolders.items;
    return [];
  }, [rawFolders]);

  const allWorkflows = React.useMemo(
    () => fetchResult?.filteredWorkflows || [],
    [fetchResult?.filteredWorkflows]
  );
  const workflow = React.useMemo(
    () => allWorkflows.find((w) => getWorkflowId(w) === workflowId) || null,
    [allWorkflows, workflowId]
  );
  const activeFolderId = React.useMemo(
    () => (workflow ? getWorkflowFolderId(workflow) : queryCollectionId || null),
    [workflow, queryCollectionId]
  );
  const workflows = React.useMemo(
    () => filterWorkflowsByFolderScope(allWorkflows, workflow, queryCollectionId),
    [allWorkflows, workflow, queryCollectionId]
  );
  const currentWorkflowIndex = React.useMemo(
    () => workflows.findIndex((w) => getWorkflowId(w) === workflowId),
    [workflows, workflowId]
  );

  const { destination: backDestination, label: backLabel } = React.useMemo(
    () =>
      resolveEditNavbarBackDestination({
        workflow,
        queryCollectionId,
        projectId,
        folders,
      }),
    [workflow, queryCollectionId, projectId, folders]
  );

  // Redirect back to collection or assets if workflow is not found after loading
  React.useEffect(() => {
    if (!isLoading && !workflow && allWorkflows.length > 0) {
      router.replace(backDestination);
    }
  }, [isLoading, workflow, allWorkflows.length, router, backDestination]);

  const [selectedItemId, setSelectedItemId] = React.useState(null);
  const [activeEditTool, setActiveEditTool] = React.useState(null); // null | "angles" | "relight" | "remove-background"
  const [isCreditsModalOpen, setIsCreditsModalOpen] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Sync activeWorkflowId only when routeWorkflowId itself changes externally (e.g. browser back/forward)
  const lastRouteWorkflowIdRef = React.useRef(routeWorkflowId);
  React.useEffect(() => {
    if (!routeWorkflowId || routeWorkflowId === lastRouteWorkflowIdRef.current) return;
    lastRouteWorkflowIdRef.current = routeWorkflowId;
    if (routeWorkflowId === activeWorkflowId) return;
    setActiveWorkflowId(routeWorkflowId);
    setSelectedItemId(null);
    setActiveEditTool(null);
  }, [routeWorkflowId, activeWorkflowId]);

  const resolvedPrimary = React.useMemo(
    () => (workflow ? resolveMainMedia(workflow) : null),
    [workflow]
  );

  // Derive fresh activeItem from Project Cache so processing -> ready updates live
  const activeItem = React.useMemo(
    () => resolveActiveWorkflowItem(workflow, selectedItemId, resolvedPrimary),
    [workflow, selectedItemId, resolvedPrimary]
  );

  const isVideoWorkflow = resolvedPrimary?.kind === "video";
  const isTrashedWorkflow = isWorkflowTrashed(workflow);
  const canEditImage = Boolean(workflow && !isVideoWorkflow && !isTrashedWorkflow);

  const { models: removeBackgroundModels, isLoading: isLoadingRemoveBgModels } =
    useRemoveBackgroundModels({
      projectModels: fetchResult?.modelConfig?.models,
      enabled: canEditImage && activeEditTool === "remove-background",
    });

  const activeMeta = React.useMemo(
    () => (activeItem && workflow ? getItemMetadata(activeItem, workflow) : null),
    [activeItem, workflow]
  );

  const isPrimaryProcessing =
    resolvedPrimary?.status === "processing" ||
    activeMeta?.status === "processing" ||
    activeMeta?.status === "pending";

  const editPreviewUrl = React.useMemo(
    () => resolveEditPreviewUrl({ activeMeta, resolvedPrimary, workflow }),
    [activeMeta, resolvedPrimary, workflow]
  );

  const displayTitle = resolveWorkflowDisplayTitle(workflow);

  const navigateToWorkflow = React.useCallback(
    (targetWf) => {
      const targetId = getWorkflowId(targetWf);
      if (!targetId || targetId === workflowId) return;

      setActiveWorkflowId(targetId);
      setSelectedItemId(null);
      setActiveEditTool(null);

      const effectiveCollectionId = activeFolderId || queryCollectionId;
      const suffix = effectiveCollectionId
        ? `?collectionId=${encodeURIComponent(effectiveCollectionId)}`
        : "";
      const nextUrl = `/cinema-studio/${projectId}/assets/edit/${targetId}${suffix}`;
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", nextUrl);
      }
    },
    [projectId, workflowId, activeFolderId, queryCollectionId]
  );

  const handleEditResponse = React.useCallback(
    (res, fallbackSuccessMsg, fallbackCreditsMsg) => {
      if (res?.needsCredits) {
        toast.error(res.message || fallbackCreditsMsg);
        setIsCreditsModalOpen(true);
        return;
      }
      if (res?.mediaId) {
        setSelectedItemId(res.mediaId);
      }
      toast.success(res?.message || fallbackSuccessMsg);
    },
    []
  );

  const handleGenerateAngles = React.useCallback(
    async ({ rotation, tilt, zoom, parameters }) => {
      const currentWfId = getWorkflowId(workflow);
      if (!currentWfId) return;
      try {
        const res = await imageAnglesMutation.mutateAsync({
          workflowId: currentWfId,
          projectId,
          rotation,
          tilt,
          zoom,
          parameters,
        });
        handleEditResponse(
          res,
          "Image angle adjustment started.",
          "Insufficient credits to adjust camera angle."
        );
      } catch {
        // Error toast already handled by useImageAnglesEdit onError callback
      }
    },
    [workflow, projectId, imageAnglesMutation, handleEditResponse]
  );

  const handleGenerateRelight = React.useCallback(
    async ({ light_type, brightness, color, size, rotation, tilt, distance, parameters }) => {
      const currentWfId = getWorkflowId(workflow);
      if (!currentWfId) return;
      try {
        const res = await imageRelightMutation.mutateAsync({
          workflowId: currentWfId,
          projectId,
          light_type,
          brightness,
          color,
          size,
          rotation,
          tilt,
          distance,
          parameters,
        });
        handleEditResponse(
          res,
          "Image relight started.",
          "Insufficient credits to relight image."
        );
      } catch {
        // Error toast already handled by useImageRelightEdit onError callback
      }
    },
    [workflow, projectId, imageRelightMutation, handleEditResponse]
  );

  const handleGenerateRemoveBackground = React.useCallback(
    async ({ model, modelSchema, prompt, preserve_alpha, parameters }) => {
      const currentWfId = getWorkflowId(workflow);
      if (!currentWfId) return;
      try {
        const res = await imageRemoveBackgroundMutation.mutateAsync({
          workflowId: currentWfId,
          projectId,
          model,
          modelSchema,
          prompt,
          preserve_alpha,
          parameters,
        });
        handleEditResponse(
          res,
          "Background removal started.",
          "Insufficient credits to remove background."
        );
      } catch {
        // Error toast already handled by useImageRemoveBackgroundEdit onError callback
      }
    },
    [workflow, projectId, imageRemoveBackgroundMutation, handleEditResponse]
  );

  const handleSelectVersion = React.useCallback(
    (item) => {
      const meta = getItemMetadata(item, workflow);
      if (!meta?.url && meta?.status !== "processing") return;
      const mediaId = getMediaItemId(item);
      setSelectedItemId(mediaId);
      const currentWfId = getWorkflowId(workflow);
      if (mediaId && currentWfId) {
        setPrimaryMediaMutation.mutate({
          workflowId: currentWfId,
          mediaId,
          projectId,
        });
      }
    },
    [workflow, projectId, setPrimaryMediaMutation]
  );

  const handleDownloadActive = React.useCallback(async () => {
    const url = activeMeta?.url;
    if (!url || isDownloading) return;
    setIsDownloading(true);
    try {
      const ext = url.split("?")[0].split(".").pop() || "png";
      const id = getMediaItemId(activeItem) || getWorkflowId(workflow) || "asset";
      await downloadFile(url, `generation-${id}.${ext}`);
    } finally {
      setIsDownloading(false);
    }
  }, [activeMeta?.url, activeItem, workflow, isDownloading]);

  const handleRenameWorkflow = React.useCallback(
    (nextName) => {
      const currentWfId = getWorkflowId(workflow);
      if (!currentWfId) return;
      updateWorkflow({
        workflowId: currentWfId,
        workflowData: { display_name: nextName },
        projectId,
      });
    },
    [workflow, projectId, updateWorkflow]
  );

  const handleDeleteVersion = React.useCallback(
    async (mediaId) => {
      if (!mediaId) return;
      await deleteMedia({ mediaId, projectId });
      if ((workflow?.items?.length || 0) <= 1) {
        router.push(backDestination);
      } else {
        setSelectedItemId(null);
      }
    },
    [deleteMedia, projectId, workflow?.items?.length, router, backDestination]
  );

  const handleDetachVersion = React.useCallback(
    async (mediaId) => {
      if (!mediaId) return;
      try {
        await detachMedia({ mediaId, projectId });
        toast.success("Detached to a new workflow.");
      } catch (err) {
        toast.error(err?.message || "Failed to detach media.");
      }
    },
    [detachMedia, projectId]
  );

  const submitting = React.useMemo(
    () => ({
      angles: imageAnglesMutation.isPending,
      relight: imageRelightMutation.isPending,
      removeBackground: imageRemoveBackgroundMutation.isPending,
    }),
    [
      imageAnglesMutation.isPending,
      imageRelightMutation.isPending,
      imageRemoveBackgroundMutation.isPending,
    ]
  );

  const actions = React.useMemo(
    () => ({
      navigateToWorkflow,
      handleSelectVersion,
      handleDownloadActive,
      handleRenameWorkflow,
      handleDeleteVersion,
      handleDetachVersion,
      handleGenerateAngles,
      handleGenerateRelight,
      handleGenerateRemoveBackground,
    }),
    [
      navigateToWorkflow,
      handleSelectVersion,
      handleDownloadActive,
      handleRenameWorkflow,
      handleDeleteVersion,
      handleDetachVersion,
      handleGenerateAngles,
      handleGenerateRelight,
      handleGenerateRemoveBackground,
    ]
  );

  return {
    isLoading,
    workflow,
    workflows,
    currentWorkflowIndex,
    workflowId,
    activeItem,
    activeMeta,
    displayTitle,
    editPreviewUrl,
    isVideoWorkflow,
    canEditImage,
    isPrimaryProcessing,
    backDestination,
    backLabel,
    activeEditTool,
    setActiveEditTool,
    isCreditsModalOpen,
    setIsCreditsModalOpen,
    isDownloading,
    removeBackgroundModels,
    isLoadingRemoveBgModels,
    submitting,
    actions,
  };
}

export default useAssetEditController;
