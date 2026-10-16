"use client";

import { useRef, useMemo } from "react";
import { Loader2, AlertCircle, FolderOpen } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { MediaItemView } from "@/widgets/CoreMediaItemView";
import { FlowCharacterImagePreview } from "./FlowCharacterImagePreview";

/**
 * CharacterSheetSection
 * Renders View A: The character's 3-view turnaround sheet,
 * powered by MediaItemView for authentic rendering, context menu, and hover actions.
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

  return (
    <div className="w-full h-full flex items-center justify-center relative border-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {isUpdatingSheet && !activeSheetSrc ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="size-8 text-violet-400 animate-spin" />
          <p className="text-white/60 text-sm">Updating Body Sheet…</p>
        </div>
      ) : isProcessing && !activeSheetSrc ? (
        <div className="w-full h-full flex items-center justify-center relative border-none">
          <MediaItemView
            workflow={workflow}
            item={item}
            status="processing"
            aspect="16:9"
            fit="contain"
            className="group/sheet relative w-full max-w-[850px] aspect-video rounded-xl overflow-hidden border-none shadow-2xl flex items-center justify-center bg-transparent"
            showLikedBadge={false}
            showVideoBadge={false}
            showMenu={false}
            showHoverOverlay={false}
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
      ) : isFailed && !activeSheetSrc ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
          <div className="size-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
            <AlertCircle className="size-6 text-white/70" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-white/80 font-medium text-sm">Generation failed</p>
            <p className="text-white/40 text-xs max-w-xs">
              You can upload a custom 3-view turnaround sheet or choose an image from your project assets.
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <Button
              type="button"
              variant="user-menu-filled"
              size="sm"
              onClick={onOpenAssets}
              disabled={isUpdatingSheet}
              className="h-8 text-xs px-3.5 bg-white/10 hover:bg-white/15 text-white"
            >
              <FolderOpen className="size-3.5 mr-1.5" /> Select from assets
            </Button>
          </div>
        </div>
      ) : activeSheetSrc && !imageLoadError ? (
        <div className="w-full h-full flex items-center justify-center relative border-none">
          <MediaItemView
            workflow={workflow}
            item={item}
            src={activeSheetSrc}
            status={item?.status || "completed"}
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
