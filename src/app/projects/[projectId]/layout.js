"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { SessionSidebar } from "@/widgets/StudioLayout/SessionSidebar/SessionSidebar"
import { StudioNavbar } from "@/widgets/StudioNavbar"
import { useWorkflowsStore } from "@/features/workflows"

/**
 * Layout for /projects/[projectId] studio pages.
 * Skips StudioNavbar for /edit/* sub-routes (they have their own EditNavbar).
 */
export default function StudioLayout({ children }) {
    const pathname = usePathname()
    const setIsNavbarHidden = useWorkflowsStore((s) => s.setIsNavbarHidden)
    const isEditPage =
        pathname?.includes("/generations/edit/") ||
        pathname?.includes("/elements/edit/") ||
        pathname?.includes("/edit/")

    useEffect(() => {
        setIsNavbarHidden(false)
    }, [pathname, setIsNavbarHidden])

    if (isEditPage) {
        // Edit pages manage their own height and navbar via edit/layout.js
        return <>{children}</>
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <div className="flex-1 min-h-0 flex overflow-hidden">
                <SessionSidebar />
                <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
                    <StudioNavbar />
                    {children}
                </div>
            </div>
        </div>
    )
}

