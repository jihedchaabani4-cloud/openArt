"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { EditableDisplayName } from "@/shared/ui/EditableDisplayName";
import { useUpdateWorkflow } from "@/features/workflows/api/workflowsApi";
import { UserDropdown } from "@/widgets/StudioNavbar/ui/UserDropdown";
import { Sparkles, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export function ElementEditNavbar({
    workflow,
    elementTypeConfig,
    serverType,
    activeTasteProfile,
    analyzeVisionMutation,
    handleAnalyzeVision,
    onDeleteElement,
}) {
    const { projectId } = useParams();
    const router = useRouter();
    const nameRef = React.useRef(null);
    const { mutateAsync: updateWorkflow } = useUpdateWorkflow();

    const displayTitle = React.useMemo(() => {
        return (
            workflow?.metadata?.displayName ||
            workflow?.display_name ||
            workflow?.name ||
            "Untitled Element"
        );
    }, [workflow]);

    const handleEditWorkflowName = async (nextName) => {
        const workflowId = workflow?.id || workflow?.name;
        if (!workflowId) return;

        await updateWorkflow({
            workflowId,
            workflowData: { display_name: nextName },
        });
    };

    return (
        <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 left-0 w-full z-50 flex items-center h-16 px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl"
        >
            {/* Left section */}
            <div className="flex items-center gap-1">
                <Button
                    variant="studio-ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => router.push(`/cinema-studio/${projectId}/elements`)}
                    aria-label="Back to elements"
                >
                    <GoogleIcon iconName="arrow_back" className="text-[20px]" />
                </Button>

                <EditableDisplayName
                    ref={nameRef}
                    displayName={displayTitle}
                    placeholder="Untitled Element"
                    onSave={handleEditWorkflowName}
                    inputClassName="text-md font-medium tracking-tight max-w-[260px] focus:text-white"
                />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="studio-ghost" size="icon">
                            <GoogleIcon iconName="more_vert" className="text-[13px]" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[140px]">
                        <DropdownMenuItem onClick={() => nameRef.current?.startEditing()}>
                            <GoogleIcon iconName="edit" className="text-[13px]" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDeleteElement} className="text-red-400 focus:text-red-400">
                            <GoogleIcon iconName="delete" className="text-[13px]" />
                            Delete Element
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Right section */}
            <div className="ml-auto flex items-center gap-2">
                {/* Read-only Element Type Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/15 mr-1">
                    <GoogleIcon iconName={elementTypeConfig?.googleIcon || "cube"} className="text-[13px]" />
                    <span>{elementTypeConfig?.label || serverType || "Object"}</span>
                </div>

                <Button
                    onClick={handleAnalyzeVision}
                    disabled={analyzeVisionMutation?.isPending}
                    variant="user-menu-filled"
                    size="sm"
                >
                    {analyzeVisionMutation?.isPending ? (
                        <>
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>Analyzing images...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="size-3.5" />
                            <span>{activeTasteProfile ? "Re-analyze Vision" : "Analyze Taste Profile"}</span>
                        </>
                    )}
                </Button>

                <Button
                    variant="studio-white"
                    onClick={() => router.push(`/cinema-studio/${projectId}/elements`)}
                >
                    Done
                </Button>

                <UserDropdown />
            </div>
        </motion.nav>
    );
}

export default ElementEditNavbar;
