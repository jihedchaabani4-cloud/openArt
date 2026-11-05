"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
} from "lexical";
import { $createMentionNode } from "./MentionNode";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

/**
 * MentionPlugin (Version 1: Floating In-Editor Dropdown)
 *
 * Listens for '@' query in the active Lexical text node,
 * computes the caret's DOM coordinates, and displays a floating
 * dropdown menu directly under the cursor with keyboard navigation.
 */
export function MentionPlugin({ references = [], onOpenMediaLibrary }) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [activeIdx, setActiveIdx] = useState(0);
  const menuRef = useRef(null);

  const filtered = references.filter((item) => {
    const title = (item.displayName || item.name || "").toLowerCase();
    const type = (item.type || item.label || "").toLowerCase();
    const q = query.toLowerCase();
    return title.includes(q) || type.includes(q);
  });

  // Track cursor position and '@' query
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setOpen(false);
          return;
        }

        const anchor = selection.anchor;
        const node = anchor.getNode();
        const text = node.getTextContent();
        const offset = anchor.offset;
        const before = text.slice(0, offset);

        // Match '@' followed by non-space characters up to the caret
        const match = before.match(/@([^@\s]*)$/);

        if (match) {
          const matchQuery = match[1];
          setQuery(matchQuery);
          setActiveIdx(0);
          setOpen(true);

          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const editorEl = editor.getRootElement();
            if (editorEl) {
              const editorRect = editorEl.getBoundingClientRect();
              // Calculate relative offset within editor container
              const rawTop = rect.bottom - editorRect.top + 8;
              const rawLeft = rect.left - editorRect.left;
              // Constrain left position to prevent overflowing out of container
              const constrainedLeft = Math.max(0, Math.min(rawLeft, editorRect.width - 260));
              setPos({
                top: rawTop,
                left: constrainedLeft,
              });
            }
          }
        } else {
          setOpen(false);
        }
      });
    });
  }, [editor]);

  const insertMention = useCallback(
    (item, idx) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchor = selection.anchor;
        const node = anchor.getNode();
        const text = node.getTextContent();
        const offset = anchor.offset;
        const before = text.slice(0, offset);
        const atIndex = before.lastIndexOf("@");

        if (atIndex === -1) return;

        const prefix = text.slice(0, atIndex);
        const suffix = text.slice(offset);

        // Replace the current text node with the prefix before @
        node.setTextContent(prefix);

        const mentionNode = $createMentionNode(
          item.url || item.thumbnail_url || item.preview,
          idx,
          item.displayName || item.name || `Ref ${idx + 1}`,
          item.id || item.assetId || item.asset_id || `ref_${idx}`,
          item.type || item.role || "media"
        );

        const spaceNode = $createTextNode(" " + suffix);
        node.insertAfter(spaceNode);
        node.insertAfter(mentionNode);

        // Move cursor right after the space
        spaceNode.select(1, 1);
      });
      setOpen(false);
    },
    [editor]
  );

  // Keyboard navigation
  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (e) => {
        if (!open) return false;

        const totalItems = filtered.length + (onOpenMediaLibrary ? 1 : 0);
        if (totalItems === 0) return false;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIdx((i) => (i + 1) % totalItems);
          return true;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIdx((i) => (i - 1 + totalItems) % totalItems);
          return true;
        }

        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          if (activeIdx < filtered.length) {
            insertMention(filtered[activeIdx], activeIdx);
          } else if (onOpenMediaLibrary) {
            setOpen(false);
            onOpenMediaLibrary();
          }
          return true;
        }

        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, open, filtered, activeIdx, insertMention, onOpenMediaLibrary]);

  // Click outside listener
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: pos.top, left: pos.left }}
      className="absolute z-[9999] w-64 rounded-lg border border-white/10 bg-[#161718]/95 backdrop-blur-2xl p-1.5 shadow-none animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-white/40 flex items-center justify-between">
        <span>Mention Reference</span>
        {query && <span className="text-white/60 lowercase font-mono">@{query}</span>}
      </div>

      <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {filtered.length === 0 ? (
          <div className="px-3 py-3 text-center text-[12px] text-white/40">
            No matching references
          </div>
        ) : (
          filtered.map((item, i) => {
            const isSelected = i === activeIdx;
            const title = item.displayName || item.name || `Ref ${i + 1}`;
            const sub = item.label || item.type || "reference";
            const imgUrl = item.url || item.thumbnail_url || item.preview;

            return (
              <div
                key={item.id || item.assetId || i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(item, i);
                }}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected ? "bg-white/15 text-white" : "hover:bg-white/10 text-white/80"
                }`}
              >
                <div className="shrink-0 size-7 rounded-lg overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <GoogleIcon iconName="image" className="text-[14px] text-white/50" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[13px] font-medium text-white truncate leading-tight">
                    {title}
                  </span>
                  <span className="text-[10px] text-white/40 uppercase tracking-wide truncate">
                    {sub}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {onOpenMediaLibrary && (
          <>
            <div className="h-px bg-white/10 my-1" />
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
                onOpenMediaLibrary();
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors text-[12px] ${
                activeIdx === filtered.length ? "bg-white/15 text-white" : "hover:bg-white/10 text-white/70 hover:text-white"
              }`}
            >
              <GoogleIcon iconName="add_photo_alternate" className="text-[16px] text-white/60" />
              <span>Choose from Library / Upload...</span>
            </div>
          </>
        )}
      </div>

      <div className="px-2 py-1 mt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30">
        <span>Use ↑↓ to navigate</span>
        <span>↵ Enter to select</span>
      </div>
    </div>
  );
}
