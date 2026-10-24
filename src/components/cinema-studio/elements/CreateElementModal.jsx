"use client";

import React from "react";
import { ChevronLeft, Image, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useCreateElementForm } from "@/features/elements";
import { getAcceptedMimeTypes, ELEMENT_REFERENCE_UPLOAD_POLICY } from "@/features/media";

/**
 * CreateElementModal Component
 * Pure presentation dialog for creating elements.
 * All logic and mutations are driven by useCreateElementForm.
 */
export function CreateElementModal({ isOpen, onClose, projectId, onCreated }) {
  const {
    name,
    setName,
    referenceImages,
    error,
    setError,
    isUploading,
    isDragging,
    isLoading,
    fileInputRef,
    handleRemoveImage,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleCreate,
  } = useCreateElementForm({ projectId, onCreated, onClose });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md sm:max-w-[480px] overflow-hidden rounded-[28px] border border-white/5 bg-[var(--mat-dialog-container-color)] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.58)]"
      >
        <DialogTitle className="flex items-center gap-3 text-lg font-bold text-white mb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="p-1.5 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span>Create Element</span>
        </DialogTitle>

        {/* Modal Body */}
        <div className="flex flex-col gap-6 mt-4">
          {/* Element Name Input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="element-name" className="text-xs font-bold uppercase tracking-wider text-white/70">
              Name*
            </Label>
            <Input
              id="element-name"
              type="text"
              placeholder="@Sarah"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-white/40 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all"
            />
          </div>

          {/* Reference Photos Section */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <Label className="text-xs font-bold uppercase tracking-wider text-white/70">
                Reference Images
              </Label>
              <span className="text-xs text-white/40 mt-1">
                Upload 1 to 6 images from different angles for better results
              </span>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-white/10 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                isDragging
                  ? "border-white/40 bg-white/10"
                  : "bg-zinc-900/40 hover:bg-zinc-900/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={getAcceptedMimeTypes(ELEMENT_REFERENCE_UPLOAD_POLICY)}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Icon Box */}
              <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-white/70 animate-spin" />
                ) : (
                  <div className="relative">
                    <Image className="w-6 h-6 text-white/70" />
                    <div className="absolute -bottom-1 -right-1 bg-white/20 text-white rounded-full p-0.5 border border-zinc-800">
                      <Plus className="w-2.5 h-2.5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Text Box */}
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-white">
                  Drag up to 6 image files
                </span>
                <span className="text-xs text-white/50">
                  Or <span className="underline text-white/70 hover:text-white transition-colors">upload a file</span>
                </span>
              </div>
            </div>

            {/* Image Thumbnails Grid */}
            {referenceImages.length > 0 && (
              <div className="border border-white/10 rounded-2xl p-3 bg-zinc-900/20 mt-2">
                <div className="grid grid-cols-3 gap-3">
                  {referenceImages.map((img, idx) => {
                    const src = typeof img === "string" ? img : (img?.previewUrl || img?.url || "");
                    return (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/15 bg-zinc-900">
                        <img src={src} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white text-zinc-800 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-md"
                        >
                          <Trash2 className="w-4 h-4 text-zinc-600 hover:text-red-600" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[10px] text-white/30 mt-1">
              {referenceImages.length}/6 photos added. First image will be used as cover thumbnail.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
              {error}
            </div>
          )}

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCreate}
              disabled={isLoading || isUploading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                "Save Element"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateElementModal;
