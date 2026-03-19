"use client"

import * as React from "react"
import { useStudioStore } from "@/store/useStudioStore"
import { 
    Dialog, 
    DialogContent, 
    DialogTrigger,
    DialogClose,
    DialogTitle
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { HeritageTree } from "../HeritageTree"
import { ImageInfoSidebar } from "./ImageInfoSidebar"

export function ImageViewerDialog({ children, nodeId, item, group, src, title, showSidebar = true, isVideo = false }) {
    const { nodes } = useStudioStore()
    const [isOpen, setOpen] = React.useState(false)

    const node = nodeId ? nodes[nodeId] : null
    const finalSrc = src || node?.image_url
    const finalTitle = title || node?.edit_command || "Initial State"
    const status = node ? node.status : "completed" // assume completed if direct src provided
    
    if (!finalSrc) return children

    return (
        <Dialog open={isOpen} onOpenChange={(val) => {
            if (status !== "completed") return
            setOpen(val)
        }}>
            <DialogTrigger asChild>
                <div className={cn(
                    "h-full w-full",
                    status === "completed" ? "cursor-pointer" : "cursor-default"
                )}>
                    {children}
                </div>
            </DialogTrigger>
            
            <DialogContent 
                variant="full"
                className="p-0 border-none"
                showCloseButton={false}
            >
                {/* ── Accessibility: Hidden Title ── */}
                <DialogTitle className="sr-only">
                    {isVideo ? 'Video' : 'Image'} Viewer: {finalTitle}
                </DialogTitle>

                {/* ── Background: Improved Blurred Image ── */}
                <div className="absolute inset-0 overflow-hidden bg-page-overlay">
                    {!isVideo && (
                        <div 
                            className="absolute inset-0 scale-110 blur-lg bg-cover bg-center bg-no-repeat transition-opacity duration-300 opacity-100"
                            style={{ 
                                backgroundImage: `url(${finalSrc})`, 
                            }}
                        />
                    )}
                    {/* Darker overlay to make the main image pop */}
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* ── Close Button (Fallback when Sidebar not showing info) ── */}
                {!item && (
                    <div className=" top-6 right-6 z-50">
                        <DialogClose asChild>
                            <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10 group backdrop-blur-md">
                                <X className="w-6 h-6 opacity-40 group-hover:opacity-100" />
                            </button>
                        </DialogClose>
                    </div>
                )}

                {/* ── Main Content Container ── */}
                <div className="relative z-10 flex w-full h-full overflow-hidden">
                    {/* ── Content Section (Left) ── */}
                    <div className="flex-1 flex items-center justify-center p-8 min-w-0">
                        {isVideo ? (
                            <video 
                                src={finalSrc} 
                                controls 
                                autoPlay
                                className="max-w-full max-h-full shadow-2xl rounded-lg"
                            />
                        ) : (
                            <img 
                                src={finalSrc} 
                                alt="" 
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                            />
                        )}
                    </div>

                    {/* ── Sidebar (Right) ── */}
                    {showSidebar && (
                        <div className="w-[320px] shrink-0 h-full hidden lg:block border-l border-white/10 bg-black/50">
                            <ImageInfoSidebar item={item} group={group} />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}