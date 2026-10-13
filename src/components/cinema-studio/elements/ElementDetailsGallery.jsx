"use client";

import React, { useRef } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem";

/**
 * ElementDetailsGallery
 * Right stage for the Element edit view:
 * - Clean header with counter and compact actions (no big button)
 * - Grid of 1 to 6 reference photos powered by MediaGridItem
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

  const isFull = items.length >= maxAllowed;

  // Filter out items without valid URLs or identifiers
  const validItems = items.filter((m) => Boolean(m.url || m.file_url || m.asset?.file_url || m.id || m.name));

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

      {/* ── Gallery Header: Title, Counter & Action Buttons ── */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 w-full shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-white/90 tracking-wide">
            Images de référence
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/5">
            {validItems.length} / {maxAllowed}
          </span>
        </div>

        {!isFull && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              title="Importer depuis l'ordinateur"
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
                className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                title="Ajouter à partir du projet"
              >
                <GoogleIcon iconName="add" className="text-[16px]" />
                <span>Depuis le projet</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Gallery Body: Media Grid or Minimal Empty State ── */}
      {validItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full overflow-y-auto custom-scrollbar p-1">
          {validItems.map((item, idx) => {
            const mediaId = item.id || item.name || item.asset_id;
            const isCover =
              (primaryMediaId && (mediaId === primaryMediaId || item.asset_id === primaryMediaId)) ||
              idx === 0;
            const isDeletingThis = deletingMediaId === mediaId;
            const isAddingThis = pendingUrls.includes(item.url || item.file_url);
            const isLoadingThis = isDeletingThis || isAddingThis;

            const customMenuItems = [
              ...(!isCover && onSetCover
                ? [
                    {
                      key: "set-cover",
                      label: "Définir comme couverture",
                      icon: "star",
                      onClick: () => onSetCover(mediaId),
                    },
                  ]
                : []),
              ...(onDeleteImage
                ? [
                    {
                      key: "delete-img",
                      label: "Supprimer l'image",
                      icon: "delete",
                      variant: "destructive",
                      onClick: () => onDeleteImage(item),
                    },
                  ]
                : []),
            ];

            return (
              <div
                key={mediaId || idx}
                className="relative group/elem-tile rounded-xl overflow-hidden aspect-[4/3] bg-zinc-900 shadow-md"
              >
                <MediaGridItem
                  workflow={workflow}
                  item={item}
                  mediaId={mediaId}
                  projectId={projectId}
                  aspect="4/3"
                  className="w-full h-full rounded-xl border-none shadow-none"
                  menuItems={customMenuItems}
                  topLeft={
                    isCover ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/15 text-white/90 text-[10.5px] font-medium shadow-sm backdrop-blur-md select-none pointer-events-none">
                        <Star className="size-3 text-amber-400 fill-amber-400" />
                        <span>Couverture</span>
                      </div>
                    ) : null
                  }
                />

                {/* Loading overlay for pending / deleting */}
                {isLoadingThis && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center rounded-xl">
                    <Loader2 className="size-6 text-white animate-spin" />
                  </div>
                )}
              </div>
            );
          })}

          {/* "+ Add" dashed tile inside grid */}
          {!isFull && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group/addtile relative rounded-xl border border-dashed border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all aspect-[4/3] flex flex-col items-center justify-center gap-2 cursor-pointer select-none"
              title="Ajouter une image de référence"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 group-hover/addtile:bg-white/10 flex items-center justify-center transition-colors">
                <GoogleIcon
                  iconName="add"
                  className="text-[20px] text-white/50 group-hover/addtile:text-white"
                />
              </div>
              <span className="text-xs font-medium text-white/50 group-hover/addtile:text-white transition-colors">
                Ajouter une image
              </span>
            </div>
          )}
        </div>
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
