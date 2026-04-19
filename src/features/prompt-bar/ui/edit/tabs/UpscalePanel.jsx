"use client";

import React, { useMemo, useState } from "react";
import { Loader2, ChevronDown, Sparkles } from "lucide-react";
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
        <div className="flex items-center gap-2 w-full p-3 animate-in fade-in zoom-in-95 duration-300">

            {/* Scale — DropdownSegmentedWithLabel */}
            <div className="flex-1 min-w-0">
                <DropdownSegmentedWithLabel
                    label="Scale"
                    value={upscaleScale}
                    onChange={setUpscaleScale}
                    options={scaleOptions}
                    transparent
                />
            </div>

            {/* Process Button */}
            <Button
                onClick={onGenerate}
                disabled={generating || selectedExceedsLimit}
                className="h-full shrink-0 px-4 py-2 rounded-xl bg-[#6C5CE7] hover:bg-[#7C6CF7] text-white text-[13px] font-semibold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {generating ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <Sparkles className="size-4" />
                )}
                Process
            </Button>
        </div>
    );
}
