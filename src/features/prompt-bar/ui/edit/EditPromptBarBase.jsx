"use client";

import { cn } from "@/shared/lib/utils";
import { useEditStore } from "../../model/useEditStore";
import { useWorkflowsStore } from "@/features/workflows";
import { getPromptBarVariant } from "../common/promptBarVariants";

export function EditPromptBarBase({
    tabs = [],
    defaultTab,
    showGuard = true,
    children,
    className,
}) {
    const variantConfig = getPromptBarVariant("edit");
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

    return (
        <div className={cn("relative w-full flex flex-col items-center gap-3", className)}>
            <div className={variantConfig.cardClassName}>
                {typeof children === "function" ? children(activeTab) : children}
            </div>

            {tabs.length > 1 && (
                <div className="flex rounded-xl overflow-hidden backdrop-blur-xl items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center cursor-pointer gap-1.5 px-9 py-4 rounded-2xl text-sm font-medium transition-all duration-150 shrink-0 whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-[#505153] text-white"
                                    : "text-white bg-[#131517] hover:text-white hover:bg-[#505153]/50"
                            )}
                        >
                            <tab.icon className="size-4 stroke-3" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
