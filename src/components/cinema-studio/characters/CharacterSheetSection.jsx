"use client";

import { useRef, useMemo } from "react";
import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { MediaView } from "@/features/media";
import { ProcessingCard } from "@/components/cinema-studio/media/ProcessingCard";
import { FlowErrorTile } from "@/components/primitives/FlowErrorTile";
import { FlowCharacterImagePreview } from "./FlowCharacterImagePreview";

/**
 * CharacterSheetSection
 * Renders View A: The character's 3-view turnaround sheet.
 * Simple, status-driven media viewer:
 * - Error/failed -> FlowErrorTile with actionable recovery
 * - Processing -> ProcessingCard with aurora blur
 * - Completed -> MediaItemView with fit="contain" & context menu
 * - Empty -> FlowCharacterImagePreview empty state
 */
export function CharacterSheetSection({
  workflow = null,
  item = null,
  activeSheetSrc,
  imageLoadError,
  setImageLoadError,
  isUpdatingSheet,
  isProcessing,
  isFailed,
  onUploadFile,
  onOpenAssets,
  onDownload,
  onDelete,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const contextMenuItems = useMemo(() => {
    return [
      ...(onDownload
        ? [
            {
              key: "download",
              label: "Télécharger",
              icon: "download-04",
              onClick: onDownload,
            },
          ]
        : []),
      {
        key: "upload-sheet",
        label: "Importer une image (Turnaround)",
        icon: "upload-04",
        onClick: () => fileInputRef.current?.click(),
      },
      ...(onOpenAssets
        ? [
            {
              key: "from-assets",
              label: "Sélectionner depuis le projet",
              icon: "folder-open",
              onClick: onOpenAssets,
            },
          ]
        : []),
      ...(onDelete
        ? [
            {
              key: "delete-character",
              label: "Supprimer le personnage",
              icon: "delete-02",
              variant: "destructive",
              onClick: onDelete,
            },
          ]
        : []),
    ];
  }, [onDownload, onOpenAssets, onDelete]);

  // Clean, unambiguous status resolution directly from media and props
  const isError = Boolean(
    isFailed ||
    imageLoadError ||
    item?.status === "failed" ||
    item?.status === "error" ||
    workflow?.status === "failed"
  );

  const isBusy = Boolean(
    !isError &&
    (isProcessing ||
      item?.status === "processing" ||
      item?.status === "pending" ||
      workflow?.status === "processing" ||
      workflow?.status === "pending")
  );

  const hasImage = Boolean(activeSheetSrc) && !isError;

  return (
    <div className="w-full h-full flex items-center justify-center relative border-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {isUpdatingSheet && !hasImage ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <HugeIcon name="loading-03" size="2xl" className="text-violet-400 animate-spin" />
          <p className="ds-type-small text-white/60">Updating Body Sheet…</p>
        </div>
      ) : isBusy && !hasImage ? (
        <div className="relative aspect-video w-full max-w-[850px] mx-auto rounded-comfortable overflow-hidden border border-white/10 shadow-none select-none group/sheet">
          <ProcessingCard
            progress={item?.progress ?? workflow?.progress}
            aspectRatio="16/9"
            className="w-full h-full"
          />
          <div className="absolute top-3 right-3 opacity-0 group-hover/sheet:opacity-100 transition-opacity duration-200 pointer-events-auto flex items-center gap-2 z-30">
            <IconButton
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              title="Importer une image de corps (Turnaround)"
            >
              <HugeIcon name="upload-04" />
            </IconButton>
            {onOpenAssets && (
              <IconButton
                type="button"
                variant="outline"
                onClick={onOpenAssets}
                title="Select Body Sheet from assets"
              >
                <HugeIcon name="folder-open" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                type="button"
                variant="outline"
                onClick={onDelete}
                title="Delete character"
              >
                <HugeIcon name="delete-02" />
              </IconButton>
            )}
          </div>
        </div>
      ) : isError ? (
        <div className="relative aspect-video w-full max-w-[850px] mx-auto rounded-comfortable overflow-hidden border border-white/10 shadow-none select-none group/sheet">
          <FlowErrorTile
            error={item?.error_message || item?.error || "Generation failed. You can upload a custom turnaround sheet or choose from project assets."}
            onReusePrompt={onOpenAssets}
            onDelete={onDelete}
            className="w-full h-full"
          />
          <div className="absolute top-3 right-3 opacity-0 group-hover/sheet:opacity-100 transition-opacity duration-200 pointer-events-auto flex items-center gap-2 z-30">
            <IconButton
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              title="Importer une image de corps (Turnaround)"
            >
              <HugeIcon name="upload-04" />
            </IconButton>
            {onOpenAssets && (
              <IconButton
                type="button"
                variant="outline"
                onClick={onOpenAssets}
                title="Select Body Sheet from assets"
              >
                <HugeIcon name="folder-open" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                type="button"
                variant="outline"
                onClick={onDelete}
                title="Delete character"
              >
                <HugeIcon name="delete-02" />
              </IconButton>
            )}
          </div>
        </div>
      ) : hasImage ? (
        <div className="w-full h-full flex items-center justify-center relative border-none">
          <MediaView
            workflow={workflow}
            item={item}
            src={activeSheetSrc}
            status="completed"
            fit="contain"
            className="group/sheet relative max-w-full max-h-[520px] rounded-comfortable overflow-hidden border-none shadow-none flex items-center justify-center bg-transparent"
            style={{
              maxHeight: 520,
            }}
            mediaClassName="rounded-comfortable object-contain max-h-[520px] w-auto h-auto"
            showLikedBadge={false}
            showVideoBadge={false}
            showMenu={false}
            showHoverOverlay={false}
            onError={() => setImageLoadError && setImageLoadError(true)}
            overlay={
              isUpdatingSheet ? (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-40 flex flex-col items-center justify-center gap-2 rounded-comfortable">
                  <HugeIcon name="loading-03" size="xl" className="text-white animate-spin" />
                  <span className="ds-type-small text-white/80">Updating…</span>
                </div>
              ) : null
            }
            topRight={
              <div className="opacity-0 group-hover:opacity-100 group-hover/sheet:opacity-100 transition-opacity duration-200 pointer-events-auto flex items-center gap-2">
                <IconButton
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  title="Importer une image de corps (Turnaround)"
                >
                  <HugeIcon name="upload-04" />
                </IconButton>
                {onOpenAssets && (
                  <IconButton
                    type="button"
                    variant="outline"
                    onClick={onOpenAssets}
                    title="Select Body Sheet from assets"
                  >
                    <HugeIcon name="folder-open" />
                  </IconButton>
                )}
                {onDownload && (
                  <IconButton
                    type="button"
                    variant="outline"
                    onClick={onDownload}
                    title="Download character sheet"
                  >
                    <HugeIcon name="download-04" />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton
                    type="button"
                    variant="outline"
                    onClick={onDelete}
                    title="Delete character"
                  >
                    <HugeIcon name="delete-02" />
                  </IconButton>
                )}
              </div>
            }
            contextMenuItems={contextMenuItems}
          />
        </div>
      ) : (
        <FlowCharacterImagePreview
          onUpload={() => fileInputRef.current?.click()}
          onSelectProject={onOpenAssets}
          isUploading={isUpdatingSheet}
        />
      )}
    </div>
  );
}

export default CharacterSheetSection;
