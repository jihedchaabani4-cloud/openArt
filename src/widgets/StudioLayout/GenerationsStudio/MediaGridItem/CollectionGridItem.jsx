"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { ButtonGroup } from "@/shared/ui/button-group";
import { ActionBtn } from "./ActionBtn";
import { StudioItemDropdownMenu } from "./StudioItemMenu";
import { CoreMediaItemView } from "@/widgets/CoreMediaItemView";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
import { useDeleteFolder, useUpdateFolder } from "@/features/folders";
import { InlineRenamePill } from "@/shared/ui/InlineRenamePill";

export const CollectionGridItem = React.memo(function CollectionGridItem({
  collection,
  className,
  onClick = () => {},
  width: albumWidth = null,
  height: albumHeight = null,
  aspect = "4/3",
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [cardRect, setCardRect] = useState(null);

  const cardRef = useRef(null);
  const canDismissRef = useRef(false);

  const { mutateAsync: deleteFolder, isPending: isDeleting } = useDeleteFolder();
  const { mutateAsync: updateFolder } = useUpdateFolder();

  const collectionId = collection?.id;
  const projectId = collection?.project_id || collection?.projectId;
  const collectionName = collection?.name || "Untitled collection";

  // Dynamically track card position while rename pill is open
  useEffect(() => {
    if (!isRenaming) {
      setCardRect(null);
      return;
    }
    const updateRect = () => {
      if (cardRef.current) {
        const r = cardRef.current.getBoundingClientRect();
        setCardRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          bottom: r.bottom,
          right: r.right,
        });
      }
    };
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [isRenaming]);

  const startRename = useCallback(() => {
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      setCardRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
        right: r.right,
      });
    }
    canDismissRef.current = false;
    setIsRenaming(true);
    setTimeout(() => {
      canDismissRef.current = true;
    }, 150);
  }, []);

  const handleRename = async (newName) => {
    if (!collectionId || !newName?.trim()) return;
    await updateFolder({
      folderId: collectionId,
      projectId,
      name: newName.trim(),
    });
  };

  const handleDelete = async () => {
    if (!collectionId) return;
    await deleteFolder({
      folderId: collectionId,
      projectId,
    });
  };

  const cardStyle = albumWidth && albumHeight
    ? {
        width: albumWidth,
        height: albumHeight,
        aspectRatio: `${albumWidth} / ${albumHeight}`,
        transform: "translateZ(0)",
        contain: "paint layout",
        contentVisibility: "auto",
      }
    : {
        width: "100%",
        aspectRatio: aspect || "4/3",
        transform: "translateZ(0)",
        contain: "paint layout",
        contentVisibility: "auto",
      };

  const menuItems = [
    {
      key: "rename",
      label: "Rename",
      icon: "edit",
      onClick: startRename,
    },
    {
      key: "delete",
      label: "Delete collection",
      icon: "delete",
      variant: "destructive",
      onClick: () => setIsDeleteConfirmOpen(true),
    },
  ];

  return (
    <>
      <div ref={cardRef} className="relative w-full h-full">
        <CoreMediaItemView
          className={cn(
            "bg-[#303134] hover:bg-[#38393d] border border-white/5 rounded-2xl cursor-pointer select-none transition-all duration-200 shadow-xl",
            className
          )}
          style={cardStyle}
          onClick={(e) => {
            if (!isRenaming) {
              onClick(collection, e);
            }
          }}
          contextMenuItems={menuItems}
          topRight={
            <div
              className={cn(
                "transition-opacity duration-200 pointer-events-auto",
                isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg">
                <ActionBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLiked((prev) => !prev);
                  }}
                  title={isLiked ? "Unlike collection" : "Like collection"}
                >
                  <GoogleIcon
                    iconName="favorite"
                    fill={isLiked}
                    className="text-[13px] text-[#303031]"
                  />
                </ActionBtn>
                <StudioItemDropdownMenu
                  open={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                  items={menuItems}
                />
              </ButtonGroup>
            </div>
          }
          bottomLeft={
            !isRenaming && (
              <div className="p-1 pointer-events-auto max-w-[calc(100%-20px)]">
                <span
                  title={collectionName}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startRename();
                  }}
                  className="text-white/95 text-[18px] sm:text-[20px] font-semibold tracking-tight leading-snug truncate block select-none"
                >
                  {collectionName}
                </span>
              </div>
            )
          }
        />
      </div>

      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        description={`Delete collection "${collectionName}"?`}
        onConfirm={handleDelete}
        loading={isDeleting}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
      />

      <InlineRenamePill
        isOpen={isRenaming}
        initialName={collectionName}
        onSave={handleRename}
        onClose={() => setIsRenaming(false)}
        canDismissRef={canDismissRef}
        customPosition={
          cardRect
            ? {
                top: `${cardRect.bottom + 10}px`,
                left: `${Math.max(12, Math.min(cardRect.left, window.innerWidth - 320))}px`,
              }
            : undefined
        }
      />
    </>
  );
});
