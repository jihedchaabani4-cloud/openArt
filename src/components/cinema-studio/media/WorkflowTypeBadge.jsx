"use client";

import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";
import { getWorkflowEntityType } from "./studioMenuConfig";

export const WORKFLOW_TYPE_BADGE_CONFIG = {
  video: { icon: "video-01", label: "Video" },
  element: { icon: "shapes", label: "Element" },
  character: { icon: "user", label: "Character" },
};

/**
 * Resolves the canonical workflow/media badge type.
 * Returns only "character" | "element" | "video" — standard image media returns null.
 */
export function resolveWorkflowBadgeType({
  type = null,
  workflow = null,
  item = null,
  isVideo = false,
} = {}) {
  if (type) {
    const normalized = String(type).trim().toLowerCase();
    return WORKFLOW_TYPE_BADGE_CONFIG[normalized] ? normalized : null;
  }

  const workflowType = getWorkflowEntityType(workflow);
  if (workflowType === "character" || workflowType === "element") {
    return workflowType;
  }

  if (item) {
    const itemType = getWorkflowEntityType(item);
    if (itemType === "character" || itemType === "element") {
      return itemType;
    }
    if (item.role === "sheet" || item.mediaRole === "sheet") {
      return "character";
    }
  }

  if (isVideo) {
    return "video";
  }

  return null;
}

/**
 * WorkflowTypeBadge — Single unified icon-only indicator for Video, Element,
 * and Character workflows. Intentionally renders nothing for regular images.
 */
export function WorkflowTypeBadge({
  type = null,
  workflow = null,
  item = null,
  isVideo = false,
  size = "xs",
  className,
  iconClassName,
}) {
  const resolvedType = resolveWorkflowBadgeType({ type, workflow, item, isVideo });
  if (!resolvedType) return null;

  const config = WORKFLOW_TYPE_BADGE_CONFIG[resolvedType];

  return (
    <div
      data-slot="workflow-type-badge"
      data-workflow-type={resolvedType}
      className={cn(
        "flex items-center justify-center size-6 rounded-control bg-white text-black shadow-none pointer-events-none select-none transition-all duration-200 group-hover:scale-105",
        className
      )}
      title={config.label}
      aria-label={config.label}
    >
      <HugeIcon
        name={config.icon}
        size={size}
        className={cn("text-black", iconClassName)}
      />
    </div>
  );
}

export default WorkflowTypeBadge;
