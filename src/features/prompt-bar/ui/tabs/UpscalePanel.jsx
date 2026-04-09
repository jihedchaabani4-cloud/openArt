"use client";

import React, { useMemo } from "react";
import { ArrowRight, Loader2, Info } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { DropdownSegmented } from "@/shared/ui/DropdownShell";
import { cn } from "@/shared/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_MP = 19;           // maximum megapixels allowed
const SCALES = [2, 4, 8, 16]; // all options — those exceeding MAX_MP are disabled

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a numeric scale from a string like "x2" → 2 */
function parseScale(scaleStr) {
    return parseInt(scaleStr.replace("x", ""), 10) || 2;
}

/** Compute output megapixels for a given scale */
function computeMP(width, height, scale) {
    if (!width || !height) return null;
    return ((width * scale) * (height * scale)) / 1_000_000;
}

/** Format a megapixel number nicely */
function formatMP(mp) {
    return mp < 10 ? mp.toFixed(1) + " MP" : Math.round(mp) + " MP";
}

// ─── UpscalePanel ─────────────────────────────────────────────────────────────

/**
 * UpscalePanel
 * Renders ×2 / ×4 / ×8 scale buttons with a live output-size badge.
 * Buttons that would exceed MAX_MP (19 MP) are visually disabled.
 */
export default function UpscalePanel({
    editTarget,
    upscaleScale,
    setUpscaleScale,
    generating,
    onGenerate,
}) {
    // Dimensions from the edit target (may be undefined for older data)
    const srcW = editTarget?.width  ?? editTarget?.media_width  ?? null;
    const srcH = editTarget?.height ?? editTarget?.media_height ?? null;
    const isVideo = editTarget?.isVideo ?? false;

    const hasDimensions = Boolean(srcW && srcH && !isNaN(srcW) && !isNaN(srcH));

    // Maximum safe scale derived from limits (19 MP for images, or maybe lower for video)
    // For now we keep 19MP limit for both, but we can adjust if needed.
    const maxSafeScale = useMemo(() => {
        if (!hasDimensions) return 8; // If no dimensions, cap at 8x to safely disable 16x
        return Math.sqrt((MAX_MP * 1_000_000) / (Number(srcW) * Number(srcH)));
    }, [srcW, srcH, hasDimensions]);

    const selectedScaleNum = parseScale(upscaleScale);

    // Is the currently selected scale within limits?
    const selectedExceedsLimit = selectedScaleNum > maxSafeScale;

    return (
        <div className="flex flex-col w-full p-4 gap-4 animate-in fade-in zoom-in-95 duration-300">

            <div className="flex flex-row items-center gap-4">
                <div className="flex-1">
                    <DropdownSegmented
                        value={upscaleScale}
                        onChange={setUpscaleScale}
                        options={SCALES.map((scale) => {
                            const value = `x${scale}`;
                            const mp = computeMP(srcW, srcH, scale);
                            const exceeds = scale > maxSafeScale;
                            const isActive = upscaleScale === value;

                            return {
                                value,
                                disabled: exceeds,
                                label: (
                                    <>
                                        <span className="text-[13px] font-bold">×{scale}</span>
                                        {hasDimensions && (
                                            <div className="flex flex-col items-center -gap-0.5">
                                                <span className={cn(
                                                    "text-[9px] font-medium tracking-tight",
                                                    isActive && !exceeds ? "text-white/80" : "text-white/45"
                                                )}>
                                                    {Math.round(srcW * scale)} × {Math.round(srcH * scale)}
                                                </span>
                                                {mp !== null && (
                                                    <span className={cn(
                                                        "text-[9px] font-medium opacity-60",
                                                        isActive && !exceeds ? "text-white/70" : "text-white/30"
                                                    )}>
                                                        {exceeds ? ">" + MAX_MP + " MP" : formatMP(mp)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {exceeds && (
                                            <span className="absolute top-1 right-1 text-[7px] font-bold text-white/20 uppercase">
                                                limit
                                            </span>
                                        )}
                                    </>
                                )
                            };
                        })}
                    />
                </div>

                {/* Generate Button */}
                <Button
                    onClick={onGenerate}
                    disabled={generating || selectedExceedsLimit}
                    variant="studio-white"
                    className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all bg-white hover:bg-white/90 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {generating ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <ArrowRight className="size-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
