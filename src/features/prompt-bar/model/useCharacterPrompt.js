import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateCharacterMutation } from "@/features/workflows/api/workflowsApi";
import { characterService } from "@/features/characters/services/characterService";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { queryKeys } from "@/shared/api/queryKeys";
import { usePromptBar } from "./usePromptBar";
import { useElementStore } from "./useElementStore";

/**
 * [Prompt Bar Feature - Character Domain Hook]
 * Dedicated prompt bar hook for Character Creation.
 * Sends ONLY workflow_id / asset_id references to backend.
 * All media URLs and metadata are resolved strictly on the Backend.
 */
export function useCharacterPrompt() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const s = usePromptBar({ isNewProject: false });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [internalMode, setInternalMode] = React.useState("image");
  const [targetRole, setTargetRole] = React.useState("normal");
  const [mentionCallback, setMentionCallback] = React.useState(null);

  const { selectedProjectId: storeProjectId } = useWorkflowsStore();
  const projectId = params?.projectId || storeProjectId;

  const { mutateAsync: createCharacter, isPending: isCreating } = useCreateCharacterMutation();
  const {
    prompts,
    setPrompt,
    references: elementReferences,
    addReference: addElementReference,
    clearReferences: clearElementReferences,
    elementMode,
    setElementMode,
  } = useElementStore();

  const prompt = prompts.character || s.prompt || "";
  const maxRefs = s.maxRefs ?? 4;

  // Combine reference images from both usePromptBar and useElementStore
  const rawCombinedRefs = [
    ...(elementReferences.character || []),
    ...(s.referenceImages || [])
  ];

  // Deduplicate and normalize reference image objects
  const referenceImages = Array.from(
    new Map(
      rawCombinedRefs.map((r) => {
        const id = typeof r === "string" ? r : r?.workflow_id || r?.workflowId || r?.asset_id || r?.id || r?.url || "";
        const item = typeof r === "string" 
          ? { id: r, url: r } 
          : { ...r };
        return [id, item];
      })
    ).values()
  ).filter((r) => Boolean(r.id || r.url || r.workflow_id));

  const openDialog = (mode = "image", role = "normal", callback = null) => {
    setInternalMode(mode);
    setTargetRole(role);
    setMentionCallback(() => callback);
    setDialogOpen(true);
    if (s.handleOpenLibrary) {
      s.handleOpenLibrary(mode);
    }
  };

  const handleAddClick = () => {
    if (dialogOpen) {
      setDialogOpen(false);
      return;
    }
    openDialog("image", "normal");
  };

  const handleSelectMedia = (assets) => {
    const items = Array.isArray(assets) ? assets : [assets];
    items.forEach((asset) => {
      if (s.handleAddReference) {
        s.handleAddReference(asset, targetRole);
      }
      addElementReference(asset, targetRole, maxRefs);
    });
    if (mentionCallback) mentionCallback(items);
    setDialogOpen(false);
    setMentionCallback(null);
  };

  const handleRemoveReference = (indexOrUrl) => {
    if (s.handleRemoveReference) {
      s.handleRemoveReference(indexOrUrl);
    }
    if (typeof indexOrUrl === "string") {
      useElementStore.getState().removeReference("character", indexOrUrl);
    }
  };

  const handleGenerateCharacter = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isCreating || s.generating) return;

    try {
      // Send ONLY workflow_ids (or asset_ids) to backend. NO URLs FROM FRONTEND!
      const referenceWorkflowIds = referenceImages.map((r) => {
        if (typeof r === "string") return r;
        return r.workflow_id || r.workflowId || r.asset_id || r.id;
      }).filter(Boolean);

      console.log("🚀 [useCharacterPrompt] Submitting character create payload with workflow IDs ONLY:", referenceWorkflowIds);

      const payload = characterService.buildCreatePayload({
        name: prompt.slice(0, 45),
        prompt,
        references: referenceWorkflowIds,
        projectId,
      });

      const res = await createCharacter({ payload });

      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        router.push(`/cinema-studio/${projectId}/characters`);
      }

      setPrompt("");
      if (s.clearReferences) s.clearReferences();
      if (clearElementReferences) clearElementReferences();
      return res;
    } catch (err) {
      console.error("Failed to create character via prompt bar:", err);
      throw err;
    }
  };

  return {
    ...s,
    prompt,
    setPrompt: (val) => {
      setPrompt(val);
      if (s.setPrompt) s.setPrompt(val);
    },
    referenceImages,
    maxRefs,
    dialogOpen,
    setDialogOpen,
    internalMode,
    openDialog,
    handleAddClick,
    handleSelectMedia,
    handleRemoveReference,
    elementMode: "character",
    setElementMode,
    isCreating,
    handleGenerate: handleGenerateCharacter,
  };
}

export default useCharacterPrompt;
