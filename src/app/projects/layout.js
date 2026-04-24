"use client"

import { usePathname } from "next/navigation"
import { ProjectsNavbar } from "@/widgets/ProjectsNavbar/ProjectsNavbar"

/**
 * Layout for all /projects/* routes.
 * Shows ProjectsNavbar ONLY on the /projects listing page.
 */
export default function ProjectsLayout({ children }) {
    const pathname = usePathname()

    const isListing = pathname === "/projects" || pathname === "/projects/new"

    return (
        <div className="min-h-screen flex flex-col bg-[#050505]">
                {isListing && <ProjectsNavbar />}
            <main className={isListing ? "pt-[75px] flex-1 flex flex-col" : "flex-1 flex flex-col"}>
                {children}
            </main>
        </div>
    )
}
