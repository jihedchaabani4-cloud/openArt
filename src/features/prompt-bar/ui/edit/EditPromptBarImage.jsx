"use client";

import React from "react";
import {
    Camera, Maximize, Sun, Sparkles,
} from "lucide-react";
import { useEditPromptBar } from "../../model/useEditPromptBar";
import { EditDescribeTab } from "./EditDescribeTab";
import AnglesPanel from "./tabs/Angles";
import LightingPanel from "./tabs/Lighting";
import UpscalePanel from "./tabs/UpscalePanel";
import { EditPromptBarBase } from "./EditPromptBarBase";

const TABS = [
    { id: "describe", label: "Describe", icon: Sparkles },
    { id: "upscale",  label: "Upscale",  icon: Maximize  },
    { id: "camera",   label: "Camera",   icon: Camera    },
    { id: "lighting", label: "Lighting", icon: Sun       },
];

/**
 * EditPromptBarImage — image editing specialisation of EditPromptBarBase.
 */
export function EditPromptBarImage({ className }) {
    const s = useEditPromptBar();

    return (
        <EditPromptBarBase tabs={TABS} defaultTab="describe" className={className}>
            {(activeTab) => (
                <>
                    {activeTab === "describe" ? (
                        <EditDescribeTab s={s} />
                    ) : activeTab === "upscale" ? (
                        <UpscalePanel
                            editTarget={s.editTarget}
                            upscaleScale={s.upscaleScale}
                            setUpscaleScale={s.setUpscaleScale}
                            generating={s.generating}
                            onGenerate={() => s.handleGenerate()}
                        />
                    ) : activeTab === "camera" ? (
                        <div className="flex flex-col gap-4 w-full p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <AnglesPanel
                                previewImageUrl={s.editTarget?.primaryMediaUrl || s.editTarget?.url}
                            />
                        </div>
                    ) : activeTab === "lighting" ? (
                        <div className="flex flex-col gap-4 w-full p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <LightingPanel
                                previewImageUrl={s.editTarget?.primaryMediaUrl || s.editTarget?.url}
                            />
                        </div>
                    ) : null}
                </>
            )}
        </EditPromptBarBase>
    );
}
