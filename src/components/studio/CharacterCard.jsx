import * as React from "react"
import { User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function CharacterCard({ char, isActive, onClick }) {
    const [imageError, setImageError] = React.useState(false)
    const isError = char.status === "failed" || char.status === "error" || imageError

    return (
        <div className="w-full aspect-square flex-none">
            <Button
                asChild
                variant="studio-normal"
                onClick={onClick}
                className={cn(
                    "w-full h-full rounded-2xl overflow-hidden border-2 transition-all duration-300 focus:outline-none p-0 hover:bg-transparent",
                    isActive
                        ? "border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.03]"
                        : "border-white/5 opacity-80 hover:opacity-100 hover:border-white/20"
                )}
            >
                <div className="w-full h-full relative overflow-hidden bg-[#0d0d0d]">
                    {isError ? (
                        <div className="w-full h-full bg-[#5A2020] flex flex-col items-center justify-center p-3 text-center transition-all">
                            <span className="text-[8px] font-black text-white/70 uppercase leading-relaxed tracking-widest flex flex-col items-center">
                                <span className="text-[10px] mb-1 opacity-40">ERROR</span>
                                <span>WHILE</span>
                                <span>LOADING</span>
                                <span>THE MEDIA...</span>
                            </span>
                            <div className="absolute bottom-2.5 left-2.5 right-2 text-left">
                                <span className="text-[9px] font-black text-white/40 truncate block uppercase">
                                    {char.name}
                                </span>
                            </div>
                        </div>
                    ) : char.status === "completed" && char.imageUrl ? (
                        <>
                            <img
                                src={char.imageUrl}
                                alt={char.name}
                                className="w-full h-full object-cover"
                                onError={() => setImageError(true)}
                            />
                            {/* Bottom Gradient Overlay */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

                            {/* Name Overlay */}
                            <div className="absolute bottom-2.5 left-2.5 right-2">
                                <span className="text-[10px] font-black text-white/90 truncate block uppercase tracking-wide">
                                    {char.name}
                                </span>
                            </div>
                        </>
                    ) : char.status === "processing" ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#111]">
                            <div className="w-5 h-5 border-2 border-white/5 border-t-white/40 rounded-full animate-spin" />
                            <div className="absolute bottom-2 left-2 right-2">
                                <span className="text-[8px] font-black text-white/20 uppercase truncate block">
                                    {char.name}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                            <User className="w-6 h-6 text-white/5" />
                        </div>
                    )}
                </div>
            </Button>
        </div>
    )
}
