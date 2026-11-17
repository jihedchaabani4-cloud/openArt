"use client"

import * as React from "react"
import { GoogleIcon } from "@/components/primitives/GoogleIcon"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/base/dropdown-menu"
import { Button } from "@/components/base/button"
import { Switch } from "@/components/base/switch"
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
        {/* ── 1. Grid Size Selector ── */}
        <div className="flex flex-col gap-1 px-0.5 mb-1">
          <span className="text-xs font-medium text-white/75">
            Taille de la grille
          </span>
          <div
            className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-full select-none"
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
                  className="flex-1"
                >
                  <span>{opt.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Space Between Media (S: 4px, M: 8px, L: 16px) ── */}
        <div className="flex flex-col gap-1 px-0.5 mb-1">
          <span className="text-xs font-medium text-white/75">
            Space between media
          </span>
          <div
            className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-full select-none"
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
                  className="flex-1"
                >
                  <span>{opt.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <DropdownMenuSeparator className="my-1.5 bg-white/10" />

        {/* ── 3. Display Toggles with Base UI Switch ── */}
        <div className="flex flex-col gap-0.5">
          {setShowUploadedMedia && (
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault()
                setShowUploadedMedia(!showUploadedMedia)
              }}
              className="flex items-center justify-between cursor-pointer px-2.5 h-[36px] rounded-xl hover:bg-white/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <GoogleIcon iconName="upload" className="text-lg text-white/70 shrink-0" />
                <span className="text-sm font-medium text-white">
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
              className="flex items-center justify-between cursor-pointer px-2.5 h-[36px] rounded-xl hover:bg-white/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <GoogleIcon iconName="visibility" className="text-lg text-white/70 shrink-0" />
                <span className="text-sm font-medium text-white">
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
              className="flex items-center justify-between cursor-pointer px-2.5 h-[36px] rounded-xl hover:bg-white/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <GoogleIcon iconName="volume_up" className="text-lg text-white/70 shrink-0" />
                <span className="text-sm font-medium text-white">
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
              className="flex items-center justify-between cursor-pointer px-2.5 h-[36px] rounded-xl hover:bg-white/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <GoogleIcon iconName="backspace" className="text-lg text-white/70 shrink-0" />
                <span className="text-sm font-medium text-white">
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
