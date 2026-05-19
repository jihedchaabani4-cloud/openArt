"use client";

import { cn } from "@/shared/lib/utils";
import { useEditStore } from "../../model/useEditStore";
import { useWorkflowsStore } from "@/features/workflows";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

const GOOGLE_ICON_MAP = {
    describe: "edit_note",
    edit: "draw",
    remove: "ink_eraser",
    insert: "add_box",
    extend: "keyboard_double_arrow_right",
    camera: "panorama_wide_angle",
    lighting: "light_mode",
    upscale: "aspect_ratio",
};

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

    return (
        <div className="relative w-full flex flex-col gap-1.5">
            {/* Top Edit Area Card */}
            <div className={cn("relative w-full flex flex-col border border-white/5 bg-(--background-base-pri) backdrop-blur-[80px] rounded-[28px] p-2 min-h-[60px]", className)}>
                <div className="w-full">
                    {typeof children === "function" ? children(activeTab) : children}
                </div>
            </div>

            {/* Detached Tabs Row */}
            {tabs.length > 1 && (
                <div className="flex flex-row items-center gap-1.5 w-full py-1 select-none">
                    {tabs.map((tab) => {
                        const isSelected = activeTab === tab.id;
                        const iconName = GOOGLE_ICON_MAP[tab.id] || "extension";
                        
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 px-4 py-3 rounded-[20px] flex items-center gap-2.5 justify-center border text-[14px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap",
                                    isSelected
                                        ? "bg-white/10 text-white border-white/10 shadow-lg scale-[1.02]"
                                        : "bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/8"
                                )}
                            >
                                <GoogleIcon iconName={iconName} className="text-[24px] shrink-0" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
