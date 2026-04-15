"use client"

import { usePathname } from "next/navigation"
import { SessionSidebar } from "@/widgets/StudioLayout/SessionSidebar/SessionSidebar"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { ElementsView } from "@/widgets/StudioLayout/ElementsView/ElementsView"
import { StudioNavbar } from "@/widgets/StudioNavbar"

/**
 * Layout for /projects/[projectId] studio pages.
 * Skips StudioNavbar for /edit/* sub-routes (they have their own EditNavbar).
 */
export default function StudioLayout({ children }) {
    const pathname = usePathname()
    const isEditPage = pathname?.includes("/edit/")
    const activeStudioTab = useGenerationsStore(s => s.activeStudioTab)

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
                    {activeStudioTab === "elements" ? <ElementsView /> : children}
                </div>
            </div>
        </div>
    )
}

