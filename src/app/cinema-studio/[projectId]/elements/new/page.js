"use client";

import React, { useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, FolderOpen, Plus, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { UserDropdown } from "@/widgets/StudioNavbar/ui/UserDropdown";
import { ImportMediaDialog } from "@/widgets/ImportMediaDialog/ImportMediaDialog";
import { useCreateElementSheetMutation, useElementSheetWorkflows, useProjectData } from "@/features/workflows/api/workflowsApi";
import { useWorkflowsStore } from "@/features/workflows";
import { getPrimaryMedia } from "@/shared/lib/generationUtils";
import { getItemMetadata } from "@/shared/lib/displayUtils";
import { ELEMENT_TYPES } from "@/features/workflows/model/elementSheetConfig";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";

const SAMPLE_FACES = [
  "https://www.krea.ai/_app/2ef422f246a7f9e2/immutable/assets/face_3.BsghTrki.webp",
  "https://www.krea.ai/_app/2ef422f246a7f9e2/immutable/assets/face_2.D1RW4rY-.webp",
  "https://www.krea.ai/_app/2ef422f246a7f9e2/immutable/assets/face_1.Cndx8lVo.webp",
];

function StackedPhotos({ images }) {
  const frames = images.length > 0 ? images.slice(0, 3) : SAMPLE_FACES;
  const transforms = ["-translate-x-14 -translate-y-3 -rotate-12", "translate-x-16 -translate-y-2 rotate-12", ""];
  return (
    <div className="relative h-28 w-20">
      {frames.map((src, i) => (
        <div key={i} style={{ zIndex: i }} className={"absolute top-0 h-28 w-20 overflow-hidden rounded-2xl border-4 border-white bg-black/25 shadow-xl backdrop-blur-md transition-transform duration-500 ease-out " + transforms[i]}>
          <div className="h-full w-full bg-cover bg-center opacity-100" style={{ backgroundImage: 'url("' + src + '")' }} />
        </div>
      ))}
    </div>
  );
}

const generateDefaultElementName = () => "element" + Math.floor(100 + Math.random() * 900);

export default function NewElementPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const [name, setName] = useState("");
  const [elementType, setElementType] = useState("object");
  const [error, setError] = useState(null);
  const [loadingWorkflowId, setLoadingWorkflowId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const fileInputRef = useRef(null);

  const { mutateAsync: runCreateElement } = useCreateElementSheetMutation({
    onError: (err) => setError(err.message || "Failed to create element"),
  });
  const selectedProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const effectiveProjectId = projectId || selectedProjectId;

  const { workflows: existingSheets } = useElementSheetWorkflows(effectiveProjectId);
  const { data: projectData, isLoading: isProjectLoading } = useProjectData(effectiveProjectId);

  const goBack = () => {
    if (existingSheets && existingSheets.length > 0) {
      router.push('/cinema-studio/' + effectiveProjectId + '/elements');
    } else {
      router.push('/cinema-studio/' + effectiveProjectId + '/generations');
    }
  };

  // Photos formatted with actual aspect ratio for RowsPhotoAlbum (same as generations page)
  const photos = useMemo(() => {
    const rawWorkflows = projectData?.projectContents?.workflows || [];
    const rawMedia = projectData?.projectContents?.media || [];

    const workflowPhotos = rawWorkflows
      .filter((wf) => wf.workflow_type !== "ELEMENT_SHEET")
      .reduce((acc, wf, i) => {
        const items = rawMedia
          .filter((m) => m.workflowId === wf.name || m.workflowId === wf.id)
          .map((m) => ({ ...m, id: m.id || m.name }));
        const withItems = { ...wf, items };
        const primary = getPrimaryMedia(withItems);
        if (!primary) return acc;

        const meta = getItemMetadata(primary, withItems);
        const aspect = meta?.aspect || "3/4";
        const [wStr, hStr] = aspect.split("/");
        const wNum = parseFloat(wStr) || 3;
        const hNum = parseFloat(hStr) || 4;
        const BASE = 1200;
        const width = Math.round(BASE * (wNum / Math.max(wNum, hNum)));
        const height = Math.round(BASE * (hNum / Math.max(wNum, hNum)));

        const url = meta?.url || primary.url || primary.file_url || primary.asset?.file_url;
        if (!url) return acc;

        const label = wf.metadata?.displayName || wf.display_name || wf.name || "Untitled";

        acc.push({
          src: url,
          width,
          height,
          key: wf.id || wf.name || String(i),
          workflow: withItems,
          thumbUrl: url,
          label,
        });
        return acc;
      }, []);

    const mediaPhotos = rawMedia
      .filter((m) => (m.url || m.file_url || m.src) && m.workflow_type !== "ELEMENT_SHEET")
      .map((m, i) => {
        const url = m.url || m.file_url || m.src;
        return {
          src: url,
          width: 1200,
          height: 900,
          key: m.id || m.name || `media-${i}`,
          workflow: { id: m.workflowId || m.id, items: [m] },
          thumbUrl: url,
          label: m.name || "Media Item",
        };
      });

    const combined = [...workflowPhotos];
    const seen = new Set(combined.map((p) => p.src));
    for (const p of mediaPhotos) {
      if (!seen.has(p.src)) {
        seen.add(p.src);
        combined.push(p);
      }
    }
    return combined;
  }, [projectData]);

  // Dynamic natural dimensions for generated media photos to preserve original aspect ratio
  const [genDimensions, setGenDimensions] = React.useState({});

  React.useEffect(() => {
    photos.forEach((p) => {
      if (!p.src || genDimensions[p.src]) return;
      const img = new window.Image();
      img.onload = () => {
        setGenDimensions((prev) => ({
          ...prev,
          [p.src]: { width: img.naturalWidth || 1, height: img.naturalHeight || 1 },
        }));
      };
      img.src = p.src;
    });
  }, [photos]);

  const formattedPhotos = React.useMemo(() => {
    return photos.map((p) => {
      const dims = genDimensions[p.src];
      return {
        ...p,
        width: dims?.width || p.width,
        height: dims?.height || p.height,
      };
    });
  }, [photos, genDimensions]);

  const createAndRedirect = async (urls) => {
    if (!urls || !urls.length) return;
    if (!effectiveProjectId) {
      setError("Project ID is missing. Please select a valid project.");
      return;
    }
    setError(null);
    try {
      const elementName = name.trim() || generateDefaultElementName();
      const res = await runCreateElement({
        payload: { name: elementName, sourceImages: urls, projectId: effectiveProjectId, element_type: elementType },
      });
      const elementId = res?.workflow?.id || res?.workflow?.name || res?.element?.workflow_id || res?.element?.id || res?.id || res?.name || res?.result?.data?.json?.workflow?.id;
      if (elementId && effectiveProjectId) {
        window.location.href = `/cinema-studio/${effectiveProjectId}/elements/${elementId}`;
      } else {
        window.location.href = `/cinema-studio/${effectiveProjectId}/elements`;
      }
    } catch (err) {
      setError(err?.message || "Failed to create element.");
    }
  };

  const uploadFiles = async (files) => {
    if (!files || !files.length) return;
    setError(null);
    setIsUploading(true);
    try {
      const dataUrls = await Promise.all(
        files.map((f) => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(f);
        }))
      );
      const valid = dataUrls.filter(Boolean);
      if (!valid.length) { setError("Failed to read image file(s)."); return; }
      setPreviewImages((p) => [...p, ...valid]);
      await createAndRedirect(valid);
    } catch (err) {
      setError(err?.message || "Failed to create element.");
    } finally {
      setIsUploading(false);
    }
  };

  const createFromWorkflow = async (workflow, thumbUrl) => {
    if (!thumbUrl || loadingWorkflowId) return;
    setLoadingWorkflowId(workflow.id || workflow.name);
    setError(null);
    try {
      await createAndRedirect([thumbUrl]);
    } catch (err) {
      setError(err?.message || "Failed to create element.");
    } finally {
      setLoadingWorkflowId(null);
    }
  };

  const handleSelectAssets = async (selectedItems) => {
    if (!selectedItems || !selectedItems.length) return;
    const urls = selectedItems.map((i) => i.url || i.file_url || i.src).filter(Boolean);
    if (!urls.length) return;
    setIsUploading(true);
    try {
      await createAndRedirect(urls);
    } catch (err) {
      setError(err?.message || "Failed to create element.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) await uploadFiles(files);
    e.target.value = "";
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length) await uploadFiles(files);
  };

  const isAnyLoading = !!loadingWorkflowId || isUploading;

  return (
    <div className="flex flex-col h-full w-full bg-studio-dark text-white overflow-hidden">

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-0 left-0 w-full z-50 flex items-center h-16 px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl"
      >
        <div className="flex items-center gap-1">
          <Button variant="studio-ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={goBack}>
            <GoogleIcon iconName="arrow_back" className="text-[20px]" />
          </Button>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); if (error) setError(null); }}
            placeholder="New element"
            className="bg-transparent border-none outline-none text-md font-medium tracking-tight text-white placeholder-white/40 max-w-[260px] focus:text-white focus:ring-0"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <UserDropdown />
        </div>
      </motion.nav>

      {/* ── Body ── */}
      <main
        className="flex-1 overflow-y-auto overflow-x-hidden pt-16 custom-scrollbar"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-8">

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Upload Card (original design) ── */}
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative w-full overflow-hidden rounded-2xl bg-[oklch(26.9%_0_0)] px-6 py-12 sm:px-10"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <StackedPhotos images={previewImages} />
              <div className="flex max-w-sm flex-col items-center gap-2">
                <h1 className="text-2xl font-medium tracking-tight text-white">Add images to this element</h1>
                <p className="text-white/45 text-sm leading-5">Upload multiple images from different angles for better results.</p>
              </div>

              {/* ── Category Type Selector ── */}
              <div className="flex items-center justify-center gap-2 flex-wrap bg-white/5 p-1.5 rounded-full border border-white/10">
                {ELEMENT_TYPES.map((t) => {
                  const isSelected = elementType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setElementType(t.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-white text-black font-semibold shadow-sm"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <GoogleIcon iconName={t.googleIcon} className="text-[15px]" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnyLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black font-medium text-sm px-10 h-10 w-52 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                  {isUploading ? "Creating..." : "Upload"}
                </button>
              </div>
            </div>

            {/* Drag overlay inside card */}
            <AnimatePresence>
              {isDragging && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-2xl border-2 border-blue-500 bg-blue-500/10 flex items-center justify-center pointer-events-none z-10">
                  <span className="text-blue-400 text-sm font-medium">Drop images here</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Workflow Gallery (RowsPhotoAlbum with exact aspect ratio like Generations page) ── */}
          {!isProjectLoading && photos.length > 0 && (
            <div className="flex flex-col gap-4 pt-6 w-full">
              <p className="text-xs font-medium text-white uppercase tracking-wider">Add your generated media</p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full"
              >
                <div className="flex flex-wrap gap-2.5 items-start w-full">
                  {formattedPhotos.map((photo) => {
                    const wf = photo.workflow;
                    const isThisLoading = loadingWorkflowId === (wf.id || wf.name);
                    return (
                      <div
                        key={photo.key}
                        className="relative group overflow-hidden rounded-xl bg-zinc-900 border border-white/10 shrink-0 max-h-[220px] cursor-pointer"
                        onClick={() => !isAnyLoading && createFromWorkflow(wf, photo.src)}
                      >
                        <img
                          src={photo.src}
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
        maxAllowed={10}
      />

      <style jsx global>{'.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background-color:rgba(255,255,255,.12);border-radius:20px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background-color:rgba(255,255,255,.25)}'}</style>
    </div>
  );
}