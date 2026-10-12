"use client"

import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { StudioSettingsDropdown } from "./StudioSettingsDropdown"
import { NavbarImportButton } from "./NavbarImportButton"
import { UserDropdown } from "./UserDropdown"

export const StudioNavbarRight = React.memo(function StudioNavbarRight({ searchExpanded }) {
    return (
        <div className={cn(
            "ml-auto flex flex-none items-center justify-end whitespace-nowrap transition-[opacity,flex-basis] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] gap-1",
            searchExpanded ? "basis-0 opacity-0 pointer-events-none overflow-hidden" : "basis-auto opacity-100"
        )}>
            <NavbarImportButton />
            <StudioSettingsDropdown />
            <UserDropdown />
        </div>
    )
});
