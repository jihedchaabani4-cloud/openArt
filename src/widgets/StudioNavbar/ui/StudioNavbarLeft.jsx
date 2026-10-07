"use client"

import { cn } from "@/shared/lib/utils"
import * as React from "react"
import { EditableDisplayName } from "@/shared/ui/EditableDisplayName"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import { useDeleteProject } from "@/features/projects/api/projectsApi"
import { useRouter, useParams } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Button } from "@/shared/ui/button"
import { NavbarBackButton } from "@/widgets/NavbarCore/ui/NavbarBackButton"
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog"
import { useProjectFolders, useUpdateFolder, useDeleteFolder } from "@/features/folders"

export function StudioNavbarLeft({
    searchExpanded,
    selectedProjectName,
    onEditProjectName,
    activeProjectId,
}) {
    const params = useParams() || {}
    const router = useRouter()
    const projectId = activeProjectId || params.projectId
    const collectionId = params.collectionId
    const isCollectionPage = Boolean(collectionId)

    // Fetch folders to find active collection
    const { data: rawFolders = [] } = useProjectFolders(projectId)
    const collections = React.useMemo(() => {
        if (Array.isArray(rawFolders)) return rawFolders
        if (Array.isArray(rawFolders?.items)) return rawFolders.items
        return []
    }, [rawFolders])

    const activeCollection = React.useMemo(() => {
        if (!collectionId) return null
        return collections.find((c) => c.id === collectionId) || null
    }, [collections, collectionId])

    const parentId = activeCollection?.parent_id || activeCollection?.parentId

    // Back button behavior:
    // If collection has parent -> parent collection
    // If collection has no parent -> assets page
    // Else (normal project page) -> cinema studio home
    const backHref = isCollectionPage
        ? (parentId
            ? `/cinema-studio/${projectId}/collection/${parentId}`
            : `/cinema-studio/${projectId}/assets`)
        : "/cinema-studio"

    const backIcon = isCollectionPage ? "arrow_back" : "home"
    const backLabel = isCollectionPage ? "Back" : "Accueil"

    // Display title: collection name when in collection, else project name
    const displayName = isCollectionPage
        ? (activeCollection?.name || "Collection")
        : selectedProjectName

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const nameRef = React.useRef(null)

    const { mutateAsync: deleteProject, isPending: isProjectDeleting } = useDeleteProject()
    const { mutateAsync: updateFolder } = useUpdateFolder()
    const { mutateAsync: deleteFolder, isPending: isFolderDeleting } = useDeleteFolder()

    const isDeleting = isCollectionPage ? isFolderDeleting : isProjectDeleting

    const handleSaveName = async (nextName) => {
        const trimmed = nextName?.trim()
        if (!trimmed) return
        if (isCollectionPage) {
            if (!collectionId || !projectId) return
            await updateFolder({
                folderId: collectionId,
                patch: { name: trimmed },
                projectId,
            })
        } else {
            await onEditProjectName?.(trimmed)
        }
    }

    const handleDelete = async () => {
        try {
            if (isCollectionPage) {
                await deleteFolder({
                    folderId: collectionId,
                    projectId,
                })
                setIsDeleteDialogOpen(false)
                router.push(backHref)
            } else {
                await deleteProject(projectId)
                setIsDeleteDialogOpen(false)
                router.push("/cinema-studio")
            }
        } catch (err) {
            console.error("Failed to delete:", err)
        }
    }

    return (
        <div className={cn(
            "flex items-center gap-2.5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden",
            searchExpanded ? "basis-0 w-0 opacity-0 pointer-events-none" : "basis-[30%] shrink-0 opacity-100"
        )}>
            <NavbarBackButton href={backHref} label={backLabel} iconName={backIcon} />

            <EditableDisplayName
                ref={nameRef}
                displayName={displayName}
                placeholder="Untitled"
                onSave={handleSaveName}
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
                        variant="destructive"
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
                description={
                    isCollectionPage
                        ? `Delete collection "${displayName}"?`
                        : `Delete "${selectedProjectName}"?`
                }
                onConfirm={handleDelete}
                loading={isDeleting}
                confirmLabel={isDeleting ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
            />
        </div>
    )
}
