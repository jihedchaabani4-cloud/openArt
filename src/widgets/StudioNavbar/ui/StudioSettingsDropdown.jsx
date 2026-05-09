"use client"

import * as React from "react"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/shared/ui/dropdown-menu"
import {
  DropdownSection,
  DropdownSegmented,
} from "@/shared/ui/DropdownShell"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

export function StudioSettingsDropdown({
  gridSize,
  setGridSize,
  showUploadedMedia,
  setShowUploadedMedia,
  showTileDetails,
  setShowTileDetails,
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="studio-ghost" size="icon" >
          <GoogleIcon iconName="settings" className="text-[13px]" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 p-2">
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

        <DropdownMenuSeparator className="my-1 bg-white/5" />

        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault()
            setShowUploadedMedia(!showUploadedMedia)
          }}
          className="justify-between"
        >
          <div className="flex items-center gap-3">
            <GoogleIcon iconName="upload" className="text-[18px]" />
            <span>Show imported media</span>
          </div>
          <div 
            className={cn(
              "pointer-events-none inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
              showUploadedMedia ? "bg-white text-black" : "bg-white/20"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-current shadow-lg ring-0 transition-transform",
                showUploadedMedia ? "translate-x-4" : "translate-x-0"
              )}
            />
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault()
            setShowTileDetails(!showTileDetails)
          }}
          className="justify-between"
        >
          <div className="flex items-center gap-3">
            <GoogleIcon iconName="visibility" className="text-[18px]" />
            <span>Show tile details</span>
          </div>
          <div 
            className={cn(
              "pointer-events-none inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
              showTileDetails ? "bg-white text-black" : "bg-white/20"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-current shadow-lg ring-0 transition-transform",
                showTileDetails ? "translate-x-4" : "translate-x-0"
              )}
            />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
