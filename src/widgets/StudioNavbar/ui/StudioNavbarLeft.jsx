"use client"

import { cn } from "@/shared/lib/utils"
import * as React from "react"
import { EditableDisplayName } from "@/shared/ui/EditableDisplayName"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import { useDeleteProject } from "@/features/projects/api/projectsApi"
import { useRouter, useParams, usePathname } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Button } from "@/shared/ui/button"
import { NavbarBackButton } from "@/widgets/NavbarCore/ui/NavbarBackButton"
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog"
import { useProjectFolders, useUpdateFolder, useDeleteFolder, useMoveAssetToFolder } from "@/features/folders"

export function StudioNavbarLeft({
    searchExpanded,
    selectedProjectName,
    onEditProjectName,
    activeProjectId,
}) {
    const params = useParams() || {}
    const router = useRouter()
    const pathname = usePathname() || ""
    const projectId = activeProjectId || params.projectId
    const collectionId = params.collectionId
    const isCollectionPage = Boolean(collectionId) || pathname.includes("/collection/")

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
    const { mutateAsync: moveAsset } = useMoveAssetToFolder()

    // Independent drag detection via window drag events (zero coupling to prompt-bar)
    const [isDragging, setIsDragging] = React.useState(false)
    const [isBackDragOver, setIsBackDragOver] = React.useState(false)

    React.useEffect(() => {
        const onDragStart = () => {
            setIsDragging(true)
        }
        const onDragEnd = () => {
            setIsDragging(false)
            setIsBackDragOver(false)
        }

        window.addEventListener("dragstart", onDragStart)
        window.addEventListener("dragend", onDragEnd)
        window.addEventListener("drop", onDragEnd)

        return () => {
            window.removeEventListener("dragstart", onDragStart)
            window.removeEventListener("dragend", onDragEnd)
            window.removeEventListener("drop", onDragEnd)
        }
    }, [])

    const isDeleting = isCollectionPage ? isFolderDeleting : isProjectDeleting

    const executeMoveToParent = React.useCallback((transferData) => {
        const { itemType, workflowId, assetId, collectionId: draggedFolderId } = transferData

        if (itemType === "workflow") {
            const id = workflowId || assetId
            if (id) {
                // Optimistic move: onMutate executes synchronously, errors rollback and show toast.
                moveAsset({
                    assetId: id,
                    folderId: parentId || null,
                    projectId,
                })
            }
        } else if (itemType === "collection") {
            if (draggedFolderId && draggedFolderId !== collectionId) {
                updateFolder({
                    folderId: draggedFolderId,
                    patch: { parentId: parentId || null },
                    projectId,
                })
            }
        }
        // Move done — no navigation, cache is optimistically updated
    }, [collectionId, parentId, projectId, moveAsset, updateFolder])

    const handleBackDragOver = React.useCallback((e) => {
        if (!isCollectionPage) return
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = "move"

        if (!isBackDragOver) {
            setIsBackDragOver(true)
            window.dispatchEvent(new CustomEvent("studio:drag-target-change", { detail: { target: "move-out" } }))
        }
    }, [isCollectionPage, isBackDragOver])

    const handleBackDragEnter = React.useCallback((e) => {
        if (!isCollectionPage) return
        e.preventDefault()
        e.stopPropagation()
        setIsBackDragOver(true)
        window.dispatchEvent(new CustomEvent("studio:drag-target-change", { detail: { target: "move-out" } }))
    }, [isCollectionPage])

    const handleBackDragLeave = React.useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsBackDragOver(false)
            window.dispatchEvent(new CustomEvent("studio:drag-target-change", { detail: { target: null } }))
        }
    }, [])

    const handleBackDrop = React.useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsBackDragOver(false)
        window.dispatchEvent(new CustomEvent("studio:drag-target-change", { detail: { target: null } }))
        // Read dataTransfer SYNCHRONOUSLY before any microtask —
        // browsers null out e.dataTransfer once the event handler returns.
        const transferData = {
            itemType: e.dataTransfer.getData("itemType"),
            workflowId: e.dataTransfer.getData("workflowId"),
            assetId: e.dataTransfer.getData("assetId"),
            collectionId: e.dataTransfer.getData("collectionId"),
        }
        executeMoveToParent(transferData)
    }, [executeMoveToParent])

    React.useEffect(() => {
        if (!isDragging) {
            setIsBackDragOver(false)
        }
    }, [isDragging])

    const handleSaveName = (nextName) => {
        const trimmed = nextName?.trim()
        if (!trimmed) return
        if (isCollectionPage) {
            if (!collectionId || !projectId) return
            updateFolder({
                folderId: collectionId,
                patch: { name: trimmed },
                projectId,
            })
        } else {
            onEditProjectName?.(trimmed)
        }
    }

    const handleDelete = async () => {
        if (isCollectionPage) {
            setIsDeleteDialogOpen(false)
            router.push(backHref)
            deleteFolder({
                folderId: collectionId,
                projectId,
            })
        } else {
            setIsDeleteDialogOpen(false)
            router.push("/cinema-studio")
            deleteProject(projectId).catch(() => {})
        }
    }

    return (
        <div className={cn(
            "flex min-w-0 items-center gap-2.5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden",
            searchExpanded ? "basis-0 w-0 opacity-0 pointer-events-none" : "flex-[1_1_35%] opacity-100"
        )}>
            {isCollectionPage && isDragging ? (
                <button
                    type="button"
                    onDragOver={handleBackDragOver}
                    onDragEnter={handleBackDragEnter}
                    onDragLeave={handleBackDragLeave}
                    onDrop={handleBackDrop}
                    onClick={() => router.push(backHref)}
                    className={cn(
                        "h-10 px-4 rounded-xl border flex items-center justify-center font-medium text-sm transition-colors cursor-pointer shrink-0 select-none",
                        isBackDragOver
                            ? "border-white bg-white/20 text-white"
                            : "border-white/20 bg-white/[0.06] text-white/90 hover:border-white/40 hover:bg-white/10"
                    )}
                    title="Drop here to move out of collection"
                >
                    <span className="pointer-events-none select-none">Move out of collection</span>
                </button>
            ) : (
                <>
                    <NavbarBackButton
                        href={backHref}
                        label={backLabel}
                        iconName={backIcon}
                        className={cn(
                            "transition-all shrink-0",
                            isCollectionPage
                                ? "h-10 w-10 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.12] hover:border-white/30 text-white shadow-sm flex items-center justify-center"
                                : ""
                        )}
                        onDragOver={isCollectionPage ? handleBackDragOver : undefined}
                        onDragEnter={isCollectionPage ? handleBackDragEnter : undefined}
                        onDragLeave={isCollectionPage ? handleBackDragLeave : undefined}
                        onDrop={isCollectionPage ? handleBackDrop : undefined}
                    />

                    <EditableDisplayName
                        ref={nameRef}
                        displayName={displayName}
                        placeholder="Untitled"
                        onSave={handleSaveName}
                        inputClassName={cn(
                            "focus:text-white transition-all",
                            isCollectionPage
                                ? "text-lg font-semibold max-w-[240px] text-white tracking-tight px-2 py-0.5"
                                : "text-md font-medium max-w-[160px]"
                        )}
                    />
                </>
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="studio-ghost"
                        size="icon"
                        className={cn(
                            "transition-all shrink-0",
                            isCollectionPage
                                ? "h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.1] text-white/80 hover:text-white"
                                : "h-9 w-9"
                        )}
                    >
                        <GoogleIcon iconName="more_vert" className="text-[16px]" />
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
