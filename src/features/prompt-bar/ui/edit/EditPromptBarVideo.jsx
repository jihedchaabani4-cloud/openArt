"use client";

import React from "react";
import { Maximize, Camera, ChevronsRight, Eraser } from "lucide-react";
import { EditPromptBarBase } from "./EditPromptBarBase";
import { useEditPromptBar } from "../../model/useEditPromptBar";
import { EditDescribeTab } from "./EditDescribeTab";
import UpscalePanel from "./tabs/UpscalePanel";
import { CameraView } from "./tabs/CameraView";
import { ExtendView } from "./tabs/ExtendView";

const TABS = [
    { id: "edit", label: "Edit", icon: Eraser },
    { id: "camera",   label: "Camera",   icon: Camera    },
    { id: "extend",   label: "Extend",   icon: ChevronsRight },
    { id: "upscale",  label: "Upscale",  icon: Maximize  },
];

/**
 * EditPromptBarVideo — video editing specialisation of EditPromptBarBase.
 * Add your video-specific tabs and panels here.
 */
export function EditPromptBarVideo({ className }) {
    const s = useEditPromptBar();

    return (
        <EditPromptBarBase tabs={TABS} defaultTab="edit" className={className}>
            {(activeTab) => (
                <>
                    {activeTab === "edit" ? (
                        <EditDescribeTab s={s} />
                    ) : activeTab === "camera" ? (
                        <CameraView s={s} />
                    ) : activeTab === "extend" ? (
                        <ExtendView s={s} />
                    ) : activeTab === "upscale" ? (
                        <UpscalePanel
                            editTarget={s.editTarget}
                            upscaleScale={s.upscaleScale}
                            setUpscaleScale={s.setUpscaleScale}
                            generating={s.generating}
                            onGenerate={() => s.handleGenerate()}
                        />
                    ) : null}
                </>
            )}
        </EditPromptBarBase>
    );
}
