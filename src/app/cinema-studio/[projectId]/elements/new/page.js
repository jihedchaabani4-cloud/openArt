"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Plus, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { NavbarCore, NavbarInput } from "@/widgets/NavbarCore";
import { useNewElement } from "@/features/elements";
import { ELEMENT_TYPES } from "@/features/workflows/model/elementSheetConfig";
import { ImportMediaDialog } from "@/widgets/ImportMediaDialog/ImportMediaDialog";
import { cn } from "@/shared/lib/utils";

const SAMPLE_FACES = [
  "https://www.krea.ai/_app/2ef422f246a7f9e2/immutable/assets/face_3.BsghTrki.webp",
  "https://www.krea.ai/_app/2ef422f246a7f9e2/immutable/assets/face_2.D1RW4rY-.webp",
  "https://www.krea.ai/_app/2ef422f246a7f9e2/immutable/assets/face_1.Cndx8lVo.webp",
];

function StackedPhotos({ images = [] }) {
  const frames = images.length > 0 ? images.slice(0, 3) : SAMPLE_FACES;
  const transforms = [
    "-translate-x-14 -translate-y-3 -rotate-12",
    "translate-x-16 -translate-y-2 rotate-12",
    "",
  ];
  return (
    <div className="relative h-28 w-20">
      {frames.map((src, i) => (
        <div
          key={i}
          style={{ zIndex: i }}
          className={cn(
            "absolute top-0 h-28 w-20 overflow-hidden rounded-2xl border-4 border-white bg-black/25 shadow-xl backdrop-blur-md transition-transform duration-500 ease-out",
            transforms[i]
          )}
        >
          <div
            className="h-full w-full bg-cover bg-center opacity-100"
            style={{ backgroundImage: `url("${src}")` }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * NewElementPage
 * Presentational page for creating a new Element.
 * All logic (drag-and-drop, photo reading, state, upload) lives in useNewElement.
 */
export default function NewElementPage() {
  const {
    name,
    setName,
    elementType,
    setElementType,
    error,
    setError,
    loadingWorkflowId,
    isDragging,
    isUploading,
    isAnyLoading,
    isAssetsOpen,
    setIsAssetsOpen,
    previewImages,
    fileInputRef,
    photos,
    isProjectLoading,
    projectData,
    existingSheets,
    goBack,
    createFromWorkflow,
    handleSelectAssets,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useNewElement();

  return (
    <div className="flex flex-col h-full w-full bg-studio-dark text-white overflow-hidden">
      {/* ── Navbar ── */}
      <NavbarCore
        onBack={goBack}
        backLabel={existingSheets && existingSheets.length > 0 ? "Back to elements" : "Back to studio"}
        left={
          <NavbarInput
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="New element"
          />
        }
      />

      {/* ── Body ── */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden pt-[80px] custom-scrollbar"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Upload Card ── */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative w-full overflow-hidden rounded-2xl bg-[oklch(26.9%_0_0)] px-6 py-12 sm:px-10"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <StackedPhotos images={previewImages} />
              <div className="flex max-w-sm flex-col items-center gap-2">
                <h1 className="text-2xl font-medium tracking-tight text-white">
                  Add images to this element
                </h1>
                <p className="text-white/45 text-sm leading-5">
                  Upload multiple images from different angles for better results.
                </p>
              </div>

              {/* ── Category Type Selector ── */}
              <div className="flex items-center justify-center gap-2 flex-wrap bg-white/5 p-1.5 rounded-full border border-white/10">
                {ELEMENT_TYPES.map((t) => {
                  const isSelected = elementType === t.id;
                  return (
                    <Button
                      key={t.id}
                      type="button"
                      variant={isSelected ? "pill-active" : "pill"}
                      onClick={() => setElementType(t.id)}
                      className="gap-1.5"
                    >
                      <GoogleIcon iconName={t.googleIcon} className="text-[15px]" />
                      <span>{t.label}</span>
                    </Button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnyLoading}
                  className="w-52 rounded-full"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                  <span>{isUploading ? "Creating..." : "Upload"}</span>
                </Button>
              </div>
            </div>

            {/* Drag overlay inside card */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl border-2 border-white/40 bg-white/10 flex items-center justify-center pointer-events-none z-10 backdrop-blur-sm"
                >
                  <span className="text-white text-sm font-medium">Drop images here</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Workflow Gallery ── */}
          {!isProjectLoading && photos.length > 0 && (
            <div className="flex flex-col gap-4 pt-6 w-full">
              <p className="text-xs font-medium text-white uppercase tracking-wider">
                Add your generated media
              </p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full"
              >
                <div className="flex flex-wrap gap-2.5 items-start w-full">
                  {photos.map((photo) => {
                    const wf = photo.workflow;
                    const isThisLoading = loadingWorkflowId === (wf.id || wf.name);
                    return (
                      <div
                        key={photo.key}
                        className="relative group overflow-hidden rounded-xl bg-zinc-900 border border-white/10 shrink-0 max-h-[220px] cursor-pointer"
                        onClick={() =>
                          !isAnyLoading && createFromWorkflow(wf, photo.primaryMediaUrl)
                        }
                      >
                        <img
                          src={photo.primaryMediaUrl}
                          alt={photo.label}
                          className="w-auto h-auto max-h-[220px] max-w-full object-contain transition-transform duration-300 group-hover:scale-105 rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                          {isThisLoading ? (
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                          ) : (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                              <Plus className="w-5 h-5 text-black" />
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <p className="text-xs text-white font-medium truncate">{photo.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      <ImportMediaDialog
        open={isAssetsOpen}
        onOpenChange={setIsAssetsOpen}
        onSelect={handleSelectAssets}
        library={projectData?.projectContents?.media || []}
        mode="image"
        maxAllowed={6}
        selectedItems={previewImages}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.12);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>
  );
}