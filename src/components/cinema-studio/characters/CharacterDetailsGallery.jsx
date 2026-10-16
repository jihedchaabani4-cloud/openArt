"use client";

import { useRef, useMemo } from "react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { CharacterMediaGalleryGrid } from "./CharacterMediaGalleryGrid";

/**
 * CharacterDetailsGallery
 * Right stage for the Character detail reference photos view:
 * - Clean header with compact action buttons conforming to studio standard
 * - Grid of reference photos powered by CharacterMediaGalleryGrid & MediaItemView
 * - Authentic aspect ratio with zero crop, RowsPhotoAlbum layout, and hover action buttons
 * - Sleek minimal studio empty state
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
  targetRowHeight,
  showTopActions = true,
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
    if (items && items.length > 0) return items;
    if (displayDetailImages && displayDetailImages.length > 0) return displayDetailImages;
    if (detailPhotos && detailPhotos.length > 0) {
      return detailPhotos.map((p) => p.ref || { id: p.key, url: p.src });
    }
    return [];
  }, [items, displayDetailImages, detailPhotos]);

  // Filter out items without valid URLs or identifiers
  const validItems = useMemo(
    () => resolvedItems.filter((m) => Boolean(m.url || m.file_url || m.asset?.file_url || m.id || m.name)),
    [resolvedItems]
  );

  return (
    <div className={cn("w-full h-full flex flex-col gap-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── Gallery Action Buttons ── */}
      {showTopActions && (
        <div className="flex items-center justify-end gap-2 w-full shrink-0">
          <Button
            type="button"
            variant="blur"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 px-3.5 rounded-full text-[12px] gap-1.5 font-medium bg-white/10 hover:bg-white/15 text-white transition-all shadow-sm cursor-pointer"
            title="Importer depuis l'ordinateur"
          >
            <GoogleIcon iconName="upload" className="text-[17px]" />
            <span>Importer</span>
          </Button>

          {onOpenAssets && (
            <Button
              type="button"
              variant="blur"
              size="sm"
              onClick={onOpenAssets}
              className="h-8 px-3 rounded-full text-[12px] gap-1.5 font-medium bg-white/5 hover:bg-white/10 text-white/70 transition-all cursor-pointer"
              title="Ajouter à partir du projet"
            >
              <GoogleIcon iconName="add" className="text-[17px]" />
              <span>Depuis le projet</span>
            </Button>
          )}
        </div>
      )}

      {/* ── Gallery Body: Character Media Gallery Grid or Minimal Empty State ── */}
      {validItems.length > 0 ? (
        <CharacterMediaGalleryGrid
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
        /* Minimal sleek studio empty state (no big clumsy banner) */
        <div className="w-full flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/40 shadow-inner">
            <GoogleIcon iconName="photo_library" className="text-[28px]" />
          </div>
          <h4 className="text-base font-medium text-white/80 mb-1">
            Aucune image de référence
          </h4>
          <p className="text-xs text-white/40 max-w-sm mb-6 leading-relaxed">
            Ajoutez jusqu'à {maxAllowed} images pour définir les caractéristiques visuelles, vêtements et angles de ce personnage.
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="studio-white"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-4 rounded-full text-xs font-medium flex items-center gap-2 cursor-pointer border-none"
            >
              <GoogleIcon iconName="upload" className="text-[16px]" />
              <span>Importer</span>
            </Button>

            {onOpenAssets && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onOpenAssets}
                className="h-9 px-4 rounded-full text-xs font-medium flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <GoogleIcon iconName="add" className="text-[16px]" />
                <span>Depuis le projet</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterDetailsGallery;
