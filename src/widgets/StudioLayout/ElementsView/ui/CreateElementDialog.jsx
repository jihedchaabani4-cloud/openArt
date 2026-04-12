"use client"

import * as React from "react"
import { Plus, X, Upload, User, Package, Palette, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

const ELEMENT_TYPES = [
  { id: "character", label: "Character", icon: User },
  { id: "prop",      label: "Prop",      icon: Package },
  { id: "product",   label: "Product",   icon: Sparkles },
  { id: "style",     label: "Style",     icon: Palette },
]

export function CreateElementDialog({ 
    isOpen, 
    onOpenChange, 
    onCreate, 
    isCreating 
}) {
    const [name, setName] = React.useState("")
    const [type, setType] = React.useState("character")
    const [preview, setPreview] = React.useState(null)
    const fileInputRef = React.useRef(null)

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setPreview(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const handleCreate = () => {
        if (name.trim()) {
            onCreate({
                name: name.trim(),
                type,
                imageUrl: preview
            })
            // Reset state
            setName("")
            setType("character")
            setPreview(null)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0C0C0C]/90 backdrop-blur-2xl border-white/10 text-white rounded-3xl sm:max-w-[480px] shadow-2xl p-0 overflow-hidden">
                <div className="p-8 space-y-8">
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                        <DialogTitle className="text-xl font-semibold tracking-tight text-white/90">
                            New Element
                        </DialogTitle>
                        <button 
                            onClick={() => onOpenChange(false)}
                            className="p-2 rounded-full hover:bg-white/5 text-white/40 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </DialogHeader>

                    <div className="space-y-8">
                        {/* ── Reference Image ── */}
                        <div className="space-y-4">
                            <label className="text-xs font-medium uppercase tracking-[0.1em] text-white/40 px-1">
                                Reference Image
                            </label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "group relative aspect-[4/3] rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden cursor-pointer",
                                    preview ? "border-white/20" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                                )}
                            >
                                {preview ? (
                                    <>
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-xs font-semibold text-white">Change Image</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/20">
                                        <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                            <Upload size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-white/80">Select reference image</p>
                                            <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1">Recommended 1024x1024</p>
                                        </div>
                                    </div>
                                )}
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        {/* ── Fields ── */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-medium uppercase tracking-[0.1em] text-white/40 px-1">
                                    Element Name
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Cyberpunk Hero"
                                    className="h-14 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 px-6 focus:ring-1 focus:ring-white/20"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-medium uppercase tracking-[0.1em] text-white/40 px-1">
                                    Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ELEMENT_TYPES.map((t) => {
                                        const Icon = t.icon
                                        const isActive = type === t.id
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => setType(t.id)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200",
                                                    isActive 
                                                        ? "bg-white text-black border-white shadow-xl scale-[1.02]" 
                                                        : "bg-white/5 border-white/5 text-white/60 hover:bg-white/[0.08] hover:text-white"
                                                )}
                                            >
                                                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                                <span className="text-[13px] font-semibold">{t.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white/5 border-t border-white/5 flex items-center gap-3">
                    <Button
                        variant="studio-normal"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-14 rounded-2xl border-none hover:bg-white/10"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!name.trim() || !preview || isCreating}
                        className={cn(
                          "flex-2 h-14 rounded-2xl px-10 transition-all font-bold tracking-tight",
                          name.trim() && preview
                            ? "bg-white text-black hover:bg-white/90 active:scale-[0.98]"
                            : "bg-white/5 text-white/20 cursor-not-allowed"
                        )}
                    >
                        {isCreating ? "Creating..." : "Create Element"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
