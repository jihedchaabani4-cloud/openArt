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
    { id: "upscale", label: "Upscale", icon: Maximize },
    { id: "camera", label: "Camera", icon: Camera },
    { id: "lighting", label: "Lighting", icon: Sun },
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
                        <AnglesPanel
                            previewImageUrl={s.editTarget?.primaryMediaUrl || s.editTarget?.url}
                        />
                    ) : activeTab === "lighting" ? (
                        <LightingPanel
                            previewImageUrl={s.editTarget?.primaryMediaUrl || s.editTarget?.url}
                        />
                    ) : null}
                </>
            )}
        </EditPromptBarBase>
    );
}
