"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

/**
 * AtMentionMenu (Version 2: Top Panel Menu Zone above PromptBar shell)
 *
 * Appears as a glassmorphic top panel directly above the prompt bar shell
 * when typing '@' or triggering the mention action.
 */
export function AtMentionMenu({
  open,
  onClose,
  references = [],
  onSelectReference,
  onOpenMediaLibrary,
  anchorRef,
}) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  const filtered = references.filter((ref) => {
    const title = (ref.displayName || ref.name || "").toLowerCase();
    const sub = (ref.label || ref.type || "").toLowerCase();
    const q = search.toLowerCase();
    return title.includes(q) || sub.includes(q);
  });

  // Handle outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target))
      ) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, anchorRef]);

  // Reset search when opening
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard navigation within the panel
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      const total = filtered.length + (onOpenMediaLibrary ? 1 : 0);
      if (total === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % total);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + total) % total);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex < filtered.length) {
          onSelectReference?.(filtered[selectedIndex]);
          onClose?.();
        } else if (onOpenMediaLibrary) {
          onOpenMediaLibrary();
          onClose?.();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filtered, selectedIndex, onSelectReference, onOpenMediaLibrary, onClose]);

  if (!open) return null;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-[24px] bg-[#161718]/90 backdrop-blur-[60px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.65)] pointer-events-auto w-full max-w-[580px] flex flex-col mb-2 z-50"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg bg-white/10 flex items-center justify-center text-white/80">
            <GoogleIcon iconName="alternate_email" className="text-[14px]" />
          </div>
          <span className="text-[12px] font-semibold text-white tracking-wide">
            Mention Reference
          </span>
          <span className="text-[10px] text-white/40 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5">
            {filtered.length} available
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-white/40">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px]">ESC</kbd>
          <span>to close</span>
        </div>
      </div>

      {/* Search Bar inside panel */}
      {references.length > 3 && (
        <div className="px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[13px] text-white/90 focus-within:border-white/20 focus-within:bg-white/10 transition-all">
            <GoogleIcon iconName="search" className="text-[16px] text-white/40 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Filter references..."
              className="bg-transparent border-none outline-none text-white text-[13px] w-full placeholder:text-white/30"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-white/40 hover:text-white"
              >
                <GoogleIcon iconName="close" className="text-[14px]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reference Items List */}
      <div className="flex flex-col gap-1 px-2.5 py-2 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {filtered.length === 0 ? (
          <div className="py-6 text-center text-white/40 text-[12px]">
            No matching references found.
          </div>
        ) : (
          filtered.map((ref, idx) => {
            const isSelected = idx === selectedIndex;
            const title = ref.displayName || ref.name || `Reference #${idx + 1}`;
            const label = ref.label || ref.type || "Asset";
            const imgUrl = ref.url || ref.thumbnail_url || ref.preview;

            return (
              <button
                key={ref.id || ref.assetId || idx}
                type="button"
                onClick={() => {
                  onSelectReference?.(ref);
                  onClose?.();
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all w-full group ${
                  isSelected
                    ? "bg-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.3)] text-white"
                    : "hover:bg-white/10 text-white/80 hover:text-white"
                }`}
              >
                <div className="size-8 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt={title} className="size-full object-cover" />
                  ) : (
                    <GoogleIcon iconName="image" className="text-[16px] text-white/50" />
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[13px] font-medium truncate leading-tight group-hover:text-white">
                    {title}
                  </span>
                  <span className="text-[10px] text-white/45 truncate mt-0.5">
                    {label}
                  </span>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 opacity-60 group-hover:opacity-100">
                  <span className="text-[10px] text-white/50 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                    Insert @
                  </span>
                </div>
              </button>
            );
          })
        )}

        {/* Option to pick from Library or Upload */}
        {onOpenMediaLibrary && (
          <>
            <div className="h-px bg-white/5 my-1" />
            <button
              type="button"
              onClick={() => {
                onOpenMediaLibrary();
                onClose?.();
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors w-full text-[12px] ${
                selectedIndex === filtered.length
                  ? "bg-white/15 text-white"
                  : "hover:bg-white/10 text-white/70 hover:text-white"
              }`}
            >
              <div className="size-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                <GoogleIcon iconName="add_photo_alternate" className="text-[16px]" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white/90">Choose from Media Library / Upload...</span>
                <span className="text-[10px] text-white/40">Pick any image from your workspace or disk</span>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Footer shortcut hints */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center justify-between text-[11px] text-white/40">
        <span>Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[9px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[9px]">↓</kbd> to navigate</span>
        <span>Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[9px]">ENTER</kbd> to insert</span>
      </div>
    </motion.div>
  );
}
