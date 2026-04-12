import React from "react";
import { Upload } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { useProjects } from "@/features/projects/api/projectsApi";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { useLibraryFilter } from "@/features/prompt-bar/model/useLibraryFilter";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import PhotoAlbum from "react-photo-album";

export function ImportMediaDialog({
  open, onOpenChange, onSelect,
  library = [], loading = false, hasMore = false, onLoadMore,
  mode = "all", maxAllowed = 1, onUploadFromPC,
}) {
  const { data: projects = [] } = useProjects();
  const { selectedProjectId: activeProjectId } = useGenerationsStore();
  const { search, setSearch, visibleItems } = useLibraryFilter(library, mode);
  const [selectedItems, setSelectedItems] = React.useState([]);
  const fileInputRef = React.useRef(null);

  const photos = React.useMemo(() =>
    visibleItems.map((item) => {
      const url     = item.url ?? item.image?.url ?? item.video?.url ?? item.file_url;
      const isVideo = item.type === "video" || item.is_video || !!item.video;
      const w = item.width  ?? item.image?.width  ?? (isVideo ? 16 : 4);
      const h = item.height ?? item.image?.height ?? (isVideo ? 9  : 3);
      return { src: url, width: w, height: h, key: item.id ?? url, _item: item, _isVideo: isVideo };
    }),
  [visibleItems]);

  const toggleSelection = (item) => {
    const itemUrl = item.url ?? item.image?.url ?? item.video?.url ?? item.file_url;
    const isVideo = item.type === "video" || item.is_video || !!item.video;
    const asset   = { url: itemUrl, asset_id: item.id, is_video: isVideo };
    setSelectedItems((prev) => {
      const exists = prev.find(p => p.asset_id === asset.asset_id || p.url === asset.url);
      if (exists) return prev.filter(p => p.asset_id !== asset.asset_id && p.url !== asset.url);
      if (prev.length >= maxAllowed) return prev;
      return [...prev, asset];
    });
  };

  const handleImport = () => {
    if (selectedItems.length === 0) return;
    onSelect(selectedItems);
    setSelectedItems([]);
    onOpenChange(false);
  };

  React.useEffect(() => { if (!open) setSelectedItems([]); }, [open]);

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
        if (++processed === files.length) { onSelect(results); onOpenChange(false); }
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadAccept = mode === "image"
    ? "image/jpeg,image/png,image/webp,image/gif"
    : mode === "video" ? "video/mp4,video/webm" : "image/*,video/mp4,video/webm";

  const renderPhoto = ({ photo, imageProps: { style, ...rest } }) => {
    const item       = photo._item;
    const isSelected = selectedItems.some(p => p.asset_id === item.id || p.url === photo.src);
    const isDisabled = selectedItems.length >= maxAllowed && !isSelected;

    return (
      <button
        onClick={() => toggleSelection(item)}
        style={{ ...style, padding: 0, border: 'none', background: 'transparent' }}
        className={`group relative rounded-lg overflow-hidden bg-white/5 transition-all
          ${isSelected ? "ring-2 ring-[#3b82f6]" : "hover:ring-2 hover:ring-white/30"}
          ${isDisabled ? "opacity-20 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {photo._isVideo ? (
          <video src={photo.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
        ) : (
          <img {...rest} src={photo.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-[#3b82f6] rounded-full flex items-center justify-center shadow-lg">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="white">
              <path d="M13.485 3.485a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0l-3.25-3.25a.75.75 0 1 1 1.06-1.06L5.75 10.19l6.72-6.705a.75.75 0 0 1 1.015 0z" />
            </svg>
          </div>
        )}
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="floating" className="overflow-hidden">
        <DialogTitle className="sr-only">Import Media</DialogTitle>
        <Input ref={fileInputRef} type="file" className="hidden" multiple accept={uploadAccept} onChange={handleFileChange} />

        <div className="flex items-center gap-3 px-5 py-3">
          <div className="flex-1 relative">
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for Assets" className="rounded-lg border-none bg-[#DADCE019]" />
            <Button onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white transition-colors">
              <Upload size={16} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && visibleItems.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-white/40 text-sm">Loading…</div>
          ) : visibleItems.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-white/40 text-sm">No media found.</div>
          ) : (
            <PhotoAlbum
              layout="rows"
              photos={photos}
              targetRowHeight={180}
              spacing={8}
              renderPhoto={renderPhoto}
            />
          )}

          {(hasMore || loading) && visibleItems.length > 0 && (
            <div className="flex justify-center mt-6 pb-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-white/40">
                  <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
                  Loading more...
                </div>
              ) : (
                <div className="h-4 w-full" ref={(el) => {
                  if (!el) return;
                  const observer = new IntersectionObserver(
                    ([entry]) => { if (entry.isIntersecting && !loading && hasMore) onLoadMore(); },
                    { rootMargin: "200px" }
                  );
                  observer.observe(el);
                  return () => observer.disconnect();
                }} />
              )}
            </div>
          )}
        </div>

        <div className="p-4 flex items-center justify-end gap-3">
          <Button onClick={() => onOpenChange(false)} className="px-4 py-2 text-[13px] text-white/60 hover:text-white transition-colors">
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={selectedItems.length === 0}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all
              ${selectedItems.length > 0 ? "bg-white text-black hover:bg-white/80 active:scale-95" : "bg-white/5 text-white/20 cursor-not-allowed"}`}>
            Import {selectedItems.length > 0 ? selectedItems.length : ""} {selectedItems.length === 1 ? 'image' : 'images'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}