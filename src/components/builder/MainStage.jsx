"use client"

import * as React from "react"
/** @jsxImportSource react */
import { useStudioStore } from "@/store/useStudioStore"
import { Sparkles, Plus, Image as ImageIcon, Zap, User, AlertCircle, RefreshCcw, ChevronRight, Heart, MoreVertical, Video, Download, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageViewerDialog } from "@/components/studio/dialogs/ImageViewerDialog"
import AnglesPanel from "./Angles"

// ─── Image-only node box (vertical column, no text) ──────────────────────────
const NodeCard = React.memo(function NodeCard({ node, childrenMap, activeNodeId, selectNode }) {
    const isActive = activeNodeId === node.id
    const children = childrenMap[node.id] || []
    const rawStatus = node.status
    console.log(node)
    const status =
        rawStatus === "processing"
            ? "processing"
            : rawStatus === "completed"
                ? "completed"
                : rawStatus === "failed" || rawStatus === "error"
                    ? "error"
                    : "error" // treat null/unknown as error

    return (
        <>
            <div className="w-12 h-12 shrink-0">
                <Button
                    variant="studio-node-thumb"
                    size="tile"
                    onClick={() => selectNode(node.id)}
                    className={cn(
                        "flex items-stretch justify-stretch w-12! h-12!",
                        isActive
                            ? "border-[#D4FF00] shadow-[0_0_10px_rgba(212,255,0,0.6)] z-10"
                            : "border-white/10 opacity-30 hover:opacity-80 hover:border-white/30"
                    )}
                >
                    <div className="relative w-full h-full min-w-0 min-h-0">
                        {status === "completed" && node.image_url ? (
                            <img src={node.image_url} alt="" className="w-full h-full object-cover" />
                        ) : status === "processing" ? (
                            <div className="w-full h-full bg-[#131517] relative overflow-hidden rounded-[10px]">
                                <div className="absolute inset-0 bg-[#131517]" />
                                <div className="absolute inset-0 bg-linear-to-t from-[#131517]/50 via-[#131517]/30 to-transparent" />
                            </div>
                        ) : (
                            /* ── Error State f Node List — Red background, no icon ── */
                            <div 
                                className="w-full h-full" 
                                style={{ backgroundColor: "#e6483d99" }}
                            />
                        )}
                        {isActive && <div className="absolute inset-0 bg-[#D4FF00]/10 pointer-events-none" />}
                    </div>
                </Button>
            </div>

            {/* Children — same column, below */}
            {children.map(child => (
                <NodeCard
                    key={child.id}
                    node={child}
                    childrenMap={childrenMap}
                    activeNodeId={activeNodeId}
                    selectNode={selectNode}
                />
            ))}
        </>
    )
})

// ─── Empty State Portrait (shown when no character is active) ─────────────────
function EmptyPortrait() {
    return (
        <div className="rounded-[20px] shadow-2xl relative flex-1 min-h-0 aspect-[9/16]" style={{ background: "rgba(28, 30, 32, 0.48)" }}>
            <div className="size-full bg-[#1C1E207A] rounded-[20px] flex flex-col items-center justify-center relative pointer-events-none cursor-default">
                <span 
                    className="rounded-full p-3 mb-6 border border-white/10" 
                    style={{ 
                        background: "rgba(255, 255, 255, 0.02)", 
                        boxShadow: "rgba(0, 0, 0, 0) 0px 128.852px 36.007px 0px, rgba(0, 0, 0, 0.01) 0px 82.429px 33.031px 0px, rgba(0, 0, 0, 0.05) 0px 46.422px 27.972px 0px, rgba(0, 0, 0, 0.09) 0px 20.533px 20.533px 0px, rgba(0, 0, 0, 0.1) 0px 5.059px 11.308px 0px, rgba(185, 185, 185, 0.16) 0px -1px 4px 0px inset", 
                        backdropFilter: "blur(3.73164px)" 
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/40">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3 4.75C3 3.7835 3.7835 3 4.75 3H19.25C20.2165 3 21 3.7835 21 4.75V19.25C21 20.2165 20.2165 21 19.25 21H4.75C3.7835 21 3 20.2165 3 19.25V4.75ZM4.75 4.5C4.61193 4.5 4.5 4.61193 4.5 4.75V14.4393L6.76256 12.1768C7.44598 11.4934 8.55402 11.4934 9.23744 12.1768L16.5607 19.5H19.25C19.3881 19.5 19.5 19.3881 19.5 19.25V4.75C19.5 4.61193 19.3881 4.5 19.25 4.5H4.75Z" fill="currentColor"></path>
                        <path d="M13.4255 8.53727C13.4738 8.51308 13.5131 8.47385 13.5373 8.42546L14.2764 6.94721C14.3685 6.76295 14.6315 6.76295 14.7236 6.94721L15.4627 8.42546C15.4869 8.47385 15.5262 8.51308 15.5745 8.53727L17.0528 9.27639C17.237 9.36852 17.237 9.63148 17.0528 9.72361L15.5745 10.4627C15.5262 10.4869 15.4869 10.5262 15.4627 10.5745L14.7236 12.0528C14.6315 12.237 14.3685 12.237 14.2764 12.0528L13.5373 10.5745C13.5131 10.5262 13.4738 10.4869 13.4255 10.4627L11.9472 9.72361C11.763 9.63148 11.763 9.36852 11.9472 9.27639L13.4255 8.53727Z" fill="currentColor"></path>
                    </svg>
                </span>
                <p className="text-sm font-normal text-white/50 text-center">
                    Your AI influencer lives here.<br />
                    Design and build your AI influencer<br />
                    from scratch
                </p>
            </div>
            <div className="z-20 absolute inset-x-0 bottom-0"></div>
        </div>
    )
}

// ─── Main Stage ───────────────────────────────────────────────────────────────
export function MainStage() {
    const {
        nodes, activeNodeId, activeCharacterId, stagedDna,
        createCharacter, selectCharacter, setIsCreating,
        creationPrompt, setCreationPrompt, creationTab, setCreationTab,
        randomizeDna,
        editActiveNode, selectNode, getFullContext,
        removeCharacter, regenerateNode, characters,
        updateStagedDna
    } = useStudioStore()

    const activeCharacter = React.useMemo(() => 
        characters.find(c => c.id === activeCharacterId),
        [characters, activeCharacterId]
    )

    const [instruction, setInstruction] = React.useState("")
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [showAngles, setShowAngles] = React.useState(false)
    const inputRef = React.useRef(null)

    const handleCreateCharacter = async (e) => {
        if (e) e.preventDefault()
        if (isGenerating) return
        
        setIsGenerating(true)
        try {
            const finalName = `New Character ${Date.now().toString().slice(-4)}`
            
            const charId = await createCharacter(
                finalName, 
                stagedDna, 
                creationTab === "prompt" ? creationPrompt : ""
            )
            
            if (charId) {
                await selectCharacter(charId)
                setIsCreating(false)
            }
        } catch (error) {
            console.error("Failed to generate character:", error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleRandomize = () => {
        // Randomize DNA traits only
        randomizeDna()
        setCreationTab("builder")
    }

    const handleDelete = async () => {
        if (!activeCharacterId) return
        if (confirm("Are you sure you want to delete this character?")) {
            await removeCharacter(activeCharacterId)
            selectCharacter(null)
        }
    }

    const handleRegenerate = async () => {
        if (!activeCharacterId || !activeNodeId) return
        setIsGenerating(true)
        try {
            await regenerateNode(activeNodeId)
        } catch (error) {
            console.error("Regenerate failed:", error)
        } finally {
            setIsGenerating(false)
        }
    }

    const activeNode = nodes[activeNodeId]
    const rawViewStatus = activeNode?.status
    const viewStatus =
        rawViewStatus === "processing"
            ? "processing"
            : rawViewStatus === "completed"
                ? "completed"
                : rawViewStatus === "failed" || rawViewStatus === "error"
                    ? "error"
                    : "error"

    // Heritage path for the "Gen X" badge
    const heritagePath = React.useMemo(() => {
        if (!activeNodeId) return []
        const { path } = getFullContext(activeNodeId)
        return path
    }, [activeNodeId, nodes, getFullContext])

    // Context tags derived from stagedDna
    const contextTags = React.useMemo(() => {
        if (!stagedDna) return []
        const core = stagedDna.identity_dna?.core || stagedDna
        const list = [
            core.character_type,
            core.gender,
            core.ethnicity,
            core.age_stage,
            core.eye_color,
            stagedDna.style_dna?.rendering_style
        ].filter(v => v && v !== "" && v !== "None")

        return list.map(v => Array.isArray(v) ? v[0] : v)
    }, [stagedDna])

    // Heritage tree data + flat list (newest generated at top)
    const { characterNodes, childrenMap, roots, nodesNewestFirst } = React.useMemo(() => {
        const allNodes = Object.values(nodes)
        const characterNodes = allNodes.filter(n => n.character_id === activeCharacterId)
        const childrenMap = {}
        characterNodes.forEach(node => {
            if (!childrenMap[node.id]) childrenMap[node.id] = []
            if (node.parent_id) {
                if (!childrenMap[node.parent_id]) childrenMap[node.parent_id] = []
                childrenMap[node.parent_id].push(node)
            }
        })
        Object.keys(childrenMap).forEach(id => {
            childrenMap[id].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        })
        const roots = characterNodes.filter(n => !n.parent_id)
        roots.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        const nodesNewestFirst = [...characterNodes].sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        )
        return { characterNodes, childrenMap, roots, nodesNewestFirst }
    }, [nodes, activeCharacterId])

    const handleGenerate = async () => {
        if (isGenerating || activeNode?.status === "processing") return
        setIsGenerating(true)
        await editActiveNode(instruction.trim())
        setInstruction("")
        setIsGenerating(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate() }
    }

    const canGenerate = activeCharacterId && (!activeNode || (activeNode.status !== "processing" && activeNode.status !== "failed" && activeNode.status !== "error"))

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0F1113] relative">
            {/* ── Grid Background Layer ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="bg-grid-perspective opacity-40" />
                <div className="absolute inset-0 bg-radial-to-b from-transparent via-[#0F1113]/20 to-[#0F1113]" />
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer { 
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}} />

            {/* Main Stage Container (Fixed Viewport) */}
            <div className="flex-1 flex flex-col items-center p-6 min-h-0 bg-[#0F1113]">

                {/* ── Visual Section: History + Current Image ── */}
                <div className="flex-1 w-full flex items-start justify-center min-h-0 gap-3">

                    {/* Heritage Mini-Strip — flat list, newest generated at top */}
                    <div className="flex h-[90%] flex-col gap-2 py-4 px-2 shrink- max-h-[740px] items-center overflow-y-auto scrollbar-hide w-12">
                        {!activeCharacterId
                            ? /* Ghost placeholders when no character */ (
                                [...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-12 h-12 rounded-[10px] border border-white/5 bg-white/[0.02] shrink-0"
                                        style={{ opacity: 0.15 - i * 0.03 }}
                                    />
                                ))
                            )
                            : nodesNewestFirst.map((node) => (
                                <NodeCard
                                    key={node.id}
                                    node={node}
                                    childrenMap={{}}
                                    activeNodeId={activeNodeId}
                                    selectNode={selectNode}
                                />
                            ))
                        }
                    </div>

                    {/* Portrait + Input Container (flex column) */}
                    <div className="flex flex-col items-center gap-4 h-full min-h-0 w-full max-w-[420px]">

                        {/* Portrait Container */}
                        {!activeCharacterId ? (
                            /* ── Empty state — same container shape as real portrait ── */
                            <EmptyPortrait />
                        ) : (
                            /* ── Real portrait ── */
                            <ImageViewerDialog nodeId={activeNodeId}>
                                <div className="relative flex-1 min-h-0 aspect-[9/16] rounded-lg overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] bg-[#1C1E207A] group/portrait h-full">
                                    {viewStatus === "completed" ? (
                                        activeNode?.image_url ? (
                                            <img src={activeNode.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
                                                <ImageIcon className="w-8 h-8 text-white/5" />
                                                <span className="text-[10px] font-normal text-white/10 uppercase tracking-widest">Ready</span>
                                            </div>
                                        )
                                    ) : viewStatus === "processing" ? (
                                        <div className="w-full h-full bg-[#0d0d0d] flex flex-col items-center justify-center gap-4">
                                            <div className="w-10 h-10 border-4 border-[#D4FF00]/10 border-t-[#D4FF00] rounded-full animate-spin" />
                                            <span className="text-[10px] font-normal text-[#D4FF00]/60 uppercase tracking-widest">Generating...</span>
                                        </div>
                                    ) : (
                                        /* ── Error State — Red background as requested ── */
                                        <div 
                                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 p-6 text-center" 
                                            style={{ backgroundColor: "#e6483d99" }}
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <AlertCircle className="w-12 h-12 text-white/80" />
                                                <p className="text-[21px] uppercase font-bold tracking-wider text-white leading-tight">
                                                    Error while generating<br/>character...
                                                </p>
                                            </div>

                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRegenerate();
                                                }}
                                                disabled={isGenerating}
                                                className="h-12 px-8 rounded-xl bg-white text-black hover:bg-white/90 transition-all uppercase font-bold tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95"
                                            >
                                                {isGenerating ? (
                                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <span>Try Again</span>
                                                        <RefreshCcw className="w-4 h-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {/* Top-left status badges */}
                                    {(activeNode?.image_url || viewStatus === "processing") && (
                                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                                            {activeNode?.image_url && (
                                                <span className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-mono tracking-widest uppercase text-white/80">
                                                    Generated
                                                </span>
                                            )}
                                            {viewStatus === "processing" && (
                                                <span className="px-2 py-1 rounded-lg bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-[10px] font-mono tracking-widest uppercase text-blue-300 flex items-center gap-1">
                                                    <span className="inline-block w-3 h-3 border-2 border-blue-300/40 border-t-blue-300 rounded-full animate-spin" />
                                                    Loading
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Global bottom gradient overlay (Always present on top of images) */}
                                    <div
                                        className="absolute inset-0 z-10 pointer-events-none"
                                        style={{
                                            background:
                                                "linear-gradient(0deg, rgba(0, 0, 0, 0.7) -10.87%, rgba(0, 0, 0, 0) 49.91%)",
                                        }}
                                    />

                                    {/* Top Actions Overlay (Only if completed) */}
                                    {viewStatus === "completed" && (
                                        <div className="absolute top-5 right-5 flex flex-col gap-2 opacity-0 group-hover/portrait:opacity-100 transition-opacity duration-300 z-20">
                                            <Button 
                                                variant="studio-overlay-icon" 
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowAngles(true);
                                                }}
                                            >
                                                <Video className="w-4 h-4" />
                                            </Button>
                                            <Button variant="studio-overlay-icon" size="icon">
                                                <Heart className="w-4 h-4" />
                                            </Button>
                                            <Button variant="studio-overlay-icon" size="icon">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button variant="studio-overlay-icon" size="icon">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </ImageViewerDialog>
                        )}

                        {/* ── Control Section: Input + Button ── */}
                        <div className="w-full shrink-0">
                            {!activeCharacterId ? (
                                /* ── Empty State Form (Provided UI) ── */
                                <form onSubmit={handleCreateCharacter} className="w-full flex items-center gap-2.5">
                                    <Button
                                        type="button"
                                        variant="studio-normal"
                                        className="grid items-center justify-center w-14 h-14 rounded-xl bg-[#1C1E207A] border border-white/5 text-white/40 pb-0.5 shadow-[inset_0px_-3px_rgba(0,0,0,0.43)] transition hover:opacity-80 active:opacity-60"
                                        onClick={handleRandomize}
                                    >
                                        <svg className="w-5 h-5" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.75 18.1875H4.39152C4.65663 18.1875 4.91089 18.0822 5.09841 17.8948L15.9571 7.04268C16.1447 6.85527 16.3989 6.75 16.664 6.75H20.5M2.75 5.75H4.33579C4.601 5.75 4.85536 5.85536 5.04289 6.04289L8.5 9.5M20.5 17.1562H16.5304C16.2622 17.1562 16.0052 17.0485 15.8172 16.8573L13.5 14.5M18.25 3.75L21.25 6.75L18.25 9.75M18.1667 14.0625L21.25 17.1562L18.1667 20.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        </svg>
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={isGenerating || (creationTab === "prompt" && !creationPrompt.trim())}
                                        className="flex-1 h-14 rounded-xl bg-[#D4FF00] text-black font-normal uppercase tracking-widest shadow-[inset_0px_-3px_rgba(0,0,0,0.43)] hover:bg-[#E5FF4D] flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        <span className="flex items-center gap-2">
                                            {isGenerating ? "Generating..." : "Generate Influencer"}
                                            {!isGenerating && (
                                                <div className="flex items-center gap-1">
                                                    <Sparkles className="w-4 h-4 fill-black" />
                                                    <span className="text-[10px] opacity-60">2</span>
                                                </div>
                                            )}
                                        </span>
                                    </Button>
                                </form>
                            ) : viewStatus === "error" ? (
                                /* ── Error State Actions ── */
                                <div className="w-full flex items-center gap-3">
                                    <Button
                                        onClick={handleDelete}
                                        variant="studio-normal"
                                        className="flex-1 h-14 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all uppercase font-medium tracking-widest text-xs flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete</span>
                                    </Button>
                                    <Button
                                        onClick={handleRegenerate}
                                        disabled={isGenerating}
                                        className="flex-[2] h-14 rounded-xl bg-[#D4FF00] text-black hover:bg-[#E5FF4D] transition-all uppercase font-bold tracking-widest text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,255,0,0.15)]"
                                    >
                                        {isGenerating ? (
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Regenerate</span>
                                                <RefreshCcw className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                /* ── Active State Form (EDIT) ── */
                                <div
                                    className={cn(
                                        "w-full flex items-center justify-center gap-3 py-[9.5px] px-3 rounded-[20px] cursor-text transition border border-white/10 focus-within:ring-1 focus-within:ring-white focus-within:shadow-[0px_0px_0px_4px_rgba(99,99,99,1.00)]",
                                        !canGenerate && "opacity-50 grayscale pointer-events-none"
                                    )}
                                    style={{
                                        background:
                                            "linear-gradient(115deg, rgba(36, 43, 50, 0.12) 27.54%, rgba(219, 219, 219, 0.12) 85.5%), rgba(15, 17, 19, 0.96)",
                                        backdropFilter: "blur(10.45px)",
                                    }}
                                >
                                    <Textarea
                                        ref={inputRef}
                                        value={instruction}
                                        onChange={(e) => setInstruction(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type to customize character"
                                        disabled={!canGenerate || isGenerating}
                                        className="flex-1 bg-transparent border-0 text-base text-white/90 placeholder:text-white/40 outline-none px-1 py-0 min-h-[24px] max-h-[80px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none ring-0 scrollbar-hide"
                                    />

                                    <Button
                                        onClick={handleGenerate}
                                        disabled={!instruction.trim() || isGenerating || !canGenerate}
                                        variant="studio-neon"
                                        className="h-[34px] sm:h-[47px] px-4 py-2 sm:px-6 sm:py-3 rounded-xl flex items-center gap-1 shrink-0 uppercase font-bold transition-transform"
                                    >
                                        {isGenerating ? (
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            <>
                                            <span className="text-[11px] font-normal uppercase tracking-widest">EDIT</span>
                                            <Sparkles className="w-4 h-4 fill-black" />
                                            <span className="text-[11px] font-normal opacity-60">2</span>
                                        </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Angles Panel Overlay ── */}
            {showAngles && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-[440px] max-h-[90vh] shadow-2xl overflow-hidden rounded-2xl border border-white/10">
                        <AnglesPanel 
                            onClose={() => setShowAngles(false)} 
                            previewImageUrl={activeNode?.image_url}
                            onGenerate={async (cameraData) => {
                                 setShowAngles(false);
                                 if (isGenerating || activeNode?.status === "processing") return;
                                 setIsGenerating(true);
                                 
                                 // Update camera DNA in stagedDna before generating
                                 updateStagedDna("camera_dna.rotation", cameraData.rotation);
                                 updateStagedDna("camera_dna.tilt", cameraData.tilt);
                                 updateStagedDna("camera_dna.zoom", cameraData.zoom);
                                 
                                 await editActiveNode("Update camera angle");
                                 setIsGenerating(false);
                             }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
