"use client"

import { useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useMediaLibrary } from "@/features/media/model/useMediaLibrary";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";

export function NavbarImportButton() {
  const { selectedProjectId: projectId, activeSessionId, activeStudioTab } = useGenerationsStore();
  const fileInputRef = useRef(null);
  const lib = useMediaLibrary(projectId);

  if (activeStudioTab !== 'generations') return null;

  const handleClick = () => {
    if (!projectId) return;
    fileInputRef.current?.click();
  };
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    try {
        await lib.handleUpload(files, activeSessionId);
    } catch (err) {
        console.error("Batch upload failed in Navbar:", err);
    }
    
    // Reset the input so the same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*,video/mp4,video/webm"
      />
      
      <button
        type="button"
        onClick={handleClick}
        disabled={lib.loading || !projectId}
        className="size-11 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 transition-all border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        title={projectId ? "Upload Media" : "Project is still loading"}
      >
        {lib.loading ? (
            <Loader2 className="size-6 animate-spin text-white/40" />
        ) : (
            <Plus className="size-6 " strokeWidth={3}  />
        )}
      </button>
    </>
  );
}
