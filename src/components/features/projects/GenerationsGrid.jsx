import { useGenerationsStudioStore } from '@/store/useGenerationsStudioStore'
import { cn } from '@/lib/utils'
import { Heart, Trash2, Download } from 'lucide-react'
import ImageStatusView from "@/components/skeleton/ImageStatusView"

export function GenerationsGrid() {
    const { generations, loading, toggleLike, removeGeneration, fetchAssets, fetchGenerations, projectId, activeSessionId } = useGenerationsStudioStore()

    if (loading && generations.length === 0) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>
        )
    }

    if (generations.length === 0) {
        return (
            <div className="text-center py-20 opacity-20">
                <p className="text-xl font-medium">No generations in this session yet</p>
                <p className="text-sm">Start generating to see your media here</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            {generations.map(gen => {
                const ratioStr = gen.params?.ratio || "1:1";
                let aspect = "1/1";
                if (ratioStr === "16:9") aspect = "16/9";
                else if (ratioStr === "9:16") aspect = "9/16";
                else if (ratioStr === "4:3") aspect = "4/3";
                else if (ratioStr === "3:4") aspect = "3/4";
                else if (ratioStr === "2:3") aspect = "2/3";
                else if (ratioStr === "3:2") aspect = "3/2";
                else if (ratioStr === "21:9") aspect = "21/9";

                const handleRetry = async () => {
                    if (!gen.params) return;
                    try {
                        const { api } = await import("@/lib/api");
                        const res = await api.post("/generations/generate", {
                            ...gen.params,
                            project_id: projectId,
                            session_id: activeSessionId
                        });
                        if (res.ok) {
                            removeGeneration(gen.id);
                            fetchAssets(projectId, activeSessionId);
                            fetchGenerations(projectId, activeSessionId);
                        }
                    } catch (error) {
                        console.error("❌ Retry failed:", error);
                    }
                };

                return (
                    <div key={gen.id} className="group relative bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden hover:border-[#D4FF00]/30 transition-all duration-300 shadow-xl">
                        <ImageStatusView
                            status={gen.status}
                            src={gen.file_url}
                            alt={gen.params?.prompt || ""}
                            aspect={aspect}
                            onCancel={() => removeGeneration(gen.id)}
                            onRetry={handleRetry}
                            className="w-full h-full"
                        />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => toggleLike(gen.id, gen.is_Like)}
                                className={cn(
                                    "p-2 rounded-lg backdrop-blur-md transition-all",
                                    gen.is_Like ? "bg-[#D4FF00] text-black" : "bg-black/50 text-white hover:bg-black/70"
                                )}
                            >
                                <Heart className={cn("size-4", gen.is_Like && "fill-current")} />
                            </button>
                        </div>
                        
                        <div className="flex justify-between items-center translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <button className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 backdrop-blur-md">
                                <Download className="size-4" />
                            </button>
                            <button 
                                onClick={() => removeGeneration(gen.id)}
                                className="p-2 bg-black/50 text-red-400 rounded-lg hover:bg-black/70 backdrop-blur-md"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </div>

                        {/* Badge */}
                        {gen.is_Like && (
                            <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#D4FF00] text-black text-[10px] font-bold rounded-full shadow-lg z-20">
                                LIKED
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    )
}
