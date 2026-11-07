"use client";

import React, { useState, useRef, useMemo } from "react";
import { notFound } from "next/navigation";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from "lexical";
import { MentionNode, $createMentionNode } from "@/features/prompt-bar/ui/common/editor/MentionNode";
import { MentionPlugin } from "@/features/prompt-bar/ui/common/editor/MentionPlugin";
import { AtMentionMenu } from "@/features/prompt-bar/ui/common/editor/AtMentionMenu";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";

const INITIAL_REFERENCES = [
  {
    id: "char_elena_01",
    displayName: "Elena Vance",
    name: "Elena Vance",
    role: "character",
    type: "character",
    label: "Main Character",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
  },
  {
    id: "char_marcus_02",
    displayName: "Marcus Drake",
    name: "Marcus Drake",
    role: "character",
    type: "character",
    label: "Supporting Character",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
  },
  {
    id: "elem_neon_car_01",
    displayName: "Cyberpunk Cruiser",
    name: "Cyberpunk Cruiser",
    role: "element",
    type: "element",
    element_type: "vehicle",
    label: "Vehicle",
    url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=150&q=80",
  },
  {
    id: "elem_katana_02",
    displayName: "Cyber Katana",
    name: "Cyber Katana",
    role: "element",
    type: "element",
    element_type: "object",
    label: "Object",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&q=80",
  },
  {
    id: "elem_retro_style_03",
    displayName: "Synthwave Palette",
    name: "Synthwave Palette",
    role: "element",
    type: "element",
    element_type: "style",
    label: "Style",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&q=80",
  },
  {
    id: "ref_tokyo_night",
    displayName: "Neo-Tokyo Alley",
    name: "Neo-Tokyo Alley",
    role: "reference",
    type: "reference",
    workflow_type: "GENERATED",
    label: "Environment Generation",
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&q=80",
  },
  {
    id: "upload_sketch_01",
    displayName: "Concept Art Sketch",
    name: "Concept Art Sketch",
    role: "upload",
    type: "upload",
    is_upload: true,
    workflow_type: "UPLOAD",
    label: "Local Upload",
    url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=150&q=80",
  },
];

const editorTheme = {
  paragraph: "text-white/90 text-[14.5px] leading-relaxed",
};

function AtShortcutPlugin({ onTriggerMention, onMentionQueryChange, mentionOpen }) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
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

        if (!found) {
          const fullText = $getRoot().getTextContent();
          const atIndex = fullText.lastIndexOf("@");
          if (atIndex !== -1) {
            query = fullText.slice(atIndex + 1).split("\n")[0];
            found = true;
          }
        }

        onMentionQueryChange?.(found ? query : "");
      });
    });
  }, [editor, mentionOpen, onMentionQueryChange]);

  React.useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (e) => {
        if (mentionOpen && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          return true;
        }
        if (e.key === "@") {
          setTimeout(() => {
            onTriggerMention?.();
          }, 0);
          return false;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, onTriggerMention, mentionOpen]);

  return null;
}

// ── Version 2 External Inserter Plugin ───────────────────────────────────────
function ExternalInsertPlugin({ insertTarget, onInserted }) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (!insertTarget) return;

    editor.update(() => {
      const selection = $getSelection();
      let targetSelection = selection;

      if (!$isRangeSelection(selection)) {
        const root = $getRoot();
        const lastChild = root.getLastChild();
        if (lastChild) {
          lastChild.select();
          targetSelection = $getSelection();
        }
      }

      if (targetSelection && $isRangeSelection(targetSelection)) {
        const anchor = targetSelection.anchor;
        const node = anchor.getNode();
        const text = node.getTextContent?.() || "";
        const offset = anchor.offset;
        const before = text.slice(0, offset);
        const atIndex = before.lastIndexOf("@");

        const mentionNode = $createMentionNode(
          insertTarget.url,
          0,
          insertTarget.displayName || insertTarget.name,
          insertTarget.id,
          insertTarget.type || "media"
        );

        if (atIndex !== -1 && typeof node.setTextContent === "function") {
          const prefix = text.slice(0, atIndex);
          const suffix = text.slice(offset);
          node.setTextContent(prefix);
          const space = $createTextNode(" " + suffix);
          node.insertAfter(space);
          node.insertAfter(mentionNode);
          space.select(1, 1);
        } else {
          targetSelection.insertNodes([mentionNode, $createTextNode(" ")]);
        }
      } else {
        const root = $getRoot();
        const p = $createParagraphNode();
        const mentionNode = $createMentionNode(
          insertTarget.url,
          0,
          insertTarget.displayName || insertTarget.name,
          insertTarget.id,
          insertTarget.type || "media"
        );
        p.append(mentionNode, $createTextNode(" "));
        root.append(p);
      }
    });

    onInserted();
  }, [insertTarget, editor, onInserted]);

  return null;
}

export default function TestMentionPage() {
  const [activeTab, setActiveTab] = useState("both"); // "both" | "v1" | "v2"
  const [references, setReferences] = useState(INITIAL_REFERENCES);
  
  // V1 State
  const [v1RawOutput, setV1RawOutput] = useState("");

  // V2 State
  const [v2RawOutput, setV2RawOutput] = useState("");
  const [v2PanelOpen, setV2PanelOpen] = useState(false);
  const [v2InsertTarget, setV2InsertTarget] = useState(null);
  const [v2MentionQuery, setV2MentionQuery] = useState("");
  const v2AnchorRef = useRef(null);

  const initialConfigV1 = useMemo(() => ({
    namespace: "V1-FloatingMention",
    theme: editorTheme,
    nodes: [MentionNode],
    onError: (err) => console.error(err),
  }), []);

  const initialConfigV2 = useMemo(() => ({
    namespace: "V2-TopPanelMention",
    theme: editorTheme,
    nodes: [MentionNode],
    onError: (err) => console.error(err),
  }), []);

  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const handleAddSample = () => {
    const id = `asset_${Date.now()}`;
    const sampleTypes = ["character", "vehicle", "object", "style", "generation", "upload"];
    const chosen = sampleTypes[references.length % sampleTypes.length];

    let newRef;
    if (chosen === "character") {
      newRef = {
        id,
        displayName: `Sample Character #${references.length + 1}`,
        name: `Sample Character #${references.length + 1}`,
        role: "character",
        type: "character",
        label: "Character",
        url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80",
      };
    } else if (chosen === "upload") {
      newRef = {
        id,
        displayName: `Uploaded Asset #${references.length + 1}`,
        name: `Uploaded Asset #${references.length + 1}`,
        role: "upload",
        type: "upload",
        is_upload: true,
        workflow_type: "UPLOAD",
        label: "User Upload",
        url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=150&q=80",
      };
    } else if (chosen === "generation") {
      newRef = {
        id,
        displayName: `Sample Generation #${references.length + 1}`,
        name: `Sample Generation #${references.length + 1}`,
        role: "reference",
        type: "reference",
        workflow_type: "GENERATED",
        label: "Generation",
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80",
      };
    } else {
      const typeName = chosen.charAt(0).toUpperCase() + chosen.slice(1);
      newRef = {
        id,
        displayName: `Sample ${typeName} #${references.length + 1}`,
        name: `Sample ${typeName} #${references.length + 1}`,
        role: "element",
        type: "element",
        element_type: chosen,
        label: typeName,
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&q=80",
      };
    }
    setReferences((prev) => [...prev, newRef]);
  };

  const handleResetReferences = () => {
    setReferences(INITIAL_REFERENCES);
  };

  return (
    <div className="min-h-screen bg-[#0d0e0f] text-white p-6 md:p-12 font-sans selection:bg-white/20">
      {/* Top Banner / Navigation */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PROMPT BAR EXPERIMENTAL LAB
              </span>
              <span className="text-white/40 text-[12px]">•</span>
              <span className="text-white/50 text-[12px]">Interactive Mention UI Comparison</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <GoogleIcon iconName="alternate_email" className="text-[28px] text-blue-400" />
              Mention Component Test Arena
            </h1>
            <p className="text-white/60 text-[13.5px] mt-1">
              Compare the in-editor floating dropdown (<span className="text-white font-medium">Version 1</span>) against the top-panel shell zone (<span className="text-white font-medium">Version 2</span>).
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#161718] border border-white/10 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("both")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                activeTab === "both"
                  ? "bg-white text-black shadow-none font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Side-by-Side (Both)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("v1")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                activeTab === "v1"
                  ? "bg-white text-black shadow-none font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Version 1 (Floating)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("v2")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                activeTab === "v2"
                  ? "bg-white text-black shadow-none font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Version 2 (Top Panel)
            </button>
          </div>
        </div>

        {/* Global Reference Store Bar */}
        <div className="mt-4 p-4 rounded-2xl bg-[#161718]/60 border border-white/5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-semibold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
              <GoogleIcon iconName="perm_media" className="text-[16px] text-white/50" />
              Active References Pool ({references.length}):
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {references.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/90"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ref.url} alt="" className="size-4 rounded object-cover" />
                  <span className="truncate max-w-[100px]">{ref.displayName}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-6 px-2 text-xs"
              onClick={handleAddSample}
            >
              <GoogleIcon iconName="add" className="text-[14px]" />
              Add Sample
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={handleResetReferences}
            >
              Reset Pool
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid Arena */}
      <div className={`max-w-6xl mx-auto grid gap-8 ${activeTab === "both" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* ── VERSION 1 CARD ── */}
        {(activeTab === "both" || activeTab === "v1") && (
          <div className="flex flex-col gap-4 rounded-2xl bg-[#131415]/90 border border-white/10 p-6 shadow-none relative">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="size-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-[13px]">
                  V1
                </span>
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    In-Editor Floating Dropdown
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-mono">
                      MentionPlugin.jsx
                    </span>
                  </h2>
                  <p className="text-white/40 text-[11.5px]">
                    Opens at exact caret coordinates inside textarea. Full keyboard navigation.
                  </p>
                </div>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-[12px] text-purple-200/90 flex items-start gap-2.5">
              <GoogleIcon iconName="info" className="text-[18px] shrink-0 text-purple-300 mt-0.5" />
              <div>
                <p className="font-semibold text-white">How to test:</p>
                <p className="mt-0.5">
                  Click inside the input below and type <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-white/20 font-mono text-purple-200">@</kbd>.
                  The floating menu will appear directly under your cursor. Use <kbd className="px-1 py-0.5 bg-black/40 rounded border border-white/20 text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-black/40 rounded border border-white/20 text-[10px]">↓</kbd> and <kbd className="px-1 py-0.5 bg-black/40 rounded border border-white/20 text-[10px]">Enter</kbd> to insert.
                </p>
              </div>
            </div>

            {/* Interactive Prompt Bar Shell */}
            <div className="relative mt-2">
              <div className="rounded-2xl bg-[#161718]/80 backdrop-blur-xl border border-white/10 p-4 shadow-none focus-within:border-white/30 transition-all">
                <LexicalComposer initialConfig={initialConfigV1}>
                  <div className="relative min-h-[70px] w-full">
                    <RichTextPlugin
                      contentEditable={
                        <ContentEditable className="outline-none text-white text-[14.5px] leading-relaxed min-h-[60px] py-1" />
                      }
                      placeholder={
                        <span className="absolute top-1 left-0 text-white/30 text-[14.5px] pointer-events-none">
                          Type @ to trigger floating mention...
                        </span>
                      }
                      ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <MentionPlugin
                      references={references}
                      onOpenMediaLibrary={() => alert("Version 1: Media Library callback triggered!")}
                    />
                    <OnChangePlugin
                      onChange={(state) => {
                        state.read(() => {
                          setV1RawOutput($getRoot().getTextContent());
                        });
                      }}
                    />
                  </div>
                </LexicalComposer>

                {/* Bottom Bar Details */}
                <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                    <GoogleIcon iconName="keyboard" className="text-[14px]" />
                    <span>Trigger: Typing @</span>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    className="h-6 px-2 text-xs"
                    onClick={() => alert(`Submitted V1 prompt: ${v1RawOutput}`)}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </div>

            {/* Live Serialized Prompt Output */}
            <div className="mt-2 p-3 rounded-2xl bg-black/40 border border-white/5">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-white/40 mb-1 flex items-center justify-between">
                <span>Serialized Prompt Output:</span>
                <span className="font-mono text-purple-300">Lexical TextNode / MentionNode</span>
              </div>
              <div className="font-mono text-[12px] text-purple-200/90 break-all select-all min-h-[20px]">
                {v1RawOutput || <span className="text-white/20 italic">Empty prompt...</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── VERSION 2 CARD ── */}
        {(activeTab === "both" || activeTab === "v2") && (
          <div className="flex flex-col gap-4 rounded-2xl bg-[#131415]/90 border border-white/10 p-6 shadow-none relative">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="size-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-[13px]">
                  V2
                </span>
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    Krea-Style Mention Menu & Prompt Bar
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono">
                      AtMentionMenu.jsx
                    </span>
                  </h2>
                  <p className="text-white/40 text-[11.5px]">
                    Floating top panel matching prompt bar style with Add (Files & Asset library) and zero borders.
                  </p>
                </div>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-[12px] text-cyan-200/90 flex items-start gap-2.5">
              <GoogleIcon iconName="info" className="text-[18px] shrink-0 text-cyan-300 mt-0.5" />
              <div>
                <p className="font-semibold text-white">How to test:</p>
                <p className="mt-0.5">
                  Click inside the input below and type <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-white/20 font-mono text-cyan-200">@</kbd> (or click the @ button).
                  The top panel appears above the prompt bar. Select an asset with click or arrow keys.
                </p>
              </div>
            </div>

            {/* Interactive Prompt Bar Shell with Top Panel Zone */}
            <div className="relative mt-2 flex flex-col items-center gap-2 w-full" ref={v2AnchorRef}>
              {/* TOP PANEL ZONE */}
              <AtMentionMenu
                open={v2PanelOpen}
                onClose={() => {
                  setV2PanelOpen(false);
                  setV2MentionQuery("");
                }}
                references={references}
                anchorRef={v2AnchorRef}
                query={v2MentionQuery}
                onSelectReference={(ref) => {
                  setV2InsertTarget(ref);
                  setV2PanelOpen(false);
                  setV2MentionQuery("");
                }}
                onOpenMediaLibrary={() => alert("Asset library clicked: Opening assets...")}
              />

              {/* Prompt Bar Shell (Border-free and shadow-free matching prompt bar) */}
              <div className="w-full rounded-2xl bg-(--background-state-90) backdrop-blur-80 p-3.5 shadow-none transition-all border-0">
                <LexicalComposer initialConfig={initialConfigV2}>
                  <div className="relative min-h-[50px] w-full px-1">
                    <RichTextPlugin
                      contentEditable={
                        <ContentEditable className="outline-none text-white text-[15px] leading-relaxed min-h-[46px] py-1" />
                      }
                      placeholder={
                        <span className="absolute top-1 left-1 text-white/30 text-[15px] pointer-events-none">
                          Type @ to trigger mention menu...
                        </span>
                      }
                      ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <AtShortcutPlugin
                      onTriggerMention={() => {
                        setV2MentionQuery("");
                        setV2PanelOpen(true);
                      }}
                      onMentionQueryChange={setV2MentionQuery}
                      mentionOpen={v2PanelOpen}
                    />
                    <ExternalInsertPlugin
                      insertTarget={v2InsertTarget}
                      onInserted={() => setV2InsertTarget(null)}
                    />
                    <OnChangePlugin
                      onChange={(state) => {
                        state.read(() => {
                          setV2RawOutput($getRoot().getTextContent());
                        });
                      }}
                    />
                  </div>
                </LexicalComposer>

                {/* Bottom Bar: Circular '+' on left, Auto Medium dropdown, Mic, and Circular '+' submit on right */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setV2PanelOpen(true)}
                    className="size-8 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white/70 hover:text-white flex items-center justify-center transition-all shrink-0"
                    title="Add media, reference or connector"
                  >
                    <GoogleIcon iconName="add" className="text-[18px]" />
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Auto Medium Selector */}
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[12.5px] font-medium transition-colors"
                    >
                      <span className="font-semibold text-white">Auto</span>
                      <span className="text-white/60">Medium</span>
                      <GoogleIcon iconName="keyboard_arrow_down" className="text-[15px] text-white/40" />
                    </button>

                    {/* Microphone Voice Button */}
                    <button
                      type="button"
                      className="size-8 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors"
                      title="Voice Input"
                    >
                      <GoogleIcon iconName="mic" className="text-[18px]" />
                    </button>

                    {/* Circular White Action Button with Black '+' */}
                    <button
                      type="button"
                      onClick={() => alert(`Submitted prompt: ${v2RawOutput}`)}
                      className="size-8 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black flex items-center justify-center transition-all shadow-none shrink-0 cursor-pointer"
                      title="Generate"
                    >
                      <GoogleIcon iconName="add" className="text-[20px] font-bold text-black" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Serialized Prompt Output */}
            <div className="mt-2 p-3 rounded-2xl bg-black/40 border border-white/5">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-white/40 mb-1 flex items-center justify-between">
                <span>Serialized Prompt Output:</span>
                <span className="font-mono text-cyan-300">Lexical TextNode / MentionNode</span>
              </div>
              <div className="font-mono text-[12px] text-cyan-200/90 break-all select-all min-h-[20px]">
                {v2RawOutput || <span className="text-white/20 italic">Empty prompt...</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-6xl mx-auto mt-12 p-6 rounded-2xl bg-[#141516]/80 border border-white/10 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <GoogleIcon iconName="table_chart" className="text-[20px] text-white/70" />
          Comparison Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-[11px] uppercase tracking-wider">
                <th className="pb-3 pr-4">Feature / Behavior</th>
                <th className="pb-3 px-4 text-purple-300">Version 1 (Floating Caret Popover)</th>
                <th className="pb-3 pl-4 text-cyan-300">Version 2 (Top Panel Shelf Zone)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              <tr>
                <td className="py-3 pr-4 font-medium text-white">Visual Anchor</td>
                <td className="py-3 px-4 text-white/70">Floats directly under the typing caret inside the text area.</td>
                <td className="py-3 pl-4 text-white/70">Floats centered above the entire PromptBar container.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-white">Trigger Experience</td>
                <td className="py-3 px-4 text-white/70">Typing <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-[11px]">@</kbd> queries dynamically as you keep typing letters.</td>
                <td className="py-3 pl-4 text-white/70">Typing <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-[11px]">@</kbd> pops open a full panel menu with search bar.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-white">Keyboard Navigation</td>
                <td className="py-3 px-4 text-white/70">↑, ↓, Enter, Tab, Escape natively inside the Lexical flow.</td>
                <td className="py-3 pl-4 text-white/70">Dedicated search filter input + keyboard list selection.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-white">Mobile / Narrow Viewports</td>
                <td className="py-3 px-4 text-white/70">Compact popup, bound to cursor bounds.</td>
                <td className="py-3 pl-4 text-white/70">Expansive top panel, easy to tap touch targets.</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-medium text-white">Chip Generation</td>
                <td className="py-3 px-4 text-white/70">Replaces typed <code className="text-purple-300">@query</code> with <code className="text-purple-300">&lt;MentionTag&gt;</code> badge.</td>
                <td className="py-3 pl-4 text-white/70">Inserts <code className="text-cyan-300">&lt;MentionTag&gt;</code> badge at cursor position.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
