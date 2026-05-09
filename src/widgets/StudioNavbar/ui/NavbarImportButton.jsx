"use client"

import { useRef } from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { useMediaLibrary } from "@/features/media/model/useMediaLibrary";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { Button } from "@/shared/ui/button";

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
      
      <Button
        onClick={handleClick}
        disabled={lib.loading || !projectId}
        variant="studio-ghost"
        size="icon"
        title={projectId ? "Upload Media" : "Project is still loading"}
      >
        {lib.loading ? (
            <GoogleIcon iconName="progress_activity" className="text-[13px] animate-spin text-white/40" />
        ) : (
            <GoogleIcon iconName="add" className="text-[13px]" />
        )}
      </Button>
    </>
  );
}
