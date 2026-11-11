"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { useUploadMedia } from "@/features/media";
import { CreateFolderDialog } from "@/shared/ui/CreateFolderDialog";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { logger } from "@/shared/lib/logger";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";

export function NavbarImportButton() {
  const { selectedProjectId: projectId, activeStudioTab, setActiveCollectionId } = useGenerationsStore();
  const fileInputRef = useRef(null);
  const pathname = usePathname();

  // NavbarImportButton lives inside the [projectId] layout — useParams() never sees [collectionId].
  // Extract it from the pathname directly: /cinema-studio/[pid]/collection/[cid]
  const collectionMatch = pathname?.match(/\/collection\/([^/]+)/);
  const currentCollectionId = collectionMatch ? collectionMatch[1] : null;

  const { uploadMedia, isUploading } = useUploadMedia();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  if (activeStudioTab !== "assets" && activeStudioTab !== "generations" && activeStudioTab !== "collection") return null;

  const handleUploadClick = () => {
    setDropdownOpen(false);
    if (!projectId) return;
    fileInputRef.current?.click();
  };

  const handleCreateCollectionClick = () => {
    setDropdownOpen(false);
    if (!projectId) return;
    setIsCreateFolderOpen(true);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    try {
      await uploadMedia(files, {
        collectionId: currentCollectionId,
        folderId: currentCollectionId,
      });
    } catch (err) {
      logger.error("navbar_batch_upload_failed", { message: err?.message });
      toast.error(err.message || "Batch upload failed");
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
            variant="ghost"
            className="size-8 sm:size-9 max-h-full p-0 aspect-square text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-5)] rounded-[var(--r-sm)]"
            title={projectId ? "Add or Upload" : "Project is still loading"}
          >
            {isUploading ? (
              <GoogleIcon iconName="progress_activity" className="text-[13px] animate-spin text-[var(--text-tertiary)]" />
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
            className="flex items-center gap-3 cursor-pointer pl-3 pr-4 py-2 hover:bg-[var(--overlay-5)] text-[var(--text-primary)] min-h-[2.125rem] text-[14px] leading-5 font-medium transition-colors duration-100 ease-in-out"
          >
            <GoogleIcon iconName="upload" className="text-[20px] text-[var(--text-secondary)] shrink-0" />
            <span className="font-medium">Upload media</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleCreateCollectionClick}
            disabled={!projectId}
            className="flex items-center gap-3 cursor-pointer pl-3 pr-4 py-2 hover:bg-[var(--overlay-5)] text-[var(--text-primary)] min-h-[2.125rem] text-[14px] leading-5 font-medium transition-colors duration-100 ease-in-out"
          >
            <GoogleIcon iconName="create_new_folder" className="text-[20px] text-[var(--text-secondary)] shrink-0" />
            <span className="font-medium">Create collection</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        projectId={projectId}
        parentId={currentCollectionId || null}
      />
    </>
  );
}
