import * as React from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function CharacterCard({ char, tileNode = null, tileStatus, isActive, onClick }) {
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

    const isProcessing = normalizedStatus === "processing"
    const isCompleted = normalizedStatus === "completed"
    const isError = normalizedStatus === "error"
    const hasValidImage = isCompleted && !imageError && imageUrl

    return (
        <div className="w-full h-full flex-none min-w-0">
            <Button
                asChild
                variant="studio-normal"
                onClick={onClick}
                className={cn(
                    "group relative w-full h-full rounded-[24px] overflow-hidden border-2 transition-all duration-300 p-0 border-transparent cursor-pointer",
                    isActive && "border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.4)]"
                )}
            >
                <div className="w-full h-full min-w-0 min-h-0 relative overflow-hidden bg-[#131517]">
                    {isProcessing ? (
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
