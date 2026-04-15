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
function SubmissionPlugin({ onSubmit, externalValue }) {
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
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSubmit?.();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, onSubmit]);

  return null;
}

// ── @ Shortcut Plugin ────────────────────────────────────────────────────────
/**
 * Intercepts the '@' key BEFORE it is inserted into the editor.
 * - Prevents the default insertion entirely (e.key === "@").
 * - Opens the Media Library dialog immediately.
 * - On asset selection, inserts MentionNode chips at the cursor position.
 * No text scanning, no deletion loops, no race conditions.
 */
function AtShortcutPlugin({ onTriggerMentionDialog }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onTriggerMentionDialog) return;

    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        // Detect '@' regardless of keyboard layout (key value or Shift+2)
        if (event.key !== "@") return false;

        // ① Prevent '@' from ever appearing in the editor
        event.preventDefault();

        // ② Open the Media Library; provide a callback for when assets are chosen
        onTriggerMentionDialog((assets) => {
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return;

            assets.forEach((asset, idx) => {
              const mentionNode = $createMentionNode(
                asset.url,
                idx,
                asset.displayName || asset.name || "Ref",
                asset.asset_id
              );
              // Insert chip + trailing space at the cursor
              selection.insertNodes([mentionNode, $createTextNode(" ")]);
            });
          });
        });

        // ③ Mark command as handled so nothing else processes it
        return true;
      },
      // HIGH priority so we run before SubmissionPlugin's Enter handler
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, onTriggerMentionDialog]);

  return null;
}

const EDITOR_NODES = [MentionNode, FeatureNode];

// ── Main Component ───────────────────────────────────────────────────────────
export function PromptEditor({
  value,
  onChange,
  onSubmit,
  referenceImages,
  textareaRef,
  onTriggerMentionDialog,
  placeholder = "Describe the scene you imagine...",
}) {
  const initialConfig = React.useMemo(() => ({
    namespace: "PromptEditor",
    theme,
    nodes: EDITOR_NODES,
    onError: (error) => {
      console.error(error);
    },
  }), []);

  const handleLexicalChange = (editorState) => {
    editorState.read(() => {
      // Save the FULL content including serialized tags (<Trait: ...>) to the store.
      // This ensures the prompt string is actually contextual for AI processing.
      onChange($getRoot().getTextContent());
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative min-h-[38px] w-full items-start">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="outline-none text-white text-[14.5px] leading-relaxed min-h-[36px] py-1.5" />
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
        <AtShortcutPlugin onTriggerMentionDialog={onTriggerMentionDialog} />
        <TextTagConverterPlugin referenceImages={referenceImages} />
        <OnChangePlugin onChange={handleLexicalChange} />
        <SubmissionPlugin onSubmit={onSubmit} externalValue={value} />
      </div>
    </LexicalComposer>
  );
}