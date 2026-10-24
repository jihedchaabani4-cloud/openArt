"use client";

import React, { useRef } from "react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { ElementMediaGalleryGrid } from "./ElementMediaGalleryGrid";
import { getAcceptedMimeTypes, ELEMENT_REFERENCE_UPLOAD_POLICY } from "@/features/media";

/**
 * ElementDetailsGallery
 * Right stage for the Element edit view:
 * - Clean header with counter and compact actions (no big clumsy button)
 * - Grid of 1 to 6 reference photos powered by ElementMediaGalleryGrid & MediaItemView
 * - Direct mediaId support on cards with authentic ratio and cover badge
 * - Sleek minimal add tile and empty state
 */
export function ElementDetailsGallery({
  workflow = null,
  items = [],
  primaryMediaId = null,
  pendingUrls = [],
  deletingMediaId = null,
  maxAllowed = 6,
  onUploadFiles,
  onOpenAssets,
  onDeleteImage,
  onSetCover,
  isSettingCover = false,
  projectId = null,
  targetRowHeight,
  showTopActions = true,
  className,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = Math.max(0, maxAllowed - items.length);
    const filesToUpload = files.slice(0, remainingSlots);
    if (filesToUpload.length > 0 && onUploadFiles) {
      onUploadFiles(filesToUpload);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isFull = items.length >= maxAllowed;

  // Filter out items without valid URLs or identifiers
  const validItems = items.filter((m) => Boolean(m.url || m.file_url || m.asset?.file_url || m.id || m.name));

  return (
    <div className={cn("w-full h-full flex flex-col gap-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedMimeTypes(ELEMENT_REFERENCE_UPLOAD_POLICY)}
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
            disabled={isFull}
            onClick={() => !isFull && fileInputRef.current?.click()}
            className={cn(
              "h-8 px-3.5 rounded-full text-[12px] gap-1.5 font-medium transition-all shadow-sm cursor-pointer",
              isFull
                ? "bg-white/5 text-white/30 cursor-not-allowed opacity-50"
                : "bg-white/10 hover:bg-white/15 text-white"
            )}
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
              disabled={isFull}
              onClick={!isFull ? onOpenAssets : undefined}
              className={cn(
                "h-8 px-3 rounded-full text-[12px] gap-1.5 font-medium transition-all cursor-pointer",
                isFull
                  ? "bg-white/5 text-white/20 cursor-not-allowed opacity-50"
                  : "bg-white/5 hover:bg-white/10 text-white/70"
              )}
              title="Ajouter à partir du projet"
            >
              <GoogleIcon iconName="add" className="text-[17px]" />
              <span>Depuis le projet</span>
            </Button>
          )}
        </div>
      )}

      {/* ── Gallery Body: Element Media Gallery Grid or Minimal Empty State ── */}
      {validItems.length > 0 ? (
        <ElementMediaGalleryGrid
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
            Ajoutez jusqu'à 6 images pour définir les caractéristiques visuelles, matériaux et angles de cet élément.
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

export default ElementDetailsGallery;
