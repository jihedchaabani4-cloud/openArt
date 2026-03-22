import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Download, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useGenerationsStore } from "@/features/generations/model/useGenerationsStore";
import { MediaGridItem } from "./MediaGridItem";
import { useRemoveGeneration } from "@/features/generations/api/generationsApi";
import { getGridClass } from "@/shared/lib/generationUtils";

// ─── Icon Button ───
function IconButton({ icon, onClick, danger = false, title }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={cn(
                "flex items-center justify-center size-9 rounded-md transition-all",
                danger
                    ? "text-white/30 hover:bg-red-500/10 hover:text-red-400"
                    : "text-white/40 hover:bg-white/8 hover:text-white/80"
            )}
        >
            {icon}
        </button>
    );
}

// ─── Side Panel ───
function SidePanel({ group, prompt, modelLabel, onDelete, onDownload, onEdit }) {
    const [expanded, setExpanded] = useState(false);

    const MAX_LENGTH = 80;
    const isTruncated = prompt.length > MAX_LENGTH;
    const displayText = expanded
        ? prompt
        : isTruncated
            ? prompt.slice(0, MAX_LENGTH).trim()
            : prompt;

    const createdAt = group?.created_at
        ? new Date(group.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
          })
        : null;

    const updatedAt =
        group?.updated_at && group.updated_at !== group.created_at
            ? new Date(group.updated_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
              })
            : null;

    return (
        <div className="shrink-0 w-[25%] flex flex-col gap-3 pt-0.5">
            {/* Buttons */}
            <div className="flex items-center gap-1">
                <IconButton icon={<Pencil size={15} />}    onClick={onEdit}         title="Edit Parameters" />
                <IconButton icon={<Download size={15} />}  onClick={onDownload}     title="Download" />
                <IconButton icon={<Trash2 size={15} />}    onClick={onDelete}       title="Delete" danger />
            </div>

            {/* Prompt */}
            <div className="flex flex-col gap-1">
                <p className="text-[12.5px] font-medium text-white/80 leading-relaxed">
                    {displayText}
                    {!expanded && isTruncated && (
                        <span className="text-white/30 ml-1">...</span>
                    )}
                </p>
                {isTruncated && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-[10.5px] text-white/25 hover:text-white/50 transition-colors w-fit"
                    >
                        {expanded
                            ? <><ChevronUp size={10} /> Show less</>
                            : <><ChevronDown size={10} /> Show more</>
                        }
                    </button>
                )}
            </div>

            {/* Reference images */}
            {group?.input_assets?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {group.input_assets.map((asset, i) => (
                        <div
                            key={asset.asset_id || i}
                            className="size-10 rounded-md overflow-hidden border border-white/8 bg-white/5 shrink-0 cursor-grab"
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("imageUrl", asset.url);
                                if (asset.asset_id) e.dataTransfer.setData("assetId", asset.asset_id);
                                e.dataTransfer.effectAllowed = "copy";
                            }}
                        >
                            <img src={asset.url} alt="ref" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}

            {/* Dates + model */}
            <div className="flex flex-col gap-1">
                {createdAt && (
                    <span className="text-[11px] text-white/25 font-medium whitespace-nowrap">
                        Created {createdAt}
                    </span>
                )}
                {updatedAt && (
                    <span className="text-[11px] text-white/25 font-medium whitespace-nowrap">
                        Edited {updatedAt}
                    </span>
                )}
                {modelLabel && (
                    <span className="text-[11px] text-white/25 font-medium whitespace-nowrap">
                        {modelLabel}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Grid Item extracted to MediaGridItem.jsx ───

// ─── Session ───
export function Session({ group, gridSize = "lg" }) {
    const { setEditTrigger, showDetails } = useGenerationsStore();
    const { mutate: removeGeneration } = useRemoveGeneration();

    const items = (group?.items || []).filter((i) => i.status !== "deleted");
    const prompt =
        group?.params?.prompt ||
        group?.items?.[0]?.asset?.prompt ||
        "Generated Asset";
    const { gridClass, maxHeightClass } = getGridClass(group, items.length, gridSize);

    const modelLabel =
        group?.model?.includes("cinema")   ? "Cinema"     :
        group?.model?.includes("flux")     ? "Flux"       :
        group?.model?.includes("nanobana") ? "NanoBanana" :
        group?.model?.includes("seedream") ? "Seedream"   :
        group?.model?.includes("z-image")  ? "Z-Image"    :
        group?.model?.includes("kling")    ? "Kling"      :
        group?.model?.includes("wan")      ? "Wan"        :
        group?.model?.includes("hailuo")   ? "Hailuo"     :
        group?.model?.includes("seedance") ? "Seedance"   : "Standard";

    const handleDelete       = () => removeGeneration(group.id);

    const handleDownload = () => {
        items
            .filter((i) => i.status === "completed" && i.asset?.file_url)
            .forEach((item, idx) => {
                const rawExt = item.asset.file_url.split(".").pop().split("?")[0];
                const ext    = rawExt?.length <= 4 ? rawExt : "jpg";
                const a      = document.createElement("a");
                a.href       = item.asset.file_url;
                a.download   = `generation_${group.id}_${idx + 1}.${ext}`;
                a.click();
            });
    };

    const handleEdit = () => {
        const editParams = { ...(group.params || {}) };

        if (!editParams.prompt) editParams.prompt = prompt;
        if (!editParams.model_name && group.model) editParams.model_name = group.model;

        if (group.input_assets?.length > 0) {
            const mapped = group.input_assets
                .map((asset) => {
                    const actualAsset = asset.asset || asset;
                    const url = actualAsset.url || actualAsset.file_url || null;
                    if (!url) return null;
                    return {
                        url,
                        asset_id: asset.asset_id || actualAsset.id || asset.id || null,
                        role:     asset.role || "normal",
                        type:     actualAsset.asset_type || (actualAsset.is_video ? "video" : "image"),
                    };
                })
                .filter(Boolean);

            if (mapped.length > 0) editParams.references = mapped;
        } else if (group.params?.references?.length > 0) {
            editParams.references = group.params.references;
        }

        setEditTrigger({ params: editParams });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full flex flex-row gap-3 items-start"
        >
            {/* ── Grid ── */}
            <div className="flex-1 min-w-0">
                <div className={cn(gridClass)}>
                    {items.map((item) => {
                        return (
                            <MediaGridItem 
                                key={item.id}
                                item={item}
                                group={group}
                                showPrompt={false}
                                className={maxHeightClass}
                            />
                        );

                    })}
                </div>
            </div>

            {/* ── Side Panel ── */}
            {showDetails && (
                <SidePanel
                    group={group}
                    prompt={prompt}
                    modelLabel={modelLabel}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                    onEdit={handleEdit}
                />
            )}
        </motion.div>
    );
}