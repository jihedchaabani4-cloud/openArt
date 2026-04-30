"use client"

import * as React from "react"
import { Settings, Upload } from "lucide-react"
import {
  DropdownShell,
  DropdownSection,
  DropdownSegmented,
  DropdownRow,
  DropdownToggle,
} from "@/shared/ui/DropdownShell"

export function StudioSettingsDropdown({
  gridSize,
  setGridSize,
  showUploadedMedia,
  setShowUploadedMedia,
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownShell
      trigger={<Settings className="size-7" />}
      isActive={open}
      open={open}
      onOpenChange={setOpen}
      panelWidth="w-72"
    >

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
        <DropdownRow icon={<Upload />} label="Show imported media">
          <DropdownToggle value={showUploadedMedia} onChange={setShowUploadedMedia} />
        </DropdownRow>
      </div>
    </DropdownShell>
  )
}
