"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useCharacter } from "@/features/characters";
import { useProjectData } from "@/features/workflows/api/workflowsApi";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";
import { CharacterEditNavbar } from "@/widgets/CharacterEditNavbar/CharacterEditNavbar";
import {
  CharacterInfoSidebar,
  CharacterSheetSection,
  CharacterDetailsGallery,
  CharacterTabSwitch,
} from "@/components/cinema-studio/characters";
import { cn } from "@/shared/lib/utils";

export default function CharacterDetailPage() {
  const { projectId, workflowId } = useParams();
  const router = useRouter();

  const {
    workflow,
    prompt,
    features,
    isLoading,
    isProcessing,
    isFailed,

    // Title & Info
    draftTitle,
    setDraftTitle,
    saveTitle,
    draftDesc,
    setDraftDesc,
    saveDescription,
    promptCopied,
    copyPrompt,

    // Turnaround Sheet
    activeSheetSrc,
    isUpdatingSheet,
    imageLoadError,
    setImageLoadError,
    uploadSheetFile,
    selectSheetAsset,
    downloadSheet,

    // Detail Images Gallery
    displayDetailImages,
    detailPhotos,
    deletingMediaId,
    maxDetailImages,
    uploadDetailFiles,
    addDetailFromAssets,
    removeDetailImage,

    // Character Deletion
    promptDelete,
    confirmDelete,
    isDeleting,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
  } = useCharacter({ projectId, characterId: workflowId });

  const { data: projectData } = useProjectData(projectId);

  // Active view tab: "sheet" | "details"
  const [activeTab, setActiveTab] = React.useState("sheet");

  // Popover states
  const [isAssetsOpen, setIsAssetsOpen] = React.useState(false);
  const [isSheetAssetsOpen, setIsSheetAssetsOpen] = React.useState(false);

  // Redirect if character workflow not found
  React.useEffect(() => {
    if (!isLoading && !workflow && projectData) {
      router.replace(`/cinema-studio/${projectId}/characters`);
    }
  }, [isLoading, workflow, projectData, router, projectId]);

  if (isLoading) return <LoadingScreen />;
  if (!workflow) return null;

  return (
    <div className="flex flex-col h-full w-full bg-studio-dark text-white overflow-hidden">
      <CharacterEditNavbar
        workflow={workflow}
        onDeleteCharacter={() =>
          promptDelete({
            id: workflow.id || workflow.name,
            projectId,
            workflowType: "CHARACTER",
          })
        }
      />

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-[80px] pb-16 custom-scrollbar">
        <div className="px-6 lg:px-[45px] pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full max-w-[1560px] mx-auto">
            {/* Left Sidebar: Title, Info, Tags, Prompt */}
            <CharacterInfoSidebar
              draftTitle={draftTitle}
              setDraftTitle={setDraftTitle}
              onSaveTitle={saveTitle}
              draftDesc={draftDesc}
              setDraftDesc={setDraftDesc}
              onSaveDescription={saveDescription}
              features={features}
              prompt={prompt}
              promptCopied={promptCopied}
              onCopyPrompt={copyPrompt}
            />

            {/* Right Main Stage: Sheet or Details */}
            <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3 relative">
              <div
                className={cn(
                  "relative w-full flex items-center justify-center transition-all duration-300",
                  (activeTab === "details" && detailPhotos.length === 0) ||
                    (activeTab === "sheet" && !activeSheetSrc && !isUpdatingSheet && !isProcessing && !isFailed)
                    ? "bg-transparent p-0"
                    : "rounded-2xl overflow-hidden bg-black/60 min-h-[460px] max-h-[580px] p-4"
                )}
              >
                {activeTab === "sheet" && (
                  <CharacterSheetSection
                    activeSheetSrc={activeSheetSrc}
                    imageLoadError={imageLoadError}
                    setImageLoadError={setImageLoadError}
                    isUpdatingSheet={isUpdatingSheet}
                    isProcessing={isProcessing}
                    isFailed={isFailed}
                    onUploadFile={uploadSheetFile}
                    onOpenAssets={() => setIsSheetAssetsOpen(true)}
                    onDownload={downloadSheet}
                    onDelete={() =>
                      promptDelete({
                        id: workflow.id || workflow.name,
                        projectId,
                        workflowType: "CHARACTER",
                      })
                    }
                  />
                )}

                {activeTab === "details" && (
                  <CharacterDetailsGallery
                    detailPhotos={detailPhotos}
                    displayDetailImages={displayDetailImages}
                    pendingUrls={[]}
                    deletingMediaId={deletingMediaId}
                    maxAllowed={maxDetailImages}
                    onUploadFiles={uploadDetailFiles}
                    onOpenAssets={() => setIsAssetsOpen(true)}
                    onDeleteImage={removeDetailImage}
                  />
                )}
              </div>

              {/* Floating Bottom Tab Pill Switch */}
              <CharacterTabSwitch
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                activeSheetSrc={activeSheetSrc}
                imageLoadError={imageLoadError}
                setImageLoadError={setImageLoadError}
                firstDetailPhotoSrc={detailPhotos[0]?.src}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Character"
        description="This will permanently delete this character and all its generated images. Are you sure?"
        confirmLabel="Delete Character"
        cancelLabel="Cancel"
        loading={isDeleting}
        onConfirm={async () => {
          await confirmDelete(projectId);
          router.push(`/cinema-studio/${projectId}/characters`);
        }}
      />

      {/* Assets Import Popover (Detail Images) */}
      <ImportMediaPopover
        open={isAssetsOpen}
        onOpenChange={setIsAssetsOpen}
        onSelect={async (items) => {
          await addDetailFromAssets(items);
          setIsAssetsOpen(false);
        }}
        library={projectData?.projectContents?.media || []}
        variant="asset-select"
        mode="image"
        maxAllowed={Math.max(1, maxDetailImages - displayDetailImages.length)}
        selectedItems={displayDetailImages}
      />

      {/* Assets Import Popover (Body Sheet) */}
      <ImportMediaPopover
        open={isSheetAssetsOpen}
        onOpenChange={setIsSheetAssetsOpen}
        onSelect={async (items) => {
          await selectSheetAsset(items);
          setIsSheetAssetsOpen(false);
        }}
        library={projectData?.projectContents?.media || []}
        variant="asset-select"
        mode="image"
        maxAllowed={1}
        selectedItems={activeSheetSrc ? [{ url: activeSheetSrc, id: "active-sheet" }] : []}
      />
    </div>
  );
}
