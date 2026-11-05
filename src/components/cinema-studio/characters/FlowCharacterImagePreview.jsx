"use client";

import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

/**
 * FlowCharacterImagePreview
 *
 * Exact visual fidelity to Google Flow's <flow-character-image-preview>:
 * - Big 16:9 box (`aspect-video w-full max-w-[860px]`)
 * - Dark Google Flow surface background (`#1e1f20`, `rounded-2xl`, `border border-white/10`)
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
        "relative aspect-video w-full max-w-[850px] mx-auto rounded-2xl bg-[rgba(218,220,224,0.1)] backdrop-blur-[80px] shadow-lg flex flex-col items-center justify-center p-6 sm:p-10 select-none border-none",
        className
      )}
    >
      <div className="empty-container w-full max-w-xl flex flex-col items-center justify-center gap-6 text-center">
        <span className="empty-state-text text-[18px] sm:text-[21px] md:text-[22px] leading-snug font-medium font-sans antialiased text-white tracking-[-0.01em]">
          {text}
        </span>

        <div className="empty-actions flex items-center justify-center gap-3.5 flex-wrap">
          {/* Button 1: Importer (Upload) */}
          <Button
            type="button"
            variant="ghost"
            disabled={isUploading}
            onClick={onUpload}
            className="h-10 px-5 rounded-full bg-white/5 backdrop-blur-md text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20 border-none text-xs font-medium gap-2"
          >
            <GoogleIcon iconName="upload" className="text-[19px]" />
            <span>Importer</span>
          </Button>

          {/* Button 2: Ajouter à partir du projet (Project Assets) */}
          <Button
            type="button"
            variant="ghost"
            disabled={isUploading}
            onClick={onSelectProject}
            className="h-10 px-5 rounded-full bg-white/5 backdrop-blur-md text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20 border-none text-xs font-medium gap-2"
          >
            <GoogleIcon iconName="add" className="text-[19px]" />
            <span>Ajouter à partir du projet</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FlowCharacterImagePreview;
