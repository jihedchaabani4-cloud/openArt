"use client";

import React, { useRef } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { FlowCharacterImagePreview } from "./FlowCharacterImagePreview";

/**
 * CharacterDetailsGallery
 * Renders View B: Character detail reference photos (up to 5),
 * grid layout, delete buttons, add image card, and empty state preview.
 */
export function CharacterDetailsGallery({
  detailPhotos = [],
  displayDetailImages = [],
  pendingUrls = [],
  deletingMediaId = null,
  maxAllowed = 5,
  onUploadFiles,
  onOpenAssets,
  onDeleteImage,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUploadFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isFull = displayDetailImages.length >= maxAllowed;

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col gap-3",
        detailPhotos.length > 0
          ? "overflow-y-auto custom-scrollbar p-1 max-h-[540px]"
          : "items-center justify-center p-0"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {detailPhotos.length > 0 ? (
        <>
          {/* Header Bar with Counter and Action Buttons */}
          <div className="flex items-center justify-between px-1 py-1 w-full shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium font-['Google_Sans_Text',sans-serif] text-white/70">
                Photos de référence
              </span>
              <span className="text-[11.5px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium">
                {displayDetailImages.length} / {maxAllowed}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Button 1: Importer (Upload from device) */}
              <Button
                type="button"
                variant="blur"
                size="sm"
                disabled={isFull}
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3.5 rounded-full text-[12px] gap-1.5 font-medium bg-white/10 hover:bg-white/15 text-white transition-all shadow-sm"
                title="Importer une image depuis l'ordinateur"
              >
                <GoogleIcon iconName="upload" className="text-[17px]" />
                <span>Importer</span>
              </Button>

              {/* Button 2: Depuis le projet (Assets) */}
              <Button
                type="button"
                variant="blur"
                size="sm"
                disabled={isFull}
                onClick={() => onOpenAssets()}
                className="h-8 px-3 rounded-full text-[12px] gap-1.5 font-medium bg-white/5 hover:bg-white/10 text-white/70 transition-all"
                title="Ajouter depuis les assets du projet"
              >
                <GoogleIcon iconName="add" className="text-[17px]" />
                <span className="hidden sm:inline">Projet</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full p-1 overflow-y-auto custom-scrollbar">
            {detailPhotos.map((photo) => {
              const mediaId = photo.ref?.id;
              const isDeletingThis = deletingMediaId === mediaId;
              const isAddingThis = pendingUrls.includes(photo.src);
              const isLoadingThis = isDeletingThis || isAddingThis;

              return (
                <div
                  key={photo.key}
                  className="group/card relative overflow-hidden rounded-xl bg-zinc-900 border border-white/10 w-full aspect-[4/3] flex items-center justify-center shrink-0"
                >
                  <img
                    src={photo.src}
                    alt="Character detail"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105 rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/25 transition-colors duration-200" />

                  {!isLoadingThis && (
                    <Button
                      type="button"
                      variant="studio-overlay-icon"
                      size="icon-xs"
                      onClick={() => onDeleteImage(photo.ref)}
                      className="absolute top-2 right-2 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <X className="size-3.5 stroke-[2.5]" />
                    </Button>
                  )}

                  {isLoadingThis && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
                      <Loader2 className="size-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add more image card in grid with direct Importer & Project options */}
            {!isFull && (
              <div className="group/addcard relative overflow-hidden rounded-xl border border-dashed border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all w-full aspect-[4/3] flex flex-col items-center justify-center gap-2.5 p-3 text-center select-none">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-[155px]"
                  title="Importer depuis l'ordinateur"
                >
                  <GoogleIcon iconName="upload" className="text-[18px]" />
                  <span>Importer</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenAssets()}
                  className="w-full max-w-[155px]"
                  title="Ajouter à partir du projet"
                >
                  <GoogleIcon iconName="add" className="text-[16px]" />
                  <span>Depuis le projet</span>
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <FlowCharacterImagePreview
          onUpload={() => !isFull && fileInputRef.current?.click()}
          onSelectProject={() => !isFull && onOpenAssets()}
          isUploading={pendingUrls.length > 0}
        />
      )}
    </div>
  );
}

export default CharacterDetailsGallery;
