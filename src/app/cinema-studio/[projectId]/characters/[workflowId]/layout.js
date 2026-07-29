/**
 * Layout for /cinema-studio/[projectId]/characters/[workflowId] pages.
 */
export default function CharacterDetailLayout({ children }) {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#050505]">
            {children}
        </div>
    );
}
