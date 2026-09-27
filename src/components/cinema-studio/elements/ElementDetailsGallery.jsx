"use client";

import React, { useRef } from "react";
import { Loader2, X, Star } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { FlowCharacterImagePreview } from "../characters/FlowCharacterImagePreview";

/**
 * ElementDetailsGallery
 * Right stage for the Element edit view:
 * - Grid of 1 to 6 reference photos with hover actions (delete, set cover)
 * - Cover badge styled with neutral studio glass (no purple)
 * - Empty state preview with direct upload & project import buttons
 */
export function ElementDetailsGallery({
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

  const isFull = items.length >= maxAllowed;

  // Filter out items without valid URLs
  const validItems = items.filter((m) => Boolean(m.url || m.file_url || m.asset?.file_url));

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col gap-3",
        validItems.length > 0
          ? "overflow-y-auto custom-scrollbar p-1 max-h-[580px]"
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

      {validItems.length > 0 ? (
        /* Reference Images Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full p-1 overflow-y-auto custom-scrollbar">
          {validItems.map((item, idx) => {
            const src = item.url || item.file_url || item.asset?.file_url;
            const mediaId = item.id || item.name;
            const isCover =
              (primaryMediaId && (mediaId === primaryMediaId || item.asset_id === primaryMediaId)) ||
              idx === 0;
            const isDeletingThis = deletingMediaId === mediaId;
            const isAddingThis = pendingUrls.includes(src);
            const isLoadingThis = isDeletingThis || isAddingThis;

            return (
              <div
                key={mediaId || src || idx}
                className="group/card relative overflow-hidden rounded-xl bg-zinc-900 border border-white/10 w-full aspect-[4/3] flex items-center justify-center shrink-0 shadow-md"
              >
                <img
                  src={src}
                  alt={`Element reference ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105 rounded-xl"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/30 transition-colors duration-200" />

                {/* Primary / Cover Badge — Neutral Studio Glass */}
                {isCover && (
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/15 text-white/90 text-[10.5px] font-medium shadow-sm backdrop-blur-md">
                    <Star className="size-3 text-amber-400 fill-amber-400" />
                    <span>Couverture</span>
                  </div>
                )}

                {/* Hover Actions: Set as Cover & Delete */}
                {!isLoadingThis && (
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    {!isCover && onSetCover && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onSetCover(mediaId)}
                        disabled={isSettingCover}
                        className="h-7 px-2.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/80 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all backdrop-blur-md border border-white/10 cursor-pointer"
                        title="Définir comme image principale"
                      >
                        <Star className="size-3" />
                        <span className="hidden sm:inline">Couverture</span>
                      </Button>
                    )}

                    {onDeleteImage && (
                      <Button
                        type="button"
                        variant="studio-overlay-icon"
                        size="icon-xs"
                        onClick={() => onDeleteImage(item)}
                        className="size-7 rounded-lg bg-black/60 hover:bg-red-500/80 text-white/80 hover:text-white transition-colors cursor-pointer"
                        title="Supprimer l'image"
                      >
                        <X className="size-3.5 stroke-[2.5]" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Loading spinner overlay */}
                {isLoadingThis && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
                    <Loader2 className="size-6 text-white animate-spin" />
                  </div>
                )}
              </div>
            );
          })}

          {/* "+ Add more image" dashed card */}
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
                onClick={() => onOpenAssets && onOpenAssets()}
                className="w-full max-w-[155px]"
                title="Ajouter à partir du projet"
              >
                <GoogleIcon iconName="add" className="text-[16px]" />
                <span>Depuis le projet</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <FlowCharacterImagePreview
          onUpload={() => !isFull && fileInputRef.current?.click()}
          onSelectProject={() => !isFull && onOpenAssets && onOpenAssets()}
          isUploading={pendingUrls.length > 0}
          text="Ajoutez des images de référence pour votre élément"
        />
      )}
    </div>
  );
}

export default ElementDetailsGallery;
