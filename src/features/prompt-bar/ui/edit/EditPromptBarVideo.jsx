"use client";

import React from "react";
import { Sparkles, Maximize } from "lucide-react";
import { EditPromptBarBase } from "./EditPromptBarBase";
import { useEditPromptBar } from "../../model/useEditPromptBar";
import { EditDescribeTab } from "./EditDescribeTab";
import UpscalePanel from "../tabs/UpscalePanel";

const TABS = [
    { id: "generate", label: "Generate", icon: Sparkles },
    { id: "upscale",  label: "Upscale",  icon: Maximize  },
];

/**
 * EditPromptBarVideo — video editing specialisation of EditPromptBarBase.
 * Add your video-specific tabs and panels here.
 */
export function EditPromptBarVideo({ className }) {
    const s = useEditPromptBar();

    return (
        <EditPromptBarBase tabs={TABS} defaultTab="generate" className={className}>
            {(activeTab) => (
                <>
                    {activeTab === "generate" ? (
                        <EditDescribeTab s={s} />
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
