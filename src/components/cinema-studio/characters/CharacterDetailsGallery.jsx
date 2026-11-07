"use client";

import { useRef, useMemo } from "react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { ReferenceMediaGalleryGrid } from "../common/ReferenceMediaGalleryGrid";
import { FlowCharacterImagePreview } from "./FlowCharacterImagePreview";
import { getAcceptedMimeTypes, CHARACTER_DETAIL_UPLOAD_POLICY } from "@/features/media";
import { isSheetMedia } from "@/features/characters/core/mediaClassification";

/**
 * CharacterDetailsGallery
 * Right stage for the Character detail reference photos view:
 * - Clean display powered by ReferenceMediaGalleryGrid & MediaItemView (authentic aspect ratio, RowsPhotoAlbum)
 * - Empty state uses FlowCharacterImagePreview for selecting details
 * - Actions (Upload & Assets) reside cleanly in CharacterEditNavbar matching ElementEditNavbar
 */
export function CharacterDetailsGallery({
  workflow = null,
  items = [],
  displayDetailImages = [],
  detailPhotos = [],
  primaryMediaId = null,
  pendingUrls = [],
  deletingMediaId = null,
  maxAllowed = 5,
  isAddDisabled = false,
  targetRowHeight,
  showTopActions = false,
  onUploadFiles,
  onOpenAssets,
  onDeleteImage,
  onSetCover,
  isSettingCover = false,
  projectId: _projectId = null,
  className,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onUploadFiles) {
      onUploadFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Harmonize incoming items whether caller passes items, displayDetailImages, or detailPhotos
  const resolvedItems = useMemo(() => {
    let source = [];
    if (items && items.length > 0) source = items;
    else if (displayDetailImages && displayDetailImages.length > 0) source = displayDetailImages;
    else if (detailPhotos && detailPhotos.length > 0) {
      source = detailPhotos.map((p) => p.ref || { id: p.key, url: p.src });
    }
    // Strictly filter out any sheet media, letting explicit roles win over step_id
    return source.filter((m) => !isSheetMedia(m));
  }, [items, displayDetailImages, detailPhotos]);

  // Filter out items without valid URLs or identifiers
  const validItems = useMemo(
    () => resolvedItems.filter((m) => Boolean(m.url || m.file_url || m.asset?.file_url || m.id || m.name)),
    [resolvedItems]
  );

  const atLimit = isAddDisabled || validItems.length >= maxAllowed;

  return (
    <div className={cn("w-full h-full flex flex-col gap-4 border-none", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedMimeTypes(CHARACTER_DETAIL_UPLOAD_POLICY)}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Optional Top Action Buttons (hidden by default since actions live in Navbar) ── */}
      {showTopActions && (
        <div className="flex items-center justify-end gap-2 w-full shrink-0">
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-4 rounded-full bg-white/10 hover:bg-white/15 text-white/60 hover:text-white border-none"
            disabled={atLimit}
            onClick={() => fileInputRef.current?.click()}
            title={atLimit ? "Maximum 5 images autorisées" : "Importer depuis l'ordinateur"}
          >
            <GoogleIcon iconName="upload" className="text-[17px]" />
            <span>Importer</span>
          </Button>

          {onOpenAssets && (
            <Button
              type="button"
              variant="ghost"
            className="h-8 px-4 rounded-full bg-white/10 hover:bg-white/15 text-white/60 hover:text-white border-none"
              disabled={atLimit}
              onClick={onOpenAssets}
              title={atLimit ? "Maximum 5 images autorisées" : "Ajouter à partir du projet"}
            >
              <GoogleIcon iconName="add" className="text-[17px]" />
              <span>Depuis le projet</span>
            </Button>
          )}
        </div>
      )}

      {/* ── Gallery Body: Reference Media Gallery Grid or FlowCharacterImagePreview ── */}
      {validItems.length > 0 ? (
        <ReferenceMediaGalleryGrid
          workflow={workflow}
          items={validItems}
          primaryMediaId={primaryMediaId}
          pendingUrls={pendingUrls}
          deletingMediaId={deletingMediaId}
          maxAllowed={maxAllowed}
          onUploadFiles={onUploadFiles}
          onDeleteImage={onDeleteImage}
          onSetCover={onSetCover}
          isSettingCover={isSettingCover}
          targetRowHeight={targetRowHeight}
        />
      ) : (
        <FlowCharacterImagePreview
          onUpload={() => fileInputRef.current?.click()}
          onSelectProject={() => onOpenAssets && onOpenAssets()}
          isUploading={pendingUrls.length > 0}
        />
      )}
    </div>
  );
}

export default CharacterDetailsGallery;
