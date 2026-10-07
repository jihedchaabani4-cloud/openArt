"use client";

import React, { useState } from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { useUpdateFolder, useDeleteFolder } from "@/features/folders";
import { useWorkflowsStore } from "@/features/workflows";

export const CollectionGridItem = React.memo(function CollectionGridItem({
  collection,
  projectId,
  width,
  height,
  className,
  onClick,
}) {
  const [isLiked, setIsLiked] = useState(Boolean(collection?.favorited || collection?.is_liked));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(collection?.name || "");
  const [errorMessage, setErrorMessage] = useState(null);

  const { mutateAsync: updateFolder, isPending: isUpdating } = useUpdateFolder();
  const { mutateAsync: deleteFolder, isPending: isDeleting } = useDeleteFolder();
  const setActiveCollectionId = useWorkflowsStore((s) => s.setActiveCollectionId);
  const activeCollectionId = useWorkflowsStore((s) => s.activeCollectionId);

  const handleCardClick = (e) => {
    // Prevent navigation if interacting with dropdown or action buttons
    if (e.target.closest("[data-no-card-click]")) return;
    onClick?.(collection);
  };

  const handleToggleLike = (e) => {
    e.stopPropagation();
    setIsLiked((prev) => !prev);
  };

  const handleOpenRename = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    setRenameValue(collection?.name || "");
    setErrorMessage(null);
    setIsRenameOpen(true);
  };

  const handleSaveRename = async (e) => {
    e?.preventDefault?.();
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === collection?.name) {
      setIsRenameOpen(false);
      return;
    }

    setErrorMessage(null);
    try {
      await updateFolder({
        folderId: collection.id,
        patch: { name: trimmed },
        projectId,
      });
      setIsRenameOpen(false);
    } catch (err) {
      setErrorMessage(err.message || "Failed to rename collection");
    }
  };

  const handleOpenDelete = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteFolder({
        folderId: collection.id,
        projectId,
      });
      if (activeCollectionId === collection.id) {
        setActiveCollectionId(null);
      }
      setIsDeleteOpen(false);
    } catch (err) {
      alert(err.message || "Cannot delete collection with items inside");
    }
  };

  return (
    <>
      <div
        style={{ width, height }}
        onClick={handleCardClick}
        className={cn(
          "relative rounded-2xl overflow-hidden bg-[#2b2d31] hover:bg-[#34363b] transition-all duration-200 cursor-pointer group flex flex-col justify-between p-5 border border-white/5 shadow-xl select-none",
          className
        )}
      >
        {/* Top-Right Action Pill */}
        <div
          data-no-card-click="true"
          className="self-end flex items-center bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full px-1.5 py-1 gap-1 z-10 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            title={isLiked ? "Unlike collection" : "Like collection"}
            className="size-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <GoogleIcon
              iconName={isLiked ? "favorite" : "favorite_border"}
              className={cn("text-[17px]", isLiked ? "text-red-500" : "text-white/80")}
            />
          </button>

          {/* More Menu */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="size-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                title="Collection options"
              >
                <GoogleIcon iconName="more_vert" className="text-[17px]" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-40 p-1.5 flex flex-col gap-0.5 font-sans"
            >
              <DropdownMenuItem
                onClick={handleOpenRename}
                className="flex items-center gap-2.5 cursor-pointer py-2 px-2.5 rounded-[10px] hover:bg-white/10 text-white text-[13px]"
              >
                <GoogleIcon iconName="edit" className="text-[16px] text-white/70" />
                <span>Rename</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                variant="destructive"
                onClick={handleOpenDelete}
                className="flex items-center gap-2.5 cursor-pointer py-2 px-2.5 rounded-[10px] hover:bg-red-500/20 text-red-400 text-[13px]"
              >
                <GoogleIcon iconName="delete" className="text-[16px] text-red-400" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom Title */}
        <div className="z-10 mt-auto pointer-events-none">
          <h3 className="text-[22px] font-medium text-white/95 tracking-tight leading-snug line-clamp-2">
            {collection?.name || "Untitled collection"}
          </h3>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent
          variant="small"
          className="bg-[rgba(22,23,24,0.95)] backdrop-blur-[80px] border border-white/10 text-white rounded-[24px] max-w-[340px] p-5 shadow-2xl"
          showCloseButton={false}
        >
          <form onSubmit={handleSaveRename} className="flex flex-col gap-4">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-[15px] font-semibold text-white">
                Rename collection
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-1.5">
              <Input
                value={renameValue}
                onChange={(e) => {
                  setRenameValue(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Collection name"
                className="h-10 text-[13px] bg-white/5 border-white/10 rounded-xl focus:border-white/25"
                disabled={isUpdating}
                autoFocus
              />
              {errorMessage && (
                <p className="text-[11px] text-red-400 px-1">{errorMessage}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="studio-ghost"
                size="sm"
                onClick={() => setIsRenameOpen(false)}
                disabled={isUpdating}
                className="text-[13px] text-white/70 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="studio-accent"
                size="sm"
                disabled={!renameValue.trim() || isUpdating}
                className="text-[13px] px-4 font-medium"
              >
                {isUpdating ? (
                  <GoogleIcon iconName="progress_activity" className="text-[14px] animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        description={`Delete collection "${collection?.name || "Untitled collection"}"?`}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
      />
    </>
  );
});
