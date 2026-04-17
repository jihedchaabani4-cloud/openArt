import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Dna, 
  Shirt, 
  FileText, 
  X,
  Globe,
  Activity,
  UserCircle,
  Sparkles,
  Check
} from "lucide-react";
import { BaseSelector } from "../common/selectors/BaseSelector";
import { SelectorCard } from "@/shared/ui/selector-card";
import { SelectorSlide } from "@/shared/ui/selector-slide";
import { useElementPrompt } from "../../model/useElementPrompt";
import { cn } from "@/shared/lib/utils";
import { useElementStore } from "../../model/useElementStore";

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
  RENDERING_STYLE_OPTIONS
} from "../../model/feature-constants";

const SELECT_GROUPS = []; // No longer needed for BaseSelector

export function ElementFeatureEditor({ open, onOpenChange, anchorRef }) {
  const featureEditor = useElementStore((state) => state.featureEditor);
  const setFeatureEditorView = useElementStore((state) => state.setFeatureEditorView);
  const [activeTab, setActiveTab] = React.useState(featureEditor.activeTab || 'identity');
  const editorRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setActiveTab(featureEditor.activeTab || 'identity');
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
        onOpenChange(false);
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
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-50",
            "flex flex-col h-[470px] w-[880px] overflow-hidden",
            "gap-2 p-1 rounded-[20px] backdrop-blur-[20px]",
            "shadow-[0_12px_8px_0_rgba(0,0,0,0.20),inset_0_0_0_1px_rgba(255,255,255,0.02)]",
            "bg-[#ffffff0d] bg-[linear-gradient(115deg,rgba(36,43,50,0.12)_27.54%,rgba(219,219,219,0.12)_85.5%),linear-gradient(0deg,rgba(15,17,19,0.96)_0%,rgba(15,17,19,0.96)_100%),linear-gradient(0deg,rgba(19,21,23,0.88)_0%,rgba(19,21,23,0.88)_100%),linear-gradient(41deg,rgba(101,189,235,0.24)_25.53%,rgba(101,189,235,0)_63.06%)]",
            "bg-blend-[normal,normal,normal,lighten]"
          )}
        >
          {/* Header - Selector */}
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
          <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
             <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col"
                >
                   {activeTab === 'era' && <EraSection />}
                  {activeTab === 'renderingStyle' && <RenderingStyleSection />}
                   {activeTab === 'identity' && <IdentitySection />}
                  {activeTab === 'head' && <HeadSection />}
                  {activeTab === 'details' && <DetailsSection />}
                  {activeTab === 'outfit' && <OutfitSection />}
                </motion.div>
             </AnimatePresence>
          </div>


          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EraSection() {
  const s = useElementPrompt();
  const { prompt, toggleTagInPrompt } = s;

  const currentSelection = React.useMemo(() => {
    const match = ERA_STEPS.find(step => prompt.includes(`<Trait: ${step.label}>`));
    return match ? match.value : null;
  }, [prompt]);

  return (
    <div className="flex-1 p-8 flex flex-col justify-center h-full">
      <SelectorSlide
        title="What period is your film set in?"
        steps={ERA_STEPS}
        value={currentSelection}
        onChange={(val) => {
          const label = ERA_STEPS.find(a => a.value === val)?.label;
          if (label) toggleTagInPrompt(label, { section: 'era', key: null });
        }}
        accentColor="#a3e635"
      />
    </div>
  );
}

function IdentitySection() {
  const s = useElementPrompt();
  const featureEditor = useElementStore((state) => state.featureEditor);
  const setFeatureEditorView = useElementStore((state) => state.setFeatureEditorView);
  const [activeSubTab, setActiveSubTab] = React.useState(featureEditor.activeSubTab || 'characterType');
  const { prompt, toggleTagInPrompt } = s;

  React.useEffect(() => {
    if (featureEditor.activeTab === 'identity' && featureEditor.activeSubTab) {
      setActiveSubTab(featureEditor.activeSubTab);
    }
  }, [featureEditor.activeTab, featureEditor.activeSubTab]);

  // Derive selection state from the prompt string
  const currentSelections = React.useMemo(() => {
    const results = {};
    // Age
    const ageMatch = AGE_STEPS.find(step => prompt.includes(`<Trait: ${step.label}>`));
    results.age = ageMatch ? ageMatch.value : null;

    // Height
    const heightMatch = HEIGHT_STEPS.find(step => prompt.includes(`<Trait: ${step.label}>`));
    results.height = heightMatch ? heightMatch.value : null;

    // Character Type
    const charTypeMatch = CHARACTER_TYPE_OPTIONS.find(opt => prompt.includes(`<Trait: ${opt.label}>`));
    results.characterType = charTypeMatch ? charTypeMatch.value : null;

    // Other Identity Options (Gender, Race, Build)
    Object.keys(IDENTITY_OPTIONS).forEach((key) => {
      const match = IDENTITY_OPTIONS[key].find(opt => prompt.includes(`<Trait: ${opt.label}>`));
      results[key] = match ? match.value : null;
    });

    return results;
  }, [prompt]);

  return (
    <div className="flex rounded-xl overflow-hidden h-full">
      {/* Left Sidebar - Vertical Sub-tabs */}
      <div className="w-1/6 p-2 space-y-1">
        {IDENTITY_SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setFeatureEditorView({ activeTab: 'identity', activeSubTab: tab.id });
              }}
              className={cn(
                "w-full flex items-center px-2 py-2 rounded-lg transition-all text-[14px]",
                isActive 
                  ? "text-white bg-white/10" 
                  : "text-white/70 hover:text-white/90"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right Content */}
      <div className="flex-1 p-4 flex flex-col">
        {activeSubTab === 'age' ? (
          <div className="w-full flex flex-col">
             <SelectorSlide
              title="Select age of your character"
              steps={AGE_STEPS}
              value={currentSelections.age}
              onChange={(val) => {
                const label = AGE_STEPS.find(a => a.value === val)?.label;
                if (label) toggleTagInPrompt(label, { section: 'identity', key: 'age' });
              }}
              accentColor="#a3e635"
            />
          </div>
        ) : activeSubTab === 'height' ? (
          <div className="w-full flex flex-col">
             <SelectorSlide
              title="Select height of your character"
              steps={HEIGHT_STEPS}
              value={currentSelections.height}
              onChange={(val) => {
                const label = HEIGHT_STEPS.find(h => h.value === val)?.label;
                if (label) toggleTagInPrompt(label, { section: 'identity', key: 'height' });
              }}
              accentColor="#a3e635"
            />
          </div>
        ) : activeSubTab === 'characterType' ? (
          <SelectorCard
            items={CHARACTER_TYPE_OPTIONS}
            value={currentSelections.characterType}
            onChange={(val) => {
              const opt = CHARACTER_TYPE_OPTIONS.find(o => o.value === val);
              if (opt) toggleTagInPrompt(opt.label, { section: 'identity', key: 'characterType' });
            }}
          />
        ) : (
        <SelectorCard
          items={
            activeSubTab === 'race'
              ? IDENTITY_OPTIONS.race.map(opt => ({
                  ...opt,
                  mediaLink: currentSelections.gender === 'female' ? opt.mediaLinkFemale : opt.mediaLinkMale,
                }))
              : IDENTITY_OPTIONS[activeSubTab]
          }
          value={currentSelections[activeSubTab]}
          onChange={(val) => {
              const opt = IDENTITY_OPTIONS[activeSubTab].find(o => o.value === val);
              if (opt) toggleTagInPrompt(opt.label, { section: 'identity', key: activeSubTab });
          }}
        />
        )}
      </div>
    </div>
  );
}

function HeadSection() {
  const s = useElementPrompt();
  const featureEditor = useElementStore((state) => state.featureEditor);
  const setFeatureEditorView = useElementStore((state) => state.setFeatureEditorView);
  const [activeSubTab, setActiveSubTab] = React.useState(featureEditor.activeSubTab || 'hairStyle');
  const { prompt, toggleTagInPrompt } = s;

  React.useEffect(() => {
    if (featureEditor.activeTab === 'head' && featureEditor.activeSubTab) {
      setActiveSubTab(featureEditor.activeSubTab);
    }
  }, [featureEditor.activeTab, featureEditor.activeSubTab]);

  const currentSelections = React.useMemo(() => {
    const results = {};
    const options = HEAD_OPTIONS[activeSubTab] || [];
    const match = options.find(opt => prompt.includes(`<Trait: ${opt.label}>`));
    results[activeSubTab] = match ? match.value : null;
    return results;
  }, [prompt, activeSubTab]);

  return (
    <div className="flex rounded-xl overflow-hidden h-full">
      {/* Left Sidebar - Vertical Sub-tabs */}
      <div className="w-1/6 p-2 space-y-1">
        {HEAD_SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setFeatureEditorView({ activeTab: 'head', activeSubTab: tab.id });
              }}
              className={cn(
                "w-full flex items-center px-2 py-2 rounded-lg transition-all text-[14px]",
                isActive 
                  ? "text-white bg-white/10" 
                  : "text-white/70 hover:text-white/90"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right Content */}
      <div className="flex-1 p-4 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <SelectorCard
          items={HEAD_OPTIONS[activeSubTab]}
          value={currentSelections[activeSubTab]}
          onChange={(val) => {
              const opt = HEAD_OPTIONS[activeSubTab].find(o => o.value === val);
              if (opt) toggleTagInPrompt(opt.label, { section: 'head', key: activeSubTab });
          }}
        />
      </div>
    </div>
  );
}

function DetailsSection() {
  const s = useElementPrompt();
  const featureEditor = useElementStore((state) => state.featureEditor);
  const setFeatureEditorView = useElementStore((state) => state.setFeatureEditorView);
  const [activeSubTab, setActiveSubTab] = React.useState(featureEditor.activeSubTab || 'eyeColor');
  const { prompt, toggleTagInPrompt } = s;

  React.useEffect(() => {
    if (featureEditor.activeTab === 'details' && featureEditor.activeSubTab) {
      setActiveSubTab(featureEditor.activeSubTab);
    }
  }, [featureEditor.activeTab, featureEditor.activeSubTab]);

  const currentSelections = React.useMemo(() => {
    const results = {};
    const options = DETAILS_OPTIONS[activeSubTab] || [];
    const match = options.find(opt => prompt.includes(`<Trait: ${opt.label}>`));
    results[activeSubTab] = match ? match.value : null;
    return results;
  }, [prompt, activeSubTab]);

  return (
    <div className="flex rounded-xl overflow-hidden h-full">
      {/* Left Sidebar - Vertical Sub-tabs */}
      <div className="w-1/6 p-2 space-y-1">
        {DETAILS_SUB_TABS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setFeatureEditorView({ activeTab: 'details', activeSubTab: tab.id });
              }}
              className={cn(
                "w-full flex items-center px-2 py-2 rounded-lg transition-all text-[14px]",
                isActive 
                  ? "text-white bg-white/10" 
                  : "text-white/70 hover:text-white/90"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right Content */}
      <div className="flex-1 p-4 flex flex-col h-full overflow-y-auto scrollbar-hide">
        <SelectorCard
          items={DETAILS_OPTIONS[activeSubTab]}
          value={currentSelections[activeSubTab]}
          onChange={(val) => {
              const opt = DETAILS_OPTIONS[activeSubTab].find(o => o.value === val);
              if (opt) toggleTagInPrompt(opt.label, { section: 'details', key: activeSubTab });
          }}
        />
      </div>
    </div>
  );
}

function OutfitSection() {
  const s = useElementPrompt();
  const { prompt, toggleTagInPrompt } = s;
  
  // Need to know gender to show correct preview
  const currentGender = React.useMemo(() => {
    const match = IDENTITY_OPTIONS.gender.find(opt => prompt.includes(`<Trait: ${opt.label}>`));
    return match ? match.value : 'male'; // Default to male preview if nothing selected
  }, [prompt]);

  const currentSelectedValue = React.useMemo(() => {
    const match = OUTFIT_OPTIONS.find(opt => prompt.includes(`<Trait: ${opt.label}>`));
    return match ? match.value : null;
  }, [prompt]);

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto scrollbar-hide">
      <SelectorCard
        items={OUTFIT_OPTIONS.map(opt => ({
          ...opt,
          mediaLink: opt.mediaLink || (currentGender === 'female' ? opt.mediaLinkFemale : opt.mediaLinkMale)
        }))}
        value={currentSelectedValue}
        onChange={(val) => {
            const opt = OUTFIT_OPTIONS.find(o => o.value === val);
            if (opt) toggleTagInPrompt(opt.label, { section: 'outfit', key: null });
        }}
      />
    </div>
  );
}

function RenderingStyleSection() {
  const s = useElementPrompt();
  const { prompt, toggleTagInPrompt } = s;
  const currentSelectedValue = React.useMemo(() => {
    const match = RENDERING_STYLE_OPTIONS.find(opt => prompt.includes(`<Trait: ${opt.label}>`));
    return match ? match.value : null;
  }, [prompt]);

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto scrollbar-hide">
      <SelectorCard
        items={RENDERING_STYLE_OPTIONS}
        value={currentSelectedValue}
        onChange={(val) => {
            const opt = RENDERING_STYLE_OPTIONS.find(o => o.value === val);
            if (opt) toggleTagInPrompt(opt.label, { section: 'renderingStyle', key: null });
        }}
      />
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 text-white/70">
      <Icon size={16} />
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
    </div>
  );
}

function FeatureInput({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider ml-1">{label}</label>
      <input 
        className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20 transition-all placeholder:text-white/10"
        {...props}
      />
    </div>
  );
}

function FeatureTextarea({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider ml-1">{label}</label>
      <textarea 
        className="bg-white/5 border border-white/5 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-white/20 transition-all placeholder:text-white/10 resize-none min-h-[80px]"
        {...props}
      />
    </div>
  );
}
