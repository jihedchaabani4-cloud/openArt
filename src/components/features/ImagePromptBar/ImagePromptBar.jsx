import React, { useState, useRef, useMemo } from "react";
import { ModelSelector, MODELS as STUDIO_MODELS } from "../ModelSelector/ModelSelector";
import { useStudioStore } from "@/store/useStudioStore";
import { useCinemaStore } from "@/store/useCinemaStudioStore"; // Multi-modal store
import { api } from "@/lib/api";
import { X, Image as ImageIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16", "2:3", "3:2", "21:9"];
const RESOLUTIONS = ["2K", "4K"];

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path d="M11.8525 4.21651L11.7221 3.2387C11.6906 3.00226 11.4889 2.82568 11.2504 2.82568C11.0118 2.82568 10.8102 3.00226 10.7786 3.23869L10.6483 4.21651C10.2658 7.0847 8.00939 9.34115 5.14119 9.72358L4.16338 9.85396C3.92694 9.88549 3.75037 10.0872 3.75037 10.3257C3.75037 10.5642 3.92694 10.7659 4.16338 10.7974L5.14119 10.9278C8.00938 11.3102 10.2658 13.5667 10.6483 16.4349L10.7786 17.4127C10.8102 17.6491 11.0118 17.8257 11.2504 17.8257C11.4889 17.8257 11.6906 17.6491 11.7221 17.4127L11.8525 16.4349C12.2349 13.5667 14.4913 11.3102 17.3595 10.9278L18.3374 10.7974C18.5738 10.7659 18.7504 10.5642 18.7504 10.3257C18.7504 10.0872 18.5738 9.88549 18.3374 9.85396L17.3595 9.72358C14.4913 9.34115 12.2349 7.0847 11.8525 4.21651Z" />
  </svg>
);

const RatioIcon = ({ ratio }) => {
  const parts = ratio.split(":").map(Number);
  const w = parts[0], h = parts[1];
  const scale = 10;
  const rectW = Math.min(w * scale, 140);
  const rectH = Math.min(h * scale, 140);
  return (
    <svg width={rectW} height={rectH} viewBox={`0 0 ${rectW} ${rectH}`} fill="none">
      <rect x="1" y="1" width={rectW - 2} height={rectH - 2} rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

export default function ImagePromptBar({ hideBackground = false }) {
  const { 
    selectedNodeId, nodes, setNodeSelection, clearNodeSelection,
    editActiveNode, selectNode, activeWorkspaceId
  } = useStudioStore()

  const { 
    fetchAssets, fetchGenerations, allGenerations, generations,
    fetchAllGenerations, allGenerationsLoading, allGenerationsHasMore
  } = useCinemaStore();

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (libraryTab === "all" && allGenerationsHasMore && !allGenerationsLoading) {
        fetchAllGenerations();
      }
    }
  };

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(STUDIO_MODELS[0]);
  const [resolution, setResolution] = useState("2K");
  const [ratio, setRatio] = useState("3:4");
  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [showResMenu, setShowResMenu] = useState(false);
  const [showStrengthMenu, setShowStrengthMenu] = useState(false);
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState("workspace"); // "workspace", "all", "liked"
  const [isOver, setIsOver] = useState(false);

  const filteredLibrary = useMemo(() => {
    if (libraryTab === "liked") return allGenerations.filter(g => g.is_Like);
    if (libraryTab === "workspace") return generations;
    return allGenerations;
  }, [allGenerations, generations, libraryTab]);

  const handleSelectFromLibrary = (imageUrl) => {
    if (referenceImages.length >= 4) {
      alert("You can only add up to 4 reference images.");
      return;
    }
    setReferenceImages(prev => [...prev, imageUrl]);
    setShowAssetLibrary(false);
  };

  // Reference Image States
  const [referenceImages, setReferenceImages] = useState([]); // array of base64 strings
  const [strength, setStrength] = useState(0.75);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 4 - referenceImages.length;
    if (remainingSlots <= 0) {
      alert("You can only add up to 4 reference images.");
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    filesToUpload.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImages(prev => {
          if (prev.length >= 4) return prev;
          return [...prev, reader.result];
        });
      };
      reader.readAsDataURL(file);
    });
    setShowAssetLibrary(false);
  };

  const handleRemoveReference = (index) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearReferences = () => {
    setReferenceImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    clearNodeSelection();
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || generating) return;
    
    setGenerating(true);
    try {
      // 1. If we have a selected node (Character Node), use the character edit API
      if (selectedNodeId && referenceImages.length === 0) {
        await editActiveNode(prompt, selectedNodeId);
      } else {
        // 2. Otherwise, use the NEW general image generation API
        const res = await api.post("/images/generate", {
          prompt,
          workspace_id: activeWorkspaceId,
          ratio,
          quality: resolution,
          count,
          image_base64: referenceImages[0] || null, // Send first for backward compatibility
          images_base64: referenceImages, // Send all references
          strength: strength,
          edit_type: referenceImages.length > 0 ? "img2img" : "txt2img"
        });
        
        if (res.ok) {
          // Refresh gallery and history
          if (activeWorkspaceId) {
            fetchAssets(activeWorkspaceId);
            fetchGenerations(activeWorkspaceId);
          }
        } else {
          throw new Error(res.message);
        }
      }
      
      // Clear after success
      setPrompt("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      clearNodeSelection();
    } catch (error) {
      console.error("❌ Generation failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);

    // 1. Check if it's an image URL being dropped (priority)
    const imageUrl = e.dataTransfer.getData("imageUrl");
    if (imageUrl) {
      handleSelectFromLibrary(imageUrl);
      return;
    }

    // 2. Check for character node drop
    const nodeId = e.dataTransfer.getData("nodeId");
    if (nodeId) {
      setNodeSelection(nodeId);
      // Sync with the store's active node so editActiveNode works on this node
      selectNode(nodeId);
    }
  };

  const Pill = ({ children, onClick, active }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "0 12px",
        height: "36px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        color: "rgba(255,255,255,0.85)",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background 0.15s",
        fontFamily: "inherit",
        position: "relative",
      }}
    >
      {children}
    </button>
  );

  const Dropdown = ({ value, options, onChange, show, setShow, renderOption, renderValue }) => (
    <div style={{ position: "relative" }}>
      <Pill onClick={() => setShow(!show)} active={show}>
        {renderValue ? renderValue(value) : value}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, transform: show ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
          <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Pill>
      {show && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "12px",
          padding: "6px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          zIndex: 100,
          minWidth: "120px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setShow(false); }}
              style={{
                padding: "7px 12px",
                borderRadius: "8px",
                border: "none",
                background: opt === value ? "rgba(255,255,255,0.1)" : "transparent",
                color: opt === value ? "white" : "rgba(255,255,255,0.65)",
                fontSize: "13px",
                fontWeight: opt === value ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "background 0.1s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {renderOption ? renderOption(opt) : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: hideBackground ? "auto" : "100vh",
      background: hideBackground ? "transparent" : "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      padding: hideBackground ? "0" : "24px",
    }}>
      {/* Demo backdrop */}
      {!hideBackground && (
        <div style={{
          position: "fixed", inset: 0,
          background: "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(90,60,200,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
      )}

      <div style={{ width: "100%", maxWidth: "780px", position: "relative" }}>
        {/* The bar */}
        <div
          style={{
            borderRadius: "20px",
            padding: "2px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.07) 100%)",
          }}
        >
          <form
            onSubmit={handleGenerate}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              background: isOver ? "rgba(255,255,255,0.05)" : "rgba(15,15,18,0.97)",
              borderRadius: "18px",
              padding: "16px 18px",
              backdropFilter: "blur(20px)",
              border: isOver ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.07)",
              transition: "all 0.2s ease-in-out",
            }}
          >
            {/* References row removed from here */}

            {/* Container for the prompt bar and overlay library */}
            <div style={{ position: "relative", width: "100%" }}>
              {/* Asset Library Panel (Floating Above) */}
              {showAssetLibrary && (
                <div 
                  className="absolute -top-3 w-full -translate-y-full"
                  style={{ 
                    zIndex: 100,
                    opacity: 1, 
                    display: "block",
                    animation: "in-from-bottom 0.2s ease-out"
                  }}
                >
                  <div 
                    className="rounded-[24px] backdrop-blur-[40px] shadow-[0_20px_40px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(25,25,25,0.9)_0%,rgba(15,15,15,0.95)_100%)] w-full max-h-[400px] overflow-hidden flex flex-col border border-white/5"
                  >
                    {/* Header with Tabs */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-full">
                        {[
                          { id: "workspace", label: "Workspace" },
                          { id: "all", label: "All Generations" },
                          { id: "liked", label: "Liked" }
                        ].map(tab => (
                          <button 
                            key={tab.id}
                            type="button" 
                            onClick={() => setLibraryTab(tab.id)}
                            className={cn(
                              "text-[11px] font-bold px-4 py-1.5 rounded-full transition-all duration-200 uppercase tracking-wider",
                              libraryTab === tab.id 
                                ? "bg-white text-black shadow-lg" 
                                : "text-white/40 hover:text-white/60 hover:bg-white/5"
                            )}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => setShowAssetLibrary(false)}
                        className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Content Grid (Masonry Style) */}
                    <div 
                      onScroll={handleScroll}
                      className="flex-1 overflow-y-auto p-4 custom-scrollbar"
                    >
                      <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
                        {/* Upload Card */}
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="break-inside-avoid flex flex-col items-center justify-center gap-3 aspect-square rounded-lg bg-white/[0.03] border border-dashed border-white/10 hover:border-[#D4FF00]/40 hover:bg-[#D4FF00]/5 transition-all duration-300 cursor-pointer group"
                        >
                          <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#D4FF00]/10 transition-colors">
                            <Plus size={20} className="text-white/40 group-hover:text-[#D4FF00] transition-colors" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white">Upload</span>
                        </div>

                        {/* Assets */}
                        {filteredLibrary.map((item, idx) => {
                          // Determine aspect ratio class based on item params if available
                          const ratioStr = item.params?.ratio || "1:1";
                          let aspect = "aspect-square";
                          if (ratioStr === "16:9") aspect = "aspect-video";
                          else if (ratioStr === "9:16") aspect = "aspect-[9/16]";
                          else if (ratioStr === "4:3") aspect = "aspect-[4/3]";
                          else if (ratioStr === "3:4") aspect = "aspect-[3/4]";
                          else if (ratioStr === "2:3") aspect = "aspect-[2/3]";
                          else if (ratioStr === "3:2") aspect = "aspect-[3/2]";
                          else if (ratioStr === "21:9") aspect = "aspect-[21/9]";

                          return (
                            <div 
                              key={item.id || idx}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("imageUrl", item.file_url || item.asset?.file_url);
                                e.dataTransfer.effectAllowed = "copy";
                              }}
                              onClick={() => handleSelectFromLibrary(item.file_url || item.asset?.file_url)}
                              className={cn(
                                "break-inside-avoid relative rounded-lg overflow-hidden cursor-pointer group border border-white/5 hover:border-[#D4FF00]/40 transition-all duration-300",
                                aspect
                              )}
                            >
                              <img 
                                src={item.file_url || item.asset?.file_url} 
                                alt="Asset" 
                                className="size-full object-cover transition-transform duration-500 group-hover:scale-110" 
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Plus size={20} className="text-white" />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Loading indicator for pagination */}
                      {allGenerationsLoading && (
                        <div className="w-full flex justify-center py-4">
                          <div className="size-6 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Prompt input row */}
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "14px" }}>
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleImageUpload}
                />

                {/* Attach button or Image Previews */}
                <div style={{ position: "relative", flexShrink: 0, marginTop: "2px", display: "flex", gap: "6px" }}>
                  {(referenceImages.length > 0 || (selectedNodeId && nodes[selectedNodeId])) ? (
                    <>
                      {/* Show Character Node Reference if selected and no manual images */}
                      {selectedNodeId && nodes[selectedNodeId] && referenceImages.length === 0 && (
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.2)",
                          overflow: "hidden",
                          position: "relative",
                        }}>
                          <img 
                            src={nodes[selectedNodeId].image_url} 
                            alt="Node Reference" 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                          />
                          <button
                            type="button"
                            onClick={handleClearReferences}
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              width: "14px",
                              height: "14px",
                              background: "rgba(0,0,0,0.6)",
                              border: "none",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                              borderRadius: "0 0 0 4px",
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}

                      {/* Show manual reference images */}
                      {referenceImages.map((img, index) => (
                        <div key={index} style={{
                          width: "36px", height: "36px", borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.2)",
                          overflow: "hidden",
                          position: "relative",
                        }}>
                          <img 
                            src={img} 
                            alt={`Reference ${index}`} 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveReference(index)}
                            style={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              width: "14px",
                              height: "14px",
                              background: "rgba(0,0,0,0.6)",
                              border: "none",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                              borderRadius: "0 0 0 4px",
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}

                      {/* Add more button - Only show if less than 4 references */}
                      {referenceImages.length < 4 && (
                        <button
                          type="button"
                          onClick={() => {
                            fetchAllGenerations();
                            setShowAssetLibrary(!showAssetLibrary);
                          }}
                          style={{
                            width: "36px", height: "36px", borderRadius: "10px",
                            border: isOver || showAssetLibrary ? "1px solid rgba(212, 255, 0, 0.4)" : "1px solid rgba(255,255,255,0.1)",
                            background: isOver || showAssetLibrary ? "rgba(212, 255, 0, 0.1)" : "rgba(255,255,255,0.04)",
                            color: isOver || showAssetLibrary ? "#D4FF00" : "rgba(255,255,255,0.5)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          <Plus size={18} />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        fetchAllGenerations();
                        setShowAssetLibrary(!showAssetLibrary);
                      }}
                      style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        border: isOver || showAssetLibrary ? "1px solid rgba(212, 255, 0, 0.4)" : "1px solid rgba(255,255,255,0.1)",
                        background: isOver || showAssetLibrary ? "rgba(212, 255, 0, 0.1)" : "rgba(255,255,255,0.04)",
                        color: isOver || showAssetLibrary ? "#D4FF00" : "rgba(255,255,255,0.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>

                {/* Textarea */}
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe the scene you imagine..."
                  rows={1}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    color: "white",
                    fontSize: "14.5px",
                    lineHeight: "1.6",
                    fontFamily: "inherit",
                    padding: "6px 0",
                    maxHeight: "120px",
                    overflowY: "auto",
                  }}
                  onInput={e => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                />
                {!prompt && (
                  <div style={{
                    position: "absolute", top: "6px", left: 0,
                    color: "rgba(255,255,255,0.25)",
                    fontSize: "14.5px",
                    pointerEvents: "none",
                  }}>
                    Describe the scene you imagine...
                  </div>
                )}
              </div>
            </div>

            {/* Controls row */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {/* Strength selector - Only show if we have a reference image */}
              {referenceImages.length > 0 && (
                <Dropdown
                  value={`${Math.round(strength * 100)}%`}
                  options={["25%", "50%", "75%", "90%"]}
                  onChange={(v) => setStrength(parseInt(v) / 100)}
                  show={showStrengthMenu}
                  setShow={setShowStrengthMenu}
                  renderValue={(v) => (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <ImageIcon size={14} style={{ opacity: 0.6 }} />
                      {v}
                    </span>
                  )}
                />
              )}

              {/* Resolution */}
              <ModelSelector
                onChange={setModel}
                defaultId={model.id}
              />

              {/* Divider */}
              <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

              {/* Resolution */}
              <Dropdown
                value={resolution}
                options={RESOLUTIONS}
                onChange={setResolution}
                show={showResMenu}
                setShow={setShowResMenu}
                renderValue={(v) => (
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.6 }}>
                      <path d="M9.783.5c.54 0 .893-.004 1.231.079a2.5 2.5 0 0 1 .444.223c.32.137.592.351 1.005.668.707.545 1.267.975 1.677 1.36.415.39.721.773.882 1.24.131.383.18.788.144 1.19-.044.491-.253.931-.565 1.397-.308.46-.751.994-1.309 1.668L10.617 11.463c-.502.606-.913 1.104-1.29 1.444-.389.35-.806.592-1.328.593-.478-.001-.895-.243-1.284-.593-.377-.34-.788-.838-1.29-1.444L4.069 8.247c-.558-.674-1.002-1.208-1.31-1.668-.312-.466-.52-.906-.564-1.397a3.5 3.5 0 0 1 .144-1.19c.16-.467.467-.85.882-1.24.41-.385.97-.815 1.677-1.36.413-.317.685-.531 1.005-.668A2.5 2.5 0 0 1 6.348.579C6.687.496 7.039.5 7.579.5h2.204ZM6.578 1.5c-.588 0-.796.003-1 .053a1.5 1.5 0 0 0-.302.093c-.178.077-.338.196-.787.543C3.766 2.742 3.252 3.138 2.886 3.48c-.362.34-.537.59-.612.836a2.5 2.5 0 0 0-.103.592c-.023.254.078.53.347.931.273.41.677.9 1.248 1.59l1.662 2.038c.522.631.88 1.069 1.19 1.342.307.268.495.332.582.332.087 0 .275-.064.582-.332.31-.273.668-.711 1.19-1.342l1.662-2.038c.571-.69.975-1.18 1.248-1.59.27-.4.37-.677.347-.931a2.5 2.5 0 0 0-.103-.592c-.075-.246-.25-.496-.612-.836-.366-.342-.88-.738-1.603-1.291-.449-.347-.609-.466-.787-.543a1.5 1.5 0 0 0-.302-.093C9.4 1.503 9.192 1.5 8.604 1.5H6.578ZM9.082 4.167a.667.667 0 0 1 0 1.333H6.915a.667.667 0 0 1 0-1.333h2.167Z" />
                    </svg>
                    {v}
                  </span>
                )}
              />

              {/* Ratio */}
              <Dropdown
                value={ratio}
                options={RATIOS}
                onChange={setRatio}
                show={showRatioMenu}
                setShow={setShowRatioMenu}
                renderValue={(v) => (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ opacity: 0.6, fontSize: "11px" }}>
                      {(() => {
                        const [w, h] = v.split(":").map(Number);
                        const maxD = 14;
                        const rw = w >= h ? maxD : Math.round(w / h * maxD);
                        const rh = h >= w ? maxD : Math.round(h / w * maxD);
                        return (
                          <svg width={rw} height={rh} viewBox={`0 0 ${rw} ${rh}`} fill="none">
                            <rect x=".75" y=".75" width={rw - 1.5} height={rh - 1.5} rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                        );
                      })()}
                    </span>
                    {v}
                  </span>
                )}
                renderOption={(opt) => {
                  const [w, h] = opt.split(":").map(Number);
                  const maxD = 14;
                  const rw = w >= h ? maxD : Math.round(w / h * maxD);
                  const rh = h >= w ? maxD : Math.round(h / w * maxD);
                  return (
                    <>
                      <svg width={rw} height={rh} viewBox={`0 0 ${rw} ${rh}`} fill="none">
                        <rect x=".75" y=".75" width={rw - 1.5} height={rh - 1.5} rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      {opt}
                    </>
                  );
                }}
              />

              {/* Divider */}
              <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

              {/* Count stepper */}
              <div style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "0 10px", height: "36px", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
              }}>
                <button
                  type="button"
                  disabled={count <= 1}
                  onClick={() => setCount(c => Math.max(1, c - 1))}
                  style={{
                    width: "20px", height: "20px", border: "none", background: "none",
                    color: count <= 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                    cursor: count <= 1 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "inherit", fontSize: "18px", lineHeight: 1, padding: 0,
                  }}
                >−</button>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "white", minWidth: "36px", textAlign: "center" }}>
                  {count}<span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/4</span>
                </span>
                <button
                  type="button"
                  disabled={count >= 4}
                  onClick={() => setCount(c => Math.min(4, c + 1))}
                  style={{
                    width: "20px", height: "20px", border: "none", background: "none",
                    color: count >= 4 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                    cursor: count >= 4 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "inherit", fontSize: "18px", lineHeight: 1, padding: 0,
                  }}
                >+</button>
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Generate button */}
              <button
                type="submit"
                disabled={!prompt.trim() || generating}
                style={{
                  height: "36px",
                  padding: "0 18px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: generating
                    ? "rgba(255,255,255,0.05)"
                    : !prompt.trim()
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(255,255,255,0.92)",
                  color: generating || !prompt.trim() ? "rgba(255,255,255,0.3)" : "#0a0a0a",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  cursor: !prompt.trim() || generating ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {generating ? (
                  <>
                    <div style={{
                      width: "13px", height: "13px", borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.15)",
                      borderTopColor: "rgba(255,255,255,0.5)",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate
                    <span style={{ display: "flex", alignItems: "center", gap: "3px", opacity: 0.7 }}>
                      <SparkleIcon />
                      <span style={{ fontSize: "12px" }}>{count}</span>
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

        {/* Label */}
        <p style={{
          textAlign: "center",
          marginTop: "20px",
          color: "rgba(255,255,255,0.2)",
          fontSize: "12px",
          fontFamily: "inherit",
          letterSpacing: "0.04em",
        }}>
          ImagePromptBar — React Component
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder { color: transparent; }
        * { box-sizing: border-box; }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}
