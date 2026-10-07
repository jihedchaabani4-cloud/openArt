"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { useFilteredWorkflows as useFilteredGenerations } from "@/features/workflows/model/useFilteredWorkflows";
import { useQueryClient } from "@tanstack/react-query";
import { useGenerateMutation } from "@/features/workflows/api/workflowsApi";
import { useProjectFolders, useUpdateFolder, useDeleteFolder } from "@/features/folders";
import { useUploadMedia } from "@/features/media";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  PromptBarPlatform,
  generatedMediaType,
  generatedMediaConfig,
  useRealBackendModels,
} from "@/features/prompt-bar/index.platform";
import { isLtxModel } from "@/features/prompt-bar/providers/ltx/index.js";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";
import { getPrimaryMedia } from "@/shared/lib/generationUtils";
import { getItemMetadata as getDisplayMeta, getStudioGridDensity } from "@/shared/lib/displayUtils";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";

const PAGE_SIZE = 30;

export default function CollectionDetailPage({ params }) {
  const { projectId, collectionId } = React.use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const setSelectedProjectId = useGenerationsStore((s) => s.setSelectedProjectId);
  const setActiveStudioTab = useGenerationsStore((s) => s.setActiveStudioTab);
  const setActiveCollectionId = useGenerationsStore((s) => s.setActiveCollectionId);
  const gridSize = useGenerationsStore((s) => s.gridSize);
  const setIsNavbarHidden = useGenerationsStore((s) => s.setIsNavbarHidden);

  // Sync active studio project & collection id
  React.useEffect(() => {
    if (projectId && useGenerationsStore.getState().selectedProjectId !== projectId) {
      setSelectedProjectId(projectId);
    }
    if (useGenerationsStore.getState().activeStudioTab !== "assets") {
      setActiveStudioTab("assets");
    }
    setActiveCollectionId(collectionId);

    return () => {
      setActiveCollectionId(null);
    };
  }, [projectId, collectionId, setSelectedProjectId, setActiveStudioTab, setActiveCollectionId]);

  // Fetch folders to get collection metadata
  const { data: rawFolders = [], isLoading: isFoldersLoading } = useProjectFolders(projectId);
  const collections = React.useMemo(() => {
    if (Array.isArray(rawFolders)) return rawFolders;
    if (Array.isArray(rawFolders?.items)) return rawFolders.items;
    return [];
  }, [rawFolders]);

  const collection = React.useMemo(() => {
    return collections.find((c) => c.id === collectionId) || null;
  }, [collections, collectionId]);

  // Fetch project workflows
  const { data: fetchResult, isLoading: isWorkflowsLoading } = useFilteredGenerations(projectId);
  const allWorkflows = React.useMemo(
    () => fetchResult?.filteredWorkflows || [],
    [fetchResult?.filteredWorkflows]
  );

  // Filter workflows belonging strictly to this collection
  const collectionWorkflows = React.useMemo(() => {
    return allWorkflows.filter(
      (w) => w.folder_id === collectionId || w.folderId === collectionId
    );
  }, [allWorkflows, collectionId]);

  // Pagination & scroll
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const hasMore = visibleCount < collectionWorkflows.length;
  const visibleWorkflows = React.useMemo(
    () => collectionWorkflows.slice(0, visibleCount),
    [collectionWorkflows, visibleCount]
  );

  const scrollRef = React.useRef(null);
  const prevScrollTop = React.useRef(0);

  const loadMore = React.useCallback(() => {
    setVisibleCount((cur) => Math.min(cur + PAGE_SIZE, collectionWorkflows.length));
  }, [collectionWorkflows.length]);

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const currentScrollTop = el.scrollTop;
    const isCurrentlyHidden = useGenerationsStore.getState().isNavbarHidden;
    if (currentScrollTop > prevScrollTop.current && currentScrollTop > 80) {
      if (!isCurrentlyHidden) setIsNavbarHidden(true);
    } else if (currentScrollTop < prevScrollTop.current) {
      if (isCurrentlyHidden) setIsNavbarHidden(false);
    }
    prevScrollTop.current = currentScrollTop;

    if (hasMore) {
      const remainingScroll = el.scrollHeight - (currentScrollTop + el.clientHeight);
      if (remainingScroll <= 300) {
        loadMore();
      }
    }
  }, [hasMore, loadMore, setIsNavbarHidden]);

  // Upload handler for this collection
  const fileInputRef = React.useRef(null);
  const { uploadMedia, isUploading } = useUploadMedia();

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      await uploadMedia(files, { collectionId });
    } catch (err) {
      console.error("Collection upload failed:", err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Generation handler
  const { data: backendData } = useRealBackendModels({ projectId });
  const realModels = React.useMemo(() => backendData?.models || [], [backendData]);
  const { mutateAsync: runGenerate, isPending: isGeneratingMutation } = useGenerateMutation();

  const handleGenerate = React.useCallback(
    async (request) => {
      if (!request?.prompt?.trim()) return;
      const chosenModel = realModels.find((m) => m.id === request.model);
      const isVideo = chosenModel?.domain === "video";

      const payload = {
        model: request.model,
        prompt: request.prompt,
        project_id: projectId,
        folder_id: collectionId,
        collection_id: collectionId,
        parameters: request.parameters || {},
        references: request.references || [],
        elements: request.elements || [],
        characters: request.characters || [],
      };

      try {
        if (isLtxModel(request.model)) {
          const res = await fetch("/api/ltx/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.message || "LTX generation failed");
          if (projectId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
          }
        } else {
          const res = await runGenerate({ payload, isVideo });
          const finalProj = res?.project_id ?? projectId;
          if (finalProj) {
            queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(finalProj) });
          }
        }
      } catch (err) {
        console.error("Generation failed:", err);
      }
    },
    [projectId, collectionId, realModels, runGenerate, queryClient]
  );

  // Collection Rename & Delete actions
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");
  const [renameError, setRenameError] = React.useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const { mutateAsync: updateFolder, isPending: isUpdating } = useUpdateFolder();
  const { mutateAsync: deleteFolder, isPending: isDeleting } = useDeleteFolder();

  const handleOpenRename = () => {
    setRenameValue(collection?.name || "");
    setRenameError(null);
    setIsRenameOpen(true);
  };

  const handleSaveRename = async (e) => {
    e?.preventDefault?.();
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === collection?.name) {
      setIsRenameOpen(false);
      return;
    }
    try {
      await updateFolder({
        folderId: collectionId,
        patch: { name: trimmed },
        projectId,
      });
      setIsRenameOpen(false);
    } catch (err) {
      setRenameError(err.message || "Failed to rename collection");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteFolder({
        folderId: collectionId,
        projectId,
      });
      setIsDeleteOpen(false);
      router.replace(`/cinema-studio/${projectId}/assets`);
    } catch (err) {
      alert(err.message || "Cannot delete collection with items inside");
    }
  };

  // Navigate to edit workflow
  const handleWorkflowClick = React.useCallback(
    (workflow) => {
      const workflowId = workflow?.id || workflow?.name;
      if (!workflowId || !projectId) return;
      router.push(`/cinema-studio/${projectId}/assets/edit/${workflowId}`);
    },
    [projectId, router]
  );

  // Photos preparation for RowsPhotoAlbum
  const photos = React.useMemo(() => {
    return visibleWorkflows.reduce((acc, workflow, i) => {
      const primaryItem = getPrimaryMedia(workflow);
      if (!primaryItem) return acc;

      const meta = getDisplayMeta(primaryItem, workflow);
      const aspect = meta?.aspect ?? "3/4";
      const [wStr, hStr] = aspect.split("/");
      const wNum = parseFloat(wStr) || 3;
      const hNum = parseFloat(hStr) || 4;
      const BASE = 1200;
      const width = Math.round(BASE * (wNum / Math.max(wNum, hNum)));
      const height = Math.round(BASE * (hNum / Math.max(wNum, hNum)));

      const url = meta?.url || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

      acc.push({
        src: url,
        width,
        height,
        key: workflow.id || workflow.name || String(i),
        workflow,
      });
      return acc;
    }, []);
  }, [visibleWorkflows]);

  const density = getStudioGridDensity(gridSize);

  const renderPhoto = React.useCallback(
    (_, { photo, width, height }) => {
      return (
        <MediaGridItem
          key={photo.key}
          workflow={photo.workflow}
          projectId={projectId}
          onClick={handleWorkflowClick}
          className="rounded-2xl border-none shadow-xl"
          width={width}
          height={height}
        />
      );
    },
    [handleWorkflowClick, projectId]
  );

  const albumRender = React.useMemo(
    () => ({ photo: renderPhoto }),
    [renderPhoto]
  );

  const isDragging = usePromptStore((s) => s.isDraggingGalleryItem);

  if ((isFoldersLoading || isWorkflowsLoading) && collectionWorkflows.length === 0 && !collection) {
    return <LoadingScreen message="Loading collection..." />;
  }

  const collectionName = collection?.name || "Collection";

  return (
    <div className="flex h-full w-full overflow-hidden text-white bg-background relative">
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden z-10">
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[25] bg-black/60 backdrop-blur-[4px] pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Hidden upload file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="image/*,video/mp4,video/webm"
        />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pt-[72px] overflow-x-hidden px-4 py-3 custom-scrollbar"
        >
          {/* ── Collection Header & Breadcrumb ── */}
          <div className="flex items-center justify-between gap-4 mb-5 pt-2 pb-1 border-b border-white/5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <button
                type="button"
                onClick={() => router.push(`/cinema-studio/${projectId}/assets`)}
                className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors cursor-pointer group"
              >
                <GoogleIcon
                  iconName="arrow_back"
                  className="text-[18px] text-white/60 group-hover:text-white transition-colors"
                />
                <span>All assets</span>
              </button>
              <span className="text-white/25">/</span>
              <div className="flex items-center gap-2">
                <GoogleIcon iconName="folder" className="text-[18px] text-white/70" />
                <h1 className="text-white text-[16px] sm:text-[18px] font-semibold tracking-tight">
                  {collectionName}
                </h1>
                <span className="text-xs text-white/40 ml-1">
                  ({collectionWorkflows.length})
                </span>
              </div>
            </div>

            {/* Actions: Upload & Collection Options */}
            <div className="flex items-center gap-2">
              <Button
                variant="studio-ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="h-8 gap-1.5 text-xs text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl px-3"
              >
                {isUploading ? (
                  <GoogleIcon iconName="progress_activity" className="text-[14px] animate-spin" />
                ) : (
                  <GoogleIcon iconName="upload" className="text-[15px]" />
                )}
                <span>Upload</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="studio-ghost"
                    size="icon"
                    className="size-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
                    title="Collection options"
                  >
                    <GoogleIcon iconName="more_horiz" className="text-[18px]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 p-1.5 flex flex-col gap-0.5">
                  <DropdownMenuItem
                    onClick={handleOpenRename}
                    className="flex items-center gap-2.5 cursor-pointer py-2 px-2.5 rounded-[10px] text-[13px]"
                  >
                    <GoogleIcon iconName="edit" className="text-[16px] text-white/70" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setIsDeleteOpen(true)}
                    className="flex items-center gap-2.5 cursor-pointer py-2 px-2.5 rounded-[10px] text-red-400 text-[13px]"
                  >
                    <GoogleIcon iconName="delete" className="text-[16px] text-red-400" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── Content Feed or Empty State ── */}
          <AnimatePresence mode="wait">
            {collectionWorkflows.length > 0 ? (
              <motion.div
                key="collection-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-6 w-full pb-32"
              >
                <RowsPhotoAlbum
                  photos={photos}
                  targetRowHeight={density.targetRowHeight}
                  spacing={density.spacing}
                  rowConstraints={{
                    singleRowMaxHeight: density.targetRowHeight * density.maxRowHeightMultiplier,
                  }}
                  render={albumRender}
                />
                {hasMore && (
                  <div className="flex justify-center pt-2 text-sm text-white/45">
                    Scroll down to load 30 more
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="collection-empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full min-h-[420px] flex flex-col items-center justify-center gap-4 text-center px-4"
              >
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <GoogleIcon iconName="folder_open" className="text-[32px] text-white/40" />
                </div>
                <div className="flex flex-col items-center gap-1.5 max-w-sm">
                  <h3 className="text-lg font-medium text-white/90">This collection is empty</h3>
                  <p className="text-sm text-white/45">
                    Upload media or generate images and videos to add them to this collection.
                  </p>
                </div>
                <Button
                  variant="studio-accent"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mt-2 h-9 px-4 rounded-xl gap-2 text-sm font-medium"
                >
                  <GoogleIcon iconName="upload" className="text-[16px]" />
                  <span>Upload media</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dedicated Generations PromptBar (Platform Architecture) */}
        <PromptBarPlatform
          type={generatedMediaType}
          featureConfig={generatedMediaConfig}
          models={realModels}
          onGenerate={handleGenerate}
          isGenerating={isGeneratingMutation}
        />
      </main>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent
          variant="small"
          className="bg-[rgba(22,23,24,0.95)] backdrop-blur-[80px] border border-white/10 text-white rounded-[24px] max-w-[340px] p-5 shadow-2xl"
          showCloseButton={false}
        >
          <form onSubmit={handleSaveRename} className="flex flex-col gap-4">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-[15px] font-semibold text-white">
                Rename collection
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-1.5">
              <Input
                value={renameValue}
                onChange={(e) => {
                  setRenameValue(e.target.value);
                  if (renameError) setRenameError(null);
                }}
                placeholder="Collection name"
                className="h-10 text-[13px] bg-white/5 border-white/10 rounded-xl focus:border-white/25"
                disabled={isUpdating}
                autoFocus
              />
              {renameError && <p className="text-[11px] text-red-400 px-1">{renameError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="studio-ghost"
                size="sm"
                onClick={() => setIsRenameOpen(false)}
                disabled={isUpdating}
                className="text-[13px] text-white/70 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="studio-accent"
                size="sm"
                disabled={!renameValue.trim() || isUpdating}
                className="text-[13px] px-4 font-medium"
              >
                {isUpdating ? (
                  <GoogleIcon iconName="progress_activity" className="text-[14px] animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        description={`Delete collection "${collectionName}"?`}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
      />
    </div>
  );
}
