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
import { NavbarTitle } from "@/widgets/NavbarCore/ui/NavbarTitle"
import { ConfirmDeleteDialog } from "@/shared/ui/ConfirmDeleteDialog"
import { useProjectFolders, useUpdateFolder, useDeleteFolder, useFolderMove, useDownloadCollection } from "@/features/folders"
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore"
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore"

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
    const isTrashPage = pathname.includes("/trash")

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
    // If trash page -> assets page
    // If collection has parent -> parent collection
    // If collection has no parent -> assets page
    // Else (normal project page) -> cinema studio home
    const backHref = isTrashPage
        ? `/cinema-studio/${projectId}/assets`
        : isCollectionPage
            ? (parentId
                ? `/cinema-studio/${projectId}/collection/${parentId}`
                : `/cinema-studio/${projectId}/assets`)
            : "/cinema-studio"

    const backIcon = (isTrashPage || isCollectionPage) ? "arrow_back" : "home"
    const backLabel = (isTrashPage || isCollectionPage) ? "Back" : "Accueil"

    // Display title: collection name when in collection, else project name
    const displayName = isCollectionPage
        ? (activeCollection?.name || "Collection")
        : selectedProjectName

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const nameRef = React.useRef(null)

    const { mutateAsync: deleteProject, isPending: isProjectDeleting } = useDeleteProject()
    const { mutateAsync: updateFolder } = useUpdateFolder()
    const { mutateAsync: deleteFolder, isPending: isFolderDeleting } = useDeleteFolder()
    const { executeMoveFromPayload } = useFolderMove(projectId)
    const { downloadCollection, isDownloading } = useDownloadCollection()

    const favoriteFolderIds = useWorkflowsStore((s) => s.favoriteFolderIds || {})
    const toggleFavoriteFolder = useWorkflowsStore((s) => s.toggleFavoriteFolder)
    const isLiked = Boolean(favoriteFolderIds[collectionId] ?? activeCollection?.favorited ?? activeCollection?.is_liked)

    const handleToggleLike = () => {
        if (collectionId) toggleFavoriteFolder?.(collectionId)
    }

    const handleDownloadCollection = () => {
        if (!collectionId) return
        downloadCollection({
            collectionId,
            collectionName: displayName,
            projectId,
            folders: collections,
        })
    }

    // Independent drag detection via window drag events and prompt store
    const isGalleryDragging = usePromptStore((s) => s.isDraggingGalleryItem)
    const [isWindowDragging, setIsWindowDragging] = React.useState(false)
    const isDragging = isWindowDragging || isGalleryDragging
    const [isBackDragOver, setIsBackDragOver] = React.useState(false)

    React.useEffect(() => {
        const onDragStart = () => {
            setIsWindowDragging(true)
        }
        const onDragEnd = () => {
            setIsWindowDragging(false)
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
        executeMoveFromPayload({
            payload: transferData,
            currentFolderId: collectionId,
            projectId,
            isMoveOut: true,
        })
    }, [collectionId, projectId, executeMoveFromPayload])

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

    React.useEffect(() => {
        const onPointerHover = (e) => {
            if (e.detail?.target === "move-out" && (!e.detail.area || e.detail.area === "navbar")) {
                setIsBackDragOver(true)
            } else {
                setIsBackDragOver(false)
            }
        }
        const onPointerDrop = (e) => {
            if (e.detail) {
                executeMoveToParent(e.detail)
                setIsBackDragOver(false)
            }
        }
        window.addEventListener("studio:pointer-hover-target", onPointerHover)
        window.addEventListener("studio:drop-to-back", onPointerDrop)
        return () => {
            window.removeEventListener("studio:pointer-hover-target", onPointerHover)
            window.removeEventListener("studio:drop-to-back", onPointerDrop)
        }
    }, [executeMoveToParent])

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
            "flex min-w-0 items-center gap-2 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex-1 h-full max-h-full",
            searchExpanded ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
            {isCollectionPage && isDragging ? (
                <Button
                    type="button"
                    variant={isBackDragOver ? "secondary" : "outline"}
                    data-drop-back="true"
                    onDragOver={handleBackDragOver}
                    onDragEnter={handleBackDragEnter}
                    onDragLeave={handleBackDragLeave}
                    onDrop={handleBackDrop}
                    onClick={() => router.push(backHref)}
                    className="shrink-0 select-none h-8 max-h-full"
                    title="Drop here to move out of collection"
                >
                    <span className="pointer-events-none select-none">Move out of collection</span>
                </Button>
            ) : (
                <>
                    {(isCollectionPage || isTrashPage) && (
                        <NavbarBackButton
                            href={backHref}
                            label={backLabel}
                            iconName={backIcon}
                            className="transition-all shrink-0 border-0 border-transparent shadow-none h-8 sm:h-9 max-h-full"
                            onDragOver={isCollectionPage ? handleBackDragOver : undefined}
                            onDragEnter={isCollectionPage ? handleBackDragEnter : undefined}
                            onDragLeave={isCollectionPage ? handleBackDragLeave : undefined}
                            onDrop={isCollectionPage ? handleBackDrop : undefined}
                        />
                    )}

                    {isTrashPage ? (
                        <NavbarTitle>Trash</NavbarTitle>
                    ) : isCollectionPage ? (
                        <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium h-full max-h-full">
                            <span
                                onClick={() => router.push(`/cinema-studio/${projectId}/assets`)}
                                className="text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors"
                            >
                                Assets
                            </span>
                            <span className="text-on-surface-subtle">/</span>
                            <EditableDisplayName
                                ref={nameRef}
                                displayName={displayName}
                                placeholder="Untitled collection"
                                onSave={handleSaveName}
                                inputClassName="text-md font-medium max-w-[160px] sm:max-w-[220px] focus:text-on-surface transition-all text-on-surface h-8 max-h-full"
                            />
                        </div>
                    ) : pathname.includes("/elements") ? (
                        <NavbarTitle>Elements</NavbarTitle>
                    ) : pathname.includes("/characters") ? (
                        <NavbarTitle>Characters</NavbarTitle>
                    ) : (
                        <div className="flex min-w-0 items-center gap-1">
                            <NavbarTitle>Assets</NavbarTitle>
                        </div>
                    )}
                </>
            )}

            {!isTrashPage && (
                <>
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
                </>
            )}
        </div>
    )
}
