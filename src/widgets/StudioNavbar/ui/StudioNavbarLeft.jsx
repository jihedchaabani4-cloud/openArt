"use client"

import { cn } from "@/shared/lib/utils"
import * as React from "react"
import { EditableDisplayName } from "@/shared/ui/EditableDisplayName"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import { useDeleteProject } from "@/features/projects/api/projectsApi"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Button } from "@/shared/ui/button"
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog"

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
                    <Button variant="studio-ghost" size="sm">
                        <GoogleIcon iconName="more_vert" className="text-[13px]" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                    <DropdownMenuItem onClick={() => nameRef.current?.startEditing()}>
                        <GoogleIcon iconName="edit" className="text-[13px]" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={() => setIsDeleteDialogOpen(true)}
                    >
                        <GoogleIcon iconName="delete" className="text-[13px]" />
                        Delete
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
