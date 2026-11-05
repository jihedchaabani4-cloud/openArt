import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";

/**
 * PromptBarControlsRow
 *
 * Pure presentational component for the prompt bar controls / bottom row.
 * Houses the left spacer, center spacer, settings trigger button
 * (displaying current model icon/name, aspect ratio icon, and variations count),
 * optional renderRightActions, and the circular generate button with spinner/arrow.
 * Props only — no store access.
 */
export function PromptBarControlsRow({
  renderRightActions,
  isGenerating,
  showSettingsButton,
  tuneButtonRef,
  drawerOpen,
  onToggleDrawer,
  currentModel,
  currentModelIcon,
  currentRatioIcon,
  currentCount,
  estimatedCredits,
  isGenerateDisabled,
  handleGenerate,
}) {
  return (
    <div className="flex items-center justify-between gap-2 w-full">
      {/* Left side spacer */}
      <div className="flex items-center gap-1.5 min-w-[32px]" />

      {/* Center: Spacer (model selection is housed exclusively inside settings drawer) */}
      <div className="flex-1" />

      {/* Right side: Parameter button + generate */}
      <div className="flex items-center gap-2 shrink-0">
        {renderRightActions && renderRightActions({ isGenerating })}
        {showSettingsButton && (
          <Button
            ref={tuneButtonRef}
            type="button"
            variant="blur"
            aria-label="Déclencheur des paramètres"
            title="Paramètres de génération et modèles"
            onClick={onToggleDrawer}
            className={cn(
              "settings-trigger-button h-8 px-2.5 flex items-center gap-1.5 transition-all cursor-pointer select-none text-[12px] font-medium text-white",
              drawerOpen
                ? "bg-white/15 border border-white/20 shadow-none text-white"
                : "border-transparent text-white hover:text-white"
            )}
          >
            {currentModel && (
              <div className="flex items-center gap-1.5 max-w-[150px] truncate">
                {currentModelIcon && (
                  <img
                    src={currentModelIcon}
                    alt=""
                    className="size-3.5 rounded-sm object-contain brightness-0 invert shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <span className="font-medium text-[12px] truncate text-white">
                  {currentModel.name || currentModel.displayName || currentModel.id}
                </span>
              </div>
            )}
            <GoogleIcon
              iconName={currentRatioIcon}
              className="text-[15px] leading-none shrink-0 text-white"
            />
            <span className="leading-none shrink-0 font-medium text-[12px] text-white">
              x{currentCount}
            </span>
          </Button>
        )}

        <Button
          type="button"
          variant="flow-generate"
          aria-label="Generate"
          title={estimatedCredits > 0 ? `Generate (${estimatedCredits} cr)` : "Generate"}
          onClick={handleGenerate}
          disabled={isGenerateDisabled}
          className={cn(
            "size-8 min-w-8 p-0 rounded-full flex items-center justify-center transition-all shrink-0",
            isGenerateDisabled
              ? "bg-white/10 text-white/30 cursor-not-allowed"
              : "bg-white text-black hover:bg-white/90 active:scale-95 shadow-none"
          )}
        >
          {isGenerating ? (
            <span className="size-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
          ) : (
            <ArrowRight className="size-4 shrink-0" strokeWidth={2.5} />
          )}
        </Button>
      </div>
    </div>
  );
}
