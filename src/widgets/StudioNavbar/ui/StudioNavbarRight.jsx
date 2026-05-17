"use client"

import Link from "next/link"
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
            "shrink-0 flex items-center justify-end  overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] gap-1",
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
            <Link
                href="/pricing"
                className="flex h-9 items-center justify-center rounded-xl px-4 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white"
            >
                Pricing
            </Link>
            <UserDropdown />
        </div>
    )
}
