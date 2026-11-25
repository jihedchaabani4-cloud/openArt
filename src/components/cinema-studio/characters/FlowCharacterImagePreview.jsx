"use client";

import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Button } from "@/components/base/button";
import { cn } from "@/shared/lib/utils";

/**
 * FlowCharacterImagePreview
 *
 * Exact visual fidelity to Google Flow's <flow-character-image-preview>:
 * - Big 16:9 box (`aspect-video w-full max-w-[860px]`)
 * - Dark Google Flow surface background (`bg-omni-bg`, `rounded-comfortable`, `border border-white/10`)
 * - Centered prompt text with Google Sans
 * - Material 3 / Google Flow style buttons:
 *   1. "Importer" (upload icon)
 *   2. "Ajouter à partir du projet" (add icon)
 */
export function FlowCharacterImagePreview({
  onUpload,
  onSelectProject,
  isUploading = false,
  text = "Générez ou ajoutez une image de votre personnage",
  className,
}) {
  return (
    <div
      data-component="flow-character-image-preview"
      className={cn(
        "relative aspect-video w-full max-w-[850px] mx-auto rounded-comfortable bg-surface-panel border border-white/10 shadow-none flex flex-col items-center justify-center p-6 sm:p-10 select-none",
        className
      )}
    >
      <div className="empty-container w-full max-w-xl flex flex-col items-center justify-center gap-6 text-center">
        <span className="empty-state-text ds-type-feature-title antialiased text-white">
          {text}
        </span>

        <div className="empty-actions flex items-center justify-center gap-3.5 flex-wrap">
          {/* Button 1: Importer (Upload) */}
          <Button
            type="button"
            variant="pill"
            disabled={isUploading}
            onClick={onUpload}
          >
            <HugeIcon name="upload-04" />
            <span>Importer</span>
          </Button>

          {/* Button 2: Ajouter à partir du projet (Project Assets) */}
          <Button
            type="button"
            variant="pill"
            disabled={isUploading}
            onClick={onSelectProject}
          >
            <HugeIcon name="add-01" />
            <span>Ajouter à partir du projet</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FlowCharacterImagePreview;
