import * as React from "react"
import { motion } from "framer-motion"
import { Upload, Play } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { useGenerationsStore } from "@/features/generations/model/useGenerationsStore"

export function UploadedMediaBlock({ assetGroup, gridSize }) {
    const item = assetGroup?.items?.[0];
    if (!item || !item.asset) return null;

    const { file_url, asset_type, media_type } = item.asset;
    const isVideo = media_type === "video";

    // Grid classes based on gridSize
    const gridCls = gridSize === "lg" ? "grid-cols-4" : gridSize === "md" ? "grid-cols-6" : "grid-cols-8";

    // Drag to promptbar
    const handleDragStart = (e) => {
        e.dataTransfer.setData("imageUrl", file_url);
        e.dataTransfer.setData("assetId", item.asset.id);
        e.dataTransfer.effectAllowed = "copy";
        
        useGenerationsStore.getState().setDraggedImage({ url: file_url, aspect: 1, x: e.clientX, y: e.clientY });

        const dragImg = new Image();
        dragImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        e.dataTransfer.setDragImage(dragImg, 0, 0);
    };

    const handleDragEnd = () => {
        useGenerationsStore.getState().clearDraggedImage();
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col mb-4"
        >
            <div className="flex items-center gap-2 mb-2 px-1">
                <div className="p-1.5 rounded-md bg-white/5 border border-white/10 text-white/50">
                    <Upload className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-white/70">Uploaded Media</span>
                    <span className="text-[11px] text-white/40">
                        {new Date(assetGroup.created_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </span>
                </div>
            </div>

            <div className={cn("grid gap-4", gridCls)}>
                <motion.div 
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    className="group relative col-span-1 rounded-lg overflow-hidden shadow-lg ring-1 ring-white/10 bg-[#0a0a0a] cursor-grab active:cursor-grabbing" 
                    style={{ aspectRatio: '1/1' }}
                >
                    {isVideo ? (
                        <video
                            src={file_url}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            muted
                            loop
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        />
                    ) : (
                        <img
                            src={file_url}
                            alt="Uploaded"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    )}

                    {/* Simple overlay gradient */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {isVideo && (
                        <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 pointer-events-none drop-shadow-md">
                            <div className="p-1 rounded-full bg-white/20 backdrop-blur-md shadow-md w-fit">
                                <Play className="size-2 fill-white text-white" />
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}
