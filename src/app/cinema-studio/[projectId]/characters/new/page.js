"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { NavbarCore, NavbarTitle } from "@/widgets/NavbarCore";
import { useCharacterWorkflows, useGenerateCharacterDescriptionMutation, useCreateCharacterMutation } from "@/features/characters";
import { useWorkflowsStore } from "@/features/workflows";
import { useCharacterStore } from "@/features/studio";
import { CharacterPromptBar, promptBarService } from "@/features/prompt-bar";

const CHARACTER_ARCHETYPES = [
  {
    id: "eccentric",
    title: "The Eccentric",
    description: "Unforgettable quirky humans. Magnetic scene-stealers with offbeat charm.",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_eccentric.jpeg",
  },
  {
    id: "professional",
    title: "The Professional",
    description: "Sharply dressed, composed. Polished presence built for corporate/drama.",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_professional.jpeg",
  },
  {
    id: "wildcard",
    title: "The Wildcard",
    description: "Beyond human, anything can be a character, right?",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_wildcard.jpeg",
  },
  {
    id: "familiar",
    title: "The Familiar",
    description: "Relatable, grounded everyday people.",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_familiar.jpeg",
  },
  {
    id: "wicked",
    title: "The Wicked",
    description: "Intense antagonists & antiheroes.",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_wicked.jpeg",
  },
  {
    id: "fantastical",
    title: "The Fantastical",
    description: "Mythic, futuristic, & otherworldly entities.",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_fantastical.jpeg",
  },
];

function ArchetypeCard({ archetype, onClick, index, isGenerating, isDisabled }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      whileTap={!isDisabled && !isGenerating ? { scale: 0.98 } : {}}
      disabled={isDisabled || isGenerating}
      onClick={() => onClick(archetype)}
      style={{
        flex: "1 1 0px",
        minWidth: 0,
        height: "auto",
        padding: "1rem",
        borderRadius: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        textAlign: "left",
        backdropFilter: (isGenerating || isDisabled) ? "none" : "blur(80px)",
        backgroundColor: (isGenerating || isDisabled)
          ? "transparent"
          : "rgba(218, 220, 224, 0.1)",
        color: "rgb(255, 255, 255)",
        boxShadow: isGenerating
          ? "rgba(255, 255, 255, 0.75) 0px 0px 0px 0.75px inset"
          : "none",
        cursor: isGenerating ? "wait" : isDisabled ? "not-allowed" : "pointer",
        opacity: 1,
        transition: "background-color 0.05s ease-out, box-shadow 0.05s ease-out",
        width: "100%",
        position: "relative",
      }}
      whileHover={!isDisabled && !isGenerating ? { backgroundColor: "rgba(255, 255, 255, 0.18)", transition: { duration: 0.05, ease: "easeOut" } } : {}}
    >
      <img
        src={archetype.image}
        alt={archetype.title}
        crossOrigin="anonymous"
        style={{
          width: 88,
          height: 88,
          borderRadius: "0.875rem",
          objectFit: "cover",
          flexShrink: 0,
          opacity: 1,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#fff", lineHeight: "1.25rem" }}>
          {archetype.title}
        </span>
        <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)", lineHeight: "1.1rem" }}>
          {archetype.description}
        </span>
        {isGenerating && (
          <span className="text-[0.6875rem] font-medium text-white/90 animate-pulse pt-0.5">
            Génération du prompt...
          </span>
        )}
      </div>
    </motion.button>
  );
}

export default function NewCharacterPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const [error] = useState(null);
  const [generatingDescriptionId, setGeneratingDescriptionId] = useState(null);

  const selectedProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const effectiveProjectId = projectId || selectedProjectId;

  const setPrompt = useCharacterStore((state) => state.setPrompt);
  const generateDescriptionMutation = useGenerateCharacterDescriptionMutation();
  const createCharacterMutation = useCreateCharacterMutation();

  const { workflows: existingSheets } = useCharacterWorkflows(effectiveProjectId);

  const goBack = () => {
    if (existingSheets && existingSheets.length > 0) {
      router.push(`/cinema-studio/${effectiveProjectId}/characters`);
    } else {
      router.push(`/cinema-studio/${effectiveProjectId}/assets`);
    }
  };

  const handleGenerate = async (payload) => {
    if (!payload?.prompt?.trim() || payload.prompt.trim().length < 10) return;

    try {
      const references = payload.references || payload.parameters?.references || [];
      await createCharacterMutation.mutateAsync({
        projectId: effectiveProjectId,
        name: payload.prompt.slice(0, 40),
        prompt: payload.prompt,
        references,
      });
      router.push(`/cinema-studio/${effectiveProjectId}/characters`);
    } catch (err) {
      console.warn("Character creation error:", err);
    }
  };

  const handleArchetypeClick = async (archetype) => {
    setGeneratingDescriptionId(archetype.id);

    try {
      const res = await generateDescriptionMutation.mutateAsync({
        concept: archetype.title,
        archetype: archetype.id,
      });
      if (res?.description) {
        setPrompt(res.description);
        promptBarService({ templateId: "character", projectId: effectiveProjectId }).setPrompt(res.description);
        setTimeout(() => {
          const textarea = document.querySelector("textarea");
          if (textarea) {
            textarea.focus();
            textarea.scrollIntoView({ behavior: "smooth", block: "end" });
          }
        }, 100);
      }
    } catch (err) {
      console.warn("Character description generation error:", err.message);
    } finally {
      setGeneratingDescriptionId(null);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-studio-dark text-white overflow-hidden relative">
      {/* Navbar */}
      <NavbarCore
        onBack={goBack}
        backLabel={existingSheets && existingSheets.length > 0 ? "Back to characters" : "Back to studio"}
        left={<NavbarTitle>New character</NavbarTitle>}
      />

      {/* Body - Centered Layout */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-[80px] pb-44 custom-scrollbar flex flex-col items-center justify-center">
        <div className="w-full px-4 sm:px-8 py-8 flex flex-col gap-8 items-center justify-center min-h-[calc(100vh-240px)]">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 w-full max-w-[55rem]">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Archetype Cards Grid & Centered Hero Generator ── */}
          <div className="flex flex-col items-center justify-center gap-6 text-center w-full">
            <h1 style={{
              textAlign: "center",
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              fontWeight: 400,
              lineHeight: "1.6",
              color: "rgba(255,255,255,0.55)",
              maxWidth: "55rem",
              margin: 0,
            }}>
              Build and reuse characters for consistent videos.<br />
              Use a sample prompt below, or create from scratch.
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-[55rem]">
              {CHARACTER_ARCHETYPES.map((archetype, index) => (
                <ArchetypeCard
                  key={archetype.id}
                  archetype={archetype}
                  onClick={handleArchetypeClick}
                  index={index}
                  isGenerating={generatingDescriptionId === archetype.id}
                  isDisabled={!!generatingDescriptionId && generatingDescriptionId !== archetype.id}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Dedicated Character PromptBar (Prompt + Reference, No models, No params) */}
      <CharacterPromptBar
        projectId={effectiveProjectId}
        onGenerate={handleGenerate}
        isGenerating={createCharacterMutation.isPending}
      />
    </div>
  );
}
