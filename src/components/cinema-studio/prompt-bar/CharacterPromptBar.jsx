"use client";

import { useRef } from "react";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Button } from "@/components/base/button";
import { cn } from "@/shared/lib/utils";
import { PromptBarPlatform } from "./PromptBarPlatform.jsx";
import { characterTemplate } from "@/features/prompt-bar";
import { useCharacterStore } from "@/features/prompt-bar/model/useCharacterStore.js";
import { CharacterFeatureEditor } from "./CharacterFeatureEditor.jsx";
import { SyncFeaturesPlugin } from "./editor/plugins/SyncFeaturesPlugin.jsx";

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
            data-state={featureEditorOpen ? "open" : "closed"}
            className={cn(
              "rounded-lg ds-text-caption-m font-medium",
              featureEditorOpen
                ? "text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            )}
            title="Character Form Features"
          >
            <HugeIcon name="user-circle" className="shrink-0" />
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
