"use client"

import * as React from "react"
import { Icon } from "@/shared/ui/Icon"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu"
import { Button } from "@/shared/ui/button"
import { Switch } from "@/shared/ui/switch"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"

export function StudioSettingsDropdown(props) {
  const storeGridSize = useGenerationsStore(s => s.gridSize);
  const storeSetGridSize = useGenerationsStore(s => s.setGridSize);
  const storeGridSpacing = useGenerationsStore(s => s.gridSpacing);
  const storeSetGridSpacing = useGenerationsStore(s => s.setGridSpacing);
  const storeShowUploadedMedia = useGenerationsStore(s => s.showUploadedMedia);
  const storeSetShowUploadedMedia = useGenerationsStore(s => s.setShowUploadedMedia);
  const storeShowTileDetails = useGenerationsStore(s => s.showTileDetails);
  const storeSetShowTileDetails = useGenerationsStore(s => s.setShowTileDetails);
  const storeSoundOnHover = useGenerationsStore(s => s.soundOnHover);
  const storeSetSoundOnHover = useGenerationsStore(s => s.setSoundOnHover);
  const storeClearPromptOnSubmit = useGenerationsStore(s => s.clearPromptOnSubmit);
  const storeSetClearPromptOnSubmit = useGenerationsStore(s => s.setClearPromptOnSubmit);

  const gridSize = props.gridSize ?? storeGridSize;
  const setGridSize = props.setGridSize ?? storeSetGridSize;
  const gridSpacing = props.gridSpacing ?? (typeof storeGridSpacing === "string" ? storeGridSpacing : "sm");
  const setGridSpacing = props.setGridSpacing ?? storeSetGridSpacing;
  const showUploadedMedia = props.showUploadedMedia ?? storeShowUploadedMedia;
  const setShowUploadedMedia = props.setShowUploadedMedia ?? storeSetShowUploadedMedia;
  const showTileDetails = props.showTileDetails ?? storeShowTileDetails;
  const setShowTileDetails = props.setShowTileDetails ?? storeSetShowTileDetails;
  const soundOnHover = props.soundOnHover ?? storeSoundOnHover;
  const setSoundOnHover = props.setSoundOnHover ?? storeSetSoundOnHover;
  const clearPromptOnSubmit = props.clearPromptOnSubmit ?? storeClearPromptOnSubmit;
  const setClearPromptOnSubmit = props.setClearPromptOnSubmit ?? storeSetClearPromptOnSubmit;

  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="size-8 sm:size-9 max-h-full p-0 aspect-square text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-5)] rounded-[var(--r-sm)]"
          title="Paramètres d'affichage"
          aria-label="Paramètres de la grille de blocs"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Icon name="settings_2" size={20} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72 p-2 flex flex-col gap-1.5 font-sans antialiased bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--r-lg)] shadow-[0_16px_32px_rgba(0,0,0,0.40),0_4px_8px_rgba(0,0,0,0.24)]">
        {/* ── 1. Grid Size Selector ── */}
        <div className="flex flex-col gap-1 px-1 mb-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Taille de la grille
          </span>
          <div
            className="flex items-center gap-1 p-0.5 bg-[var(--overlay-5)] rounded-[var(--r-sm)] w-full select-none"
            role="radiogroup"
            aria-label="Taille de la grille"
          >
            {[
              { value: "sm", label: "S" },
              { value: "md", label: "M" },
              { value: "lg", label: "L" },
            ].map((opt) => {
              const isChecked = gridSize === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={isChecked}
                  variant={isChecked ? "secondary" : "ghost"}
                  onClick={() => setGridSize?.(opt.value)}
                  className="flex-1 h-7 text-xs font-medium rounded-[var(--r-xs)]"
                >
                  <span>{opt.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Space Between Media ── */}
        <div className="flex flex-col gap-1 px-1 mb-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Space between media
          </span>
          <div
            className="flex items-center gap-1 p-0.5 bg-[var(--overlay-5)] rounded-[var(--r-sm)] w-full select-none"
            role="radiogroup"
            aria-label="Space between media"
          >
            {[
              { value: "sm", label: "S" },
              { value: "md", label: "M" },
              { value: "lg", label: "L" },
            ].map((opt) => {
              const isChecked = gridSpacing === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={isChecked}
                  variant={isChecked ? "secondary" : "ghost"}
                  onClick={() => setGridSpacing?.(opt.value)}
                  className="flex-1 h-7 text-xs font-medium rounded-[var(--r-xs)]"
                >
                  <span>{opt.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <DropdownMenuSeparator className="my-1 bg-[var(--border-subtle)]" />

        {/* ── 3. Display Toggles ── */}
        <div className="flex flex-col gap-0.5">
          {setShowUploadedMedia && (
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault()
                setShowUploadedMedia(!showUploadedMedia)
              }}
              className="flex items-center justify-between cursor-pointer px-2.5 py-1.5 rounded-[var(--r-sm)] hover:bg-[var(--overlay-5)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Icon name="upload" size={18} className="text-[var(--text-secondary)] shrink-0" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Médias importés
                </span>
              </div>
              <Switch checked={showUploadedMedia} aria-label="Médias importés" />
            </DropdownMenuItem>
          )}

          {setShowTileDetails && (
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault()
                setShowTileDetails(!showTileDetails)
              }}
              className="flex items-center justify-between cursor-pointer px-2.5 py-1.5 rounded-[var(--r-sm)] hover:bg-[var(--overlay-5)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Icon name="visibility" size={18} className="text-[var(--text-secondary)] shrink-0" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Détails des blocs
                </span>
              </div>
              <Switch checked={showTileDetails} aria-label="Détails des blocs" />
            </DropdownMenuItem>
          )}

          {setSoundOnHover && (
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault()
                setSoundOnHover(!soundOnHover)
              }}
              className="flex items-center justify-between cursor-pointer px-2.5 py-1.5 rounded-[var(--r-sm)] hover:bg-[var(--overlay-5)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Icon name="volume_up" size={18} className="text-[var(--text-secondary)] shrink-0" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Son au survol
                </span>
              </div>
              <Switch checked={soundOnHover} aria-label="Son au survol" />
            </DropdownMenuItem>
          )}

          {setClearPromptOnSubmit && (
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault()
                setClearPromptOnSubmit(!clearPromptOnSubmit)
              }}
              className="flex items-center justify-between cursor-pointer px-2.5 py-1.5 rounded-[var(--r-sm)] hover:bg-[var(--overlay-5)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Icon name="backspace" size={18} className="text-[var(--text-secondary)] shrink-0" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Effacer le prompt
                </span>
              </div>
              <Switch checked={clearPromptOnSubmit} aria-label="Effacer le prompt" />
            </DropdownMenuItem>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
