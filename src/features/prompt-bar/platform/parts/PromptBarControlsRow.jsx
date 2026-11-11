import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/Icon";
import { Button } from "@/shared/ui/button";

/**
 * PromptBarControlsRow
 *
 * Pure presentational component for the prompt bar controls / bottom row.
 * Design-system alignment:
 * - Generate Button: Compact 36x36 lime button (§3.2)
 * - Settings Trigger: Chip (§3.7) with overlay-5 background, 8px radius
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
            variant="chip"
            aria-label="Déclencheur des paramètres"
            title="Paramètres de génération et modèles"
            onClick={onToggleDrawer}
            className={cn(
              "settings-trigger-button flex items-center gap-1.5 cursor-pointer select-none h-[28px] px-2.5 rounded-[var(--r-sm)] bg-[var(--overlay-5)] text-[var(--text-primary)] hover:bg-[var(--overlay-10)] active:bg-[var(--overlay-20)] border border-[var(--border-subtle)] transition-all",
              drawerOpen && "bg-white/15 bg-[var(--overlay-15)] border-[var(--brand)] text-[var(--brand)]"
            )}
          >
            {currentModel && (
              <div className="flex items-center gap-1.5 max-w-[150px] truncate">
                {currentModelIcon && (
                  <img
                    src={currentModelIcon}
                    alt=""
                    className="size-3.5 rounded-[var(--r-xs)] object-contain brightness-0 invert shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <span className="font-medium text-[12px] leading-[18px] truncate text-[var(--text-primary)]">
                  {currentModel.name || currentModel.displayName || currentModel.id}
                </span>
              </div>
            )}
            <Icon
              name={currentRatioIcon || "crop_16_9"}
              size={14}
              className="shrink-0 text-[var(--text-secondary)]"
            />
            <span className="leading-[18px] shrink-0 font-medium text-[12px] text-[var(--text-primary)]">
              x{currentCount}
            </span>
          </Button>
        )}

        <Button
          type="button"
          variant="generate-compact"
          aria-label="Generate"
          title={estimatedCredits > 0 ? `Generate (${estimatedCredits} cr)` : "Generate"}
          onClick={handleGenerate}
          disabled={isGenerateDisabled}
          className={cn(
            "btn-generate-compact shrink-0",
            isGenerateDisabled && "opacity-40 cursor-not-allowed filter-none"
          )}
        >
          {isGenerating ? (
            <span className="size-3.5 rounded-full border-2 border-[var(--text-on-brand)]/30 border-t-[var(--text-on-brand)] animate-spin" />
          ) : (
            <Icon name="arrow_forward" size={16} className="shrink-0 font-bold text-[var(--text-on-brand)]" />
          )}
        </Button>
      </div>
    </div>
  );
}
