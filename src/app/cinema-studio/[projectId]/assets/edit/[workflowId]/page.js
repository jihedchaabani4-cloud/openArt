"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useFilteredWorkflows } from "@/features/workflows/model/useFilteredWorkflows";
import { useProjectFolders } from "@/features/folders";
import { EditMediaView } from "@/components/cinema-studio/media/EditMediaView";
import { EditToolsSidebar } from "@/components/cinema-studio/media/EditToolsSidebar";
import { AnglesPanel } from "@/components/cinema-studio/media/AnglesPanel";
import { RelightPanel } from "@/components/cinema-studio/media/RelightPanel";
import { RemoveBackgroundPanel } from "@/components/cinema-studio/media/RemoveBackgroundPanel";
import { resolveEditNavbarBackDestination } from "@/components/layout/EditNavbar";
import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { LoadingScreen } from "@/components/primitives/LoadingScreen";
import { getItemMetadata } from "@/shared/lib/generationUtils";
import { downloadFile, cn } from "@/shared/lib/utils";
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
import { PackageSelectionDialog } from "@/features/payments/ui/PackageSelectionDialog";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const FILMSTRIP_CENTER_X = 220;
const FILMSTRIP_STRIDE = 44;
const FILMSTRIP_DRAG_THRESHOLD = 5;
const FILMSTRIP_WHEEL_STEP = 40;

function getMediaItemId(item) {
  return item?.id || item?.media_id || item?.name || null;
}

function getWorkflowId(wf) {
  return wf?.id || wf?.name || null;
}

const VIDEO_URL_REGEX = /\.(mp4|webm|mov|m4v)(\?|$)/i;

function isVideoUrl(url) {
  return typeof url === "string" && VIDEO_URL_REGEX.test(url);
}

function getWorkflowThumbInfo(wf) {
  const primary = resolveMainMedia(wf);
  if (primary) {
    const isVideo = primary.kind === "video" || isVideoUrl(primary.url);
    const posterUrl =
      primary.thumbUrl && !isVideoUrl(primary.thumbUrl) ? primary.thumbUrl : null;
    if (posterUrl || primary.url) {
      return {
        isVideo,
        posterUrl,
        url: primary.url || null,
      };
    }
  }
  const items = Array.isArray(wf?.items) ? wf.items : [];
  for (const it of items) {
    const meta = getItemMetadata(it, wf);
    if (meta?.url) {
      const isVideo = Boolean(meta.isVideo) || isVideoUrl(meta.url);
      const posterUrl =
        meta.thumbUrl && !isVideoUrl(meta.thumbUrl) ? meta.thumbUrl : null;
      return { isVideo, posterUrl, url: meta.url };
    }
  }
  return { isVideo: false, posterUrl: null, url: null };
}

/**
 * Asset Edit Page
 * Full-viewport 2-column studio editor architecture:
 * - Left Stage: Top close button + centered project workflow filmstrip (< [thumbs] >),
 *   full-bleed zoomable media preview, and bottom-right floating zoom controls (- / fit / +).
 * - Right Docked Sidebar (320px): Top More + Download bar, Edits / Info tabs, horizontal
 *   version history strip, and ghost-button edit tools swapping into Angles / Relight / Remove BG.
 */
export default function AssetEditPage() {
  const { projectId, workflowId: routeWorkflowId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCollectionId =
    searchParams?.get("collectionId") || searchParams?.get("folderId") || null;

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

  const workflows = React.useMemo(
    () => fetchResult?.filteredWorkflows || [],
    [fetchResult?.filteredWorkflows]
  );
  const currentWorkflowIndex = React.useMemo(
    () => workflows.findIndex((w) => getWorkflowId(w) === workflowId),
    [workflows, workflowId]
  );
  const workflow = currentWorkflowIndex >= 0 ? workflows[currentWorkflowIndex] : null;

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
    if (!isLoading && !workflow && workflows.length > 0) {
      router.replace(backDestination);
    }
  }, [isLoading, workflow, workflows.length, router, backDestination]);

  const [selectedItemId, setSelectedItemId] = React.useState(null);
  const [activeEditTool, setActiveEditTool] = React.useState(null); // null | "angles" | "relight" | "remove-background"
  const [isCreditsModalOpen, setIsCreditsModalOpen] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [zoomLevel, setZoomLevel] = React.useState(1);

  // Sync activeWorkflowId only when routeWorkflowId itself changes externally (e.g. browser back/forward)
  const lastRouteWorkflowIdRef = React.useRef(routeWorkflowId);
  React.useEffect(() => {
    if (!routeWorkflowId || routeWorkflowId === lastRouteWorkflowIdRef.current) return;
    lastRouteWorkflowIdRef.current = routeWorkflowId;
    if (routeWorkflowId === activeWorkflowId) return;
    setActiveWorkflowId(routeWorkflowId);
    setSelectedItemId(null);
    setActiveEditTool(null);
    setZoomLevel(1);
  }, [routeWorkflowId, activeWorkflowId]);

  const resolvedPrimary = React.useMemo(
    () => (workflow ? resolveMainMedia(workflow) : null),
    [workflow]
  );

  // Derive fresh activeItem from Project Cache so processing -> ready updates live
  const activeItem = React.useMemo(() => {
    if (!workflow) return null;
    const items = Array.isArray(workflow.items) ? workflow.items : [];
    if (selectedItemId) {
      const match = items.find((it) => getMediaItemId(it) === selectedItemId);
      if (match) return match;
    }
    if (resolvedPrimary) {
      return resolvedPrimary.raw || resolvedPrimary;
    }
    return {
      id: getWorkflowId(workflow),
      status: workflow.status || "processing",
      url: null,
    };
  }, [workflow, selectedItemId, resolvedPrimary]);

  const isVideoWorkflow = resolvedPrimary?.kind === "video";
  const isTrashedWorkflow = Boolean(
    workflow?.deleted_at ||
      workflow?.deletedAt ||
      workflow?.trashed_at ||
      workflow?.is_deleted ||
      workflow?.status === "trashed"
  );
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

  const editPreviewUrl = React.useMemo(() => {
    if (activeMeta?.url) return activeMeta.url;
    if (resolvedPrimary?.thumbUrl || resolvedPrimary?.url) {
      return resolvedPrimary.thumbUrl || resolvedPrimary.url;
    }
    const items = Array.isArray(workflow?.items) ? workflow.items : [];
    for (const it of items) {
      const meta = getItemMetadata(it, workflow);
      if (meta?.url) return meta.url;
    }
    return null;
  }, [activeMeta, resolvedPrimary, workflow]);

  const displayTitle =
    workflow?.display_name || workflow?.metadata?.displayName || "Untitled Workflow";

  const navigateToWorkflow = React.useCallback(
    (targetWf) => {
      const targetId = getWorkflowId(targetWf);
      if (!targetId || targetId === workflowId) return;

      setActiveWorkflowId(targetId);
      setSelectedItemId(null);
      setActiveEditTool(null);
      setZoomLevel(1);

      const suffix = queryCollectionId
        ? `?collectionId=${encodeURIComponent(queryCollectionId)}`
        : "";
      const nextUrl = `/cinema-studio/${projectId}/assets/edit/${targetId}${suffix}`;
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", nextUrl);
      }
    },
    [projectId, workflowId, queryCollectionId]
  );

  const prevWorkflow =
    currentWorkflowIndex > 0 ? workflows[currentWorkflowIndex - 1] : null;
  const nextWorkflow =
    currentWorkflowIndex >= 0 && currentWorkflowIndex < workflows.length - 1
      ? workflows[currentWorkflowIndex + 1]
      : null;

  // ── Switch Bar Drag-to-Scrub & Wheel/Trackpad Scroll ──────────────────────
  const filmstripViewportRef = React.useRef(null);
  const filmstripDragRef = React.useRef(null);
  const suppressFilmstripClickRef = React.useRef(false);
  const wheelAccumRef = React.useRef(0);
  const wheelResetTimerRef = React.useRef(null);
  const [dragTrackX, setDragTrackX] = React.useState(null);

  const clampedWorkflowIndex = Math.max(0, currentWorkflowIndex);
  const restingTrackX = FILMSTRIP_CENTER_X - clampedWorkflowIndex * FILMSTRIP_STRIDE;

  // Non-passive wheel listener so vertical mouse wheel & horizontal trackpad swipe step smoothly
  React.useEffect(() => {
    const el = filmstripViewportRef.current;
    if (!el || workflows.length <= 1) return;

    const handleWheel = (e) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();

      wheelAccumRef.current += delta;
      clearTimeout(wheelResetTimerRef.current);
      wheelResetTimerRef.current = setTimeout(() => {
        wheelAccumRef.current = 0;
      }, 180);

      if (Math.abs(wheelAccumRef.current) >= FILMSTRIP_WHEEL_STEP) {
        const step = wheelAccumRef.current > 0 ? 1 : -1;
        wheelAccumRef.current = 0;
        const nextIdx = Math.min(
          workflows.length - 1,
          Math.max(0, clampedWorkflowIndex + step)
        );
        if (nextIdx !== clampedWorkflowIndex && workflows[nextIdx]) {
          navigateToWorkflow(workflows[nextIdx]);
        }
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      clearTimeout(wheelResetTimerRef.current);
    };
  }, [workflows, clampedWorkflowIndex, navigateToWorkflow]);

  const handleFilmstripPointerDown = React.useCallback(
    (e) => {
      if (e.button !== 0 || workflows.length <= 1) return;
      suppressFilmstripClickRef.current = false;
      filmstripDragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startIndex: clampedWorkflowIndex,
        baseX: FILMSTRIP_CENTER_X - clampedWorkflowIndex * FILMSTRIP_STRIDE,
        lastIndex: clampedWorkflowIndex,
        dragged: false,
      };
    },
    [workflows.length, clampedWorkflowIndex]
  );

  const handleFilmstripPointerMove = React.useCallback(
    (e) => {
      const drag = filmstripDragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;

      if (!drag.dragged) {
        if (Math.abs(dx) < FILMSTRIP_DRAG_THRESHOLD) return;
        drag.dragged = true;
        suppressFilmstripClickRef.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }

      const maxX = FILMSTRIP_CENTER_X;
      const minX = FILMSTRIP_CENTER_X - (workflows.length - 1) * FILMSTRIP_STRIDE;
      const nextX = Math.min(maxX, Math.max(minX, drag.baseX + dx));
      setDragTrackX(nextX);

      const hoveredIdx = Math.min(
        workflows.length - 1,
        Math.max(0, Math.round((FILMSTRIP_CENTER_X - nextX) / FILMSTRIP_STRIDE))
      );
      if (hoveredIdx !== drag.lastIndex && workflows[hoveredIdx]) {
        drag.lastIndex = hoveredIdx;
        navigateToWorkflow(workflows[hoveredIdx]);
      }
    },
    [workflows, navigateToWorkflow]
  );

  const finishFilmstripDrag = React.useCallback((e) => {
    const drag = filmstripDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.dragged) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      setTimeout(() => {
        suppressFilmstripClickRef.current = false;
      }, 0);
    }
    filmstripDragRef.current = null;
    setDragTrackX(null);
  }, []);

  const handleEditResponse = React.useCallback((res, fallbackSuccessMsg, fallbackCreditsMsg) => {
    if (res?.needsCredits) {
      toast.error(res.message || fallbackCreditsMsg);
      setIsCreditsModalOpen(true);
      return;
    }
    if (res?.mediaId) {
      setSelectedItemId(res.mediaId);
    }
    toast.success(res?.message || fallbackSuccessMsg);
  }, []);

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

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!workflow) return null; // Let the redirect handle it

  return (
    <div className="flex flex-col sm:flex-row h-full w-full text-text-primary overflow-hidden bg-background">
      {/* ── Left / Main Stage: Top Bar + Full-Bleed Zoomable Canvas + Floating Zoom Pill ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Top Stage Bar: Close button (left) + Project Workflows Filmstrip (center) */}
        <header className="h-14 px-4 flex items-center justify-between gap-3 shrink-0 z-10">
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            aria-label={backLabel}
            title={backLabel}
            onClick={() => router.push(backDestination)}
          >
            <HugeIcon name="cancel-01" size="sm" />
          </IconButton>

          {/* Centered Sliding Workflow Filmstrip (480px viewport, active thumb dead-center at 220px, 80px edge fades) */}
          {workflows.length > 1 ? (
            <div
              className="hidden md:flex items-center justify-center transition-opacity duration-200"
              role="navigation"
              aria-label="Project assets"
            >
              <IconButton
                type="button"
                variant="ghost"
                disabled={!prevWorkflow}
                aria-label="Previous asset"
                onClick={() => prevWorkflow && navigateToWorkflow(prevWorkflow, currentWorkflowIndex - 1)}
                className="size-9 rounded-full shrink-0 text-icon-secondary hover:text-text-primary disabled:opacity-40"
              >
                <HugeIcon name="arrow-left-01" size="sm" />
              </IconButton>

              <div
                ref={filmstripViewportRef}
                onPointerDown={handleFilmstripPointerDown}
                onPointerMove={handleFilmstripPointerMove}
                onPointerUp={finishFilmstripDrag}
                onPointerCancel={finishFilmstripDrag}
                className={cn(
                  "relative w-[480px] h-10 overflow-hidden select-none touch-none",
                  dragTrackX !== null ? "cursor-grabbing" : "cursor-grab"
                )}
              >
                {/* Left & Right edge fade masks */}
                <div
                  aria-hidden="true"
                  className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"
                />
                <div
                  aria-hidden="true"
                  className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"
                />

                {/* Sliding track: 40px item + 4px gap = 44px stride; live-follows drag, springs to 220px center on snap */}
                <motion.div
                  className="absolute top-0 left-0 flex gap-x-1"
                  initial={false}
                  animate={{ x: dragTrackX !== null ? dragTrackX : restingTrackX }}
                  transition={
                    dragTrackX !== null
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 380, damping: 34, mass: 0.8 }
                  }
                >
                  {workflows.map((wf) => {
                    const wfId = getWorkflowId(wf);
                    const isCurrent = wfId === workflowId;
                    const { isVideo, posterUrl, url } = getWorkflowThumbInfo(wf);
                    const imgSrc = posterUrl || (!isVideo ? url : null);
                    return (
                      <button
                        key={wfId}
                        type="button"
                        aria-current={isCurrent ? "page" : undefined}
                        aria-label={wf.display_name || "Asset"}
                        onClick={() => {
                          if (suppressFilmstripClickRef.current) {
                            suppressFilmstripClickRef.current = false;
                            return;
                          }
                          navigateToWorkflow(wf);
                        }}
                        className={cn(
                          "group relative size-10 shrink-0 rounded-sm overflow-hidden bg-surface-tonal cursor-pointer transition-opacity duration-200 focus-workspace",
                          isCurrent
                            ? "opacity-100"
                            : "opacity-50 hover:opacity-80"
                        )}
                      >
                        {imgSrc ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={imgSrc}
                            alt=""
                            className="w-full h-full pointer-events-none absolute inset-0 object-cover"
                          />
                        ) : isVideo && url ? (
                          <video
                            src={url}
                            muted
                            playsInline
                            preload="metadata"
                            className="w-full h-full pointer-events-none absolute inset-0 object-cover"
                          />
                        ) : (
                          <span className="size-full flex items-center justify-center text-text-secondary">
                            <HugeIcon name={isVideo ? "video-01" : "image-01"} size="xs" />
                          </span>
                        )}
                        {isVideo && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute bottom-0.5 right-0.5 flex size-4 items-center justify-center rounded-sm bg-black/60 text-white"
                          >
                            <HugeIcon name="play" className="text-[9px]" />
                          </span>
                        )}
                        {isCurrent && (
                          <motion.span
                            layoutId="edit-switch-active-ring"
                            aria-hidden="true"
                            transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-inset ring-white/50"
                          />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </div>

              <IconButton
                type="button"
                variant="ghost"
                disabled={!nextWorkflow}
                aria-label="Next asset"
                onClick={() => nextWorkflow && navigateToWorkflow(nextWorkflow, currentWorkflowIndex + 1)}
                className="size-9 rounded-full shrink-0 text-icon-secondary hover:text-text-primary disabled:opacity-40"
              >
                <HugeIcon name="arrow-right-01" size="sm" />
              </IconButton>
            </div>
          ) : (
            <div />
          )}

          <div className="w-8 shrink-0" aria-hidden="true" />
        </header>

        {/* Center Preview Canvas */}
        <main className="flex-1 relative flex items-center justify-center overflow-hidden px-6 pb-12 pt-2 min-h-0">
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out"
            style={!isVideoWorkflow && zoomLevel !== 1 ? { transform: `scale(${zoomLevel})` } : undefined}
          >
            <EditMediaView workflow={workflow} item={activeItem} />
          </div>

          {/* Bottom-Right Floating Zoom Controls (- / Fit / +) */}
          {!isVideoWorkflow && (
            <div
              role="group"
              aria-label="Preview zoom controls"
              className="absolute bottom-4 right-4 z-10 flex items-center gap-0.5 rounded-xl bg-omni-bg border border-border-subtle p-1"
            >
              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                disabled={zoomLevel <= MIN_ZOOM}
                aria-label="Zoom out"
                onClick={() =>
                  setZoomLevel((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))))
                }
              >
                <HugeIcon name="minus-sign" size="xs" />
              </IconButton>

              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Reset zoom"
                title={`${Math.round(zoomLevel * 100)}%`}
                onClick={() => setZoomLevel(1)}
              >
                <HugeIcon name="full-screen" size="xs" />
              </IconButton>

              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                disabled={zoomLevel >= MAX_ZOOM}
                aria-label="Zoom in"
                onClick={() =>
                  setZoomLevel((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))))
                }
              >
                <HugeIcon name="add-01" size="xs" />
              </IconButton>
            </div>
          )}
        </main>
      </div>

      {/* ── Right Docked Sidebar (Full-Height Inspector & Edit Tools) ── */}
      <aside className="w-full sm:w-[320px] shrink-0 h-full border-t sm:border-t-0 sm:border-l border-border-subtle bg-omni-bg overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {canEditImage && activeEditTool === "angles" ? (
            <motion.div
              key="angles"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <AnglesPanel
                previewUrl={editPreviewUrl}
                isSubmitting={imageAnglesMutation.isPending}
                isPrimaryProcessing={isPrimaryProcessing}
                onGenerate={handleGenerateAngles}
                onBack={() => setActiveEditTool(null)}
                onClose={() => setActiveEditTool(null)}
                className="w-full rounded-none border-0"
              />
            </motion.div>
          ) : canEditImage && activeEditTool === "relight" ? (
            <motion.div
              key="relight"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <RelightPanel
                previewUrl={editPreviewUrl}
                isSubmitting={imageRelightMutation.isPending}
                isPrimaryProcessing={isPrimaryProcessing}
                onGenerate={handleGenerateRelight}
                onBack={() => setActiveEditTool(null)}
                onClose={() => setActiveEditTool(null)}
                className="w-full rounded-none border-0"
              />
            </motion.div>
          ) : canEditImage && activeEditTool === "remove-background" ? (
            <motion.div
              key="remove-background"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <RemoveBackgroundPanel
                models={removeBackgroundModels}
                isLoadingModels={isLoadingRemoveBgModels}
                isSubmitting={imageRemoveBackgroundMutation.isPending}
                isPrimaryProcessing={isPrimaryProcessing}
                onGenerate={handleGenerateRemoveBackground}
                onBack={() => setActiveEditTool(null)}
                onClose={() => setActiveEditTool(null)}
                className="w-full rounded-none border-0"
              />
            </motion.div>
          ) : (
            <motion.div
              key="tools-home"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <EditToolsSidebar
                workflow={workflow}
                items={workflow.items}
                activeItem={activeItem}
                primaryMediaId={workflow.metadata?.primaryMediaId}
                displayTitle={displayTitle}
                canEditImage={canEditImage}
                isDownloading={isDownloading}
                onSelectTool={setActiveEditTool}
                onSelectVersion={handleSelectVersion}
                onDownload={handleDownloadActive}
                onRenameWorkflow={handleRenameWorkflow}
                onDeleteMedia={handleDeleteVersion}
                onDetachMedia={handleDetachVersion}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      <PackageSelectionDialog
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
    </div>
  );
}
