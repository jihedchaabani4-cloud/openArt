"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { downloadFile } from "@/shared/lib/utils"
import { getPrimaryMediaConfig } from "@/shared/lib/generationUtils"
import { EditableDisplayName } from "@/shared/ui/EditableDisplayName"
import { useUpdateWorkflow } from "@/features/workflows/api/workflowsApi"

function toTitleCase(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function buildCleanWorkflowTitle(workflow) {
    const primaryConfig = getPrimaryMediaConfig(workflow) || {}
    const rawTitle =
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
    showHistory = true,
    onToggleHistory = () => {}
}) {
    const { projectId } = useParams()
    const router = useRouter()
    const displayTitle = React.useMemo(() => buildCleanWorkflowTitle(workflow), [workflow])
    const { mutateAsync: updateWorkflow } = useUpdateWorkflow()

    const handleEditWorkflowName = async (nextName) => {
        const workflowId = workflow?.id || workflow?.name
        if (!workflowId) return

        await updateWorkflow({
            workflowId,
            workflowData: { display_name: nextName },
        })
    }

    const handleDownloadAll = async () => {
        if (!workflow?.items) return;

        for (const item of workflow.items) {
            const url = item.url || item.image?.url || item.video?.url;
            if (url) {
                const filename = `generation-${item.id || item.name}.${url.split('.').pop()}`;
                await downloadFile(url, filename);
                await new Promise(r => setTimeout(r, 200));
            }
        }
    }

    return (
        <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 left-0 w-full z-50 flex items-center h-16 px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl"
        >
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/projects/${projectId}/generations`)}
                    className="rounded-full hover:bg-white/10 text-whit transition-all"
                >
                    <ArrowLeft className="size-6" />
                </Button>

                <EditableDisplayName
                    displayName={workflow?.metadata?.displayName || displayTitle}
                    placeholder="Untitled Workflow"
                    onSave={handleEditWorkflowName}
                    inputClassName="text-sm font-medium tracking-tight max-w-[260px]"
                />
            </div>

            <div className="ml-auto flex items-center gap-2">
                <Button
                    variant="studio-ghost"
                    onClick={handleDownloadAll}
                >
                    Download
                </Button>

                <Button
                    variant="studio-ghost"
                    onClick={onToggleHistory}
                >
                    {showHistory ? "Hide history" : "Show history"}
                </Button>

                <Button
                    variant="studio-white"
                    onClick={() => router.push(`/projects/${projectId}/generations`)}
                >
                    Done
                </Button>
            </div>
        </motion.nav>
    )
}
