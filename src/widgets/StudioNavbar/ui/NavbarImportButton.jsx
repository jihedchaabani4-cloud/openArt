"use client";

import { useRef, useState } from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { useUploadMedia } from "@/features/media";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import { CreateCollectionDialog } from "@/widgets/dialogs/CreateCollectionDialog";

export function NavbarImportButton() {
  const { selectedProjectId: projectId, activeStudioTab } = useGenerationsStore();
  const fileInputRef = useRef(null);
  const { uploadMedia, isUploading, folderId, collectionId } = useUploadMedia();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);

  if (activeStudioTab !== "assets" && activeStudioTab !== "generations") return null;

  const handleUploadClick = () => {
    setDropdownOpen(false);
    if (!projectId) return;
    fileInputRef.current?.click();
  };

  const handleCreateCollectionClick = () => {
    setDropdownOpen(false);
    setCreateCollectionOpen(true);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    try {
      await uploadMedia(files, { folderId, collectionId });
    } catch (err) {
      console.error("Batch upload failed in Navbar:", err);
    } finally {
      // Reset the input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isUploading || !projectId}
            variant="studio-ghost"
            size="icon"
            title={projectId ? "Add or Upload" : "Project is still loading"}
          >
            {isUploading ? (
              <GoogleIcon iconName="progress_activity" className="text-[13px] animate-spin text-white/40" />
            ) : (
              <GoogleIcon iconName="add" className="text-[13px]" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-52 p-1.5 flex flex-col gap-0.5 font-sans"
        >
          <DropdownMenuItem
            onClick={handleUploadClick}
            className="flex items-center gap-2.5 cursor-pointer py-2 px-2.5 rounded-[12px] hover:bg-white/10 text-white min-h-[40px]"
          >
            <GoogleIcon iconName="upload" className="text-[18px] text-white/80" />
            <span className="text-[13px] font-medium">Upload media</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleCreateCollectionClick}
            className="flex items-center gap-2.5 cursor-pointer py-2 px-2.5 rounded-[12px] hover:bg-white/10 text-white min-h-[40px]"
          >
            <GoogleIcon iconName="create_new_folder" className="text-[18px] text-white/80" />
            <span className="text-[13px] font-medium">Create collection</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateCollectionDialog
        open={createCollectionOpen}
        onOpenChange={setCreateCollectionOpen}
        projectId={projectId}
      />
    </>
  );
}
