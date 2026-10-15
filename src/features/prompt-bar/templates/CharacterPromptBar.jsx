"use client";

import React from "react";
import { PromptBarPlatform } from "../platform/PromptBarPlatform.jsx";
import { characterTemplate } from "./character.template.js";

/**
 * CharacterPromptBar
 *
 * Pre-composed, ready-to-use Prompt Bar for Character Creation.
 * Encapsulates the character template, default persistKey, templateId,
 * and instance identification.
 *
 * @param {object} props
 * @param {object[]} props.models - Catalog of available models
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
  ...restProps
}) {
  return (
    <PromptBarPlatform
      type={characterTemplate}
      featureConfig={characterTemplate}
      templateId={characterTemplate.id}
      instanceId={instanceId}
      persistKey={persistKey}
      projectId={projectId}
      {...restProps}
    />
  );
}

export default CharacterPromptBar;
