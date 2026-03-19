"use client";

import { useEffect, useState, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
} from "lexical";
import { $createMentionNode } from "./MentionNode";

export function MentionPlugin({ images = [] }) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [activeIdx, setActiveIdx] = useState(0);

  const filtered = images.filter(img =>
    (img.name || '').toLowerCase().includes(query.toLowerCase())
  );

  // Detect @ trigger on input
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchor = selection.anchor;
        const node = anchor.getNode();
        const text = node.getTextContent();
        const offset = anchor.offset;
        const before = text.slice(0, offset);
        const match = before.match(/@([^@\s]*)$/);

        if (match) {
          setQuery(match[1]);
          setActiveIdx(0);
          setOpen(true);

          // Get caret position for dropdown
          const domSelection = window.getSelection();
          if (domSelection && domSelection.rangeCount > 0) {
            const range = domSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const editorEl = editor.getRootElement();
            if (editorEl) {
              const editorRect = editorEl.getBoundingClientRect();
              setPos({
                top: rect.bottom - editorRect.top + 6,
                left: rect.left - editorRect.left,
              });
            }
          }
        } else {
          setOpen(false);
        }
      });
    });
  }, [editor]);

  const insertMention = useCallback((img, idx) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchor = selection.anchor;
      const node = anchor.getNode();
      const text = node.getTextContent();
      const offset = anchor.offset;
      const before = text.slice(0, offset);
      const atIndex = before.lastIndexOf("@");

      // Delete the @query text
      node.setTextContent(text.slice(0, atIndex) + text.slice(offset));

      // Insert MentionNode + space
      const mentionNode = $createMentionNode(img.url, idx, img.name || `Image ${idx + 1}`);
      const spaceNode = $createTextNode(" ");
      node.insertAfter(spaceNode);
      node.insertAfter(mentionNode);
      
      // Move selection to after the space
      spaceNode.select();
    });
    setOpen(false);
  }, [editor]);

  // Keyboard navigation
  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (e) => {
        if (!open || !filtered.length) return false;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIdx(i => (i + 1) % filtered.length);
          return true;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIdx(i => (i - 1 + filtered.length) % filtered.length);
          return true;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(filtered[activeIdx], activeIdx);
          return true;
        }
        if (e.key === "Escape") {
          setOpen(false);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [open, filtered, activeIdx, insertMention]);

  if (!open || !filtered.length) return null;

  return (
    <div
      style={{ top: pos.top, left: pos.left }}
      className="absolute z-[9999] w-56 rounded-xl border border-white/10 bg-[#1a1a1a] p-1 shadow-2xl"
    >
      {filtered.map((img, i) => (
        <div
          key={i}
          onMouseDown={e => { e.preventDefault(); insertMention(img, i); }}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            i === activeIdx ? "bg-white/10" : "hover:bg-white/5"
          }`}
        >
          <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden bg-white/10">
            {img.url ? (
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3"
                    stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="8.5" cy="8.5" r="2"
                    stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 16l5-5 4 4 3-3 6 6"
                    stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
          <span className="text-[13px] text-white/75">{img.name || `Image ${i + 1}`}</span>
        </div>
      ))}
    </div>
  );
}
