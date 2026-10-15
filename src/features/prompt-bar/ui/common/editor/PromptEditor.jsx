"use client";

import React, { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { MentionNode, $createMentionNode, $isMentionNode } from "./MentionNode";
import { FeatureNode, $createFeatureNode, $isFeatureNode } from "./FeatureNode";
import { SyncFeaturesPlugin } from "./plugins/SyncFeaturesPlugin";
import { TextTagConverterPlugin } from "./plugins/TextTagConverterPlugin";
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from "lexical";

const theme = {
  paragraph: "text-white/90 text-[14.5px] leading-relaxed",
};

// ── Sync external value + Enter to submit ────────────────────────────────────
function SubmissionPlugin({ onSubmit, externalValue, disabled = false }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      const currentText = root.getTextContent();

      // We compare the full text (including serialized chips like <Trait: ...>) 
      // against the externalValue. This prevents wiping the editor unnecessarily.
      if (externalValue !== undefined && externalValue !== currentText) {
        root.clear();
        if (externalValue) {
          const p = $createParagraphNode();
          p.append($createTextNode(externalValue));
          root.append(p);
        }
      }
    });
  }, [externalValue, editor]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (e) => {
        if (disabled) return false;
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSubmit?.();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, onSubmit, disabled]);

  return null;
}

// ── @ Shortcut Plugin ────────────────────────────────────────────────────────
/**
 * Intercepts the '@' key:
 *  - Opens the mention menu immediately.
 *  - After opening, tracks every subsequent keystroke and emits the text
 *    after the last '@' via onMentionQueryChange so the menu can filter live.
 *  - On Escape, clears the query and closes the menu.
 *  - On asset selection, removes the "@query" text and inserts MentionNode chips.
 */
function AtShortcutPlugin({ onTriggerMentionDialog, onMentionQueryChange, mentionOpen }) {
  const [editor] = useLexicalComposerContext();

  // Track query live: read text after last @ each time editor content changes
  useEffect(() => {
    if (!mentionOpen) return;

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        let query = "";
        let found = false;

        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor;
          const node = anchor.getNode();
          const text = node.getTextContent?.() || "";
          const offset = anchor.offset;
          const before = text.slice(0, offset);
          const atIndex = before.lastIndexOf("@");
          if (atIndex !== -1) {
            query = before.slice(atIndex + 1);
            found = true;
          }
        }

        // Fallback: check full editor text if selection was lost (e.g. blurred when clicking popover)
        if (!found) {
          const fullText = $getRoot().getTextContent();
          const atIndex = fullText.lastIndexOf("@");
          if (atIndex !== -1) {
            const afterAt = fullText.slice(atIndex + 1);
            query = afterAt.split("\n")[0];
            found = true;
          }
        }

        onMentionQueryChange?.(found ? query : "");
      });
    });
  }, [editor, mentionOpen, onMentionQueryChange]);

  useEffect(() => {
    if (!onTriggerMentionDialog) return;

    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        // When mention menu or import media popover is open, arrow keys navigate
        // the popover items instead of moving the cursor in the prompt bar textarea.
        if (mentionOpen && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
          event.preventDefault();
          return true;
        }

        if (event.key !== "@") return false;

        // Allow '@' to appear in the editor, then open the mention menu
        setTimeout(() => {
          onMentionQueryChange?.(""); // reset query
          onTriggerMentionDialog((assets) => {
            editor.update(() => {
              const root = $getRoot();
              
              // Find the text node containing '@'
              const textNodes = [];
              function collect(node) {
                if (node.getType?.() === "text") {
                  textNodes.push(node);
                } else if (typeof node.getChildren === "function") {
                  node.getChildren().forEach(collect);
                }
              }
              collect(root);

              let targetNode = null;
              let atIndex = -1;
              let nodeText = "";

              for (let i = textNodes.length - 1; i >= 0; i--) {
                const tn = textNodes[i];
                const content = tn.getTextContent?.() || "";
                const idx = content.lastIndexOf("@");
                if (idx !== -1) {
                  targetNode = tn;
                  atIndex = idx;
                  nodeText = content;
                  break;
                }
              }

              if (targetNode && atIndex !== -1) {
                const prefix = nodeText.slice(0, atIndex);
                // The mention query extends to end of node or next space
                targetNode.setTextContent(prefix);

                let lastInserted = targetNode;
                assets.forEach((asset, idx) => {
                  const assetType = asset.type || asset.workflow_type || (asset.characterId ? "character" : (asset.elementId ? "element" : "media"));
                  const canonicalId = asset.workflow_id || asset.workflowId || asset.workflow?.id || asset.id || asset.asset_id;
                  const mentionNode = $createMentionNode(
                    asset.url || asset.avatar_url || asset.image_url,
                    idx,
                    asset.displayName || asset.name || "Ref",
                    canonicalId,
                    assetType
                  );
                  lastInserted.insertAfter(mentionNode);
                  lastInserted = mentionNode;
                });

                const space = $createTextNode(" ");
                lastInserted.insertAfter(space);
                space.select(1, 1);
              } else {
                // If no @ text node found, append at the end
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  assets.forEach((asset, idx) => {
                    const assetType = asset.type || asset.workflow_type || (asset.characterId ? "character" : (asset.elementId ? "element" : "media"));
                    const canonicalId = asset.workflow_id || asset.workflowId || asset.workflow?.id || asset.id || asset.asset_id;
                    const mentionNode = $createMentionNode(
                      asset.url || asset.avatar_url || asset.image_url,
                      idx,
                      asset.displayName || asset.name || "Ref",
                      canonicalId,
                      assetType
                    );
                    selection.insertNodes([mentionNode, $createTextNode(" ")]);
                  });
                }
              }

              onMentionQueryChange?.(""); // clear query after insertion
            });
          });
        }, 0);

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, onTriggerMentionDialog, onMentionQueryChange]);

  return null;
}

// ── Focus when focusRequest changes ──────────────────────────────────────────
function FocusPlugin({ focusRequest }) {
  const [editor] = useLexicalComposerContext();
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (focusRequest > 0) {
      editor.focus();
    }
  }, [focusRequest, editor]);

  return null;
}

// ── Main Component ───────────────────────────────────────────────────────────
export function PromptEditor({
  value,
  onChange,
  onSubmit,
  referenceImages,
  textareaRef,
  onTriggerMentionDialog,
  onMentionQueryChange,
  mentionOpen = false,
  placeholder = "Describe the scene you imagine...",
  focusRequest = 0,
}) {
  // Move nodes inside to participate in HMR correctly
  const EDITOR_NODES = React.useMemo(() => [MentionNode, FeatureNode], [MentionNode, FeatureNode]);

  const initialConfig = React.useMemo(() => ({
    namespace: "PromptEditor",
    theme,
    nodes: EDITOR_NODES,
    onError: (error) => {
      console.error(error);
    },
  }), [EDITOR_NODES]);

  // Generate a key that changes ONLY when the node classes change (HMR)
  // This forces LexicalComposer to remount, preventing "Type mismatch" errors.
  const editorKey = React.useMemo(() => {
    return `editor-${Date.now()}`;
  }, [MentionNode, FeatureNode]);

  const handleLexicalChange = (editorState) => {
    editorState.read(() => {
      // Save the FULL content including serialized tags (<Trait: ...>) to the store.
      // This ensures the prompt string is actually contextual for AI processing.
      onChange($getRoot().getTextContent());
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig} key={editorKey}>
      <div className="relative min-h-[38px] w-full items-start">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="outline-none text-white text-[14.5px] leading-relaxed min-h-[36px] py-1.5 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent" />
          }
          placeholder={
            !value && (
              <span className="absolute top-1.5 left-0 text-white/25 text-[14.5px] pointer-events-none">
                {placeholder}
              </span>
            )
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        <HistoryPlugin />
        <AtShortcutPlugin
          onTriggerMentionDialog={onTriggerMentionDialog}
          onMentionQueryChange={onMentionQueryChange}
          mentionOpen={mentionOpen}
        />
        <TextTagConverterPlugin referenceImages={referenceImages} />
        <SyncFeaturesPlugin />
        <OnChangePlugin onChange={handleLexicalChange} />
        <SubmissionPlugin onSubmit={onSubmit} externalValue={value} disabled={mentionOpen} />
        <FocusPlugin focusRequest={focusRequest} />

      </div>
    </LexicalComposer>
  );
}