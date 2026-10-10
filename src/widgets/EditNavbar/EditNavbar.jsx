"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import { Button } from "@/shared/ui/button"
import { downloadFile } from "@/shared/lib/utils"
import { getPrimaryMediaConfig } from "@/shared/lib/generationUtils"
import { EditableDisplayName } from "@/shared/ui/EditableDisplayName"
import { useUpdateWorkflow, useDeleteMedia } from "@/features/workflows/api/workflowsApi"
import { UserDropdown } from "@/widgets/StudioNavbar/ui/UserDropdown"
import { NavbarCore, NavbarAction } from "@/widgets/NavbarCore"
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

function toTitleCase(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildCleanWorkflowTitle(workflow) {
    const primaryConfig = getPrimaryMediaConfig(workflow) || {}
    const rawTitle =
        workflow?.display_name ||
        workflow?.metadata?.displayName ||
        primaryConfig?.prompt ||
        workflow?.name ||
        ""

    const traitMatches = Array.from(rawTitle.matchAll(/<Trait:\s*([^>]+)>/gi))
        .map((match) => match[1]?.trim())
        .filter(Boolean)

    const ignoredTraits = new Set([
        "character",
        "human",
        "sheet",
        "reference",
        "turnaround",
        "product",
        "location",
        "hyper realistic",
        "hyper-realistic",
        "photorealistic",
        "realistic",
        "front view",
        "back view",
    ])

    if (traitMatches.length > 0) {
        const cleanedTraits = traitMatches
            .filter((trait) => !ignoredTraits.has(trait.toLowerCase()))
            .slice(0, 4)

        if (cleanedTraits.length > 0) {
            return toTitleCase(cleanedTraits.join(" ")).substring(0, 60)
        }
    }

    const plainTitle = rawTitle
        .replace(/<Trait:\s*([^>]+)>/gi, " ")
        .replace(/[_-]+/g, " ")
        .replace(/\b(create|generate|make|draw|design|show|need|want)\b/gi, " ")
        .replace(/\b(character|element|sheet|reference|turnaround|product|location)\b/gi, " ")
        .replace(/\s+/g, " ")
        .replace(/^[,:;.\-\s]+|[,:;.\-\s]+$/g, "")
        .trim()

    if (plainTitle) {
        return toTitleCase(plainTitle).substring(0, 60)
    }

    return "Untitled Workflow"
}

export function EditNavbar({
    workflow,
    activeItem,
    showHistory = true,
    onToggleHistory = () => {}
}) {
    const { projectId } = useParams()
    const router = useRouter()
    const nameRef = React.useRef(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [isDownloading, setIsDownloading] = React.useState(false)
    const displayTitle = React.useMemo(() => buildCleanWorkflowTitle(workflow), [workflow])
    const { mutateAsync: updateWorkflow } = useUpdateWorkflow()
    const { mutateAsync: deleteMedia } = useDeleteMedia()

    const handleEditWorkflowName = (nextName) => {
        const workflowId = workflow?.id || workflow?.name
        if (!workflowId) return

        updateWorkflow({
            workflowId,
            workflowData: { display_name: nextName },
            projectId,
        })
    }

    const handleDownloadAll = async () => {
        if (!workflow?.items || isDownloading) return;

        setIsDownloading(true);
        try {
            for (const item of workflow.items) {
                const url = item.url || item.image?.url || item.video?.url;
                if (url) {
                    const filename = `generation-${item.id || item.name}.${url.split('.').pop()}`;
                    await downloadFile(url, filename);
                    await new Promise(r => setTimeout(r, 200));
                }
            }
        } finally {
            setIsDownloading(false);
        }
    }

    const handleDeleteMedia = () => {
        const mediaId = activeItem?.id || activeItem?.name
        if (!mediaId) return

        deleteMedia({ mediaId, projectId })
        // If it was the last item, redirect back immediately
        if (workflow?.items?.length <= 1) {
            router.push(`/cinema-studio/${projectId}/assets`)
        }
    }

    return (
        <NavbarCore
            onBack={() => router.push(`/cinema-studio/${projectId}/assets`)}
            backLabel="Back to assets"
            left={
                <>
                    <EditableDisplayName
                        ref={nameRef}
                        displayName={workflow?.display_name || workflow?.metadata?.displayName || displayTitle}
                        placeholder="Untitled Workflow"
                        onSave={handleEditWorkflowName}
                        inputClassName="text-md font-medium tracking-tight max-w-[260px] focus:text-white"
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="studio-ghost"
                                size="icon"
                            >
                                <GoogleIcon iconName="more_vert" className="text-[13px]" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-[180px] p-2">
                            <DropdownMenuItem onClick={() => nameRef.current?.startEditing()}>
                                <GoogleIcon iconName="edit" className="text-[20px]" />
                                Renommer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                variant="destructive"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <GoogleIcon iconName="delete" className="text-[20px]" />
                                Placer dans la corbeille
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <ConfirmDeleteDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                        description="Are you sure you want to delete this specific generation?"
                        confirmLabel="Delete"
                        cancelLabel="Cancel"
                        onConfirm={handleDeleteMedia}
                    />
                </>
            }
            right={
                <>
                    <NavbarAction
                        variant="ghost"
                        size="icon"
                        icon="download"
                        title="Download"
                        aria-label="Download"
                        loading={isDownloading}
                        onClick={handleDownloadAll}
                    />

                    <NavbarAction
                        variant="ghost"
                        label={showHistory ? "Hide history" : "Show history"}
                        onClick={onToggleHistory}
                    />

                    <NavbarAction
                        variant="white"
                        label="Done"
                        onClick={() => router.push(`/cinema-studio/${projectId}/assets`)}
                    />
                </>
            }
        />
    )
}
