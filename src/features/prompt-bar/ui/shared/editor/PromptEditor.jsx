"use client";

import React, { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { MentionNode } from "./MentionNode";
import { MentionPlugin } from "./MentionPlugin";
import { 
  $getRoot, 
  $createParagraphNode, 
  $createTextNode, 
  KEY_DOWN_COMMAND, 
  COMMAND_PRIORITY_LOW 
} from "lexical";


const theme = {
  paragraph: "text-white/90 text-[14.5px] leading-relaxed",
};

// Internal plugin to sync external state and handle submission
function SubmissionPlugin({ onSubmit, externalValue }) {
  const [editor] = useLexicalComposerContext();

  // ── Sync external value ───────────────────────────────────────────────
  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      
      // Sync external changes (like clicking "Edit Parameters") into Lexical
      // Only do this if the values differ to avoid cursor reset loops while typing
      if (externalValue !== undefined && externalValue !== text) {
        root.clear();
        if (externalValue) {
          const p = $createParagraphNode();
          p.append($createTextNode(externalValue));
          root.append(p);
        }
      }
    });
  }, [externalValue, editor]);

  // ── Enter to submit ───────────────────────────────────────────────────
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
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onSubmit]);

  return null;
}

export function PromptEditor({ 
  value, 
  onChange, 
  onSubmit, 
  referenceImages,
  textareaRef // We'll try to sync focus to Lexical
}) {
  const initialConfig = {
    namespace: "PromptEditor",
    theme,
    nodes: [MentionNode],
    onError: (error) => {
      console.error(error);
    },
  };

  // ✅ Official API
  const handleLexicalChange = (editorState) => {
    editorState.read(() => {
      onChange($getRoot().getTextContent());
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative min-h-[38px] w-full items-start">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none text-white text-[14.5px] leading-relaxed min-h-[36px] py-1.5"
            />
          }
          placeholder={
            !value && (
              <span className="absolute top-1.5 left-0 text-white/25 text-[14.5px] pointer-events-none">
                Describe the scene you imagine...
              </span>
            )
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        <HistoryPlugin />
        <MentionPlugin images={referenceImages || []} />
        <OnChangePlugin onChange={handleLexicalChange} />
        <SubmissionPlugin onSubmit={onSubmit} externalValue={value} />
      </div>
    </LexicalComposer>
  );
}
