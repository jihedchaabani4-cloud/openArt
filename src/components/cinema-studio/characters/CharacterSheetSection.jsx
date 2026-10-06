"use client";

import React, { useRef } from "react";
import { Loader2, AlertCircle, FolderOpen } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { FlowCharacterImagePreview } from "./FlowCharacterImagePreview";

/**
 * CharacterSheetSection
 * Renders View A: The character's 3-view turnaround sheet,
 * including hover action buttons and the empty state preview.
 */
export function CharacterSheetSection({
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

  return (
    <div className="w-full h-full flex items-center justify-center relative">
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
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="size-8 text-violet-400 animate-spin" />
          <p className="text-white/50 text-sm">Generating character sheet…</p>
          <p className="text-white/25 text-xs">3-view turnaround in progress</p>
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
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="relative inline-flex max-w-full max-h-[520px] rounded-xl overflow-hidden group/sheet">
            <img
              src={activeSheetSrc}
              alt="Character Sheet 3-View Turnaround"
              onError={() => setImageLoadError(true)}
              className="w-auto h-auto max-h-[520px] max-w-full object-contain rounded-xl"
            />

            {isUpdatingSheet && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-40 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-7 text-white animate-spin" />
                <span className="text-xs text-white/80">Updating…</span>
              </div>
            )}

            {/* Top-Right Floating Overlay Action Buttons anchored to image (visible on hover) */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-30 opacity-0 group-hover/sheet:opacity-100 transition-opacity duration-200">
              <Button
                type="button"
                variant="flow-overlay-action"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                title="Importer une image de corps (Turnaround)"
              >
                <GoogleIcon iconName="upload" className="text-[1.25rem]" />
              </Button>
              <Button
                type="button"
                variant="flow-overlay-action"
                size="icon"
                onClick={onOpenAssets}
                title="Select Body Sheet from assets"
              >
                <GoogleIcon iconName="folder_open" className="text-[1.25rem]" />
              </Button>
              <Button
                type="button"
                variant="flow-overlay-action"
                size="icon"
                onClick={onDownload}
                title="Download character sheet"
              >
                <GoogleIcon iconName="download" className="text-[1.25rem]" />
              </Button>
              <Button
                type="button"
                variant="flow-overlay-action"
                size="icon"
                onClick={onDelete}
                title="Delete character"
              >
                <GoogleIcon iconName="delete" className="text-[1.25rem]" />
              </Button>
            </div>
          </div>
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
