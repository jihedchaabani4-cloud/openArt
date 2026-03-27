"use client"

import * as React from "react"
import { Copy, Info, ChevronDown, ChevronUp, X, Download, Heart, Trash2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { DialogClose } from "@/shared/ui/dialog"
import { useRemoveGeneration, useToggleLike } from "@/features/generations/api/generationsApi"
import { useRemoveAsset } from "@/features/media/api/mediaApi"
import { DeleteGenerationDialog } from "./DeleteGenerationDialog"

export function ImageInfoSidebar({ item, group, onClose }) {
    const { mutate: removeGeneration } = useRemoveGeneration()
    const { mutate: removeAsset } = useRemoveAsset()
    const { mutate: toggleLike } = useToggleLike()
    const [showFullPrompt, setShowFullPrompt] = React.useState(false)
    const [showFullInfo, setShowFullInfo] = React.useState(false)
    const [isPromptLong, setIsPromptLong] = React.useState(false)
    const [copied, setCopied] = React.useState(false)
    const promptRef = React.useRef(null)

    const isUpload = group?.feed_type === 'upload'

    React.useEffect(() => {
        if (promptRef.current) {
            // Check if scrollHeight exceeds 4 lines (roughly 80-90px for text-sm leading-relaxed)
            setIsPromptLong(promptRef.current.scrollHeight > 90)
        }
    }, [item])

    if (!item) return null

    const prompt = item.params?.prompt || item.prompt || group?.params?.prompt || "No prompt available"
    const model = item.model || group?.model || "Stable Diffusion"
    const quality = item.params?.quality || group?.params?.quality || "1K"
    const ratio = item.params?.ratio || group?.params?.ratio || "1:1"
    const width = item.params?.width || group?.params?.params?.width || group?.params?.width || ""
    const height = item.params?.height || group?.params?.params?.height || group?.params?.height || ""
    const sizeStr = item.params?.size || group?.params?.size || group?.params?.params?.size;
    
    let displaySize = `${width}x${height}`;
    if (sizeStr && typeof sizeStr === 'string' && sizeStr.includes('*')) {
        displaySize = sizeStr.replace('*', ' x ');
    } else if (sizeStr && typeof sizeStr === 'string' && sizeStr.includes('x')) {
        displaySize = sizeStr;
    }
    const isLiked = item.is_Like || false
    const url = item.file_url || item.asset?.file_url
    
    // Date fallback hierarchy: item -> group -> now
    const rawDate = item.created_at || group?.created_at || new Date().toISOString()
    const createdAt = new Date(rawDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const copyToClipboard = () => {
        navigator.clipboard.writeText(prompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = async () => {
        if (!url) return
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = `openart-${item.id}.jpg`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
        } catch (err) {
            console.error("Download failed:", err)
        }
    }

    const handleDelete = () => {
        if (isUpload) {
            removeAsset({ assetId: group.id })
            onClose?.()
        } else {
            removeGeneration(item.id)
        }
    }

    return (
        <div 
            className="h-full w-full rounded-xl flex flex-col border-l border-white/10 overflow-hidden relative"
            style={{ backgroundColor: '#0F1113' }}
        >
            <div className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth p-6 pb-2">
                <div className="flex flex-col gap-8">
                    
                    {/* ── Header Actions ── */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white/40">
                            <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                {isUpload ? 'Media importé' : 'Details'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isUpload && (
                                <button 
                                    onClick={copyToClipboard}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 border",
                                        copied 
                                            ? "bg-white text-black border-white" 
                                            : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                                    )}
                                >
                                    {copied ? "Copied!" : "Copy Prompt"}
                                </button>
                            )}
                            {onClose ? (
                                <button 
                                    onClick={onClose}
                                    className="p-1.5 rounded-md bg-transparent text-white transition-all duration-300 border border-white/10 group backdrop-blur-md">
                                    <X className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                                </button>
                            ) : (
                                <DialogClose asChild>
                                    <button className="p-1.5 rounded-md bg-transparent text-white transition-all duration-300 border border-white/10 group backdrop-blur-md">
                                        <X className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                                    </button>
                                </DialogClose>
                            )}
                        </div>
                    </div>

                    {/* ── Prompt / Upload Section ── */}
                    {isUpload ? (
                        <section className="flex flex-col gap-4">
                            <div className="bg-white/5 rounded-xl border border-white/5 p-4">
                                <p className="text-sm text-white/60 leading-relaxed">
                                    {item?.asset?.media_type === 'video' ? 'Vidéo importée' : 'Image importée'}
                                </p>
                                <p className="text-[11px] text-white/30 mt-2">
                                    Création : {createdAt}
                                </p>
                            </div>
                        </section>
                    ) : (
                        <>
                            {/* ── Prompt Section ── */}
                            <section className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-white/40">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3.75 5C3.33579 5 3 5.33579 3 5.75C3 6.16421 3.33579 6.5 3.75 6.5H20.25C20.6642 6.5 21 6.16421 21 5.75C21 5.33579 20.6642 5 20.25 5H3.75Z" fill="currentColor"/>
                                        <path d="M17.6708 10.1646C17.5438 9.9105 17.2841 9.75 17 9.75C16.7159 9.75 16.4562 9.9105 16.3292 10.1646L14.941 12.941L12.1646 14.3292C11.9105 14.4562 11.75 14.7159 11.75 15C11.75 15.2841 11.9105 15.5438 12.1646 15.6708L14.941 17.059L16.3292 19.8354C16.4562 20.0895 16.7159 20.25 17 20.25C17.2841 20.25 17.5438 20.0895 17.6708 19.8354L19.059 17.059L21.8354 15.6708C22.0895 15.5438 22.25 15.2841 22.25 15C22.25 14.7159 22.0895 14.4562 21.8354 14.3292L19.059 12.941L17.6708 10.1646Z" fill="currentColor"/>
                                        <path d="M3.75 11.25C3.33579 11.25 3 11.5858 3 12C3 12.4142 3.33579 12.75 3.75 12.75H9.25C9.66421 12.75 10 12.4142 10 12C10 11.5858 9.66421 11.25 9.25 11.25H3.75Z" fill="currentColor"/>
                                        <path d="M3.75 17.5C3.33579 17.5 3 17.8358 3 18.25C3 18.6642 3.33579 19 3.75 19H7.25C7.66421 19 8 18.6642 8 18.25C8 17.8358 7.66421 17.5 7.25 17.5H3.75Z" fill="currentColor"/>
                                    </svg>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Prompt</span>
                                </div>
                                
                                <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                    <div 
                                        ref={promptRef}
                                        className={cn(
                                            "p-4 text-sm text-white/60 leading-relaxed wrap-break-word",
                                            !showFullPrompt && "line-clamp-4"
                                        )}
                                    >
                                        {prompt}
                                    </div>
                                    {isPromptLong && (
                                        <button 
                                            onClick={() => setShowFullPrompt(!showFullPrompt)}
                                            className="w-full py-2 px-4 flex items-center justify-between border-t border-white/5 text-[10px] font-bold text-white/40 hover:text-white transition-colors"
                                        >
                                            <span>{showFullPrompt ? "See less" : "See all"}</span>
                                            {showFullPrompt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                    )}
                                </div>
                            </section>

                            {/* ── Information Section ── */}
                            <section className="flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-white/40">
                                    <Info className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Information</span>
                                </div>

                                <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                    <div className="flex flex-col divide-y divide-white/5">
                                        <InfoItem label="Model" value={model} />
                                        <InfoItem label="Quality" value={quality} />
                                        
                                        <div className={cn(
                                            "flex flex-col divide-y divide-white/5 transition-all duration-300",
                                            !showFullInfo && "max-h-0 overflow-hidden"
                                        )}>
                                            <InfoItem label="Ratio" value={ratio} />
                                            <InfoItem label="Size" value={displaySize} />
                                            <InfoItem label="Created" value={createdAt} />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowFullInfo(!showFullInfo)}
                                        className="w-full py-3 px-4 flex items-center justify-between text-[10px] font-bold text-white/40 hover:text-white transition-colors"
                                    >
                                        <span>{showFullInfo ? "Show less" : "Show more"}</span>
                                        {showFullInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                </div>
                            </section>
                        </>
                    )}

                </div>
            </div>

            {/* ── Footer Actions ── */}
            <div className="p-6 pt-4 border-t border-white/5 bg-[#0F1113] grid grid-cols-5 gap-2">
                {!isUpload && (
                    <button 
                        onClick={() => toggleLike({ itemId: item.id })}
                        className={cn(
                            "button button-md h-12 flex items-center justify-center rounded-xl transition-all duration-200 border col-span-1",
                            isLiked 
                                ? "bg-red-500/10 border-red-500/20 text-red-500" 
                                : "bg-white/5 hover:bg-white/10 border-white/10 text-white/40 hover:text-white"
                        )}
                    >
                        <Heart className={cn("size-5", isLiked && "fill-current")} />
                    </button>
                )}

                <button 
                    type="button" 
                    onClick={handleDownload}
                    className={cn(
                        "button button-md button-secondary-reverted border-white/10 border hover:bg-white/10 transition-colors duration-200 h-12 flex items-center justify-center gap-2 text-white text-[12px] font-bold uppercase tracking-wider rounded-xl",
                        isUpload ? "col-span-4" : "col-span-3"
                    )}
                >
                    <svg className="size-5" aria-hidden="true" width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.25 14.75V19.25C20.25 19.8023 19.8023 20.25 19.25 20.25H4.75C4.19772 20.25 3.75 19.8023 3.75 19.25V14.75M12 15V3.75M12 15L8.5 11.5M12 15L15.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    Download
                </button>

                <DeleteGenerationDialog 
                    onConfirm={handleDelete} 
                    itemName={isUpload ? 'media' : (item.asset?.asset_type || "generation")}
                >
                    <button 
                        className="button button-md h-12 flex items-center justify-center rounded-xl transition-all duration-200 border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-white/40 hover:text-red-500 col-span-1"
                    >
                        <Trash2 className="size-5" />
                    </button>
                </DeleteGenerationDialog>
            </div>
            
            <style jsx>{`
                .mask-fade-bottom {
                    mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}

function InfoItem({ label, value }) {
    return (
        <div className="flex items-center justify-between p-4">
            <span className="text-xs text-white/40">{label}</span>
            <span className="text-xs font-medium text-white">{value}</span>
        </div>
    )
}
