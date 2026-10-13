"use client";

import React, { useRef } from "react";
import { Loader2, Star, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { ButtonGroup } from "@/shared/ui/button-group";
import { ActionBtn } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn";
import { CoreMediaItemView } from "@/widgets/CoreMediaItemView";
import { getItemMetadata } from "@/shared/lib/displayUtils";
import { cn } from "@/shared/lib/utils";
import { FlowCharacterImagePreview } from "../characters/FlowCharacterImagePreview";

/**
 * ElementDetailsGallery
 * Right stage for the Element edit view:
 * - Studio-aligned media grid built on CoreMediaItemView
 * - Neutral glass ActionBtn ButtonGroup for hover actions (set cover, delete)
 * - Couverture badge for primary cover photo
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
        "w-full h-full flex flex-col gap-4",
        validItems.length > 0
          ? "p-1"
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
        <>
          {/* Header Bar with Counter and Action Buttons */}
          <div className="flex items-center justify-between px-1 py-1 w-full shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium font-sans antialiased text-white/70">
                Photos de référence
              </span>
              <span className="text-[11.5px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium">
                {validItems.length} / {maxAllowed}
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
                className="h-8 px-3.5 rounded-full text-[12px] gap-1.5 font-medium bg-white/10 hover:bg-white/15 text-white transition-all shadow-sm cursor-pointer disabled:pointer-events-none disabled:opacity-50"
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
                onClick={() => onOpenAssets && onOpenAssets()}
                className="h-8 px-3 rounded-full text-[12px] gap-1.5 font-medium bg-white/5 hover:bg-white/10 text-white/70 transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                title="Ajouter depuis les assets du projet"
              >
                <GoogleIcon iconName="add" className="text-[17px]" />
                <span className="hidden sm:inline">Projet</span>
              </Button>
            </div>
          </div>

          {/* Reference Images Grid Powered by CoreMediaItemView */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full p-1">
            {validItems.map((item, idx) => {
              const src = item.url || item.file_url || item.asset?.file_url;
              const mediaId = item.id || item.name;
              const isCover =
                (primaryMediaId && (mediaId === primaryMediaId || item.asset_id === primaryMediaId)) ||
                idx === 0;
              const isDeletingThis = deletingMediaId === mediaId;
              const isAddingThis = pendingUrls.includes(src);
              const isLoadingThis = isDeletingThis || isAddingThis;

              const meta = getItemMetadata(item);
              const aspect = meta?.aspect && meta.aspect !== "auto" ? meta.aspect : "3/4";

              return (
                <CoreMediaItemView
                  key={mediaId || src || idx}
                  item={item}
                  src={src}
                  status={item.status || "completed"}
                  aspect={aspect}
                  fit="cover"
                  className="rounded-xl border-none shadow-xl transition-all duration-300 group hover:shadow-2xl overflow-hidden bg-black/40"
                  style={{
                    aspectRatio: aspect,
                  }}
                  topLeft={
                    isCover ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/15 text-white/90 text-[10.5px] font-medium shadow-sm backdrop-blur-md">
                        <Star className="size-3 text-amber-400 fill-amber-400" />
                        <span>Couverture</span>
                      </div>
                    ) : null
                  }
                  topRight={
                    !isLoadingThis ? (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                        <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg border-0 border-none scale-90 origin-top-right">
                          {!isCover && onSetCover && (
                            <ActionBtn
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetCover(mediaId);
                              }}
                              disabled={isSettingCover}
                              title="Définir comme image principale"
                            >
                              <Star className="size-3.5 text-[#303031]" />
                            </ActionBtn>
                          )}
                          {onDeleteImage && (
                            <ActionBtn
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteImage(item);
                              }}
                              title="Supprimer l'image"
                            >
                              <Trash2 className="size-3.5 text-[#303031] hover:text-red-500" />
                            </ActionBtn>
                          )}
                        </ButtonGroup>
                      </div>
                    ) : null
                  }
                  overlay={
                    isLoadingThis ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center pointer-events-auto">
                        <Loader2 className="size-6 text-white animate-spin" />
                      </div>
                    ) : null
                  }
                />
              );
            })}

            {/* "+ Add more image" Studio Dashed Card */}
            {!isFull && (
              <div
                className="group/addcard relative overflow-hidden rounded-xl border border-dashed border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all w-full flex flex-col items-center justify-center gap-2.5 p-3 text-center select-none shadow-xl"
                style={{ aspectRatio: "3/4" }}
              >
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
        </>
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
