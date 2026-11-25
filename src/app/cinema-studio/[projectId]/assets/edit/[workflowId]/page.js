"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAssetEditController } from "@/features/workflows/model/useAssetEditController";
import { AssetSwitchBar } from "@/components/cinema-studio/media/AssetSwitchBar";
import { EditStageCanvas } from "@/components/cinema-studio/media/EditStageCanvas";
import { EditInspectorRail } from "@/components/cinema-studio/media/EditInspectorRail";
import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { LoadingScreen } from "@/components/primitives/LoadingScreen";
import { PackageSelectionDialog } from "@/features/payments/ui/PackageSelectionDialog";

/**
 * Asset Edit Page
 * Full-viewport 2-column studio editor composition shell:
 * - Left Stage: Top close button + folder-scoped AssetSwitchBar filmstrip,
 *   and full-bleed zoomable EditStageCanvas.
 * - Right Docked Rail: EditInspectorRail swapping between EditToolsSidebar
 *   and Angles / Relight / Remove Background tool panels.
 */
export default function AssetEditPage() {
  const { projectId, workflowId: routeWorkflowId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCollectionId =
    searchParams?.get("collectionId") || searchParams?.get("folderId") || null;

  const {
    isLoading,
    workflow,
    workflows,
    currentWorkflowIndex,
    workflowId,
    activeItem,
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
  } = useAssetEditController({
    projectId,
    routeWorkflowId,
    queryCollectionId,
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!workflow) return null; // Let the redirect handle it

  return (
    <div className="flex flex-col sm:flex-row h-full w-full text-text-primary overflow-hidden bg-background">
      {/* Left / Main Stage: Top Bar + Zoomable Preview Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
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

          <AssetSwitchBar
            workflows={workflows}
            activeWorkflowId={workflowId}
            currentIndex={currentWorkflowIndex}
            onSelectWorkflow={actions.navigateToWorkflow}
          />

          <div className="w-8 shrink-0" aria-hidden="true" />
        </header>

        <EditStageCanvas
          workflow={workflow}
          activeItem={activeItem}
          workflowId={workflowId}
          isVideoWorkflow={isVideoWorkflow}
        />
      </div>

      {/* Right Docked Inspector & Edit Tools Rail */}
      <EditInspectorRail
        workflow={workflow}
        activeItem={activeItem}
        displayTitle={displayTitle}
        editPreviewUrl={editPreviewUrl}
        canEditImage={canEditImage}
        isPrimaryProcessing={isPrimaryProcessing}
        isDownloading={isDownloading}
        activeEditTool={activeEditTool}
        onSelectTool={setActiveEditTool}
        removeBackgroundModels={removeBackgroundModels}
        isLoadingRemoveBgModels={isLoadingRemoveBgModels}
        submitting={submitting}
        onGenerateAngles={actions.handleGenerateAngles}
        onGenerateRelight={actions.handleGenerateRelight}
        onGenerateRemoveBackground={actions.handleGenerateRemoveBackground}
        onSelectVersion={actions.handleSelectVersion}
        onDownload={actions.handleDownloadActive}
        onRenameWorkflow={actions.handleRenameWorkflow}
        onDeleteMedia={actions.handleDeleteVersion}
        onDetachMedia={actions.handleDetachVersion}
      />

      <PackageSelectionDialog
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
    </div>
  );
}
