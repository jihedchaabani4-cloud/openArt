"use client"

import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { StudioSettingsDropdown } from "./StudioSettingsDropdown"
import { NavbarImportButton } from "./NavbarImportButton"

export function StudioNavbarRight({
    searchExpanded,
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
    setShowUploadedMedia
}) {
    return (
        <div className={cn(
            "shrink-0 flex items-center justify-end gap-3 overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            searchExpanded ? "basis-[0%] opacity-0 pointer-events-none" : "basis-[32%] opacity-100"
        )}>
            <NavbarImportButton />
            <StudioSettingsDropdown 
                studioLayoutMode={studioLayoutMode}
                setStudioLayoutMode={setStudioLayoutMode}
                gridSize={gridSize}
                setGridSize={setGridSize}
                soundOnHover={soundOnHover}
                setSoundOnHover={setSoundOnHover}
                showTileDetails={showTileDetails}
                setShowTileDetails={setShowTileDetails}
                showDetails={showDetails}
                setShowDetails={setShowDetails}
                clearPromptOnSubmit={clearPromptOnSubmit}
                setClearPromptOnSubmit={setClearPromptOnSubmit}
                showUploadedMedia={showUploadedMedia}
                setShowUploadedMedia={setShowUploadedMedia}
            />

            {/* Avatar placeholder */}
            <div className="size-9 rounded-xl shrink-0 bg-linear-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                <div className="size-2 rounded-full bg-white/20" />
            </div>
        </div>
    )
}
