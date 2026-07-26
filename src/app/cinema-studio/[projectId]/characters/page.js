"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { useCharacterWorkflows } from "@/features/workflows/api/workflowsApi";
import { ElementsPromptBar } from "@/features/prompt-bar/ui/elements/ElementsPromptBar";
import { useElementStore } from "@/features/prompt-bar/model/useElementStore";
import { RowsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/rows.css';
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem";
import { getPrimaryMedia } from "@/shared/lib/generationUtils";
import { getItemMetadata as getDisplayMeta } from "@/shared/lib/displayUtils";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";

// ─── Character Archetypes ─────────────────────────────────────────────────────
const CHARACTER_ARCHETYPES = [
  {
    id: "eccentric",
    title: "The Eccentric",
    description: "Unforgettable quirky humans. Magnetic scene-stealers with offbeat charm.",
    prompt: "An eccentric character with wild red curly hair, bright quirky clothing, magnetic personality, unforgettable look, character reference sheet, 3-view front side back",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_eccentric.jpeg",
  },
  {
    id: "professional",
    title: "The Professional",
    description: "Clean cut, well spoken, competent",
    prompt: "A professional character, clean cut appearance, well dressed, competent and authoritative look, character reference sheet, 3-view front side back",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_professional.jpeg",
  },
  {
    id: "wildcard",
    title: "The Wildcard",
    description: "Beyond human, anything can be a character, right?",
    prompt: "A wildcard fantasy character, non-human creature, otherworldly appearance, fantastical being, character reference sheet, 3-view front side back",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_wildcard.jpeg",
  },
  {
    id: "familiar",
    title: "The Familiar",
    description: "Grounded and authentic, a relatable anchor for your story",
    prompt: "A familiar grounded character, authentic real-world look, relatable everyday person, natural appearance, character reference sheet, 3-view front side back",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_familiar.jpeg",
  },
  {
    id: "wicked",
    title: "The Wicked",
    description: "Powerful antagonistic figures that command the screen",
    prompt: "A wicked antagonist character, dark commanding presence, powerful villain look, dramatic and sinister, character reference sheet, 3-view front side back",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_wicked.jpeg",
  },
  {
    id: "fantastical",
    title: "The Fantastical",
    description: "Ethereal, dreamlike beings fusing the human and the mythical",
    prompt: "A fantastical ethereal character, dreamlike otherworldly being, mythical human fusion, glowing ethereal appearance, character reference sheet, 3-view front side back",
    image: "https://www.gstatic.com/aitestkitchen/website/flow/flow_characters/the_fantastical.jpeg",
  },
];

// ─── Archetype Card ───────────────────────────────────────────────────────────
function ArchetypeCard({ archetype, onClick, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(archetype)}
      style={{
        flex: "1 1 0px",
        minWidth: 0,
        height: "auto",
        padding: "1.25rem",
        borderRadius: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        textAlign: "left",
        backdropFilter: "blur(80px)",
        backgroundColor: "rgba(218, 220, 224, 0.1)",
        color: "rgb(255, 255, 255)",
        border: "none",
        cursor: "pointer",
        transition: "box-shadow 0.2s, background-color 0.15s",
        width: "100%",
      }}
      whileHover={{ backgroundColor: "rgba(218, 220, 224, 0.15)" }}
    >
      {/* Image */}
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
        }}
      />

      {/* Text */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 0 }}>
        <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#fff", lineHeight: "1.25rem" }}>
          {archetype.title}
        </span>
        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", lineHeight: "1.1rem" }}>
          {archetype.description}
        </span>
      </div>
    </motion.button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CharactersPage({ params }) {
  const { projectId } = React.use(params);
  const { setSelectedProjectId, setActiveStudioTab, gridSize } = useGenerationsStore();
  const { setPrompt, setElementMode } = useElementStore();
  const router = useRouter();

  React.useEffect(() => {
    if (projectId) setSelectedProjectId(projectId);
    setActiveStudioTab("characters");
    setElementMode("character");
  }, [projectId, setSelectedProjectId, setActiveStudioTab, setElementMode]);

  // Fetch only character sheet workflows
  const { workflows: characterSheets, isLoading } = useCharacterWorkflows(projectId);

  const targetRowHeight = gridSize === "lg" ? 380 : gridSize === "md" ? 280 : 200;

  const photos = React.useMemo(() => {
    return (characterSheets || []).reduce((acc, workflow, i) => {
      const primaryItem = getPrimaryMedia(workflow);
      if (!primaryItem) return acc;

      const meta = getDisplayMeta(primaryItem, workflow);
      const aspect = meta?.aspect ?? "3/4";
      const [wStr, hStr] = aspect.split("/");
      const wNum = parseFloat(wStr) || 3;
      const hNum = parseFloat(hStr) || 4;
      const BASE = 1200;
      const width  = Math.round(BASE * (wNum / Math.max(wNum, hNum)));
      const height = Math.round(BASE * (hNum / Math.max(wNum, hNum)));
      const url = meta?.url || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

      acc.push({ src: url, width, height, key: workflow.id || workflow.name || String(i), workflow });
      return acc;
    }, []);
  }, [characterSheets]);

  // Handle archetype card click — inject prompt into PromptBar
  const handleArchetypeClick = (archetype) => {
    setElementMode("character");
    setPrompt(archetype.prompt);
    // Scroll/focus the textarea
    setTimeout(() => {
      const textarea = document.querySelector("textarea");
      if (textarea) {
        textarea.focus();
        textarea.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 100);
  };

  if (isLoading && characterSheets.length === 0) {
    return <LoadingScreen message="Loading characters" />;
  }

  const hasCharacters = characterSheets.length > 0;

  return (
    <div className="flex h-full w-full overflow-hidden text-white bg-studio-dark relative">
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden z-10">

        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar">
          <AnimatePresence mode="wait">
            {hasCharacters ? (
              /* ── Gallery view ─────────────────────────────────── */
              <motion.div
                key="character-feed"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 w-full p-5 pt-[80px] pb-44"
              >
                <RowsPhotoAlbum
                  photos={photos}
                  targetRowHeight={targetRowHeight}
                  spacing={16}
                  render={{
                    photo: (_, { photo, width, height }) => (
                      <div
                        key={photo.key}
                        className="react-photo-album--photo"
                        style={{
                          width,
                          height,
                          "--react-photo-album--photo-width": width,
                          "--react-photo-album--photo-height": height,
                        }}
                      >
                        <MediaGridItem
                          key={photo.key}
                          workflow={photo.workflow}
                          onClick={() => router.push(`/cinema-studio/${projectId}/elements/${photo.key}`)}
                          className="rounded-2xl border-none shadow-xl w-full h-full"
                          width={width}
                          height={height}
                        />
                      </div>
                    ),
                  }}
                />
              </motion.div>
            ) : (
              /* ── Empty / Hero state ─────────────────────────────── */
              <motion.div
                key="character-hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "3rem",
                  width: "100%",
                  minHeight: "100%",
                  paddingTop: "60px",
                  paddingBottom: "140px",
                }}
              >
                {/* h1 — matches .vONgs */}
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

                {/* Grid — matches .hjcilJ (Responsive: 1 col on mobile, 2 on tablet, 3 on desktop) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-[55rem]">
                  {CHARACTER_ARCHETYPES.map((archetype, index) => (
                    <ArchetypeCard
                      key={archetype.id}
                      archetype={archetype}
                      onClick={handleArchetypeClick}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dedicated Character PromptBar (Bottom) */}
        <ElementsPromptBar />

      </main>
    </div>
  );
}
