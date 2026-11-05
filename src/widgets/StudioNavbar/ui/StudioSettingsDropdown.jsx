"use client"

import * as React from "react"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Switch } from "@/shared/ui/switch"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"

export function StudioSettingsDropdown(props) {
  const storeGridSize = useGenerationsStore(s => s.gridSize);
  const storeSetGridSize = useGenerationsStore(s => s.setGridSize);
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
          size="icon"
          title="Paramètres d'affichage"
          aria-label="Paramètres de la grille de blocs"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <GoogleIcon iconName="settings_2" className="text-xl" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72 p-1.5 flex flex-col gap-1 font-sans antialiased">
        {/* ── 1. Grid Size Selector (styled like Prompt Bar Parameter Selector) ── */}
        <div className="flex flex-col gap-1 px-0.5 mb-1">
          <span className="text-[12px] font-medium text-[rgba(218,220,224,0.75)]">
            Taille de la grille
          </span>
          <flow-toggles aria-label="Taille de la grille" class="block w-full">
            <div
              className="mat-button-toggle-group toggle-group flex items-center gap-0.5 p-0.5 bg-[rgba(218,220,224,0.05)] rounded-sm w-full select-none"
              role="radiogroup"
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
                    variant={isChecked ? "flow-toggle-active" : "flow-toggle"}
                    onClick={() => setGridSize?.(opt.value)}
                    className="mat-button-toggle toggle flex-toggle flex-1 h-8 text-[13px] font-medium"
                  >
                    <span>{opt.label}</span>
                  </Button>
                );
              })}
            </div>
          </flow-toggles>
        </div>

        <DropdownMenuSeparator className="my-1.5 bg-[var(--mat-menu-divider-color,var(--foreground-state-15))]" />

        {/* ── 2. Display Toggles with Material 3 Slide Toggle ── */}
        <div className="flex flex-col gap-0.5">
          {setShowUploadedMedia && (
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault()
                setShowUploadedMedia(!showUploadedMedia)
              }}
              className="flex items-center justify-between cursor-pointer pl-3 pr-4 py-2 min-h-[2.125rem] hover:bg-[var(--mat-menu-item-hover-state-layer-color,var(--foreground-state-10))] transition-colors duration-100 ease-in-out"
            >
              <div className="flex items-center gap-3">
                <GoogleIcon iconName="upload" className="text-[20px] text-[var(--foreground-neutral-000,#fff)] shrink-0" />
                <span className="text-[14px] leading-5 font-medium text-[var(--foreground-neutral-000,#fff)]">
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
              className="flex items-center justify-between cursor-pointer pl-3 pr-4 py-2 min-h-[2.125rem] hover:bg-[var(--mat-menu-item-hover-state-layer-color,var(--foreground-state-10))] transition-colors duration-100 ease-in-out"
            >
              <div className="flex items-center gap-3">
                <GoogleIcon iconName="visibility" className="text-[20px] text-[var(--foreground-neutral-000,#fff)] shrink-0" />
                <span className="text-[14px] leading-5 font-medium text-[var(--foreground-neutral-000,#fff)]">
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
              className="flex items-center justify-between cursor-pointer pl-3 pr-4 py-2 min-h-[2.125rem] hover:bg-[var(--mat-menu-item-hover-state-layer-color,var(--foreground-state-10))] transition-colors duration-100 ease-in-out"
            >
              <div className="flex items-center gap-3">
                <GoogleIcon iconName="volume_up" className="text-[20px] text-[var(--foreground-neutral-000,#fff)] shrink-0" />
                <span className="text-[14px] leading-5 font-medium text-[var(--foreground-neutral-000,#fff)]">
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
              className="flex items-center justify-between cursor-pointer pl-3 pr-4 py-2 min-h-[2.125rem] hover:bg-[var(--mat-menu-item-hover-state-layer-color,var(--foreground-state-10))] transition-colors duration-100 ease-in-out"
            >
              <div className="flex items-center gap-3">
                <GoogleIcon iconName="backspace" className="text-[20px] text-[var(--foreground-neutral-000,#fff)] shrink-0" />
                <span className="text-[14px] leading-5 font-medium text-[var(--foreground-neutral-000,#fff)]">
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
