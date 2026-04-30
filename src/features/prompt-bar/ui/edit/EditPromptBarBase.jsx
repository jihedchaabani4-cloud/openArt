"use client";

import { cn } from "@/shared/lib/utils";
import { useEditStore } from "../../model/useEditStore";
import { useWorkflowsStore } from "@/features/workflows";
import { DropdownSegmentedWithLabel } from "@/shared/ui/DropdownShell";


export function EditPromptBarBase({
    tabs = [],
    defaultTab,
    showGuard = true,
    children,
    className,
}) {
    const { activeSessionId } = useWorkflowsStore();
    const { editTarget, activeTab: storedTab, setActiveTab } = useEditStore();

    if (showGuard) {
        const canShow =
            editTarget?.media_status === "completed" &&
            (editTarget?.url || editTarget?.primaryMediaUrl) &&
            (!editTarget?.session_id ||
                !activeSessionId ||
                editTarget.session_id === activeSessionId);

        if (!canShow) return null;
    }

    const resolvedDefault = defaultTab ?? tabs[0]?.id;
    const activeTab = tabs.find((tab) => tab.id === storedTab) ? storedTab : resolvedDefault;

    const segmentedOptions = tabs.map((tab) => ({
        value: tab.id,
        label: tab.label,
    }));

    return (
        <div className={cn("relative w-full flex flex-col items-center gap-3", className)}>
         

            {tabs.length > 1 && (
                <DropdownSegmentedWithLabel
                    label="APP"
                    value={activeTab}
                    onChange={setActiveTab}
                    options={segmentedOptions}
                />
            )}
                {typeof children === "function" ? children(activeTab) : children}
            
        </div>
    );
}
