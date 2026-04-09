import React from "react";
import { cn } from "@/shared/lib/utils";
import AnglesPanel from "./Angles";
import { useEditStore } from "@/features/prompt-bar/model/useEditStore";
import { useStudioStore } from "@/store/useStudioStore";

export function CameraTab({ value, onChange, previewImageUrl }) {
    const { setCamera } = useEditStore();
    const { setCameraDna } = useStudioStore();

    const handleGenerate = (dna) => {
        // Sync both stores
        setCamera(dna);
        setCameraDna(dna);
    };

    return (
        <div className="flex flex-col gap-4 w-full p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">

                <AnglesPanel 
                    onClose={() => {}} 
                    onGenerate={handleGenerate}
                    previewImageUrl={previewImageUrl}
                />
        </div>
    );
}
