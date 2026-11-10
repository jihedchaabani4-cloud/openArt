"use client"

import { usePathname } from "next/navigation"
import { ProjectsNavbar } from "@/widgets/ProjectsNavbar/ProjectsNavbar";

/**
 * Layout for all /projects/* routes.
 * Shows ProjectsNavbar ONLY on the /projects listing page.
 */
export default function ProjectsLayout({ children }) {
    const pathname = usePathname()

    const isListing = pathname === "/cinema-studio" || pathname === "/cinema-studio/new"

    return (
        <div className={isListing ? "min-h-screen flex flex-col bg-background" : "h-screen overflow-hidden flex flex-col bg-background"}>
            {isListing && <ProjectsNavbar />}
            <main className={isListing ? "pt-[75px] flex-1 flex flex-col" : "flex-1 flex flex-col min-h-0 overflow-hidden"}>
                {children}
            </main>
        </div>
    )
}
