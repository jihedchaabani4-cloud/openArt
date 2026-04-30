"use client";

import React, { useMemo, useState } from "react";
import { Loader2, ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { DropdownSegmentedWithLabel } from "@/shared/ui/DropdownShell";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_MP = 19;
const SCALES = [2, 4, 8, 16];
const OUTPUT_OPTIONS = [1, 2, 4];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseScale(scaleStr) {
    return parseInt(scaleStr.replace("x", ""), 10) || 2;
}

function computeMP(width, height, scale) {
    if (!width || !height) return null;
    return ((width * scale) * (height * scale)) / 1_000_000;
}

function formatMP(mp) {
    return mp < 10 ? mp.toFixed(1) + " MP" : Math.round(mp) + " MP";
}

// ─── UpscalePanel ─────────────────────────────────────────────────────────────
export default function UpscalePanel({
    editTarget,
    upscaleScale,
    setUpscaleScale,
    generating,
    onGenerate,
}) {
    const [outputCount, setOutputCount] = useState(1);
    const [outputsOpen, setOutputsOpen] = useState(false);

    const srcW = editTarget?.width  ?? editTarget?.media_width  ?? null;
    const srcH = editTarget?.height ?? editTarget?.media_height ?? null;

    const hasDimensions = Boolean(srcW && srcH && !isNaN(srcW) && !isNaN(srcH));

    const maxSafeScale = useMemo(() => {
        if (!hasDimensions) return 8;
        return Math.sqrt((MAX_MP * 1_000_000) / (Number(srcW) * Number(srcH)));
    }, [srcW, srcH, hasDimensions]);

    const selectedScaleNum = parseScale(upscaleScale);
    const selectedExceedsLimit = selectedScaleNum > maxSafeScale;

    // Build scale options for DropdownSegmentedWithLabel
    const scaleOptions = SCALES.map((scale) => {
        const value = `x${scale}`;
        const exceeds = scale > maxSafeScale;
        const mp = computeMP(srcW, srcH, scale);

        return {
            value,
            disabled: exceeds,
            label: (
                <div className="flex flex-col items-center gap-0">
                    <span className="text-[13px] font-bold leading-tight">×{scale}</span>
                    {hasDimensions && mp !== null && (
                        <span className={cn(
                            "text-[9px] font-medium leading-tight opacity-60",
                            upscaleScale === value ? "text-white" : "text-white/40"
                        )}>
                            {exceeds ? `>${MAX_MP}MP` : formatMP(mp)}
                        </span>
                    )}
                </div>
            ),
        };
    });

    return (
        <div className="flex items-center gap-2 p-1.5 animate-in fade-in  duration-300 bg-(--color-imagine-grey-2) backdrop-blur-[80px] rounded-xl min-w-[390px]">

            {/* Scale — DropdownSegmentedWithLabel */}
            <div className="flex-1 min-w-0">
                <DropdownSegmentedWithLabel
                    label="Scale"
                    value={upscaleScale}
                    onChange={setUpscaleScale}
                    options={scaleOptions}
                    className="p-0"
                    transparent
                />
            </div>

            {/* Process Button */}
            <Button
                onClick={onGenerate}
                disabled={generating || selectedExceedsLimit}
                 variant="studio-white"
              className="size-9 rounded-full p-0 flex items-center justify-center shadow-xl active:scale-95 transition-all bg-[#3E3E3E] hover:bg-[#4E4E4E] text-white border-none"
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
            </Button>
        </div>  
    );
}
