import React, { useState, useCallback, useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import { ButtonGroup } from "@/shared/ui/button-group";
import { ConfirmDeleteDialog } from "@/shared/ui/ConfirmDeleteDialog";
import { useWorkflowActions } from "@/features/workflows/model/useMediaActions";
import { StudioItemDropdownMenu } from "./StudioItemMenu";
import { getTrashMenuItems } from "./trashMenuConfig";
import { useRestoreWorkflow } from "@/features/trash/api/mutations/useRestoreWorkflow";
import { MediaView } from "@/features/media";

export const TrashMediaGridCard = React.memo(function TrashMediaGridCard({
  workflow,
  item: propItem = null,
  mediaId = null,
  aspect: propAspect = null,
  className,
  onClick = () => {},
  width: albumWidth = null,
  height: albumHeight = null,
  menuItems: propMenuItems = null,
  topLeft = null,
  topRight: customTopRight = null,
  onRestoreSuccess = null,
  onRestoreError = null,
  projectId: propProjectId = null,
  ...props
}) {
  const effectiveMediaId = mediaId || (typeof propItem === "string" ? propItem : null);
  const resolvedItem = (typeof propItem === "object" && propItem !== null)
    ? propItem
    : (workflow?.items?.find((i) => (i.id || i.name || i.asset_id) === effectiveMediaId) || (effectiveMediaId ? { id: effectiveMediaId } : null));

  const effectiveProjectId = propProjectId || workflow?.projectId || workflow?.project_id || null;

  const {
    handleDelete,
    isVideo, url, status, aspect, item,
  } = useWorkflowActions(workflow, resolvedItem, { projectId: effectiveProjectId });

  const restoreMutation = useRestoreWorkflow();

  const handleRestore = useCallback(async (e) => {
    e?.stopPropagation?.();
    try {
      const cleanId = workflow?.id || workflow?.name;
      const projId = propProjectId || workflow?.projectId || workflow?.project_id;
      await restoreMutation.mutateAsync({ workflowId: cleanId, projectId: projId });
      onRestoreSuccess?.(cleanId);
    } catch (err) {
      onRestoreError?.(err);
    }
  }, [workflow, propProjectId, restoreMutation, onRestoreSuccess, onRestoreError]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const trashMenuItems = useMemo(() => {
    return getTrashMenuItems({
      onRestore: handleRestore,
      onDeletePermanently: (e) => {
        e?.stopPropagation?.();
        setIsDeleteConfirmOpen(true);
      },
      isRestoring: restoreMutation.isPending,
    });
  }, [handleRestore, restoreMutation.isPending]);

  const menuItems = propMenuItems || trashMenuItems;

  const isError = ["rejected", "failed", "error"].includes(status);
  const errorMsg = isError ? (
    item?.error ||
    workflow?.error ||
    item?.error_message ||
    workflow?.error_message ||
    "Generation failed. Please try a different prompt or retry."
  ) : null;

  const cardStyle = albumWidth && albumHeight
    ? {
        width: albumWidth,
        height: albumHeight,
        aspectRatio: `${albumWidth} / ${albumHeight}`,
        transform: "translateZ(0)",
        contain: "paint layout",
        contentVisibility: "auto",
        containIntrinsicSize: `${Math.round(albumWidth)}px ${Math.round(albumHeight)}px`,
      }
    : {
        width: "100%",
        aspectRatio: propAspect || aspect,
        transform: "translateZ(0)",
        contain: "paint layout",
        contentVisibility: "auto",
      };

  const displayName = workflow?.display_name
                   || workflow?.metadata?.displayName
                   || workflow?.title
                   || null;

  if (!item && !workflow) return null;

  return (
    <>
      <MediaView
        workflow={workflow}
        item={item}
        mediaId={effectiveMediaId}
        src={url}
        isVideo={isVideo}
        status={status}
        aspect={propAspect || aspect}
        error={errorMsg}
        fit="cover"
        surface="card"
        playOnHover={true}
        autoPlay={false}
        draggable={false}
        onClick={(e) => onClick(workflow, e)}
        showHoverOverlay={false}
        contextMenuItems={menuItems}
        onDelete={(e) => {
          e?.stopPropagation();
          setIsDeleteConfirmOpen(true);
        }}
        className={cn("cursor-pointer", className)}
        style={cardStyle}
        topLeft={topLeft}
        topRight={
          customTopRight !== null ? customTopRight : (
            <div className={cn(
              "transition-opacity duration-200 pointer-events-auto",
              isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <ButtonGroup variant="pill">
                <StudioItemDropdownMenu
                  open={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                  items={menuItems}
                />
              </ButtonGroup>
            </div>
          )
        }
        bottomLeft={
          displayName && (
            <div className="transition-opacity duration-200 pointer-events-auto max-w-[calc(100%-40px)] opacity-0 group-hover:opacity-100">
              <span
                title={displayName}
                className="text-white/90 truncate text-xs font-semibold select-none block"
              >
                {displayName}
              </span>
            </div>
          )
        }
      />

      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Supprimer définitivement ?"
        description="Cette action est irréversible. Le workflow et tous ses médias seront définitivement supprimés."
        confirmLabel="Supprimer définitivement"
        onConfirm={handleDelete}
      />
    </>
  );
});

export default TrashMediaGridCard;
