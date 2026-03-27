"use client"

import * as React from "react"
import { Settings, Grid2X2, Layers, Volume2, Eye, Eraser, Upload } from "lucide-react"
import {
  DropdownShell,
  DropdownSection,
  DropdownSegmented,
  DropdownRow,
  DropdownToggle,
} from "@/shared/ui/DropdownShell"

export function StudioSettingsDropdown({
  studioLayoutMode,
  setStudioLayoutMode,
  gridSize,
  setGridSize,
  soundOnHover,
  setSoundOnHover,
  showTileDetails,
  setShowTileDetails,
  showDetails,
  setShowDetails,
  clearPromptOnSubmit,
  setClearPromptOnSubmit,
  showUploadedMedia,
  setShowUploadedMedia,
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownShell
      trigger={<Settings className="size-6" />}
      isActive={open}
      open={open}
      onOpenChange={setOpen}
      panelWidth="w-72"
    >
      {/* View Mode */}
      <DropdownSection label="View Mode">
        <DropdownSegmented
          value={studioLayoutMode}
          onChange={setStudioLayoutMode}
          options={[
            { value: "grid",    label: <div className="flex items-center gap-1.5"><Grid2X2 className="size-3.5" /> Grid</div>  },
            { value: "grouped", label: <div className="flex items-center gap-1.5"><Layers  className="size-3.5" /> Batch</div> },
          ]}
        />
      </DropdownSection>

      {/* Grid Size */}
      <DropdownSection label="Grid Size">
        <DropdownSegmented
          value={gridSize}
          onChange={setGridSize}
          options={[
            { value: "sm", label: "S" },
            { value: "md", label: "M" },
            { value: "lg", label: "L" },
          ]}
        />
      </DropdownSection>

      {/* Toggle rows */}
      <div className="border-t border-white/5 mt-1 pt-1">
        <DropdownRow icon={<Volume2 />} label="Sound on hover">
          <DropdownToggle value={soundOnHover} onChange={setSoundOnHover} />
        </DropdownRow>

        <DropdownRow icon={<Eye />} label="Show tile details">
          <DropdownToggle value={showTileDetails} onChange={setShowTileDetails} />
        </DropdownRow>

        <DropdownRow icon={<Layers />} label="Show sidebar details">
          <DropdownToggle value={showDetails} onChange={setShowDetails} />
        </DropdownRow>

        <DropdownRow icon={<Eraser />} label="Clear prompt on submit">
          <DropdownToggle value={clearPromptOnSubmit} onChange={setClearPromptOnSubmit} />
        </DropdownRow>

        <DropdownRow icon={<Upload />} label="Show imported media">
          <DropdownToggle value={showUploadedMedia} onChange={setShowUploadedMedia} />
        </DropdownRow>
      </div>
    </DropdownShell>
  )
}
