"use client"

import { cn } from "@/shared/lib/utils"
import * as React from "react"
import { EditableDisplayName } from "@/components/primitives/EditableDisplayName"
import { useDeleteProject } from "@/features/projects/api/projectsApi"
import { useRouter, useParams, usePathname } from "next/navigation"
import { Button } from "@/components/base/button"
import { NavbarTitle } from "@/components/layout/NavbarCore/NavbarTitle"
import { ConfirmDeleteDialog } from "@/components/primitives/ConfirmDeleteDialog"
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

    const ancestorCollections = React.useMemo(() => {
        if (!activeCollection) return []
        const byId = new Map(collections.map((c) => [c.id, c]))
        const chain = []
        const visited = new Set([activeCollection.id])
        let curParentId = activeCollection.parent_id || activeCollection.parentId
        while (curParentId && !visited.has(curParentId)) {
            visited.add(curParentId)
            const parent = byId.get(curParentId)
            if (!parent) break
            chain.unshift(parent)
            curParentId = parent.parent_id || parent.parentId
        }
        return chain
    }, [activeCollection, collections])

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
        window.addEventListener("studio:pointer-hover-target", onPointerHover)
        return () => {
            window.removeEventListener("studio:pointer-hover-target", onPointerHover)
        }
    }, [])

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
                    className="shrink-0 select-none h-7 max-h-full"
                    title="Drop here to move out of collection"
                >
                    <span className="pointer-events-none select-none">Move out of collection</span>
                </Button>
            ) : (
                <>
                    {isTrashPage ? (
                        <NavbarTitle>Trash</NavbarTitle>
                    ) : isCollectionPage ? (
                        <nav
                            aria-label="Folder path"
                            className="flex min-w-0 items-center gap-1.5 ds-type-caption-label overflow-hidden"
                        >
                            <button
                                type="button"
                                onClick={() => router.push(`/cinema-studio/${projectId}/assets`)}
                                className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors shrink-0"
                            >
                                Assets
                            </button>
                            {ancestorCollections.map((ancestor) => (
                                <React.Fragment key={ancestor.id}>
                                    <span className="text-text-tertiary shrink-0">/</span>
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/cinema-studio/${projectId}/collection/${ancestor.id}`)}
                                        className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors truncate max-w-[140px]"
                                        title={ancestor.name || ancestor.folder_name || "Collection"}
                                    >
                                        {ancestor.name || ancestor.folder_name || "Collection"}
                                    </button>
                                </React.Fragment>
                            ))}
                            <span className="text-text-tertiary shrink-0">/</span>
                            <EditableDisplayName
                                ref={nameRef}
                                displayName={displayName}
                                placeholder="Untitled collection"
                                onSave={handleSaveName}
                                inputClassName="ds-type-caption-label max-w-[160px] sm:max-w-[220px] text-text-primary focus:text-text-primary transition-all h-7"
                            />
                        </nav>
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
