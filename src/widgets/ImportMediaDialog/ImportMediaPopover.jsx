import React from "react";
import { Upload, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects } from "@/features/projects/api/projectsApi";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { useLibraryFilter } from "@/features/prompt-bar/model/useLibraryFilter";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { RowsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/rows.css';
import { cn } from "@/shared/lib/utils";

/**
 * ImportMediaPopover
 * A floating popover for importing/uploading media.
 */
export function ImportMediaPopover({
  open,
  onOpenChange,
  onSelect,
  library    = [],
  loading    = false,
  hasMore    = false,
  onLoadMore,
  mode       = "all",
  maxAllowed = 1,
  onUploadFromPC,
  assetSource = "all",
  setAssetSource,
  anchorRef,
  className
}) {
  const { data: projects = [] }                = useProjects();
  const { selectedProjectId: activeProjectId } = useGenerationsStore();

  const {
    sort,            setSort,
    search,          setSearch,
    selectedProject, setSelectedProject,
    visibleItems,
  } = useLibraryFilter(library, mode);
  const [selectedItems, setSelectedItems] = React.useState([]);
  const fileInputRef = React.useRef(null);
  const popoverRef = React.useRef(null);

  // ─── Click Outside Logic ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      // Ignore clicks on the anchor/trigger button — it handles its own toggle
      if (anchorRef?.current && anchorRef.current.contains(event.target)) return;
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onOpenChange(false);
      }
    };

    // Use capture phase to ensure we catch clicks before other handlers
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

  // ─── Selection Logic ──────────────────────────────────────────────────────
  const toggleSelection = (item) => {
    const itemUrl = item.url ?? item.image?.url ?? item.video?.url ?? item.file_url;
    const isVideo = item.type === "video" || item.is_video || !!item.video;
    
    const asset = {
      url:      itemUrl,
      asset_id: item.id,
      is_video: isVideo,
    };

    setSelectedItems((prev) => {
      const exists = prev.find(p => p.asset_id === asset.asset_id || p.url === asset.url);
      if (exists) {
        return prev.filter(p => p.asset_id !== asset.asset_id && p.url !== asset.url);
      }
      if (prev.length >= maxAllowed) return prev; // block if max reached
      return [...prev, asset];
    });
  };

  const handleImport = () => {
    if (selectedItems.length === 0) return;
    onSelect(selectedItems); // Pass array to parent
    setSelectedItems([]);    // Reset
    onOpenChange(false);
  };

  // Reset selection when dialog closes/opens
  React.useEffect(() => {
    if (!open) setSelectedItems([]);
  }, [open]);

  // ─── File picker ──────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files ?? []).slice(0, maxAllowed);
    
    if (onUploadFromPC) {
      onUploadFromPC(files);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const results = [];
    let processed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        results.push({ url: reader.result, is_video: file.type.startsWith("video/") });
        processed++;
        if (processed === files.length) {
          onSelect(results);
          onOpenChange(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadAccept = mode === "image"
    ? "image/jpeg,image/png,image/webp,image/gif"
    : mode === "video"
    ? "video/mp4,video/webm"
    : "image/*,video/mp4,video/webm";

  // ─── Photo descriptors for RowsPhotoAlbum ────────────────────────────────
  const photos = React.useMemo(() => {
    const BASE = 1200;
    return visibleItems.map((item, i) => {
      const itemUrl = item.url ?? item.image?.url ?? item.video?.url ?? item.file_url ?? null;
      if (!itemUrl) return null;   // skip items with no resolved URL

      const isVideo  = item.type === "video" || item.is_video || !!item.video;

      // Derive aspect from metadata or fallback by media type
      const w = item.width  ?? item.image?.dimensions?.width  ?? item.video?.dimensions?.width  ?? null;
      const h = item.height ?? item.image?.dimensions?.height ?? item.video?.dimensions?.height ?? null;
      const wNum = w ? parseFloat(w) : (isVideo ? 16 : 3);
      const hNum = h ? parseFloat(h) : (isVideo ?  9 : 4);
      const maxDim = Math.max(wNum, hNum);

      return {
        src:     itemUrl,
        width:   Math.round(BASE * (wNum / maxDim)),
        height:  Math.round(BASE * (hNum / maxDim)),
        key:     item.id ?? itemUrl ?? String(i),
        item,
        itemUrl,
        isVideo,
      };
    }).filter(Boolean);
  }, [visibleItems]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-50",
            "bg-[#161718E6] backdrop-blur-[30px]  border border-white/10  rounded-2xl flex flex-col overflow-hidden",
            "h-[500px] max-w-[750px] w-full",
            
          )}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept={uploadAccept}
            onChange={handleFileChange}
          />



          {/* Search & Upload Bar */}
          <div className="px-4 py-3">
            <div className="relative group">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assets..."
                className="h-9 rounded-lg border-none pl-9 pr-10 text-xs"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 size-3.5" />
              <button
                 onClick={() => fileInputRef.current?.click()}
                 className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/5 text-white/30 hover:text-white transition-all"
                 title="Upload from computer"
              >
                <Upload size={14} />
              </button>
            </div>
          </div>

          {/* Grid Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide min-h-0">
            {loading && visibleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20">
                <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white animate-spin" />
                <span className="text-xs font-medium uppercase tracking-widest">Loading...</span>
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/20 text-xs uppercase tracking-widest">
                No assets found
              </div>
            ) : (
              <RowsPhotoAlbum
                photos={photos}
                targetRowHeight={160}
                spacing={10}
                rowConstraints={{ singleRowMaxHeight: 260 }}
                render={{
                  photo: (_, { photo, width, height }) => {
                    const { item, itemUrl, isVideo } = photo;
                    const isSelected  = selectedItems.some(p => p.asset_id === item.id || p.url === itemUrl);
                    const isMaxReached = selectedItems.length >= maxAllowed;
                    const isDisabled  = isMaxReached && !isSelected;

                    return (
                      <button
                        key={photo.key}
                        onClick={() => toggleSelection(item)}
                        style={{ width, height }}
                        className={cn(
                          "group relative rounded-xl overflow-hidden bg-white/5 transition-all duration-300",
                          isSelected   ? "ring-2 ring-white"          : "hover:ring-2 hover:ring-white/20",
                          isDisabled   ? "opacity-20 cursor-not-allowed" : "cursor-pointer"
                        )}
                      >
                        {isVideo ? (
                          <video src={itemUrl} style={{ width, height, objectFit: "cover" }} muted />
                        ) : (
                          <img   src={itemUrl} alt="" style={{ width, height, objectFit: "cover" }} />
                        )}

                        {isSelected && (
                          <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                            <div className="w-6 h-6 bg-white text-black rounded-full flex items-center justify-center shadow-xl">
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M13.485 3.485a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 1 1 1.06-1.06L5.75 10.19l6.72-6.705a.75.75 0 0 1 1.015 0z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  },
                }}
              />
            )}

            {(hasMore || loading) && visibleItems.length > 0 && (
              <div 
                className="h-10 w-full flex items-center justify-center"
                ref={(el) => {
                  if (!el) return;
                  const observer = new IntersectionObserver(
                    ([entry]) => {
                      if (entry.isIntersecting && !loading && hasMore) {
                        onLoadMore();
                      }
                    },
                    { rootMargin: "100px" }
                  );
                  observer.observe(el);
                  return () => observer.disconnect();
                }}
              >
                {loading && (
                   <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
                )}
              </div>
            )}
          </div>

          {/* Footer - Import Button */}
          <div className="p-3 shrink-0 flex justify-end">
            <Button 
              onClick={handleImport}
              disabled={selectedItems.length === 0}
              className={cn(
                selectedItems.length > 0 
                  ? "bg-white text-black hover:bg-white/90 active:scale-[0.95]" 
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              )}
            >
              {selectedItems.length > 0 
                ? `Import ${selectedItems.length} ${selectedItems.length === 1 ? 'Asset' : 'Assets'}`
                : "Select Assets"
              }
            </Button>
          </div>
          
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
