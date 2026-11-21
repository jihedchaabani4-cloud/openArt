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
import { HugeIcon } from "@/components/primitives/HugeIcon";
import {
  MENU_LABEL_CLASS,
  MENU_PANEL_DEFAULT_WIDTH,
  MENU_SEPARATOR_CLASS,
  MenuItemContent,
  menuItemClassName,
  menuPanelClassName,
} from "@/components/base/menu";
import { cn } from "@/shared/lib/utils";

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
      className={menuPanelClassName({ className: cn("absolute z-[9999]", MENU_PANEL_DEFAULT_WIDTH) })}
    >
      <div className={cn(MENU_LABEL_CLASS, "flex items-center justify-between")}>
        <span>Mention Reference</span>
        {query && <span className="ds-text-caption-s text-text-body-muted font-mono">@{query}</span>}
      </div>

      <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="px-3 py-3 text-center ds-text-caption-s text-text-secondary">
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
                className={menuItemClassName({
                  selected: isSelected,
                })}
              >
                <div className="shrink-0 size-7 rounded-lg overflow-hidden bg-surface-tonal border border-border-menu-subtle flex items-center justify-center">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <HugeIcon name="image-02" size="sm" className="text-icon-secondary" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="ds-text-caption-m font-medium text-text-primary truncate leading-tight">
                    {title}
                  </span>
                  <span className="ds-text-caption-s text-text-secondary truncate">
                    {sub}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {onOpenMediaLibrary && (
          <>
            <div className={MENU_SEPARATOR_CLASS} />
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
                onOpenMediaLibrary();
              }}
              className={menuItemClassName({
                selected: activeIdx === filtered.length,
              })}
            >
              <MenuItemContent icon="image-add-02">
                Choose from Library / Upload...
              </MenuItemContent>
            </div>
          </>
        )}
      </div>

      <div className={MENU_SEPARATOR_CLASS} />
      <div className="px-2 py-1 flex items-center justify-between ds-text-caption-s text-text-disabled">
        <span>Use ↑↓ to navigate</span>
        <span>↵ Enter to select</span>
      </div>
    </div>
  );
}
