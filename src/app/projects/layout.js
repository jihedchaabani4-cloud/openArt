"use client"

import { usePathname } from "next/navigation"
import { ProjectsNavbar } from "@/widgets/ProjectsNavbar/ProjectsNavbar"

/**
 * Layout for all /projects/* routes.
 * Shows ProjectsNavbar ONLY on the /projects listing page.
 * The /projects/[projectId] page has its own layout with StudioNavbar.
 */
export default function ProjectsLayout({ children }) {
    const pathname = usePathname()

    // Show the projects navbar only on the exact /projects listing page
    // (and optionally /projects/new).
    // Any route with a projectId segment gets the StudioNavbar from the nested layout.
    const isListing = pathname === "/projects" || pathname === "/projects/new"

    return (
        <>
            {isListing && <ProjectsNavbar />}
            <div className={isListing ? "pt-[60px]" : ""}>
                {children}
            </div>
        </>
    )
}
