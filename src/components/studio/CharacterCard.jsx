import * as React from "react"
import { User, MoreHorizontal, Edit2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useStudioStore } from "@/store/useStudioStore"
import { RenameCharacterDialog } from "./dialogs/RenameCharacterDialog"
import { DeleteNodeDialog } from "./dialogs/DeleteNodeDialog"

export function CharacterCard({ char, tileNode = null, tileStatus, isActive, onClick }) {
    const { renameCharacter, removeCharacter } = useStudioStore()
    const [imageError, setImageError] = React.useState(false)

    const imageUrl = tileNode?.image_url ?? tileNode?.imageUrl ?? char.imageUrl

    const normalizedStatus =
        tileStatus ||
        (tileNode?.status === "processing"
            ? "processing"
            : tileNode?.status === "completed"
                ? "completed"
                : tileNode?.status === "failed" || tileNode?.status === "error"
                    ? "error"
                    : "error")

    const isProcessingNode = tileStatus === "processing"
    const isCompleted = normalizedStatus === "completed"
    const isError = normalizedStatus === "error"
    const hasValidImage = isCompleted && !imageError && imageUrl

    return (
        <div className={cn("w-full aspect-square flex-none min-w-0 group relative", isProcessingNode && "opacity-80")}>
            {/* More Options Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button 
                        type="button" 
                        disabled={isProcessingNode}
                        className={cn(
                            "absolute top-1 right-1 z-20 rounded-full p-1 bg-black/40 backdrop-blur-lg transition-all duration-200 border border-white/10 flex items-center justify-center",
                            isProcessingNode ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 max-sm:opacity-100 opacity-0 group-hover:opacity-100 cursor-pointer"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <svg className="size-3.5 sm:size-4 text-white/60" aria-hidden="true" width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="currentColor"></path>
                            <path d="M20.25 13C20.8023 13 21.25 12.5523 21.25 12C21.25 11.4477 20.8023 11 20.25 11C19.6977 11 19.25 11.4477 19.25 12C19.25 12.5523 19.6977 13 20.25 13Z" fill="currentColor"></path>
                            <path d="M3.75 13C4.30228 13 4.75 12.5523 4.75 12C4.75 11.4477 4.30228 11 3.75 11C3.19772 11 2.75 11.4477 2.75 12C2.75 12.5523 3.19772 13 3.75 13Z" fill="currentColor"></path>
                            <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                            <path d="M20.25 13C20.8023 13 21.25 12.5523 21.25 12C21.25 11.4477 20.8023 11 20.25 11C19.6977 11 19.25 11.4477 19.25 12C19.25 12.5523 19.6977 13 20.25 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                            <path d="M3.75 13C4.30228 13 4.75 12.5523 4.75 12C4.75 11.4477 4.30228 11 3.75 11C3.19772 11 2.75 11.4477 2.75 12C2.75 12.5523 3.19772 13 3.75 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#131517] border-[#1C1F23] text-white min-w-[160px] rounded-xl p-1.5 z-[100]">
                    <RenameCharacterDialog 
                        currentName={char.name} 
                        onConfirm={(newName) => renameCharacter(char.id, newName)}
                    >
                        <DropdownMenuItem 
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 focus:bg-white/5 transition-colors"
                            onSelect={(e) => e.preventDefault()}
                        >
                            <Edit2 className="w-4 h-4 text-white/40" />
                            <span className="text-[13px] font-medium">Rename</span>
                        </DropdownMenuItem>
                    </RenameCharacterDialog>

                    <DeleteNodeDialog 
                        itemName="influencer" 
                        isLastNode={true}
                        onConfirm={() => removeCharacter(char.id)}
                    >
                        <DropdownMenuItem 
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 text-red-500 transition-colors"
                            onSelect={(e) => e.preventDefault()}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-[13px] font-medium">Delete</span>
                        </DropdownMenuItem>
                    </DeleteNodeDialog>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button
                asChild
                variant="studio-normal"
                size="tile"
                onClick={onClick}
                className={cn(
                    "group relative aspect-square  w-full h-full rounded-lg  outline-2 outline-blue transition-all duration-300 p-0 border-transparent cursor-pointer",
                    isActive && "border-white "
                )}
            >
                <div className="w-full h-full min-w-0 min-h-0 relative overflow-hidden bg-[#131517]">
                    {normalizedStatus === "processing" ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#131517]">
                            <div className="w-6 h-6 border-2 border-[#D4FF00]/20 border-t-[#D4FF00] rounded-full animate-spin" />
                            <span className="text-[8px] font-normal text-[#D4FF00]/70 uppercase tracking-widest">
                                Generating
                            </span>
                        </div>
                    ) : hasValidImage ? (
                        <>
                            <img
                                src={imageUrl}
                                alt={char.name}
                                className="w-full h-full object-cover"
                                onError={() => setImageError(true)}
                            />
                            <div
                                className="absolute inset-0"
                                style={{
                                    background:
                                        "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 50%)",
                                }}
                            />
                        </>
                    ) : isError ? (
                        <div 
                            className="w-full h-full flex flex-col items-start justify-center p-2 text-center" 
                            style={{ backgroundColor: "#e6483d99" }}
                        >
                            <span className="text-[13px] font-bold text-white uppercase tracking-widest leading-tight">
                                Error while <br />generating<br />character
                            </span>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#131517]">
                            <User className="w-6 h-6 text-white/20" />
                        </div>
                    )}

                    {/* Name label at bottom */}
                    <span className="absolute bottom-2 max-xl:bottom-1 left-2 max-xl:left-1 right-2 max-xl:right-1 text-sm max-xl:text-xs font-normal text-white truncate">
                        {char.name || "Untitled"}
                    </span>
                </div>
            </Button>
        </div>
    )
}
