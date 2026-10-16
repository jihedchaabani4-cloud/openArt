"use client";

import { useRef, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { MediaItemView } from "@/widgets/CoreMediaItemView";
import { ProcessingCard } from "@/shared/ui/ProcessingCard";
import { FlowErrorTile } from "@/shared/ui/FlowErrorTile";
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
              icon: "download",
              onClick: onDownload,
            },
          ]
        : []),
      {
        key: "upload-sheet",
        label: "Importer une image (Turnaround)",
        icon: "upload",
        onClick: () => fileInputRef.current?.click(),
      },
      ...(onOpenAssets
        ? [
            {
              key: "from-assets",
              label: "Sélectionner depuis le projet",
              icon: "folder_open",
              onClick: onOpenAssets,
            },
          ]
        : []),
      ...(onDelete
        ? [
            {
              key: "delete-character",
              label: "Supprimer le personnage",
              icon: "delete",
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
          <Loader2 className="size-8 text-violet-400 animate-spin" />
          <p className="text-white/60 text-sm">Updating Body Sheet…</p>
        </div>
      ) : isBusy && !hasImage ? (
        <div className="relative aspect-video w-full max-w-[850px] mx-auto rounded-2xl overflow-hidden shadow-lg select-none group/sheet">
          <ProcessingCard
            progress={item?.progress ?? workflow?.progress}
            aspectRatio="16/9"
            className="w-full h-full"
          />
          <div className="absolute top-3 right-3 opacity-0 group-hover/sheet:opacity-100 transition-opacity duration-200 pointer-events-auto flex items-center gap-2 z-30">
            <Button
              type="button"
              variant="flow-overlay-action"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Importer une image de corps (Turnaround)"
            >
              <GoogleIcon iconName="upload" className="text-[1.25rem]" />
            </Button>
            {onOpenAssets && (
              <Button
                type="button"
                variant="flow-overlay-action"
                size="icon"
                onClick={onOpenAssets}
                title="Select Body Sheet from assets"
              >
                <GoogleIcon iconName="folder_open" className="text-[1.25rem]" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="flow-overlay-action"
                size="icon"
                onClick={onDelete}
                title="Delete character"
              >
                <GoogleIcon iconName="delete" className="text-[1.25rem]" />
              </Button>
            )}
          </div>
        </div>
      ) : isError ? (
        <div className="relative aspect-video w-full max-w-[850px] mx-auto rounded-2xl overflow-hidden shadow-lg select-none group/sheet">
          <FlowErrorTile
            error={item?.error_message || item?.error || "Generation failed. You can upload a custom turnaround sheet or choose from project assets."}
            onReusePrompt={onOpenAssets}
            onDelete={onDelete}
            className="w-full h-full"
          />
          <div className="absolute top-3 right-3 opacity-0 group-hover/sheet:opacity-100 transition-opacity duration-200 pointer-events-auto flex items-center gap-2 z-30">
            <Button
              type="button"
              variant="flow-overlay-action"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Importer une image de corps (Turnaround)"
            >
              <GoogleIcon iconName="upload" className="text-[1.25rem]" />
            </Button>
            {onOpenAssets && (
              <Button
                type="button"
                variant="flow-overlay-action"
                size="icon"
                onClick={onOpenAssets}
                title="Select Body Sheet from assets"
              >
                <GoogleIcon iconName="folder_open" className="text-[1.25rem]" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="flow-overlay-action"
                size="icon"
                onClick={onDelete}
                title="Delete character"
              >
                <GoogleIcon iconName="delete" className="text-[1.25rem]" />
              </Button>
            )}
          </div>
        </div>
      ) : hasImage ? (
        <div className="w-full h-full flex items-center justify-center relative border-none">
          <MediaItemView
            workflow={workflow}
            item={item}
            src={activeSheetSrc}
            status="completed"
            fit="contain"
            className="group/sheet relative max-w-full max-h-[520px] rounded-xl overflow-hidden border-none shadow-2xl flex items-center justify-center bg-transparent"
            style={{
              maxHeight: 520,
            }}
            mediaClassName="rounded-xl object-contain max-h-[520px] w-auto h-auto"
            showLikedBadge={false}
            showVideoBadge={false}
            showMenu={false}
            showHoverOverlay={false}
            onError={() => setImageLoadError && setImageLoadError(true)}
            overlay={
              isUpdatingSheet ? (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-40 flex flex-col items-center justify-center gap-2 rounded-xl">
                  <Loader2 className="size-7 text-white animate-spin" />
                  <span className="text-xs text-white/80">Updating…</span>
                </div>
              ) : null
            }
            topRight={
              <div className="opacity-0 group-hover:opacity-100 group-hover/sheet:opacity-100 transition-opacity duration-200 pointer-events-auto flex items-center gap-2">
                <Button
                  type="button"
                  variant="flow-overlay-action"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Importer une image de corps (Turnaround)"
                >
                  <GoogleIcon iconName="upload" className="text-[1.25rem]" />
                </Button>
                {onOpenAssets && (
                  <Button
                    type="button"
                    variant="flow-overlay-action"
                    size="icon"
                    onClick={onOpenAssets}
                    title="Select Body Sheet from assets"
                  >
                    <GoogleIcon iconName="folder_open" className="text-[1.25rem]" />
                  </Button>
                )}
                {onDownload && (
                  <Button
                    type="button"
                    variant="flow-overlay-action"
                    size="icon"
                    onClick={onDownload}
                    title="Download character sheet"
                  >
                    <GoogleIcon iconName="download" className="text-[1.25rem]" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    type="button"
                    variant="flow-overlay-action"
                    size="icon"
                    onClick={onDelete}
                    title="Delete character"
                  >
                    <GoogleIcon iconName="delete" className="text-[1.25rem]" />
                  </Button>
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
