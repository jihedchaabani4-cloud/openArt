"use client"

import * as React from "react"
import { HugeIcon } from "@/components/primitives/HugeIcon"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/base/dropdown-menu"
import { MenuItemContent } from "@/components/base/menu"
import { Button } from "@/components/base/button"
import { Switch } from "@/components/base/switch"
import { Slider } from "@/components/primitives/slider"
import { STUDIO_GRID_SIZE_STOPS } from "@/shared/lib/displayUtils"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"

const GRID_SIZE_STOPS = STUDIO_GRID_SIZE_STOPS

export function StudioSettingsDropdown(props) {
  const storeGridSize = useGenerationsStore(s => s.gridSize);
  const storeSetGridSize = useGenerationsStore(s => s.setGridSize);
  const storeSplitByDate = useGenerationsStore(s => s.splitByDate);
  const storeSetSplitByDate = useGenerationsStore(s => s.setSplitByDate);
  const storeShowFolders = useGenerationsStore(s => s.showFolders);
  const storeSetShowFolders = useGenerationsStore(s => s.setShowFolders);
  const storeShowTileDetails = useGenerationsStore(s => s.showTileDetails);
  const storeSetShowTileDetails = useGenerationsStore(s => s.setShowTileDetails);
  const storeSoundOnHover = useGenerationsStore(s => s.soundOnHover);
  const storeSetSoundOnHover = useGenerationsStore(s => s.setSoundOnHover);
  const storeClearPromptOnSubmit = useGenerationsStore(s => s.clearPromptOnSubmit);
  const storeSetClearPromptOnSubmit = useGenerationsStore(s => s.setClearPromptOnSubmit);

  const gridSize = props.gridSize ?? storeGridSize;
  const setGridSize = props.setGridSize ?? storeSetGridSize;
  const splitByDate = props.splitByDate ?? storeSplitByDate;
  const setSplitByDate = props.setSplitByDate ?? storeSetSplitByDate;
  const showFolders = props.showFolders ?? (storeShowFolders !== false);
  const setShowFolders = props.setShowFolders ?? storeSetShowFolders;
  const showTileDetails = props.showTileDetails ?? storeShowTileDetails;
  const setShowTileDetails = props.setShowTileDetails ?? storeSetShowTileDetails;
  const soundOnHover = props.soundOnHover ?? storeSoundOnHover;
  const setSoundOnHover = props.setSoundOnHover ?? storeSetSoundOnHover;
  const clearPromptOnSubmit = props.clearPromptOnSubmit ?? storeClearPromptOnSubmit;
  const setClearPromptOnSubmit = props.setClearPromptOnSubmit ?? storeSetClearPromptOnSubmit;

  const [open, setOpen] = React.useState(false)

  const resolvedIndex = GRID_SIZE_STOPS.indexOf(gridSize);
  const sliderValue = resolvedIndex >= 0 ? resolvedIndex + 1 : 3;

  const handleSliderChange = React.useCallback(
    ([nextVal]) => {
      const idx = Math.min(GRID_SIZE_STOPS.length - 1, Math.max(0, (Number(nextVal) || 1) - 1));
      setGridSize?.(GRID_SIZE_STOPS[idx]);
    },
    [setGridSize]
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          title="Paramètres d'affichage"
          aria-label="Paramètres de la grille de blocs"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <HugeIcon name="grid-view" />
          <span>View</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {/* ── 1. Card Size Stepped Slider ── */}
        <DropdownMenuLabel>Card size</DropdownMenuLabel>
        <div
          className="px-1 pb-1.5"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.stopPropagation();
            }
          }}
        >
          <Slider
            variant="stepped"
            min={0}
            max={GRID_SIZE_STOPS.length}
            minSelectable={1}
            step={1}
            value={[sliderValue]}
            onValueChange={handleSliderChange}
            aria-label="Card size"
          />
        </div>

        <DropdownMenuSeparator />

        {/* ── 2. Display Toggles with Base UI Switch ── */}
        {setSplitByDate && (
          <DropdownMenuItem
            role="menuitemcheckbox"
            aria-checked={splitByDate}
            onSelect={(e) => {
              e.preventDefault()
              setSplitByDate(!splitByDate)
            }}
          >
            <MenuItemContent
              icon="calendar-03"
              trailing={
                <Switch
                  checked={splitByDate}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="pointer-events-none"
                />
              }
            >
              Split by date
            </MenuItemContent>
          </DropdownMenuItem>
        )}

        {setShowFolders && (
          <DropdownMenuItem
            role="menuitemcheckbox"
            aria-checked={showFolders}
            onSelect={(e) => {
              e.preventDefault()
              setShowFolders(!showFolders)
            }}
          >
            <MenuItemContent
              icon="folder-01"
              trailing={
                <Switch
                  checked={showFolders}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="pointer-events-none"
                />
              }
            >
              Show folders
            </MenuItemContent>
          </DropdownMenuItem>
        )}

        {setShowTileDetails && (
          <DropdownMenuItem
            role="menuitemcheckbox"
            aria-checked={showTileDetails}
            onSelect={(e) => {
              e.preventDefault()
              setShowTileDetails(!showTileDetails)
            }}
          >
            <MenuItemContent
              icon="view"
              trailing={
                <Switch
                  checked={showTileDetails}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="pointer-events-none"
                />
              }
            >
              Détails des blocs
            </MenuItemContent>
          </DropdownMenuItem>
        )}

        {setSoundOnHover && (
          <DropdownMenuItem
            role="menuitemcheckbox"
            aria-checked={soundOnHover}
            onSelect={(e) => {
              e.preventDefault()
              setSoundOnHover(!soundOnHover)
            }}
          >
            <MenuItemContent
              icon="volume-high"
              trailing={
                <Switch
                  checked={soundOnHover}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="pointer-events-none"
                />
              }
            >
              Son au survol
            </MenuItemContent>
          </DropdownMenuItem>
        )}

        {setClearPromptOnSubmit && (
          <DropdownMenuItem
            role="menuitemcheckbox"
            aria-checked={clearPromptOnSubmit}
            onSelect={(e) => {
              e.preventDefault()
              setClearPromptOnSubmit(!clearPromptOnSubmit)
            }}
          >
            <MenuItemContent
              icon="delete-put-back"
              trailing={
                <Switch
                  checked={clearPromptOnSubmit}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="pointer-events-none"
                />
              }
            >
              Effacer le prompt
            </MenuItemContent>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
