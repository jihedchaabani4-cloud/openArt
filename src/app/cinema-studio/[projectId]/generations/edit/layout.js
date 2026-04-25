import { EditNavbar } from "@/widgets/EditNavbar/EditNavbar"

/**
 * Layout for /projects/[projectId]/edit/[workflowId] pages.
 * Shows the EditNavbar and provides the height container.
 */
export default function EditLayout({ children }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#050505]">
            {children}
        </div>
    )
}
