import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Download, ChevronDown, ChevronUp, Undo2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useGenerationsStore } from "@/features/generations/model/useGenerationsStore";
import { MediaGridItem } from "./MediaGridItem";
import { useRemoveGeneration } from "@/features/generations/api/generationsApi";
import { useRemoveAsset } from "@/features/media/api/mediaApi";
import { ButtonGroup } from "@/shared/ui/button-group";
import { IconButton } from "@/shared/ui/icon-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";

// ─── Side Panel ───
function SidePanel({ group, prompt, onDelete, onDownload, onEdit, isDownloading }) {
    const [expanded, setExpanded] = useState(false);

    const MAX_LENGTH = 120;
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

    const isUpload = group?.feed_type === "upload";

    return (
        <div className="shrink-0 w-[400px] flex flex-col gap-2 pt-0.5">
            {/* Buttons Group */}
            <ButtonGroup className="p-0.5">
                   <IconButton 
                    size="icon-sm"
                    icon={<Download size={10} className={isDownloading ? "opacity-50 animate-pulse" : ""} />} 
                    onClick={onDownload} 
                    title={isDownloading ? "Downloading..." : "Download"} 
                    disabled={isDownloading}
                />
                {!isUpload && (
                    <IconButton 
                        size="icon-sm"
                        icon={<Undo2 size={10}  />} 
                        onClick={onEdit} 
                        title="Edit Parameters" 
                    />
                )}
             
                <IconButton 
                    size="icon-sm"
                    icon={<Trash2 size={10} />} 
                    onClick={onDelete} 
                    title="Delete" 
                    danger 
                />
            </ButtonGroup>

            {/* Prompt */}
            <div 
                className={cn("flex items-end gap-1.5 w-full group", (isTruncated || expanded) ? "cursor-pointer" : "")}
                onClick={(e) => { 
                    if ((isTruncated || expanded) && window.getSelection().toString().length === 0) {
                        e.stopPropagation(); 
                        setExpanded(!expanded);
                    }
                }}
            >
                <p className="text-[12px] font-medium text-white leading-relaxed flex-1 wrap-break-word">
                    {isUpload ? (group?.items?.[0]?.asset?.media_type === "video" ? "Vidéo importée" : "Image importée") : `"${displayText}${!expanded && isTruncated ? "..." : ""}"`}
                </p>
                {isTruncated && (
                    <button
                        className="p-1 mb-0.5 shrink-0 text-white group-hover:text-white group-hover:bg-white/10 rounded-md transition-all pointer-events-none"
                        title={expanded ? "Show less" : "Show more"}
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
            <div className="flex flex-col gap-0.5 mt-2">
                {createdAt && (
                    <span className="text-[11px] text-white/45 font-medium whitespace-nowrap">
                        Création {createdAt}
                    </span>
                )}
                {updatedAt && (
                    <span className="text-[11px] text-white/45 font-medium whitespace-nowrap">
                        Edited {updatedAt}
                    </span>
                )}
                {!isUpload && group?.model_label && (
                    <div className="flex items-center gap-1 mt-0.5">
                        <Avatar className="size-3 bg-transparent shrink-0 border-none">
                            <AvatarImage 
                                src={group.model_icon_url} 
                                alt={group.model_label} 
                                className="object-contain brightness-0 invert opacity-50"
                            />
                            <AvatarFallback className="text-[10px] text-white flex items-center justify-center">
                                {group.model_label?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-white/45 font-medium whitespace-nowrap">
                            {group.model_label}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Session ───
export function Session({ group, gridSize = "lg" }) {
    const { setEditTrigger, showDetails } = useGenerationsStore();
    const { mutate: removeGeneration } = useRemoveGeneration();
    const { mutate: removeAsset } = useRemoveAsset();
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const isUpload = group?.feed_type === "upload";
    const items = (group?.items || []).filter((i) => i.status !== "deleted");
    const prompt =
        group?.params?.prompt ||
        group?.items?.[0]?.asset?.prompt ||
        "Generated Asset";

    const handleDelete = () => {
        if (isUpload) {
            removeAsset({ assetId: group.id });
        } else {
            removeGeneration(group.id);
        }
    };

    const handleDownload = async () => {
        if (isDownloading) return;
        
        const completedItems = items.filter((i) => i.status === "completed" && i.asset?.file_url);
        if (completedItems.length === 0) return;

        setIsDownloading(true);
        try {
            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();

            const fetchPromises = completedItems.map(async (item, idx) => {
                const url = item.asset.file_url;
                const rawExt = url.split(".").pop().split("?")[0];
                const ext = rawExt?.length <= 4 ? rawExt : "jpg";
                
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    zip.file(`generation_${group.id}_${idx + 1}.${ext}`, blob);
                } catch (err) {
                    console.error("Failed to fetch image for zip", err);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `generation_${group.id}_${idx + 1}.${ext}`;
                    a.click();
                }
            });

            await Promise.all(fetchPromises);
            
            if (Object.keys(zip.files).length > 0) {
                const zipContent = await zip.generateAsync({ type: "blob" });
                const downloadUrl = URL.createObjectURL(zipContent);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = `generations_${group.id}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
            }
        } catch (error) {
            console.error("Failed to sequence zip download:", error);
            completedItems.forEach((item, idx) => {
                const rawExt = item.asset.file_url.split(".").pop().split("?")[0];
                const ext = rawExt?.length <= 4 ? rawExt : "jpg";
                const a = document.createElement("a");
                a.href = item.asset.file_url;
                a.download = `generation_${group.id}_${idx + 1}.${ext}`;
                a.click();
            });
        } finally {
            setIsDownloading(false);
        }
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
            className="w-full flex flex-row gap-8 items-start"
        >
            {/* ── Grid Area (Masonry Layout) ── */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-4">
                    {items.map((item) => {
                        const itemHeight = 
                            gridSize === "sm" ? "h-[180px]" : 
                            gridSize === "md" ? "h-[280px]" : 
                                                "h-[380px]"; // lg
                        
                        return (
                            <div 
                                key={item.id} 
                                className={cn("relative rounded-xl overflow-hidden shrink-0", itemHeight)}
                            >
                                <MediaGridItem 
                                    item={item} 
                                    group={group} 
                                    showPrompt={false} 
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Side Panel ── */}
            {showDetails && (
                <SidePanel
                    group={group}
                    prompt={prompt}
                    onDelete={() => setIsDeleteConfirmOpen(true)}
                    onDownload={handleDownload}
                    onEdit={handleEdit}
                    isDownloading={isDownloading}
                />
            )}

            <ConfirmDeleteDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                title={isUpload ? "Supprimer l'importation ?" : "Supprimer la génération ?"}
                description={isUpload 
                    ? "Cet asset sera définitivement supprimé de votre bibliothèque." 
                    : "Toutes les images de cette génération seront supprimées définitivement."
                }
                onConfirm={handleDelete}
            />
        </motion.div>
    );
}