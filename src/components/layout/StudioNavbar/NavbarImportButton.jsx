"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { useUploadMedia } from "@/features/media";
import { CreateFolderDialog } from "@/components/cinema-studio/collections/CreateFolderDialog";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { Button } from "@/components/base/button";
import { toast } from "sonner";
import { logger } from "@/shared/lib/logger";

export function NavbarImportButton() {
  const { selectedProjectId: projectId, activeStudioTab } = useGenerationsStore();
  const fileInputRef = useRef(null);
  const pathname = usePathname();

  // NavbarImportButton lives inside the [projectId] layout — useParams() never sees [collectionId].
  // Extract it from the pathname directly: /cinema-studio/[pid]/collection/[cid]
  const collectionMatch = pathname?.match(/\/collection\/([^/]+)/);
  const currentCollectionId = collectionMatch ? collectionMatch[1] : null;

  const { uploadMedia, isUploading } = useUploadMedia();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  if (activeStudioTab !== "assets" && activeStudioTab !== "generations" && activeStudioTab !== "collection") return null;

  const handleUploadClick = () => {
    if (!projectId) return;
    fileInputRef.current?.click();
  };

  const handleCreateCollectionClick = () => {
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

      <Button
        type="button"
        disabled={isUploading || !projectId}
        variant="outline"
        onClick={handleUploadClick}
        title={projectId ? "Upload media" : "Project is still loading"}
      >
        {isUploading ? (
          <HugeIcon name="loading-03" className="animate-spin text-text-secondary" />
        ) : (
          <HugeIcon name="upload-04" />
        )}
        <span>Upload</span>
      </Button>

      <Button
        type="button"
        disabled={!projectId}
        variant="outline"
        onClick={handleCreateCollectionClick}
        title={projectId ? "Create folder" : "Project is still loading"}
      >
        <HugeIcon name="folder-add" />
        <span>Folder</span>
      </Button>

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        projectId={projectId}
        parentId={currentCollectionId || null}
      />
    </>
  );
}
