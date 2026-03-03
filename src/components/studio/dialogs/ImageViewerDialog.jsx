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

export function ImageViewerDialog({ children, nodeId }) {
    const { nodes } = useStudioStore()
    const [isOpen, setOpen] = React.useState(false)

    const node = nodes[nodeId]
    
    if (!node) return children

    return (
        <Dialog open={isOpen} onOpenChange={(val) => {
            if (node.status !== "completed") return
            setOpen(val)
        }}>
            <DialogTrigger asChild>
                <div className={cn(
                    "h-full w-full",
                    node.status === "completed" ? "cursor-pointer" : "cursor-default"
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
                    Image Viewer: {node.edit_command || "Initial State"}
                </DialogTitle>

                {/* ── Background: Improved Blurred Image ── */}
                <div className="absolute inset-0 overflow-hidden bg-page-overlay">
                    <div 
                        className="absolute inset-0 scale-110 blur-[16px] bg-cover bg-center bg-no-repeat transition-opacity duration-300 opacity-100"
                        style={{ 
                            backgroundImage: `url(${node.image_url})`, 
                        }}
                    />
                    {/* Darker overlay to make the main image pop */}
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* ── Close Button ── */}
                <div className="absolute top-6 right-6 z-50">
                    <DialogClose asChild>
                        <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all duration-300 border border-white/10 group backdrop-blur-md">
                            <X className="w-6 h-6 opacity-40 group-hover:opacity-100" />
                        </button>
                    </DialogClose>
                </div>

                {/* ── Main Content Container ── */}
                <div className="relative z-10 flex w-full h-full overflow-hidden">
                    {/* ── Image Section (Left) ── */}
                    <div className="flex-1 flex items-center justify-center p-8 min-w-0">
                        <img 
                            src={node.image_url} 
                            alt="" 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                        />
                    </div>

                    {/* ── Heritage Sidebar (Right) ── */}
                    <div className="w-[450px] max-w-[450px] h-full ">
                        <HeritageTree isInsideDialog={true} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}