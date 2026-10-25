"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { useUploadMedia } from "@/features/media";
import { useCreateFolder } from "@/features/folders";
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
  const { mutateAsync: createFolder, isPending: isCreatingFolder } = useCreateFolder();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (activeStudioTab !== "assets" && activeStudioTab !== "generations" && activeStudioTab !== "collection") return null;

  const handleUploadClick = () => {
    setDropdownOpen(false);
    if (!projectId) return;
    fileInputRef.current?.click();
  };

  const handleCreateCollectionClick = async () => {
    setDropdownOpen(false);
    if (!projectId) return;

    try {
      const created = await createFolder({
        projectId,
        name: "Untitled collection",
        parentId: currentCollectionId || null,
      });
      if (created?.id) {
        setActiveCollectionId(created.id);
      }
    } catch (err) {
      logger.error("navbar_create_collection_failed", { message: err?.message });
    }
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
            disabled={isUploading || isCreatingFolder || !projectId}
            variant="studio-ghost"
            size="icon"
            title={projectId ? "Add or Upload" : "Project is still loading"}
          >
            {isUploading || isCreatingFolder ? (
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
            className="flex items-center gap-3 cursor-pointer pl-3 pr-4 py-2 rounded-[16px] hover:bg-white/10 text-white min-h-[2.125rem] text-[14px] leading-5 font-medium transition-colors duration-100 ease-in-out"
          >
            <GoogleIcon iconName="upload" className="text-[20px] text-white/80 shrink-0" />
            <span className="font-medium">Upload media</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleCreateCollectionClick}
            disabled={isCreatingFolder}
            className="flex items-center gap-3 cursor-pointer pl-3 pr-4 py-2 rounded-[16px] hover:bg-white/10 text-white min-h-[2.125rem] text-[14px] leading-5 font-medium transition-colors duration-100 ease-in-out"
          >
            <GoogleIcon iconName="create_new_folder" className="text-[20px] text-white/80 shrink-0" />
            <span className="font-medium">Create collection</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
