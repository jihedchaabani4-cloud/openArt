import { cn } from "@/shared/lib/utils";
import { HugeIcon } from "@/components/primitives/HugeIcon";
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
          data-state={drawerOpen ? "open" : "closed"}
          aria-label="Déclencheur des paramètres"
          title="Paramètres de génération et modèles"
          onClick={onToggleDrawer}
          className={cn("settings-trigger-button", drawerOpen && "is-active")}
        >
          {currentModel && (
            <div className="flex items-center gap-1.5 max-w-[180px] truncate">
              {currentModelIcon && (
                <img
                  src={currentModelIcon}
                  alt=""
                  className="size-4 rounded-sm object-contain brightness-0 invert shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <span className="ds-text-caption-m font-medium truncate text-text-primary">
                {currentModel.name || currentModel.displayName || currentModel.id}
              </span>
            </div>
          )}
          <HugeIcon
            name={drawerOpen ? "arrow-up-01" : "arrow-down-01"}
            className="leading-none shrink-0 text-text-body-muted"
          />
        </Button>
      )}

      {onToggleExpand && (
        <IconButton
          variant="ghost"
          size="sm"
          data-state={isExpanded ? "open" : "closed"}
          aria-label={isExpanded ? "Réduire le champ de saisie" : "Agrandir le champ de saisie"}
          title={isExpanded ? "Collapse prompt input" : "Expand prompt input"}
          onClick={onToggleExpand}
          className={cn(
            "shrink-0 text-text-body-muted hover:text-text-primary transition-colors",
            isExpanded && "text-text-primary"
          )}
        >
          <HugeIcon
            name={isExpanded ? "arrow-shrink-02" : "arrow-expand-02"}
            className="leading-none"
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
          <span className="size-3.5 rounded-full border-2 border-text-inverse/30 border-t-text-inverse animate-spin" />
        ) : (
          <HugeIcon name="arrow-right-02" className="shrink-0 font-bold" />
        )}
      </Button>
    </div>
  );
}
