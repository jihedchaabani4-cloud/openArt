import React from "react";
import { Button } from "@/shared/ui/button";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function AddReferenceButton({ 
  referenceImages, 
  selectedNodeId, 
  nodes, 
  handleClearReferences, 
  handleRemoveReference, 
  fetchAllGenerations, 
  showAssetLibrary, 
  setShowAssetLibrary, 
  isOver 
}) {
  return (
    <div className="flex gap-1.5 items-center">
      {(referenceImages.length > 0 || (selectedNodeId && nodes[selectedNodeId])) && (
        <div className="flex gap-1.5 items-center">
          {selectedNodeId && nodes[selectedNodeId] && referenceImages.length === 0 && (
            <div className="w-18 h-18 rounded-md border border-white/20 overflow-hidden relative group">
              <img src={nodes[selectedNodeId].image_url} alt="Node Reference" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={handleClearReferences} 
                className="absolute top-0 right-0 w-4 h-4 bg-black/60 flex items-center justify-center text-white cursor-pointer rounded-bl-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          )}
          {referenceImages.map((img, index) => (
            <div key={index} className="w-18 h-18 rounded-md border border-white/20 overflow-hidden relative group">
              <img src={img.url} alt={`Reference ${index}`} className="w-full h-full object-cover" />
              <Button 
                type="button" 
                onClick={() => handleRemoveReference(index)} 
                className="absolute top-0 right-0 w-8 h-8 bg-black/60 flex items-center justify-center text-white cursor-pointer rounded-bl-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {referenceImages.length < 4 && (
        <Button
          type="button" 
          variant="ghost" 
          size="icon"
          onClick={() => { fetchAllGenerations(); setShowAssetLibrary(!showAssetLibrary); }}
          className={cn(
            "w-14 h-14 rounded-md border transition-all duration-150 shrink-0", 
            isOver || showAssetLibrary ? "border-[#D4FF00]/40 bg-[#D4FF00]/10 text-[#D4FF00]" : "border-white/10 bg-white/5 text-white"
          )}
          title="Add Reference Image"
        >
          <ImagePlus size={19} />
        </Button>
      )}
    </div>
  );
}
