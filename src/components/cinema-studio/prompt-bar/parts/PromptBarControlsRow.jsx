import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";
import { Button } from "@/components/base/button";

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
            variant="filter-chip"
            aria-label="Déclencheur des paramètres"
            title="Paramètres de génération et modèles"
            onClick={onToggleDrawer}
            className={cn(
              "settings-trigger-button flex items-center gap-1.5 cursor-pointer select-none",
              drawerOpen && "is-active"
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
          variant="primary"
          aria-label="Generate"
          title={estimatedCredits > 0 ? `Generate (${estimatedCredits} cr)` : "Generate"}
          onClick={handleGenerate}
          disabled={isGenerateDisabled}
          className="size-8 p-0 rounded-full shrink-0"
        >
          {isGenerating ? (
            <span className="size-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
          ) : (
            <GoogleIcon iconName="arrow_forward" className="text-base shrink-0 font-bold" />
          )}
        </Button>
      </div>
    </div>
  );
}
