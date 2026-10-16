"use client";

import { PromptBarPlatform } from "../platform/PromptBarPlatform.jsx";
import { generatedMediaTemplate } from "./generatedMedia.template.js";

/**
 * GeneratedPromptBar
 *
 * Pre-composed, ready-to-use Prompt Bar for the Generated Media feature.
 * Encapsulates the generated-media template, default persistKey, templateId,
 * and instance identification so pages don't repeat the boilerplate.
 *
 * @param {object} props
 * @param {object[]} props.models - Catalog of available models
 * @param {function} props.onGenerate - Submit callback
 * @param {boolean} [props.isGenerating] - Submission in-flight indicator
 * @param {string} [props.projectId] - Active project ID (defaults to route-resolved)
 * @param {string} [props.instanceId="default"] - Multi-instance identifier
 * @param {string} [props.persistKey="studio-prompt-bar"] - Session storage persistence key
 * @param {string} [props.className] - Tailwind CSS overrides
 * @param {boolean} [props.hideBackground=false] - Embedded mode flag
 * @param {function} [props.renderRightActions] - Custom action slot renderer
 */
export function GeneratedPromptBar({
  instanceId = "default",
  persistKey = "studio-prompt-bar",
  projectId,
  ...restProps
}) {
  return (
    <PromptBarPlatform
      type={generatedMediaTemplate}
      featureConfig={generatedMediaTemplate}
      templateId={generatedMediaTemplate.id}
      instanceId={instanceId}
      persistKey={persistKey}
      projectId={projectId}
      {...restProps}
    />
  );
}
