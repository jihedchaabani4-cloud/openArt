/**
 * Layout for /projects/[projectId]/elements/edit/[workflowId] pages.
 */
export default function ElementsEditLayout({ children }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#050505]">
            {children}
        </div>
    );
}
