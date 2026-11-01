"use client";

import * as React from "react";
import { TrashView } from "@/features/trash";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";

export default function TrashPage({ params }) {
  const { projectId } = React.use(params);
  const setSelectedProjectId = useGenerationsStore((s) => s.setSelectedProjectId);
  const setActiveStudioTab = useGenerationsStore((s) => s.setActiveStudioTab);

  React.useEffect(() => {
    if (projectId && useGenerationsStore.getState().selectedProjectId !== projectId) {
      setSelectedProjectId(projectId);
    }
    if (useGenerationsStore.getState().activeStudioTab !== "trash") {
      setActiveStudioTab("trash");
    }
  }, [projectId, setSelectedProjectId, setActiveStudioTab]);

  return <TrashView projectId={projectId} />;
}
