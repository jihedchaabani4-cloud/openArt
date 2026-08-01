"use client";

import React from "react";
import { Upload, Search, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { useLibraryFilter } from "@/features/prompt-bar/model/useLibraryFilter";
import { useProjectData } from "@/features/workflows/api/workflowsApi";
import { resolveMediaUrl } from "@/shared/lib/displayUtils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { RowsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/rows.css';
import { cn } from "@/shared/lib/utils";

const CATEGORIES = [
  { id: "all",       label: "All",        googleIcon: "dashboard" },
  { id: "image",     label: "Images",     googleIcon: "image" },
  { id: "video",     label: "Videos",     googleIcon: "videocam" },
  { id: "voice",     label: "Voices",     googleIcon: "voice_selection" },
  { id: "character", label: "Characters", googleIcon: "accessibility_new" },
  { id: "element",   label: "Avatar",     googleIcon: "face" },
  { id: "upload",    label: "Uploads",    googleIcon: "drive_folder_upload" },
];

/**
 * ImportMediaPopover
 * A floating popover for importing/uploading media with a left sidebar category layout.
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
  variant    = "default",
  maxAllowed = 1,
  onUploadFromPC,
  anchorRef,
}) {
  const isAssetSelect = variant === "asset-select" || mode === "asset-select";
  const effectiveMode = isAssetSelect ? "image" : mode;

  const params = useParams();
  const projectId = params?.projectId;
  const { data: projectData } = useProjectData(projectId);

  // Build session name lookup from project data
  const sessionNameMap = React.useMemo(() => {
    const raw = projectData?.projectContents?.sessions ?? [];
    const map = {};
    raw.forEach(s => {
      if (s.name) map[s.name] = s.metadata?.displayName || null;
    });
    return map;
  }, [projectData]);

  const effectiveLibrary = React.useMemo(() => {
    const raw = (library && library.length > 0) 
      ? library 
      : (projectData?.projectContents?.media ?? []);
      
    let mapped = raw.map(m => {
      const url = resolveMediaUrl(m) || m.url || m.image?.url || m.video?.url || m.file_url || null;
      const isVid = m.type === "video" || m.is_video || !!m.video || (url && /\.(mp4|webm|mov)$/i.test(url));
      return {
        ...m,
        id: m.id || m.name,
        url,
        type: isVid ? "video" : "image",
        is_video: isVid,
      };
    });

    if (isAssetSelect) {
      mapped = mapped.filter(item => !item.is_video && item.type !== "video");
    }

    return mapped;
  }, [library, projectData, isAssetSelect]);

  const {
    search,          setSearch,
    selectedSession, setSelectedSession,
    selectedCategory, setSelectedCategory,
    visibleItems,
  } = useLibraryFilter(effectiveLibrary, effectiveMode);

  // Extract unique sessions from the library using the session ID and create time
  const sessions = React.useMemo(() => {
    const flatItems = effectiveLibrary.flatMap(i => i.items ?? i);
    const unique = new Map();

    flatItems.forEach(item => {
      const sId =
        item.session_id ||
        item.sessionId ||
        item.mediaMetadata?.sessionId ||
        item.mediaMetadata?.session_id ||
        item.metadata?.sessionId ||
        item.metadata?.session_id;

      if (!sId || unique.has(sId)) return;

      const displayName = sessionNameMap[sId];
      const time =
        item.mediaMetadata?.createTime ||
        item.created_at ||
        item.create_time ||
        item.metadata?.createTime;

      const formattedDate = time
        ? new Date(time).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Unknown Session";

      unique.set(sId, {
        id:   sId,
        name: displayName || formattedDate,
      });
    });

    return Array.from(unique.values()).sort((a, b) => b.id.localeCompare(a.id));
  }, [effectiveLibrary, sessionNameMap]);

  const activeSessionName = sessions.find(s => s.id === selectedSession)?.name || "All Sessions";

  const [selectedItems, setSelectedItems] = React.useState([]);
  const fileInputRef = React.useRef(null);
  const popoverRef = React.useRef(null);

  // Click Outside Logic
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (anchorRef?.current && anchorRef.current.contains(event.target)) return;
      
      const isPortalClick = 
        event.target.closest('[data-radix-popper-content-wrapper]') ||
        event.target.closest('[role="menu"]') ||
        event.target.closest('[data-radix-menu-content]') ||
        event.target.closest('.radix-themes');

      if (isPortalClick) return;

      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

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

  React.useEffect(() => {
    if (!open) setSelectedItems([]);
  }, [open]);

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

  const photos = React.useMemo(() => {
    const BASE = 1200;
    return visibleItems.map((item, i) => {
      const itemUrl = resolveMediaUrl(item) ?? item.url ?? item.image?.url ?? item.video?.url ?? item.file_url ?? null;
      if (!itemUrl) return null;

      const isVideo  = item.type === "video" || item.is_video || !!item.video;
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
          style={{
            backgroundColor: "rgba(22, 23, 24, 0.9)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow: "rgba(0, 0, 0, 0.2) 0px 4px 32px -8px",
          }}
          className={cn(
            "fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999]",
            "border-none rounded-3xl flex flex-row overflow-hidden text-white",
            isAssetSelect ? "h-[500px] max-w-[680px] w-full font-['Google_Sans_Text',sans-serif]" : "h-[560px] max-w-[880px] w-full font-['Google_Sans_Text',sans-serif]"
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

          {/* ── Left Category Sidebar (Shown in standard mode only) ── */}
          {!isAssetSelect && (
            <div className="w-[150px] p-2.5 flex flex-col gap-2 shrink-0 select-none bg-transparent">
              <div className="px-2 pt-1 pb-1 text-[11px] font-semibold text-white/30 uppercase tracking-wider font-['Google_Sans_Text',sans-serif]">
                Categories
              </div>
              
              <nav role="tablist" className="flex flex-col gap-1 flex-1">
                {CATEGORIES.map((cat) => {
                  const isActive = (selectedCategory || "all") === cat.id;
                  return (
                    <Button
                      key={cat.id}
                      role="tab"
                      aria-selected={isActive}
                      variant={isActive ? "nav-tab-active" : "nav-tab"}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="w-full justify-start h-9 text-xs cursor-pointer group"
                    >
                      <GoogleIcon iconName={cat.googleIcon} name={cat.googleIcon} className={cn("size-4 shrink-0 transition-colors", isActive ? "text-white" : "text-white/60 group-hover:text-white")} />
                      <span className="truncate">{cat.label}</span>
                    </Button>
                  );
                })}
              </nav>

              {/* Upload Button at bottom of sidebar */}
              <div className="mt-auto pt-2">
                <Button
                  variant="nav-tab"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full justify-center h-9 text-xs gap-2 cursor-pointer"
                >
                  <Upload size={14} className="shrink-0" />
                  <span>Upload Media</span>
                </Button>
              </div>
            </div>
          )}

          {/* ── Right Content Area ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search & Session Header Bar */}
            <div className="px-4 py-3 flex items-center gap-2 shrink-0">
              {/* Search Bar Input */}
              <div className="flex-1">
                <Input
                  variant="blurinput"
                  icon={Search}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search assets"
                  aria-label="Search assets"
                  className="w-full text-sm"
                />
              </div>

              {/* Session Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all min-w-[140px] justify-between border-none cursor-pointer">
                    <span className="truncate">{activeSessionName}</span>
                    <ChevronDown className="size-4 opacity-40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#18181b] backdrop-blur-xl border border-white/10 rounded-xl z-[10000] text-white">
                  <DropdownMenuItem onClick={() => setSelectedSession("all_sessions")} className="text-sm cursor-pointer">All Sessions</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                    {sessions.map(s => (
                      <DropdownMenuItem 
                        key={s.id} 
                        onClick={() => setSelectedSession(s.id)}
                        className={cn("text-sm cursor-pointer", selectedSession === s.id && "bg-white/10 text-white")}
                      >
                        {s.name}
                      </DropdownMenuItem>
                    ))}
                    {sessions.length === 0 && (
                      <DropdownMenuItem className="text-xs text-white/40 pointer-events-none italic">No sessions found</DropdownMenuItem>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
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
                            <img src={itemUrl} alt="" style={{ width, height, objectFit: "cover" }} />
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
            <div className="p-3 shrink-0 flex justify-end bg-transparent">
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
