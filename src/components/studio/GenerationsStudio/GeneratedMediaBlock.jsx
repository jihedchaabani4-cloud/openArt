import React, { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Play, Heart, Trash2, Download, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageViewerDialog } from "../dialogs/ImageViewerDialog";
import ImageStatusView from "@/components/skeleton/ImageStatusView";
import { useGenerationsStudioStore } from "@/store/useGenerationsStudioStore";
import { getGridClass, formatGenerationDate, getItemMetadata } from "@/utils/generationUtils";

// ─── Icon Button ───
function IconButton({ icon, onClick, danger = false, title }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={cn(
                "flex items-center justify-center size-7 rounded-md transition-all",
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
function SidePanel({ group, prompt, modelLabel, onDelete, onRetry, onGenerateMore, onDownload }) {
    const [expanded, setExpanded] = useState(false);

    const MAX_LENGTH = 80;
    const isTruncated = prompt.length > MAX_LENGTH;
    const displayText = expanded ? prompt : (isTruncated ? prompt.slice(0, MAX_LENGTH).trim() : prompt);

    const createdAt = group?.created_at
        ? new Date(group.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null;

    const updatedAt = group?.updated_at && group.updated_at !== group.created_at
        ? new Date(group.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null;

    return (
        <div className="w-[200px] shrink-0 flex flex-col gap-3 pt-0.5">

            {/* ─── Buttons horizontal top ─── */}
            <div className="flex items-center gap-0.5">
                <IconButton icon={<Download size={13} />}  onClick={onDownload}     title="Download" />
                <IconButton icon={<RotateCcw size={13} />} onClick={onGenerateMore} title="Generate More" />
                <IconButton icon={<Trash2 size={13} />}    onClick={onDelete}       title="Delete" danger />
            </div>

            {/* ─── Prompt + expand ─── */}
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

            {/* ─── Reference images ─── */}
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

            {/* ─── Dates + model ─── */}
            <div className="flex flex-col gap-1">
                {createdAt && (
                    <span className="text-[11px] text-white/25 font-medium">
                        Created {createdAt}
                    </span>
                )}
                {updatedAt && (
                    <span className="text-[11px] text-white/25 font-medium">
                        Edited {updatedAt}
                    </span>
                )}
                {modelLabel && (
                    <span className="text-[11px] text-white/25 font-medium">
                        {modelLabel}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Grid Item ───
const MediaGridItemInner = ({ item, isVideo, isAudio, url, status, aspect, prompt, onDelete, onRetry }) => {
    return (
        <ImageStatusView
            status={status}
            src={url}
            alt={prompt}
            aspect={aspect}
            error={item.error}
            showOverlay={!isAudio}
            onCancel={(status === 'rejected' || status === 'failed' || status === 'error') ? onDelete : undefined}
            onRetry={(status === 'failed' || status === 'error') ? onRetry : undefined}
            className={cn(
                "cursor-pointer w-full h-full object-cover rounded-md overflow-hidden",
                status === 'completed' && "hover:border-white/20"
            )}
        >
            {status === 'completed' && url && (
                isVideo ? (
                    <video
                        src={url}
                        className="w-full h-full object-cover"
                        onMouseEnter={e => e.currentTarget.play()}
                        onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        muted loop
                    />
                ) : isAudio ? (
                    <div className="w-full h-full flex items-center justify-center bg-blue-500/10 p-4">
                        <div className="flex items-center gap-3 w-full">
                            <div className="size-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Play className="size-4 text-blue-400 fill-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="h-1 w-full bg-white/10 rounded-lg overflow-hidden">
                                    <div className="h-full w-1/3 bg-blue-500/50" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null
            )}
        </ImageStatusView>
    );
};

// ─── Main Block ───
export function GeneratedMediaBlock({ group, studioMode, gridSize = 'lg' }) {
    const {
        removeGeneration, removeGenerationItem, toggleLike,
        retryGeneration, generateMore
    } = useGenerationsStudioStore();

    const items = (group?.items || []).filter(i => i.status !== 'deleted');
    const prompt = group?.params?.prompt || (group?.section?.includes('audio') ? "Generated Audio" : "Generated Asset");
    const gridClass = getGridClass(group, items.length, gridSize);

    const modelLabel = group?.model?.includes('cinema')   ? 'Cinema'        :
                       group?.model?.includes('flux')     ? 'Flux'          :
                       group?.model?.includes('nanobana') ? 'NanoBanana'    :
                       group?.model?.includes('seedream') ? 'Seedream'      :
                       group?.model?.includes('z-image')  ? 'Z-Image'       :
                       group?.model?.includes('kling')    ? 'Kling'         :
                       group?.model?.includes('wan')      ? 'Wan'           :
                       group?.model?.includes('hailuo')   ? 'Hailuo'        :
                       group?.model?.includes('seedance') ? 'Seedance'      : 'Standard';

    const handleRetry        = () => retryGeneration(group);
    const handleGenerateMore = () => generateMore(group);
    const handleDelete       = () => removeGeneration(group.id);
    const handleDownload     = () => {
        items
            .filter(i => i.status === 'completed' && i.asset?.file_url)
            .forEach((item, idx) => {
                const a = document.createElement('a');
                a.href     = item.asset.file_url;
                a.download = `generation_${group.id}_${idx + 1}.jpg`;
                a.click();
            });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full flex flex-row gap-3 items-start"
        >
            {/* ── Left: Grid ── */}
            <div className="flex-1 min-w-0">
                <div className={cn("grid gap-1", gridClass)}>
                    {items.map((item) => {
                        const { isVideo, isAudio, url, aspect, status } = getItemMetadata(item, group);

                        const innerContent = (
                            <MediaGridItemInner
                                item={item}
                                isVideo={isVideo}
                                isAudio={isAudio}
                                url={url}
                                status={item.status}
                                aspect={aspect}
                                prompt={prompt}
                                error={item.error}
                                onDelete={() => removeGenerationItem(item.id, group.id)}
                                onRetry={handleRetry}
                            />
                        );

                        return (
                            <motion.div
                                key={item.id}
                                draggable={status === 'completed' && !!url}
                                onDragStart={(e) => {
                                    if (status === 'completed' && url) {
                                        e.dataTransfer.setData("imageUrl", url);
                                        if (item.asset_id) e.dataTransfer.setData("assetId", item.asset_id);
                                        e.dataTransfer.effectAllowed = "copy";
                                    }
                                }}
                                className="group relative rounded-md overflow-hidden bg-[#0a0a0a] border border-white/5 w-full cursor-grab active:cursor-grabbing"
                                style={{ aspectRatio: aspect }}
                            >
                                {!isAudio && status === 'completed' && url ? (
                                    <ImageViewerDialog
                                        item={item}
                                        group={group}
                                        src={url}
                                        title={prompt}
                                        isVideo={isVideo}
                                    >
                                        {innerContent}
                                    </ImageViewerDialog>
                                ) : innerContent}

                                {/* Like */}
                                {item.status === 'completed' && url && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLike(item.id, item.is_liked);
                                        }}
                                        className={cn(
                                            "absolute top-2 right-2 p-2 rounded-lg backdrop-blur-md border transition-all z-20 group/btn",
                                            item.is_liked
                                                ? "bg-red-500/20 border-red-500/30 text-red-500 opacity-100"
                                                : "bg-black/40 border-white/10 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 hover:bg-black/80"
                                        )}
                                    >
                                        <Heart className={cn("w-4 h-4 transition-transform group-hover/btn:scale-110", item.is_liked && "fill-current")} />
                                    </button>
                                )}

                                {/* Video play */}
                                {(isVideo || isAudio) && status === 'completed' && url && (
                                    <div className="absolute top-3 right-3 size-8 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                        <Play className="size-3 fill-white text-white" />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── Right: Side Panel ── */}
            <SidePanel
                group={group}
                prompt={prompt}
                modelLabel={modelLabel}
                onDelete={handleDelete}
                onRetry={handleRetry}
                onGenerateMore={handleGenerateMore}
                onDownload={handleDownload}
            />
        </motion.div>
    );
}