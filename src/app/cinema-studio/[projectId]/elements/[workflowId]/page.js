"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useElementEdit } from "@/features/elements";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";
import { ConfirmDeleteDialog } from "@/shared/ui/ConfirmDeleteDialog";
import { ImportMediaPopover } from "@/features/media";
import { ElementEditNavbar } from "@/widgets/ElementEditNavbar/ElementEditNavbar";
import {
  ElementInfoSidebar,
  ElementDetailsGallery,
} from "@/components/cinema-studio/elements";

/**
 * ElementWorkflowEditPage
 * Thin presentational page for editing an Element workflow.
 * All state, sync logic, and mutation handlers are managed by useElementEdit.
 */
export default function ElementWorkflowEditPage() {
  const { projectId, workflowId } = useParams();

  const {
    workflow,
    items,
    elementType,
    primaryMediaId,
    projectData,

    // Draft form bindings
    draftTitle,
    setDraftTitle,
    saveTitle,
    draftDesc,
    setDraftDesc,
    saveDescription,
    draftGuidelines,
    setDraftGuidelines,
    saveGuidelines,
    saveElementType,

    // Gallery bindings
    deletingMediaId,
    isAssetsOpen,
    setIsAssetsOpen,
    handleUploadFiles,
    handleAddFromAssets,
    handleSetCover,
    handleDeleteImage,
    isSettingCover,

    // AI vision
    handleAnalyzeVision,
    isAnalyzingVision,

    // Deletion
    handleDeleteWorkflow,
    handleConfirmDelete,
    isDeleting,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,

    // Status
    isLoading,

    // Like / favorite
    isLiked,
    handleToggleLike,
  } = useElementEdit({ projectId, workflowId });

  const fileInputRef = React.useRef(null);

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && handleUploadFiles) {
      handleUploadFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (!workflow) return null;

  return (
    <div className="flex flex-col h-full w-full bg-studio-dark text-white overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* ── Top Navbar ── */}
      <ElementEditNavbar
        onDeleteElement={handleDeleteWorkflow}
        onUpload={() => fileInputRef.current?.click()}
        onOpenAssets={() => setIsAssetsOpen(true)}
        isLiked={isLiked}
        onToggleLike={handleToggleLike}
      />

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-[64px] pb-10 custom-scrollbar">
        <div className="px-6 lg:px-[45px] pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full max-w-[1560px] mx-auto">
            {/* Left Sidebar: Title, Type, Info, Guidelines */}
            <ElementInfoSidebar
              draftTitle={draftTitle}
              setDraftTitle={setDraftTitle}
              onSaveTitle={saveTitle}
              draftDesc={draftDesc}
              setDraftDesc={setDraftDesc}
              onSaveDescription={saveDescription}
              elementType={elementType}
              onSaveElementType={saveElementType}
              draftGuidelines={draftGuidelines}
              setDraftGuidelines={setDraftGuidelines}
              onSaveGuidelines={saveGuidelines}
              onAnalyzeVision={handleAnalyzeVision}
              isAnalyzingVision={isAnalyzingVision}
            />

            {/* Right Main Stage: Reference Photos Gallery */}
            <div className="lg:col-span-9 xl:col-span-9 flex flex-col gap-3 relative">
              <div className="relative w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5 min-h-[460px] p-5">
                <ElementDetailsGallery
                  workflow={workflow}
                  projectId={projectId}
                  items={items}
                  primaryMediaId={primaryMediaId}
                  pendingUrls={[]}
                  deletingMediaId={deletingMediaId}
                  maxAllowed={6}
                  onUploadFiles={handleUploadFiles}
                  onOpenAssets={() => setIsAssetsOpen(true)}
                  onDeleteImage={handleDeleteImage}
                  onSetCover={handleSetCover}
                  isSettingCover={isSettingCover}
                  showTopActions={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Element"
        description="This will permanently delete this element and all its reference images. Are you sure?"
        confirmLabel="Delete Element"
        cancelLabel="Cancel"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />

      {/* Assets Import Popover */}
      <ImportMediaPopover
        open={isAssetsOpen}
        onOpenChange={setIsAssetsOpen}
        onSelect={handleAddFromAssets}
        library={projectData?.projectContents?.media || []}
        variant="asset-select"
        mode="image"
        maxAllowed={Math.max(1, 6 - items.length)}
        selectedItems={items}
      />
    </div>
  );
}
