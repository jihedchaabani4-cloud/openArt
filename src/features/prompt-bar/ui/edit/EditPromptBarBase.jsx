"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { useEditStore } from "../../model/useEditStore";
import { useWorkflowsStore } from "@/features/workflows";

/**
 * EditPromptBarBase
 * Shared shell for all edit prompt bars (image, video, etc.).
 *
 * Usage:
 * ```jsx
 * <EditPromptBarBase tabs={tabs} defaultTab="describe">
 *   {(activeTab) => (
 *     <>
 *       {activeTab === "describe" && <MyDescribePanel />}
 *       {activeTab === "upscale"  && <MyUpscalePanel  />}
 *     </>
 *   )}
 * </EditPromptBarBase>
 * ```
 *
 * Props:
 * @param {Array<{ id: string, label: string, icon: React.ComponentType }>} tabs
 * @param {string}   [defaultTab]  - Which tab to fall back to if the stored tab isn't in the list
 * @param {boolean}  [showGuard]   - When false, skip the media-completed visibility guard (default true)
 * @param {Function} children      - Render-prop: (activeTab) => ReactNode  (the tab content)
 * @param {string}   [className]
 */
export function EditPromptBarBase({
    tabs = [],
    defaultTab,
    showGuard = true,
    children,
    className,
}) {
    const { activeSessionId } = useWorkflowsStore();
    const { editTarget, activeTab: storedTab, setActiveTab } = useEditStore();

    // ── Visibility guard (same logic used in EditPromptBar) ──────────────────
    if (showGuard) {
        const canShow =
            editTarget?.media_status === "completed" &&
            (editTarget?.url || editTarget?.primaryMediaUrl) &&
            (!editTarget?.session_id ||
                !activeSessionId ||
                editTarget.session_id === activeSessionId);

        // console.log("EditPromptBarBase: canShow=", canShow, "editTarget=", editTarget);

        if (!canShow) return null;
    }

    // ── Resolve active tab — fall back to defaultTab or first tab ────────────
    const resolvedDefault = defaultTab ?? tabs[0]?.id;
    const activeTab = tabs.find((t) => t.id === storedTab)
        ? storedTab
        : resolvedDefault;

    return (
        <div className={cn("relative w-full flex flex-col items-center gap-3", className)}>
            {/* ── Content Box ── */}
            <div className="flex flex-col w-full bg-[#131517] backdrop-blur-xl rounded-xl">
                {typeof children === "function" ? children(activeTab) : children}
            </div>

            {/* ── Tab Bar ── */}
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
