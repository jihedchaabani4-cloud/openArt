"use client"

import { usePathname } from "next/navigation"
import { StudioNavbar } from "@/widgets/StudioNavbar"

/**
 * Layout for /projects/[projectId] studio pages.
 * Skips StudioNavbar for /edit/* sub-routes (they have their own EditNavbar).
 */
export default function StudioLayout({ children }) {
    const pathname = usePathname()
    const isEditPage = pathname?.includes("/edit/")

    if (isEditPage) {
        // Edit pages manage their own height and navbar via edit/layout.js
        return <>{children}</>
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <StudioNavbar />
            <div className="flex-1 min-h-0 pt-[60px] flex flex-col overflow-hidden">
                {children}
            </div>
        </div>
    )
}

