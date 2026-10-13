"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useElementEdit } from "@/features/elements";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";
import { ElementEditNavbar } from "@/widgets/ElementEditNavbar/ElementEditNavbar";
import {
  ElementInfoSidebar,
  ElementDetailsGallery,
} from "@/components/cinema-studio/elements";
import { cn } from "@/shared/lib/utils";

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
  } = useElementEdit({ projectId, workflowId });

  if (isLoading) return <LoadingScreen />;
  if (!workflow) return null;

  return (
    <div className="flex flex-col h-full w-full bg-studio-dark text-white overflow-hidden">
      {/* ── Top Navbar ── */}
      <ElementEditNavbar onDeleteElement={handleDeleteWorkflow} />

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-[80px] pb-16 custom-scrollbar">
        <div className="px-6 lg:px-[45px] pt-4">
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
              <div
                className={cn(
                  "relative w-full flex items-center justify-center transition-all duration-300",
                  items.length === 0
                    ? "bg-transparent p-0"
                    : "rounded-2xl bg-black/40 border border-white/5 min-h-[460px] p-5"
                )}
              >
                <ElementDetailsGallery
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
