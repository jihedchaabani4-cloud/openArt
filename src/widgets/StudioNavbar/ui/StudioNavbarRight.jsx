"use client"

import { cn } from "@/shared/lib/utils"
import { StudioSettingsDropdown } from "./StudioSettingsDropdown"
import { NavbarImportButton } from "./NavbarImportButton"
import { UserDropdown } from "./UserDropdown"

export function StudioNavbarRight({
    searchExpanded,
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
            "shrink-0 flex items-center justify-end whitespace-nowrap transition-[opacity,flex-basis] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] gap-1",
            searchExpanded ? "basis-[0%] opacity-0 pointer-events-none" : "basis-[32%] opacity-100"
        )}>

            <NavbarImportButton />
            <StudioSettingsDropdown 
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
            <UserDropdown />
        </div>
    )
}
