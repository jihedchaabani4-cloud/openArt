"use client"

import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { StudioSettingsDropdown } from "./StudioSettingsDropdown"
import { NavbarImportButton } from "./NavbarImportButton"
import { NavbarRestoreAllButton } from "./NavbarRestoreAllButton"
import { UserDropdown } from "@/widgets/navigation/UserDropdown"

export const StudioNavbarRight = React.memo(function StudioNavbarRight({ searchExpanded }) {
    return (
        <div className={cn(
            "flex min-w-0 items-center justify-end whitespace-nowrap transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] gap-1 flex-1",
            searchExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
            <NavbarRestoreAllButton />
            <NavbarImportButton />
            <StudioSettingsDropdown />
            <UserDropdown />
        </div>
    )
});
