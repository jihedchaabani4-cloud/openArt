"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/utils";

// ── Icons ────────────────────────────────────────────────────────────────────

function AssetLibraryIcon({ className }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="3" ry="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

/**
 * Resolves the reference category label accurately:
 *  - "Character" for characters
 *  - "Element • [Type]" for elements (e.g. Element • Vehicle, Element • Style, Element • Object)
 *  - "Upload" for uploaded user media
 *  - "Generation" for generated media assets
 */
export function getReferenceCategory(ref) {
  if (!ref) return "Generation";

  const isChar =
    ref.type === "character" ||
    ref.role === "character" ||
    ref.is_character ||
    String(ref.workflow_type || ref.workflowType || "").toLowerCase().includes("character") ||
    Boolean(ref.characterId);

  const isElem =
    ref.type === "element" ||
    ref.role === "element" ||
    ref.is_element ||
    String(ref.workflow_type || ref.workflowType || "").toLowerCase().includes("element") ||
    Boolean(ref.elementId);

  if (isChar) {
    return "Character";
  }

  if (isElem) {
    let elemType =
      ref.element_type ||
      ref.elementType ||
      ref.category ||
      ref.subType ||
      ref.subtype ||
      ref.element?.element_type ||
      ref.element?.type ||
      ref.rawValue?.element_type;

    if (!elemType && typeof ref.label === "string") {
      const clean = ref.label.replace(/element/gi, "").trim();
      if (clean && clean.toLowerCase() !== "element") {
        elemType = clean;
      }
    }

    if (!elemType && typeof ref.displayName === "string") {
      if (ref.label && ref.label.toLowerCase() !== "element") {
        elemType = ref.label;
      }
    }

    if (!elemType) {
      elemType = "Object";
    }

    const formattedElemType =
      elemType.charAt(0).toUpperCase() + elemType.slice(1).toLowerCase();

    return `Element • ${formattedElemType}`;
  }

  // Media references: distinguish Upload vs Generation
  const isUpload =
    ref.is_upload === true ||
    ref.type === "upload" ||
    ref.role === "upload" ||
    ref.source === "upload" ||
    ref.source === "uploaded" ||
    ref.origin === "upload" ||
    String(ref.workflow_type || ref.workflowType || "").toUpperCase() === "UPLOAD" ||
    ref.workflowStepId === "UPLOAD" ||
    String(ref.category || "").toLowerCase() === "upload" ||
    String(ref.category || "").toLowerCase() === "uploads" ||
    String(ref.label || "").toLowerCase() === "upload" ||
    String(ref.label || "").toLowerCase() === "uploaded" ||
    String(ref.id || "").toLowerCase().startsWith("upload") ||
    String(ref.workflow_id || "").toLowerCase().startsWith("upload") ||
    String(ref.assetId || "").toLowerCase().startsWith("upload") ||
    Boolean(ref.rawValue?.is_upload || ref.rawValue?.type === "upload" || ref.rawValue?.workflow_type === "UPLOAD");

  if (isUpload) {
    return "Upload";
  }

  return "Generation";
}

/**
 * AtMentionMenu
 *
 * Streamlined @ mention menu matching the prompt bar design system:
 *  - No borders (seamless with prompt bar shell)
 *  - Background and blur matching prompt bar: bg-(--background-base-pri) / backdrop-blur-[80px]
 *  - "Add" section: Asset library only
 *  - "References" section showing type category:
 *      • Character
 *      • Element • [Type] (e.g. Element • Vehicle, Element • Style)
 *      • Reference
 *  - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 */
export function AtMentionMenu({
  open,
  onClose,
  references = [],
  onSelectReference,
  onOpenMediaLibrary,
  anchorRef,
  query = "",
  assetLibrarySubtitle = "Add from your assets",
  className,
}) {
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const q = (query || "").trim().toLowerCase();

  const addItems = useMemo(() => {
    const items = [
      {
        id: "asset_library",
        section: "add",
        title: "Asset library",
        subtitle: assetLibrarySubtitle,
        icon: AssetLibraryIcon,
        action: () => {
          onOpenMediaLibrary?.();
        },
      },
    ];

    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    );
  }, [q, assetLibrarySubtitle, onOpenMediaLibrary]);

  const referenceItems = useMemo(() => {
    if (!references || references.length === 0) return [];
    const items = references.map((ref, idx) => {
      const category = getReferenceCategory(ref);
      return {
        id: ref.id || ref.assetId || `ref_${idx}`,
        section: "references",
        title: ref.displayName || ref.name || `Reference #${idx + 1}`,
        category,
        url: ref.url || ref.thumbnail_url || ref.preview,
        refData: ref,
        action: () => {
          onSelectReference?.(ref);
          onClose?.();
        },
      };
    });

    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [references, q, onSelectReference, onClose]);

  // Combined flat list for unified keyboard navigation
  const allItems = useMemo(() => {
    return [...addItems, ...referenceItems];
  }, [addItems, referenceItems]);

  // Per-item DOM refs so we can scroll the highlighted item into view
  const itemRefs = useRef([]);

  // Reset highlight on query change or open
  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
    }
  }, [open, q]);

  // Click outside listener
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target))
      ) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, onClose, anchorRef]);

  // Scroll the newly-highlighted item into view on keyboard navigation
  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // Keyboard navigation — capture phase so we intercept before Lexical/submit
  // handlers; stopPropagation ensures Enter never triggers generate while open
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (allItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const activeItem = allItems[selectedIndex];
        if (activeItem) {
          activeItem.action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, allItems, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: 6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "w-full rounded-lg bg-(--background-base-pri) backdrop-blur-[80px] shadow-none pointer-events-auto flex flex-col z-50 overflow-hidden select-none border-0 font-sans antialiased",
        className
      )}
    >
      <div
        ref={listRef}
        className="flex flex-col py-2 px-2 max-h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent pr-1 font-sans antialiased"
      >
        {/* ── SECTION: Add ── */}
        {addItems.length > 0 && (
          <div>
            <div className="text-[12px] font-medium text-white/50 px-3 pt-1 pb-1">
              Add
            </div>
            <div className="flex flex-col gap-0.5">
              {addItems.map((item) => {
                const globalIdx = allItems.indexOf(item);
                const isSelected = globalIdx === selectedIndex;
                const Icon = item.icon;

                return (
                  <div
                    key={item.id}
                    ref={(el) => { itemRefs.current[globalIdx] = el; }}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer transition-all text-left",
                      isSelected
                        ? "bg-white/[0.08] text-white ring-1 ring-white/20"
                        : "hover:bg-white/[0.05] text-white/90"
                    )}
                  >
                    <div className="size-4 shrink-0 flex items-center justify-center text-white/70">
                      <Icon className="size-4" />
                    </div>
                    <div className="flex items-baseline gap-2 truncate">
                      <span className="text-[14px] font-medium text-white">
                        {item.title}
                      </span>
                      <span className="text-[13px] text-white/60 font-normal truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SECTION: Workspace References (if available or queried) ── */}
        {referenceItems.length > 0 && (
          <div>
            <div className="text-[12px] font-medium text-white/50 px-3 pt-2 pb-1">
              References
            </div>
            <div className="flex flex-col gap-0.5">
              {referenceItems.map((item) => {
                const globalIdx = allItems.indexOf(item);
                const isSelected = globalIdx === selectedIndex;

                return (
                  <div
                    key={item.id}
                    ref={(el) => { itemRefs.current[globalIdx] = el; }}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer transition-all text-left group",
                      isSelected
                        ? "bg-white/[0.08] text-white ring-1 ring-white/20"
                        : "hover:bg-white/[0.05] text-white/90"
                    )}
                  >
                    <div className="size-5 shrink-0 rounded-sm overflow-hidden bg-white/10 flex items-center justify-center">
                      {item.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <AssetLibraryIcon className="size-3 text-white/50" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
                      <span className="text-[14px] font-medium text-white truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-white/70 font-medium px-2 py-0.5 rounded-full bg-white/[0.06] shrink-0 border-0 ml-auto">
                        {item.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allItems.length === 0 && (
          <div className="py-6 text-center text-[13px] text-white/40">
            No matching options found
          </div>
        )}
      </div>
    </motion.div>
  );
}
