"use client";

import React, { useState, useRef } from "react";
import { X, Loader2, ChevronLeft, Image, Trash2, Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useCreateElementSheetMutation } from "@/features/workflows/api/workflowsApi";
import { elementService } from "@/features/elements/services/elementService";
import { useWorkflowsStore } from "@/features/workflows";
import { useBatchUploadAssets } from "@/features/media/api/mediaApi";

/**
 * CreateElementModal Component
 * Mockup-aligned modal for creating elements with name and up to 10 source images.
 */
export function CreateElementModal({ isOpen, onClose, projectId, onCreated }) {
  const [name, setName] = useState("");
  const [sourceImages, setSourceImages] = useState([]);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const { mutateAsync: runCreateElement, isPending: isLoading } = useCreateElementSheetMutation({
    onError: (err) => {
      setError(err.message || "Failed to create element");
    }
  });

  const { mutateAsync: uploadBatchToServer } = useBatchUploadAssets();

  const selectedProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const effectiveProjectId = projectId || selectedProjectId;

  const handleRemoveImage = (index) => {
    setSourceImages(sourceImages.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files) => {
    if (sourceImages.length + files.length > 10) {
      setError("Maximum 10 reference images allowed");
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const results = await uploadBatchToServer({
        files,
        projectId: effectiveProjectId,
      });
      const newUrls = results.map(r => r.url).filter(Boolean);
      setSourceImages(prev => [...prev, ...newUrls]);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image(s).");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    await uploadFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Element name is required");
      return;
    }
    if (sourceImages.length === 0) {
      setError("At least 1 reference image is required");
      return;
    }
    if (sourceImages.length > 10) {
      setError("Maximum 10 reference images allowed");
      return;
    }

    setError(null);

    try {
      const payload = elementService.buildCreatePayload({
        name: name.trim(),
        sourceImages,
        projectId: effectiveProjectId,
      });

      const result = await runCreateElement({ payload });

      if (onCreated) onCreated(result);

      // Reset and close
      setName("");
      setSourceImages([]);
      setError(null);
      onClose();

    } catch (err) {
      console.error("[CreateElementModal] Error:", err);
      setError(err.message || "Failed to create element");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md sm:max-w-[480px] overflow-hidden rounded-[28px] border border-white/5 bg-[#121212] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.58)]"
      >
        <DialogTitle className="flex items-center gap-3 text-lg font-bold text-white mb-2">
          <button
            onClick={onClose}
            className="p-1.5 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
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
              className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          {/* Reference Photos Section */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <Label className="text-xs font-bold uppercase tracking-wider text-white/70">
                Source Images
              </Label>
              <span className="text-xs text-white/40 mt-1">
                Upload multiple images from different angles for better results
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
                  ? "border-blue-500 bg-blue-500/10"
                  : "bg-zinc-900/40 hover:bg-zinc-900/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
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
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border border-zinc-800">
                      <Plus className="w-2.5 h-2.5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Text Box */}
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-white">
                  Drag up to 10 image files
                </span>
                <span className="text-xs text-white/50">
                  Or <span className="underline text-white/70 hover:text-white transition-colors">upload a file</span>
                </span>
              </div>
            </div>

            {/* Image Thumbnails Grid */}
            {sourceImages.length > 0 && (
              <div className="border border-white/10 rounded-2xl p-3 bg-zinc-900/20 mt-2">
                <div className="grid grid-cols-3 gap-3">
                  {sourceImages.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/15 bg-zinc-900">
                      <img src={url} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-zinc-800 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-md"
                      >
                        <Trash2 className="w-4 h-4 text-zinc-600 hover:text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-white/30 mt-1">
              {sourceImages.length}/10 photos added. First image will be used as cover thumbnail.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={isLoading || isUploading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl px-6 py-2.5 text-sm font-semibold transition-all"
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
