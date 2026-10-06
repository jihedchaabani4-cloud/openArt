"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { elementService } from "@/features/elements/services/elementService";
import { useCreateElementSheetMutation } from "@/features/elements/hooks/useElement";
import { useWorkflowsStore } from "@/features/workflows";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";

const CATEGORY_OPTIONS = [
  { id: "auto", label: "Auto", googleIcon: "auto_awesome" },
  { id: "object", label: "Object", googleIcon: "category" },
  { id: "style", label: "Style", googleIcon: "palette" },
  { id: "character", label: "Character", googleIcon: "accessibility_new" },
  { id: "location", label: "Location", googleIcon: "location_on" },
  { id: "font", label: "Font", googleIcon: "match_case" },
  { id: "logo", label: "Logo", googleIcon: "token" },
];

/**
 * NewElementDialog
 * Ultra-clean, borderless, heavy-blur frosted glass modal for creating a new element.
 * Strictly uses predefined SaaS component variants (Button, Dialog, Input, Select, Textarea).
 */
export function NewElementDialog({ open, onOpenChange, projectId: propProjectId }) {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const selectedProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const effectiveProjectId = propProjectId || params?.projectId || selectedProjectId;

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("auto");
  const [description, setDescription] = useState("");
  const [mediaItems, setMediaItems] = useState([]); // [{ url, isVideo, name, file }]
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const { mutateAsync: runCreateElement } = useCreateElementSheetMutation({
    onError: (err) => setError(err.message || "Failed to create element"),
  });

  const resetForm = useCallback(() => {
    setName("");
    setCategory("auto");
    setDescription("");
    setMediaItems([]);
    setActivePreviewIndex(0);
    setIsDragging(false);
    setIsUploading(false);
    setError(null);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen) => {
      if (!isOpen) {
        resetForm();
      }
      onOpenChange?.(isOpen);
    },
    [onOpenChange, resetForm]
  );

  // Process dropped or selected files
  const processFiles = useCallback(
    async (files) => {
      if (!files || !files.length) return;
      setError(null);

      const validFiles = Array.from(files).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
      );

      if (!validFiles.length) {
        setError("Veuillez sélectionner un fichier image ou vidéo valide.");
        return;
      }

      try {
        const remainingSlots = 6 - mediaItems.length;
        if (remainingSlots <= 0) {
          setError("Maximum 6 fichiers autorisés.");
          return;
        }

        const filesToProcess = validFiles.slice(0, remainingSlots);
        const newItems = await Promise.all(
          filesToProcess.map(async (file) => {
            const url = await elementService.readFileAsDataUrl(file);
            return {
              url,
              isVideo: file.type.startsWith("video/"),
              name: file.name,
              file,
            };
          })
        );

        setMediaItems((prev) => {
          const next = [...prev, ...newItems].slice(0, 6);
          return next;
        });
      } catch (err) {
        setError("Erreur lors de la lecture des fichiers.");
      }
    },
    [mediaItems.length]
  );

  const handleFileChange = useCallback(
    async (e) => {
      const files = e.target.files;
      if (files && files.length) {
        await processFiles(files);
      }
      e.target.value = "";
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length) {
        await processFiles(files);
      }
    },
    [processFiles]
  );

  const handleRemoveMedia = useCallback(
    (index, e) => {
      e?.stopPropagation();
      setMediaItems((prev) => {
        const next = prev.filter((_, i) => i !== index);
        if (activePreviewIndex >= next.length) {
          setActivePreviewIndex(Math.max(0, next.length - 1));
        }
        return next;
      });
    },
    [activePreviewIndex]
  );

  // Submit creation
  const handleCreate = useCallback(async () => {
    if (!mediaItems.length) {
      setError("Veuillez ajouter au moins une image ou vidéo.");
      return;
    }

    if (!effectiveProjectId) {
      setError("Projet introuvable.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const finalName = name.trim() || `element_${Math.floor(100 + Math.random() * 900)}`;
      const resolvedType = category === "auto" ? "object" : category;
      const sourceImages = mediaItems.map((m) => m.url);

      const payload = elementService.buildCreatePayload({
        name: finalName,
        sourceImages,
        description: description.trim(),
        elementType: resolvedType,
        projectId: effectiveProjectId,
      });

      const res = await runCreateElement({ payload });
      const elementId =
        res?.workflow?.id ||
        res?.workflow?.name ||
        res?.element?.workflow_id ||
        res?.element?.id ||
        res?.id ||
        res?.name;

      if (effectiveProjectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectData.byProject(effectiveProjectId),
        });
      }

      handleOpenChange(false);

      if (elementId && effectiveProjectId) {
        router.push(`/cinema-studio/${effectiveProjectId}/elements/${elementId}`);
      }
    } catch (err) {
      setError(err?.message || "Échec de la création de l'élément.");
      setIsUploading(false);
    }
  }, [
    mediaItems,
    name,
    category,
    description,
    effectiveProjectId,
    runCreateElement,
    queryClient,
    handleOpenChange,
    router,
  ]);

  const activeMedia = mediaItems[activePreviewIndex] || mediaItems[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        variant="glass"
        showCloseButton={false}
        className="w-full max-w-[960px] h-[610px] max-h-[92vh] flex flex-col p-7 border-none font-sans antialiased text-white select-none"
      >
        {/* ── Dialog Header (Borderless) ── */}
        <div className="flex items-center justify-between w-full mb-4 shrink-0">
          <DialogTitle className="text-[19px] font-semibold text-white tracking-tight">
            New element
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => handleOpenChange(false)}
            className="rounded-full text-white/50 hover:text-white"
          >
            <GoogleIcon iconName="close" className="text-[20px]" />
          </Button>
        </div>

        {/* ── Hidden File Input ── */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* ── Dialog Body (2 Columns, Heavy Blur, Borderless) ── */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* ── Left Column: Media Dropzone & Preview ── */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex-1 min-h-[300px] h-full rounded-[22px] bg-[var(--foreground-state-05,rgba(218,220,224,0.05))] backdrop-blur-[60px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 border-none",
              isDragging && "bg-[var(--foreground-state-15)] scale-[0.995]"
            )}
          >
            {mediaItems.length === 0 ? (
              /* Empty Drop Zone (Borderless Frosted Tile) */
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-[90%] max-w-[440px] h-[280px] rounded-[20px] bg-[var(--foreground-state-05)] hover:bg-[var(--foreground-state-10)] active:bg-[var(--foreground-state-15)]",
                  "flex flex-col items-center justify-center gap-4 transition-all duration-200 cursor-pointer p-8 text-center group border-none",
                  isDragging && "bg-[var(--foreground-state-20)] scale-[1.01] shadow-[0_0_40px_rgba(255,255,255,0.08)]"
                )}
              >
                <div className="size-14 rounded-2xl bg-[var(--foreground-state-10)] group-hover:bg-[var(--foreground-state-15)] backdrop-blur-md flex items-center justify-center text-white/80 group-hover:text-white transition-all shadow-inner">
                  <GoogleIcon iconName="cloud_upload" className="text-[28px]" />
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[15px] font-medium text-white/85 group-hover:text-white transition-colors">
                    Drop image or video here to add to element
                  </span>
                  <span className="text-[12px] text-white/40">
                    Click to browse or drag and drop (Max 6)
                  </span>
                </div>
              </div>
            ) : (
              /* Media Preview Area */
              <div className="w-full h-full flex flex-col p-3 gap-3">
                {/* Hero Preview Frame */}
                <div className="flex-1 min-h-0 w-full relative flex items-center justify-center rounded-[18px] overflow-hidden bg-black/40">
                  {activeMedia?.isVideo ? (
                    <video
                      src={activeMedia.url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={activeMedia?.url}
                      alt={activeMedia?.name || "Preview"}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Remove active button */}
                  <Button
                    type="button"
                    variant="blur"
                    size="icon-sm"
                    onClick={(e) => handleRemoveMedia(activePreviewIndex, e)}
                    className="absolute top-3 right-3 rounded-full"
                    title="Supprimer ce fichier"
                  >
                    <GoogleIcon iconName="close" className="text-[16px]" />
                  </Button>
                </div>

                {/* Thumbnails Row */}
                <div className="h-16 flex items-center gap-2.5 overflow-x-auto custom-scrollbar px-1 py-1 shrink-0">
                  {mediaItems.map((item, idx) => {
                    const isSelected = idx === activePreviewIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActivePreviewIndex(idx)}
                        className={cn(
                          "relative size-14 rounded-[12px] overflow-hidden cursor-pointer shrink-0 border-none transition-all",
                          isSelected
                            ? "ring-2 ring-white/90 scale-105 shadow-lg opacity-100"
                            : "opacity-50 hover:opacity-90"
                        )}
                      >
                        {item.isVideo ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveMedia(idx, e)}
                          className="absolute top-0.5 right-0.5 size-4 rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-black flex items-center justify-center text-[10px] border-none"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  {/* Add more button (if < 6) */}
                  {mediaItems.length < 6 && (
                    <Button
                      type="button"
                      variant="blur"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="size-14 rounded-[12px] flex flex-col items-center justify-center gap-0.5 shrink-0"
                      title="Ajouter un autre fichier"
                    >
                      <GoogleIcon iconName="add" className="text-[20px]" />
                      <span className="text-[10px] font-medium">Add</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Inputs (Category, Name, Description) - Using SaaS Components ── */}
          <div className="w-full md:w-[320px] shrink-0 flex flex-col gap-4 overflow-y-auto pr-0.5 custom-scrollbar">
            {/* 1. Category Field (Predefined Select Component with blur variant) */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-semibold text-[var(--mat-sys-on-surface,#e3e3e3)] pl-0.5">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger variant="blur" className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent align="start" className="w-[var(--radix-select-trigger-width)]">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.id}
                      value={opt.id}
                      icon={<GoogleIcon iconName={opt.googleIcon} className="text-[18px]" />}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Name Field (Predefined Input Component with blurinput variant) */}
            <div className="flex flex-col gap-1 w-full">
              <Input
                variant="blurinput"
                label="Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter element name"
                className="text-[14px]"
              />
              <span className="text-[11.5px] text-[var(--mat-sys-on-surface-variant,#8e918f)] pl-0.5">
                The display name, e.g. Cal, Oli, Elena
              </span>
            </div>

            {/* 3. Description Field (Predefined Textarea Component with blur variant) */}
            <div className="flex flex-col gap-1.5 w-full">
              <Textarea
                variant="blur"
                label="Description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Describe this element (optional)"
                rows={4}
                minHeight={110}
              />
            </div>
          </div>
        </div>

        {/* ── Dialog Footer (Borderless Actions with Predefined Button Variants) ── */}
        <div className="flex items-center justify-between w-full mt-4 pt-1 shrink-0">
          <div className="flex-1 pr-4">
            {error && (
              <span className="text-[13px] text-red-400 font-medium truncate block">
                {error}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={() => handleOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="studio-white"
              size="default"
              onClick={handleCreate}
              disabled={mediaItems.length === 0 || isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create</span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NewElementDialog;
