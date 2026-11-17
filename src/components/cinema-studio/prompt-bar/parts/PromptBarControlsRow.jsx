import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";

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
  isExpanded = false,
  onToggleExpand,
  currentModel,
  currentModelIcon,
  currentRatioIcon,
  currentCount,
  estimatedCredits,
  isGenerateDisabled,
  handleGenerate,
  className,
}) {
  return (
    <div className={cn("flex items-center gap-2 shrink-0", className)}>
      {renderRightActions && renderRightActions({ isGenerating })}
      {showSettingsButton && (
        <Button
          ref={tuneButtonRef}
          type="button"
          variant="ghost"
          aria-label="Déclencheur des paramètres"
          title="Paramètres de génération et modèles"
          onClick={onToggleDrawer}
          className={cn(
            "settings-trigger-button flex items-center gap-1.5 cursor-pointer select-none border-0",
            drawerOpen && "is-active bg-white/10"
          )}
        >
          {currentModel && (
            <div className="flex items-center gap-1.5 max-w-[180px] truncate">
              {currentModelIcon && (
                <img
                  src={currentModelIcon}
                  alt=""
                  className="size-5 rounded-sm object-contain brightness-0 invert shrink-0"
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
            iconName={drawerOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
            className="text-base leading-none shrink-0 text-white/70"
          />
        </Button>
      )}

      {onToggleExpand && (
        <IconButton
          variant="ghost"
          aria-label={isExpanded ? "Réduire le champ de saisie" : "Agrandir le champ de saisie"}
          title={isExpanded ? "Collapse prompt input" : "Expand prompt input"}
          onClick={onToggleExpand}
          className={cn(
            "size-8 p-0 border-0 flex items-center justify-center shrink-0 cursor-pointer text-white/70 hover:text-white transition-colors",
            isExpanded && "is-active bg-white/10 text-white"
          )}
        >
          <GoogleIcon
            iconName={isExpanded ? "close_fullscreen" : "open_in_full"}
            className="text-base leading-none"
          />
        </IconButton>
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
  );
}
