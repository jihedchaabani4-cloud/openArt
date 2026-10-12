"use client"

import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { StudioSettingsDropdown } from "./StudioSettingsDropdown"
import { NavbarImportButton } from "./NavbarImportButton"
import { UserDropdown } from "./UserDropdown"

export const StudioNavbarRight = React.memo(function StudioNavbarRight({ searchExpanded }) {
    return (
        <div className={cn(
            "flex min-w-0 items-center justify-end whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] gap-1 flex-1",
            searchExpanded ? "opacity-60 sm:opacity-80 max-sm:hidden" : "opacity-100"
        )}>
            <NavbarImportButton />
            <StudioSettingsDropdown />
            <UserDropdown />
        </div>
    )
});
