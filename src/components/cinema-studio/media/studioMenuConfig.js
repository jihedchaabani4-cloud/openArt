import { FOLDER_COLOR_OPTIONS, DEFAULT_FOLDER_GRADIENT } from "@/features/folders/model/folder-color-tokens";
import {
  getWorkflowEntityType,
  resolveStudioActions,
} from "@/features/workflows/lib/studioActionRules";

export { getWorkflowEntityType };

/**
 * Strips leading, trailing, and consecutive duplicate separators.
 */
function sanitizeSeparators(items) {
  const result = [];
  for (let i = 0; i < items.length; i++) {
    const curr = items[i];
    if (!curr) continue;
    if (curr.type === "separator" || curr.key?.startsWith("sep-")) {
      if (result.length === 0) continue;
      const last = result[result.length - 1];
      if (last.type === "separator" || last.key?.startsWith("sep-")) continue;
    }
    result.push(curr);
  }
  if (result.length > 0) {
    const last = result[result.length - 1];
    if (last.type === "separator" || last.key?.startsWith("sep-")) {
      result.pop();
    }
  }
  return result;
}

/**
 * Builds a structured, rule-driven list of menu items for:
 * "collection" | "folder" | "character" | "element" | "upload" | "generation".
 * All allowed/disabled gates come from `studioActionRules.js`.
 */
export function getStudioMenuItems({
  type = "generation",
  workflow = null,
  item = null,
  actions = {},
  state = {},
}) {
  const {
    handleAddToPrompt,
    handleAddStartFrame,
    handleAddEndFrame,
    handleAnimate,
    handleLike,
    handleReuseSettings,
    handleDownload,
    handleSetCover,
    handleReport,
    handlePublishYoutube,
    onDelete,
    toggleTileDetails,
    onRename,
    handleOpenInNewTab,
    onOpenInNewTab,
    handleCreateSubfolder,
    onCreateSubfolder,
    handleEdit,
    onEdit,
    handleMoveTo,
    onMoveTo,
    handleSetColor,
    onSetColor,
  } = actions;

  const openInNewTabAction = handleOpenInNewTab || onOpenInNewTab;
  const createSubfolderAction = handleCreateSubfolder || onCreateSubfolder;
  const editAction = handleEdit || onEdit;
  const moveToAction = handleMoveTo || onMoveTo;
  const setColorAction = handleSetColor || onSetColor;

  const {
    isLiked = false,
    isVideo = false,
    isDownloading = false,
    showTileDetails = false,
    canDelete = true,
    canReuse = false,
    showReuse = false,
    canAddToPrompt = true,
    isFrameMode = false,
  } = state;

  const isCollection = type === "collection" || type === "folder";
  const resolvedStatus = isCollection
    ? null
    : state.status ?? (state.isFailed ? "failed" : state.isInFlight ? "processing" : null);

  const rules = resolveStudioActions({
    entityType: type,
    workflow: isCollection ? null : workflow,
    item: isCollection ? null : item,
    status: resolvedStatus,
    isVideo,
    isFrameMode,
    hasReusablePrompt: canReuse,
    showReuse,
    canModelAcceptEntity: canAddToPrompt,
  });

  if (!rules.can.openMenu) {
    return [];
  }

  const itemLike = {
    key: "like",
    icon: "favourite",
    label: isLiked ? "Retirer des favoris" : "Ajouter aux favoris",
    fill: isLiked,
    onClick: handleLike,
  };

  const itemReuse = {
    key: "reuse",
    icon: "arrow-turn-backward",
    label: "Réutiliser le prompt",
    disabled: !rules.can.reusePrompt,
    onClick: handleReuseSettings,
  };

  const itemAnimate = {
    key: "animate",
    icon: "film-01",
    label: "Animer",
    onClick: handleAnimate,
  };

  const itemAddToPrompt = {
    key: "add",
    icon: "add-01",
    label: "Ajouter au prompt",
    disabled: !rules.can.addToPrompt,
    onClick: handleAddToPrompt,
  };

  const itemAddStartFrame = {
    key: "add-start-frame",
    icon: "chevron-first",
    label: "Ajouter en Start Frame",
    disabled: !rules.can.addFrame,
    onClick: handleAddStartFrame,
  };

  const itemAddEndFrame = {
    key: "add-end-frame",
    icon: "chevron-last",
    label: "Ajouter en End Frame",
    disabled: !rules.can.addFrame,
    onClick: handleAddEndFrame,
  };

  const itemDownload = {
    key: "download",
    icon: "download-04",
    label: "Télécharger",
    onClick: handleDownload,
  };

  const itemRename = {
    key: "rename",
    icon: "pencil-edit-02",
    label: "Renommer",
    onClick: onRename,
  };

  const itemPublishYoutube = {
    key: "youtube",
    icon: "video-02",
    label: "Publier sur YouTube",
    onClick: handlePublishYoutube,
  };

  const itemSetCover = {
    key: "cover",
    icon: "image-01",
    label: "Définir la couverture du projet",
    onClick: handleSetCover,
  };

  const itemReport = {
    key: "report",
    icon: "flag-02",
    label: "Signaler le résultat",
    onClick: handleReport,
  };

  const itemTileDetails = {
    key: "tileDetails",
    icon: showTileDetails ? "view-off-slash" : "view",
    label: showTileDetails ? "Masquer les détails" : "Afficher les détails",
    onClick: toggleTileDetails,
  };

  const deleteLabel =
    rules.deleteMode === "permanent"
      ? "Supprimer définitivement"
      : "Placer dans la corbeille";

  const itemDelete = {
    key: "delete",
    icon: "delete-02",
    label: deleteLabel,
    disabled: !(rules.can.delete && canDelete),
    variant: "destructive",
    onClick: onDelete,
  };

  const separator = (id) => ({ key: `sep-${id}`, type: "separator" });

  let rawItems;

  if (rules.entityType === "collection") {
    const folderColor = state.folderColor || (item?.color ?? null);
    const colorSubItems = (FOLDER_COLOR_OPTIONS || [])
      .map((c) => ({
        key: `color-${c.id}`,
        label: c.label,
        hex: c.hex,
        bgClass: c.bgClass,
        checked: folderColor?.toLowerCase() === c.hex.toLowerCase(),
        onClick: () => setColorAction?.(c.hex),
      }))
      .concat([
        { key: "sep-color-default", type: "separator" },
        {
          key: "color-default",
          label: "Blanc (Défaut)",
          hex: null,
          bgClass: "border border-border folder-swatch-white",
          checked:
            !folderColor ||
            folderColor.toLowerCase() === DEFAULT_FOLDER_GRADIENT?.hex?.toLowerCase(),
          onClick: () => setColorAction?.(null),
        },
      ]);

    rawItems = [
      ...(rules.can.openInNewTab
        ? [{ key: "open_in_new", label: "Open in new tab", icon: "link-square-02", onClick: openInNewTabAction }]
        : []),
      ...(rules.can.createSubfolder
        ? [{ key: "create_new_folder", label: "New subfolder", icon: "folder-add", onClick: createSubfolderAction }]
        : []),
      ...(rules.can.edit
        ? [{ key: "edit", label: "Edit", icon: "pencil-edit-02", onClick: editAction }]
        : []),
      ...(rules.can.move
        ? [{ key: "drive_file_move", label: "Move to...", icon: "folder-transfer", onClick: moveToAction }]
        : []),
      ...(rules.can.like
        ? [
            {
              key: "like",
              label: isLiked ? "Unlike collection" : "Like collection",
              icon: "favourite",
              fill: isLiked,
              iconClassName: isLiked ? "text-error" : undefined,
              onClick: handleLike,
            },
          ]
        : []),
      ...(rules.can.download
        ? [
            {
              key: "download",
              label: isDownloading ? "Downloading..." : "Download collection",
              icon: "download-04",
              disabled: isDownloading,
              onClick: handleDownload,
            },
          ]
        : []),
      separator("color"),
      ...(rules.can.setColor
        ? [{ key: "color", label: "Color", icon: "paint-board", onClick: setColorAction, subItems: colorSubItems }]
        : []),
      separator("delete"),
      ...(rules.can.delete
        ? [{ key: "delete", label: "Delete", icon: "delete-02", variant: "destructive", onClick: onDelete }]
        : []),
    ];
  } else {
    rawItems = [
      ...(rules.can.like ? [itemLike] : []),
      ...(rules.can.reusePrompt && handleReuseSettings ? [itemReuse] : []),
      separator("fav"),
      ...(rules.can.addFrame
        ? [
            ...(handleAddStartFrame ? [itemAddStartFrame] : []),
            ...(handleAddEndFrame ? [itemAddEndFrame] : []),
            ...(handleAddStartFrame || handleAddEndFrame ? [separator("frames")] : []),
          ]
        : []),
      ...(rules.can.animate && handleAnimate ? [itemAnimate, separator("animate")] : []),
      ...(rules.can.addToPrompt ? [itemAddToPrompt] : []),
      ...(rules.can.download && handleDownload ? [itemDownload] : []),
      ...(rules.can.rename && onRename ? [itemRename] : []),
      ...(rules.can.publishYoutube && handlePublishYoutube ? [itemPublishYoutube] : []),
      ...(rules.can.setCover && handleSetCover ? [itemSetCover, separator("cover")] : []),
      ...(rules.can.report && handleReport ? [itemReport, separator("report")] : []),
      ...(rules.can.details && toggleTileDetails ? [itemTileDetails, separator("details")] : []),
      ...(rules.can.delete && canDelete && (!rules.isFailed || onDelete) ? [itemDelete] : []),
    ];
  }

  const activeItems = rawItems.filter(
    (entry) => !entry || entry.type === "separator" || entry.key?.startsWith("sep-") || !entry.disabled
  );
  return sanitizeSeparators(activeItems);
}
