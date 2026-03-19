import React, { useState, useRef } from "react";
import { Heart, Upload, Plus, LayoutGrid, ChevronDown, Check, ArrowUp, ArrowDown, Images, Image, Film, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectStore } from "@/store/useProjectStore";

// Simple local dropdown (no radix, keeps it lightweight)
function FilterDropdown({ label, options, value, onChange, sectionLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative z-60">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white text-[13px] font-medium transition-colors cursor-pointer"
      >
        {current?.icon && <current.icon size={14} className="opacity-60" />}
        <span className="truncate max-w-[120px]">{current?.label || label}</span>
        <ChevronDown size={12} className="opacity-40" />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#1c1c1c] border border-white/10 rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[180px] max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded">
          {sectionLabel && (
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white/30 sticky top-0 bg-[#1c1c1c] z-10">
              {sectionLabel}
            </div>
          )}
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 text-[13px] transition-colors cursor-pointer text-left hover:bg-white/5",
                value === opt.value ? "text-white bg-white/5 font-semibold" : "text-white/60 hover:text-white"
              )}
            >
              {opt.icon && (
                <span className="size-7 flex items-center justify-center rounded-lg bg-white/5 text-white/70 shrink-0">
                  <opt.icon size={16} />
                </span>
              )}
              <span className="flex-1 truncate">{opt.label}</span>
              {value === opt.value && <Check size={13} className="text-white/50 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ASSET_FILTERS = [
  { value: "all",    label: "All Assets", icon: Images },
  { value: "images", label: "Images", icon: Image },
  { value: "videos", label: "Videos", icon: Film },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Date created", icon: ArrowUp },
  { value: "date_asc",  label: "Date created", icon: ArrowDown },
];

export function ImportMediaDialog({
  open,
  onOpenChange,
  onSelect,
  library = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  mode = "all", // "all" | "image" | "video"
  activeTab = "all",
  onTabChange,
}) {
  const { projects } = useProjectStore();
  const { projectId: activeProjectId } = require("@/store/useGenerationsStudioStore").useGenerationsStudioStore();
  // We can default initially to "all_projects", but we will sync it when `open` changes
  const [filter, setFilter]     = useState(mode === "image" ? "images" : mode === "video" ? "videos" : "all");
  const [sort, setSort]         = useState("date_desc");
  const [favOnly, setFavOnly]   = useState(false);
  const [selectedProject, setSelectedProject] = useState("all_projects");
  const [gridCols, setGridCols] = useState(5);
  const fileInputRef = useRef(null);

  const projectOptions = React.useMemo(() => [
    { value: "all_projects", label: "All Projects", icon: Folder },
    ...projects.map(p => ({ value: p.project_id, label: p.project_name || "Project", icon: Folder }))
  ], [projects]);

  // Sync internal filter if mode changes externally
  React.useEffect(() => {
    if (mode === "image") setFilter("images");
    else if (mode === "video") setFilter("videos");
    else if (mode === "all" && filter !== "all" && filter !== "images" && filter !== "videos") setFilter("all");
  }, [mode]);

  // Automatically select the active project when dialog opens (if a project is active)
  React.useEffect(() => {
    if (open) {
      setSelectedProject(activeProjectId || "all_projects");
    }
  }, [open, activeProjectId]);

  // Filter + sort
  const visible = React.useMemo(() => {
    let items = [...library];
    
    // Project filter
    if (selectedProject !== "all_projects") {
      items = items.filter(g => g.project_id === selectedProject || (g.asset && g.asset.project_id === selectedProject));
    }

    if (favOnly) items = items.filter(g => g.is_Like);
    
    // Strict typing based on mode
    if (mode === "image") items = items.filter(g => !g.is_video);
    else if (mode === "video") items = items.filter(g => g.is_video);
    else {
      // "all" mode respects internal filter
      if (filter === "images") items = items.filter(g => !g.is_video);
      if (filter === "videos") items = items.filter(g => g.is_video);
    }

    if (sort === "date_asc") items = items.reverse();
    if (sort === "likes")    items = items.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    return items;
  }, [library, filter, sort, favOnly, mode, selectedProject]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => { onSelect({ url: reader.result }); };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
    onOpenChange(false);
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 80 && hasMore && !loading) onLoadMore?.();
  };

  const colClass =
    gridCols === 2 ? "grid-cols-2" :
    gridCols === 3 ? "grid-cols-3" :
    gridCols === 4 ? "grid-cols-4" :
    gridCols === 5 ? "grid-cols-5" : "grid-cols-5";

  // Determine allowed filters based on mode
  const allowedFilters = mode === "all" ? ASSET_FILTERS : 
                        mode === "image" ? [ASSET_FILTERS[1]] : 
                        [ASSET_FILTERS[2]];

  const acceptString = mode === "image" ? "image/*" : 
                      mode === "video" ? "video/*" : 
                      "image/*,video/*";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!bg-[#111113] p-0 border border-white/10 rounded-lg overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.9)] max-w-6xl w-full h-[80vh] flex flex-col"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 relative">
          {/* Left: Project filter + asset type dropdown + favorites */}
          <div className="flex items-center gap-1">
            <FilterDropdown
              label="All Projects"
              options={projectOptions}
              value={selectedProject}
              onChange={setSelectedProject}
            />

            {mode === "all" ? (
              <FilterDropdown
                label="All Assets"
                options={ASSET_FILTERS}
                value={filter}
                onChange={setFilter}
              />
            ) : (
              <div className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/80 text-[13px] font-medium cursor-default transition-colors">
                {mode === "image" ? "Images Only" : "Videos Only"}
              </div>
            )}
            
            <button
              type="button"
              onClick={() => setFavOnly(v => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer",
                favOnly
                  ? "bg-red-500/10 text-red-400"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              <Heart size={13} className={favOnly ? "fill-red-400 text-red-400" : ""} />
              Favorites
            </button>
          </div>

          {/* Center: title */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <span className="text-white text-[15px] font-bold tracking-wide">
              {favOnly ? "Favorites" :
               mode === "image" || filter === "images" ? "Import image" :
               mode === "video" || filter === "videos" ? "Import video" :
               "Import media"}
            </span>
          </div>

          {/* Right: sort + grid toggle */}
          <div className="flex items-center gap-1">
            <FilterDropdown
              label="Newest first"
              options={SORT_OPTIONS}
              value={sort}
              onChange={setSort}
              sectionLabel="Order"
            />
            {/* Grid density — Shadcn DropdownMenu */}
            {(() => {
              const GRID_OPTIONS = [
                {
                  value: 2, label: "2 Columns",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                      <rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" />
                      <rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" />
                    </svg>
                  )
                },
                {
                  value: 3, label: "3 Columns",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                      <rect x="1" y="1" width="3.5" height="5" rx="1" /><rect x="5.25" y="1" width="3.5" height="5" rx="1" /><rect x="9.5" y="1" width="3.5" height="5" rx="1" />
                      <rect x="1" y="8" width="3.5" height="5" rx="1" /><rect x="5.25" y="8" width="3.5" height="5" rx="1" /><rect x="9.5" y="8" width="3.5" height="5" rx="1" />
                    </svg>
                  )
                },
                {
                  value: 4, label: "4 Columns",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 14 14" fill="currentColor">
                      <rect x="1" y="1" width="2.5" height="3.5" rx="0.8" /><rect x="4.25" y="1" width="2.5" height="3.5" rx="0.8" /><rect x="7.5" y="1" width="2.5" height="3.5" rx="0.8" /><rect x="10.75" y="1" width="2.5" height="3.5" rx="0.8" />
                      <rect x="1" y="5.25" width="2.5" height="3.5" rx="0.8" /><rect x="4.25" y="5.25" width="2.5" height="3.5" rx="0.8" /><rect x="7.5" y="5.25" width="2.5" height="3.5" rx="0.8" /><rect x="10.75" y="5.25" width="2.5" height="3.5" rx="0.8" />
                      <rect x="1" y="9.5" width="2.5" height="3.5" rx="0.8" /><rect x="4.25" y="9.5" width="2.5" height="3.5" rx="0.8" /><rect x="7.5" y="9.5" width="2.5" height="3.5" rx="0.8" /><rect x="10.75" y="9.5" width="2.5" height="3.5" rx="0.8" />
                    </svg>
                  )
                },
                {
                  value: 5, label: "5 Columns",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 20 14" fill="currentColor">
                      <rect x="1" y="1" width="2" height="5" rx="0.8" /><rect x="4.5" y="1" width="2" height="5" rx="0.8" /><rect x="8" y="1" width="2" height="5" rx="0.8" /><rect x="11.5" y="1" width="2" height="5" rx="0.8" /><rect x="15" y="1" width="2" height="5" rx="0.8" />
                      <rect x="1" y="8" width="2" height="5" rx="0.8" /><rect x="4.5" y="8" width="2" height="5" rx="0.8" /><rect x="8" y="8" width="2" height="5" rx="0.8" /><rect x="11.5" y="8" width="2" height="5" rx="0.8" /><rect x="15" y="8" width="2" height="5" rx="0.8" />
                    </svg>
                  )
                },
              ];
              const active = GRID_OPTIONS.find(o => o.value === gridCols);
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-center size-8 rounded-lg hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                    >
                      <span className="text-white/80">{active?.icon}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    side="bottom"
                    className="bg-[#1c1c1c] border border-white/10 rounded-lg p-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[160px] z-[200]"
                  >
                    <DropdownMenuLabel className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/30">
                      Grid
                    </DropdownMenuLabel>
                    {GRID_OPTIONS.map(opt => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setGridCols(opt.value)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] cursor-pointer",
                          gridCols === opt.value ? "text-white" : "text-white/60"
                        )}
                      >
                        <span className="size-7 flex items-center justify-center rounded-lg bg-white/5 text-white/70 shrink-0">
                          {opt.icon}
                        </span>
                        <span className="flex-1">{opt.label}</span>
                        {gridCols === opt.value && <Check size={13} className="text-white/50" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}
          </div>
        </div>

        <DialogTitle className="sr-only">Import Media</DialogTitle>

        {/* ── Grid ── */}
        <div
          onScroll={handleScroll}
          className="overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded relative"
          style={{ height: "80%" }}
        >
          {visible.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center gap-3 h-48 text-white/20">
              <LayoutGrid size={32} />
              <p className="text-sm uppercase tracking-widest">No media found</p>
            </div>
          ) : (
            <div className={cn("grid gap-2", colClass)}>
              {visible.map((item, idx) => {
                const url = item.file_url || item.asset?.file_url;
                const isVideo = item.is_video;
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => { onSelect({ url, asset_id: item.asset_id || item.id }); onOpenChange(false); }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("imageUrl", url);
                      if (item.asset_id || item.id) e.dataTransfer.setData("assetId", item.asset_id || item.id);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group border border-white/5 hover:border-white/20 transition-all duration-200 bg-white/5"
                  >
                    {isVideo ? (
                      <video src={url} className="size-full object-contain" muted />
                    ) : (
                      <img src={url} alt="Asset" className="size-full object-contain transition-transform duration-300 group-hover:scale-105" />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="size-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Plus size={16} className="text-white" />
                      </div>
                    </div>
                    {/* Like badge */}
                    {item.is_Like && (
                      <div className="absolute top-1.5 right-1.5">
                        <Heart size={12} className="fill-red-400 text-red-400 drop-shadow" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <div className="size-6 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-center px-5 py-4 mt-auto">
          <input ref={fileInputRef} type="file" className="hidden" accept={acceptString} multiple onChange={handleFileChange} />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1c1c1cd9] border border-white/10 shadow-lg hover:bg-[#252525] text-white/90 text-[13px] font-medium transition-all cursor-pointer backdrop-blur-md"
          >
            <Upload size={16} />
            Upload from my computer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
