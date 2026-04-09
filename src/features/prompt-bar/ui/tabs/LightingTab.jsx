import React from "react";
import { cn } from "@/shared/lib/utils";
import LightingPanel from "./Lighting";
import { useEditStore } from "@/features/prompt-bar/model/useEditStore";
import { useStudioStore } from "@/store/useStudioStore";

export function LightingTab({ value, onChange, previewImageUrl }) {
    const { setLighting } = useEditStore();
    const { setLightingDna } = useStudioStore();

    const handleGenerate = (dna) => {
        setLighting(dna);
        setLightingDna(dna);
    };

    return (
        <div className="flex flex-col gap-4 w-full p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <LightingPanel 
                onGenerate={handleGenerate}
                previewImageUrl={previewImageUrl}
            />
        </div>
    );
}
