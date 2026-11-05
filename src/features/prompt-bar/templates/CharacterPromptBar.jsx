"use client";

import { useRef } from "react";
import { UserCircle } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { PromptBarPlatform } from "../platform/PromptBarPlatform.jsx";
import { characterTemplate } from "./character.template.js";
import { useCharacterStore } from "../model/useCharacterStore.js";
import { CharacterFeatureEditor } from "../ui/character/CharacterFeatureEditor.jsx";
import { SyncFeaturesPlugin } from "../ui/common/editor/plugins/SyncFeaturesPlugin.jsx";

/**
 * CharacterPromptBar
 *
 * Pre-composed, ready-to-use Prompt Bar for Character Creation.
 * Encapsulates the character template, character characteristics Form editor,
 * reference attachment slot, minimum 10 characters prompt validation,
 * and instance identification.
 *
 * @param {object} props
 * @param {function} props.onGenerate - Submit callback
 * @param {boolean} [props.isGenerating] - Submission in-flight indicator
 * @param {string} [props.projectId] - Active project ID
 * @param {string} [props.instanceId="default"] - Multi-instance identifier
 * @param {string} [props.persistKey="character-prompt-bar"] - Session storage persistence key
 * @param {string} [props.className] - Tailwind CSS overrides
 * @param {boolean} [props.hideBackground=false] - Embedded mode flag
 * @param {function} [props.renderRightActions] - Custom action slot renderer
 */
export function CharacterPromptBar({
  instanceId = "default",
  persistKey = "character-prompt-bar",
  projectId,
  renderRightActions: propRenderRightActions,
  renderPopover: propRenderPopover,
  ...restProps
}) {
  const formButtonRef = useRef(null);
  const featureEditorOpen = useCharacterStore((state) => state.featureEditor.open);
  const setFeatureEditorOpen = useCharacterStore((state) => state.setFeatureEditorOpen);

  return (
    <PromptBarPlatform
      type={characterTemplate}
      featureConfig={characterTemplate}
      templateId={characterTemplate.id}
      instanceId={instanceId}
      persistKey={persistKey}
      projectId={projectId}
      editorPlugins={<SyncFeaturesPlugin key="character-sync-features" />}
      renderRightActions={(args) => (
        <>
          <Button
            ref={formButtonRef}
            type="button"
            onClick={() => setFeatureEditorOpen(!featureEditorOpen)}
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-sm transition-all shrink-0 gap-1.5 h-8 px-2.5 text-xs font-medium relative overflow-hidden",
              featureEditorOpen
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
            )}
            title="Character Form Features"
          >
            <UserCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Form</span>
          </Button>
          {propRenderRightActions && propRenderRightActions(args)}
        </>
      )}
      renderPopover={() => (
        <>
          <CharacterFeatureEditor
            open={featureEditorOpen}
            onOpenChange={setFeatureEditorOpen}
            anchorRef={formButtonRef}
          />
          {propRenderPopover && propRenderPopover()}
        </>
      )}
      {...restProps}
    />
  );
}


export default CharacterPromptBar;
