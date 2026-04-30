"use client"

import { cn } from "@/shared/lib/utils"
import * as React from "react"
import { EditableDisplayName } from "@/shared/ui/EditableDisplayName"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useDeleteProject } from "@/features/projects/api/projectsApi"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog"
import { Button } from "@/shared/ui/button"

export function StudioNavbarLeft({
    searchExpanded,
    selectedProjectName,
    onEditProjectName,
    projectSessions = [],
    activeSessionId,
    setActiveSessionId,
    activeProjectId,
    selectedSessionName,
    setIsCreateSessionOpen,
}) {
    const [sessionsOpen, setSessionsOpen] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const dropdownRef = React.useRef(null)
    const nameRef = React.useRef(null)
    const router = useRouter()
    const { mutateAsync: deleteProject, isLoading: isDeleting } = useDeleteProject()

    const handleDelete = async () => {
        try {
            await deleteProject(activeProjectId)
            setIsDeleteDialogOpen(false)
            router.push("/cinema-studio")
        } catch (err) {
            console.error("Failed to delete project:", err)
        }
    }

    React.useEffect(() => {
        if (!sessionsOpen) return
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setSessionsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [sessionsOpen])

    return (
        <div className={cn(
            "flex items-center gap-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden",
            searchExpanded ? "basis-0 w-0 opacity-0 pointer-events-none" : "basis-[30%] shrink-0 opacity-100"
        )}>
            <EditableDisplayName
                ref={nameRef}
                displayName={selectedProjectName}
                placeholder="Untitled"
                onSave={onEditProjectName}
                inputClassName="text-md font-medium max-w-[160px] focus:text-white"
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all shrink-0">
                        <MoreVertical size={16} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                    <DropdownMenuItem onClick={() => nameRef.current?.startEditing()}>
                        <Pencil className="size-3.5" />
                        <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
                    >
                        <Trash2 className="size-3.5" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDeleteDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                description={`Delete \"${selectedProjectName}\"?`}
                onConfirm={handleDelete}
                loading={isDeleting}
                confirmLabel={isDeleting ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
            />
        </div>
    )
}
