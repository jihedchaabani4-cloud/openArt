"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BaseSelector } from "../common/selectors/BaseSelector";
import { SelectorCard } from "@/shared/ui/selector-card";
import { SelectorSlide } from "@/shared/ui/selector-slide";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { useCharacterStore } from "../../model/useCharacterStore";

import {
  TABS,
  ERA_STEPS,
  IDENTITY_SUB_TABS,
  IDENTITY_OPTIONS,
  CHARACTER_TYPE_OPTIONS,
  AGE_STEPS,
  HEIGHT_STEPS,
  HEAD_SUB_TABS,
  HEAD_OPTIONS,
  DETAILS_SUB_TABS,
  DETAILS_OPTIONS,
  OUTFIT_OPTIONS,
  RENDERING_STYLE_OPTIONS,
} from "../../model/feature-constants";

export function CharacterFeatureEditor({ open, onOpenChange, anchorRef }) {
  const featureEditor = useCharacterStore((state) => state.featureEditor);
  const setFeatureEditorView = useCharacterStore((state) => state.setFeatureEditorView);
  const [activeTab, setActiveTab] = React.useState(featureEditor.activeTab || "identity");
  const editorRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setActiveTab(featureEditor.activeTab || "identity");
    }
  }, [open, featureEditor.activeTab]);

  // Click outside logic
  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (event.target instanceof Element && event.target.closest('[data-feature-chip="true"]')) {
        return;
      }
      if (anchorRef?.current && anchorRef.current.contains(event.target)) return;
      if (editorRef.current && !editorRef.current.contains(event.target)) {
        onOpenChange?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange, anchorRef]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={editorRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-50 pointer-events-auto",
            "flex flex-col h-[470px] w-[880px] max-w-[95vw] overflow-hidden",
            "gap-2 p-3 rounded-2xl backdrop-blur-80",
            "border border-white/10 shadow-none",
            "bg-(--background-state-90) text-white"
          )}
        >
          {/* Header - Tabs */}
          <div className="p-1 flex items-center justify-between">
            <BaseSelector
              value={activeTab}
              onChange={(nextTab) => {
                setActiveTab(nextTab);
                setFeatureEditorView({ activeTab: nextTab, activeSubTab: null });
              }}
              options={TABS}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                {activeTab === "era" && <EraSection />}
                {activeTab === "renderingStyle" && <RenderingStyleSection />}
                {activeTab === "identity" && <IdentitySection />}
                {activeTab === "head" && <HeadSection />}
                {activeTab === "details" && <DetailsSection />}
                {activeTab === "outfit" && <OutfitSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EraSection() {
  const prompt = useCharacterStore((state) => state.prompt || "");
  const toggleTagInPrompt = useCharacterStore((state) => state.toggleTagInPrompt);

  const currentSelectedValue = React.useMemo(() => {
    const match = ERA_STEPS.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
    return match ? match.value : null;
  }, [prompt]);

  return (
    <div className="flex-1 p-6 flex flex-col justify-center">
      <SelectorSlide
        title="Select Era"
        steps={ERA_STEPS}
        value={currentSelectedValue}
        onChange={(val) => {
          const label = ERA_STEPS.find((e) => e.value === val)?.label;
          if (label) toggleTagInPrompt(label, { section: "era", key: null });
        }}
        accentColor="#a855f7"
      />
    </div>
  );
}

function IdentitySection() {
  const prompt = useCharacterStore((state) => state.prompt || "");
  const toggleTagInPrompt = useCharacterStore((state) => state.toggleTagInPrompt);
  const featureEditor = useCharacterStore((state) => state.featureEditor);
  const setFeatureEditorView = useCharacterStore((state) => state.setFeatureEditorView);
  const [activeSubTab, setActiveSubTab] = React.useState(featureEditor.activeSubTab || "characterType");

  React.useEffect(() => {
    if (featureEditor.activeTab === "identity" && featureEditor.activeSubTab) {
      setActiveSubTab(featureEditor.activeSubTab);
    }
  }, [featureEditor.activeTab, featureEditor.activeSubTab]);

  const currentGender = React.useMemo(() => {
    const match = IDENTITY_OPTIONS.gender.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
    return match ? match.value : "male";
  }, [prompt]);

  const currentSelections = React.useMemo(() => {
    const results = {};
    if (activeSubTab === "characterType") {
      const match = CHARACTER_TYPE_OPTIONS.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
      results.characterType = match ? match.value : null;
    } else if (activeSubTab === "age") {
      const match = AGE_STEPS.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
      results.age = match ? match.value : null;
    } else if (activeSubTab === "height") {
      const match = HEIGHT_STEPS.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
      results.height = match ? match.value : null;
    } else {
      const options = IDENTITY_OPTIONS[activeSubTab] || [];
      const match = options.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
      results[activeSubTab] = match ? match.value : null;
    }
    return results;
  }, [prompt, activeSubTab]);

  return (
    <div className="flex rounded-lg overflow-hidden h-full">
      {/* Left Sidebar - Sub-tabs */}
      <div className="w-1/6 p-2 space-y-1">
        {IDENTITY_SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "secondary" : "ghost"}
              onClick={() => {
                setActiveSubTab(tab.id);
                setFeatureEditorView({ activeTab: "identity", activeSubTab: tab.id });
              }}
              className="w-full justify-start text-sm"
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Right Content */}
      <div className="flex-1 p-4 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {activeSubTab === "characterType" && (
          <SelectorCard
            items={CHARACTER_TYPE_OPTIONS}
            value={currentSelections.characterType}
            onChange={(val) => {
              const opt = CHARACTER_TYPE_OPTIONS.find((o) => o.value === val);
              if (opt) toggleTagInPrompt(opt.label, { section: "identity", key: "characterType" });
            }}
          />
        )}

        {activeSubTab === "age" && (
          <div className="flex-1 p-6 flex flex-col justify-center">
            <SelectorSlide
              title="Select Character Age"
              steps={AGE_STEPS}
              value={currentSelections.age}
              onChange={(val) => {
                const label = AGE_STEPS.find((a) => a.value === val)?.label;
                if (label) toggleTagInPrompt(label, { section: "identity", key: "age" });
              }}
              accentColor="#60a5fa"
            />
          </div>
        )}

        {activeSubTab === "height" && (
          <div className="flex-1 p-6 flex flex-col justify-center">
            <SelectorSlide
              title="Select Character Height"
              steps={HEIGHT_STEPS}
              value={currentSelections.height}
              onChange={(val) => {
                const label = HEIGHT_STEPS.find((h) => h.value === val)?.label;
                if (label) toggleTagInPrompt(label, { section: "identity", key: "height" });
              }}
              accentColor="#34d399"
            />
          </div>
        )}

        {activeSubTab !== "characterType" && activeSubTab !== "age" && activeSubTab !== "height" && (
          <SelectorCard
            items={(IDENTITY_OPTIONS[activeSubTab] || []).map((opt) => ({
              ...opt,
              mediaLink: opt.mediaLink || (currentGender === "female" ? opt.mediaLinkFemale : opt.mediaLinkMale),
            }))}
            value={currentSelections[activeSubTab]}
            onChange={(val) => {
              const opt = (IDENTITY_OPTIONS[activeSubTab] || []).find((o) => o.value === val);
              if (opt) toggleTagInPrompt(opt.label, { section: "identity", key: activeSubTab });
            }}
          />
        )}
      </div>
    </div>
  );
}

function HeadSection() {
  const prompt = useCharacterStore((state) => state.prompt || "");
  const toggleTagInPrompt = useCharacterStore((state) => state.toggleTagInPrompt);
  const featureEditor = useCharacterStore((state) => state.featureEditor);
  const setFeatureEditorView = useCharacterStore((state) => state.setFeatureEditorView);
  const [activeSubTab, setActiveSubTab] = React.useState(featureEditor.activeSubTab || "hairStyle");

  React.useEffect(() => {
    if (featureEditor.activeTab === "head" && featureEditor.activeSubTab) {
      setActiveSubTab(featureEditor.activeSubTab);
    }
  }, [featureEditor.activeTab, featureEditor.activeSubTab]);

  const currentSelections = React.useMemo(() => {
    const results = {};
    const options = HEAD_OPTIONS[activeSubTab] || [];
    const match = options.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
    results[activeSubTab] = match ? match.value : null;
    return results;
  }, [prompt, activeSubTab]);

  return (
    <div className="flex rounded-lg overflow-hidden h-full">
      <div className="w-1/6 p-2 space-y-1">
        {HEAD_SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "secondary" : "ghost"}
              onClick={() => {
                setActiveSubTab(tab.id);
                setFeatureEditorView({ activeTab: "head", activeSubTab: tab.id });
              }}
              className="w-full justify-start text-sm"
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      <div className="flex-1 p-4 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <SelectorCard
          items={HEAD_OPTIONS[activeSubTab]}
          value={currentSelections[activeSubTab]}
          onChange={(val) => {
            const opt = HEAD_OPTIONS[activeSubTab].find((o) => o.value === val);
            if (opt) toggleTagInPrompt(opt.label, { section: "head", key: activeSubTab });
          }}
        />
      </div>
    </div>
  );
}

function DetailsSection() {
  const prompt = useCharacterStore((state) => state.prompt || "");
  const toggleTagInPrompt = useCharacterStore((state) => state.toggleTagInPrompt);
  const featureEditor = useCharacterStore((state) => state.featureEditor);
  const setFeatureEditorView = useCharacterStore((state) => state.setFeatureEditorView);
  const [activeSubTab, setActiveSubTab] = React.useState(featureEditor.activeSubTab || "eyeColor");

  React.useEffect(() => {
    if (featureEditor.activeTab === "details" && featureEditor.activeSubTab) {
      setActiveSubTab(featureEditor.activeSubTab);
    }
  }, [featureEditor.activeTab, featureEditor.activeSubTab]);

  const currentSelections = React.useMemo(() => {
    const results = {};
    const options = DETAILS_OPTIONS[activeSubTab] || [];
    const match = options.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
    results[activeSubTab] = match ? match.value : null;
    return results;
  }, [prompt, activeSubTab]);

  return (
    <div className="flex rounded-lg overflow-hidden h-full">
      <div className="w-1/6 p-2 space-y-1">
        {DETAILS_SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "secondary" : "ghost"}
              onClick={() => {
                setActiveSubTab(tab.id);
                setFeatureEditorView({ activeTab: "details", activeSubTab: tab.id });
              }}
              className="w-full justify-start text-sm"
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      <div className="flex-1 p-4 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <SelectorCard
          items={DETAILS_OPTIONS[activeSubTab]}
          value={currentSelections[activeSubTab]}
          onChange={(val) => {
            const opt = DETAILS_OPTIONS[activeSubTab].find((o) => o.value === val);
            if (opt) toggleTagInPrompt(opt.label, { section: "details", key: activeSubTab });
          }}
        />
      </div>
    </div>
  );
}

function OutfitSection() {
  const prompt = useCharacterStore((state) => state.prompt || "");
  const toggleTagInPrompt = useCharacterStore((state) => state.toggleTagInPrompt);

  const currentGender = React.useMemo(() => {
    const match = IDENTITY_OPTIONS.gender.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
    return match ? match.value : "male";
  }, [prompt]);

  const currentSelectedValue = React.useMemo(() => {
    const match = OUTFIT_OPTIONS.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
    return match ? match.value : null;
  }, [prompt]);

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <SelectorCard
        items={OUTFIT_OPTIONS.map((opt) => ({
          ...opt,
          mediaLink: opt.mediaLink || (currentGender === "female" ? opt.mediaLinkFemale : opt.mediaLinkMale),
        }))}
        value={currentSelectedValue}
        onChange={(val) => {
          const opt = OUTFIT_OPTIONS.find((o) => o.value === val);
          if (opt) toggleTagInPrompt(opt.label, { section: "outfit", key: null });
        }}
      />
    </div>
  );
}

function RenderingStyleSection() {
  const prompt = useCharacterStore((state) => state.prompt || "");
  const toggleTagInPrompt = useCharacterStore((state) => state.toggleTagInPrompt);
  const currentSelectedValue = React.useMemo(() => {
    const match = RENDERING_STYLE_OPTIONS.find((opt) => prompt.includes(`<Trait: ${opt.label}>`));
    return match ? match.value : null;
  }, [prompt]);

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <SelectorCard
        items={RENDERING_STYLE_OPTIONS}
        value={currentSelectedValue}
        onChange={(val) => {
          const opt = RENDERING_STYLE_OPTIONS.find((o) => o.value === val);
          if (opt) toggleTagInPrompt(opt.label, { section: "renderingStyle", key: null });
        }}
      />
    </div>
  );
}

export const ElementFeatureEditor = CharacterFeatureEditor;
export default CharacterFeatureEditor;
