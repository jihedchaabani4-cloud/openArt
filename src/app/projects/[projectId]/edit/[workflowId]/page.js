"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectData } from "@/features/workflows/api/workflowsApi";

export default function LegacyWorkflowEditRedirectPage() {
    const { projectId, workflowId } = useParams();
    const router = useRouter();
    const { data: projectData } = useProjectData(projectId);

    React.useEffect(() => {
        const workflows = projectData?.projectContents?.workflows ?? [];
        const workflow = workflows.find((item) => (item.id || item.name) === workflowId);
        if (!workflow) return;

        const destination =
            workflow.workflow_type === "ELEMENT_SHEET"
                ? `/projects/${projectId}/elements/edit/${workflowId}`
                : `/projects/${projectId}/generations/edit/${workflowId}`;

        router.replace(destination);
    }, [projectData, projectId, router, workflowId]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#050505]">
            <div className="animate-pulse text-white/20">Redirecting...</div>
        </div>
    );
}
