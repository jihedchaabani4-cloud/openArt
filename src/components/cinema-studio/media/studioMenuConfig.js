import { FOLDER_COLOR_OPTIONS, DEFAULT_FOLDER_GRADIENT } from "@/features/folders/model/folder-color-tokens";

/**
 * Detects the entity type of a workflow:
 * - "character"
 * - "element"
 * - "upload"
 * - "generation"
 */
export function getWorkflowEntityType(workflow) {
  if (!workflow) return "generation";
  if (
    workflow.type === "collection" ||
    workflow.itemType === "collection" ||
    workflow.entity_type === "collection" ||
    workflow.entity_type === "folder" ||
    Boolean(workflow.is_collection) ||
    Boolean(workflow.is_folder)
  ) {
    return "collection";
  }
  const wType = String(workflow.workflow_type || workflow.workflowType || "").toUpperCase();
  if (
    wType === "CHARACTER" ||
    wType === "CHARACTER_SHEET" ||
    Boolean(workflow.is_character) ||
    workflow.entity_type === "character" ||
    Boolean(workflow.characterId) ||
    Boolean(workflow.character)
  ) {
    return "character";
  }
  if (
    wType === "ELEMENT" ||
    wType === "ELEMENT_SHEET" ||
    Boolean(workflow.is_element) ||
    workflow.entity_type === "element" ||
    Boolean(workflow.elementId) ||
    Boolean(workflow.element)
  ) {
    return "element";
  }
  if (wType === "UPLOAD" || workflow.feed_type === "upload") {
    return "upload";
  }
  return "generation";
}

/**
 * Builds a structured, type-specific list of menu items.
 * Supports:
 * - "character"
 * - "element"
 * - "upload"
 * - "generation"
 *
 * Each item has { key, label, icon, onClick, disabled, variant, iconClassName, fill }
 * or { key, type: "separator" }.
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

export function getStudioMenuItems({
  type = "generation",
  workflow: _workflow = null,
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

  // 1. Favorite / Like
  const itemLike = {
    key: "like",
    icon: "favourite",
    label: isLiked ? "Retirer des favoris" : "Ajouter aux favoris",
    fill: isLiked,
    onClick: handleLike,
  };

  // 2. Reuse prompt / settings
  const itemReuse = {
    key: "reuse",
    icon: "arrow-turn-backward",
    label: "Réutiliser le prompt",
    disabled: !canReuse,
    onClick: handleReuseSettings,
  };

  // 3. Animate (Image to Video start frame - upload & generation only)
  const itemAnimate = {
    key: "animate",
    icon: "film-01",
    label: "Animer",
    onClick: handleAnimate,
  };

  // 4. Add to prompt (Phase 1 — Reference mode)
  const itemAddToPrompt = {
    key: "add",
    icon: "add-01",
    label: "Ajouter au prompt",
    disabled: !canAddToPrompt,
    onClick: handleAddToPrompt,
  };

  // 4b. Add as Start / End Frame (Phase 2 — Video Frames mode)
  const itemAddStartFrame = {
    key: "add-start-frame",
    icon: "chevron-first",
    label: "Ajouter en Start Frame",
    disabled: !canAddToPrompt,
    onClick: handleAddStartFrame,
  };

  const itemAddEndFrame = {
    key: "add-end-frame",
    icon: "chevron-last",
    label: "Ajouter en End Frame",
    disabled: !canAddToPrompt,
    onClick: handleAddEndFrame,
  };

  // 5. Download
  const itemDownload = {
    key: "download",
    icon: "download-04",
    label: "Télécharger",
    onClick: handleDownload,
  };

  // 6. Rename
  const itemRename = {
    key: "rename",
    icon: "pencil-edit-02",
    label: "Renommer",
    onClick: onRename,
  };

  // 8. Publish to YouTube (video only)
  const itemPublishYoutube = {
    key: "youtube",
    icon: "video-02",
    label: "Publier sur YouTube",
    onClick: handlePublishYoutube,
  };

  // 9. Set project cover
  const itemSetCover = {
    key: "cover",
    icon: "image-01",
    label: "Définir la couverture du projet",
    onClick: handleSetCover,
  };

  // 10. Report result
  const itemReport = {
    key: "report",
    icon: "flag-02",
    label: "Signaler le résultat",
    onClick: handleReport,
  };

  // 11. Tile details (optional toggle)
  const itemTileDetails = {
    key: "tileDetails",
    icon: showTileDetails ? "view-off-slash" : "view",
    label: showTileDetails ? "Masquer les détails" : "Afficher les détails",
    onClick: toggleTileDetails,
  };

  // 12. Delete
  const itemDelete = (label = "Placer dans la corbeille") => ({
    key: "delete",
    icon: "delete-02",
    label,
    disabled: !canDelete,
    variant: "destructive",
    onClick: onDelete,
  });

  // Folder / Collection specific items
  const itemFolderOpenInNewTab = {
    key: "open_in_new",
    label: "Open in new tab",
    icon: "link-square-02",
    onClick: openInNewTabAction,
  };

  const itemFolderNewSubfolder = {
    key: "create_new_folder",
    label: "New subfolder",
    icon: "folder-add",
    onClick: createSubfolderAction,
  };

  const itemFolderEdit = {
    key: "edit",
    label: "Edit",
    icon: "pencil-edit-02",
    onClick: editAction,
  };

  const itemFolderMoveTo = {
    key: "drive_file_move",
    label: "Move to...",
    icon: "folder-transfer",
    onClick: moveToAction,
  };

  const itemFolderLike = {
    key: "like",
    label: isLiked ? "Unlike collection" : "Like collection",
    icon: "favourite",
    fill: isLiked,
    iconClassName: isLiked ? "text-error" : undefined,
    onClick: handleLike,
  };

  const itemFolderDownload = {
    key: "download",
    label: isDownloading ? "Downloading..." : "Download collection",
    icon: "download-04",
    disabled: isDownloading,
    onClick: handleDownload,
  };

  const folderColor = state.folderColor || (item?.color ?? null);
  const colorSubItems = (FOLDER_COLOR_OPTIONS || []).map((c) => ({
    key: `color-${c.id}`,
    label: c.label,
    hex: c.hex,
    bgClass: c.bgClass,
    checked: folderColor?.toLowerCase() === c.hex.toLowerCase(),
    onClick: () => setColorAction?.(c.hex),
  })).concat([
    { key: "sep-color-default", type: "separator" },
    {
      key: "color-default",
      label: "Blanc (Défaut)",
      hex: null,
      bgClass: "border border-border folder-swatch-white",
      checked: !folderColor || folderColor.toLowerCase() === DEFAULT_FOLDER_GRADIENT?.hex?.toLowerCase(),
      onClick: () => setColorAction?.(null),
    },
  ]);

  const itemFolderColor = {
    key: "color",
    label: "Color",
    icon: "paint-board",
    onClick: setColorAction,
    subItems: colorSubItems,
  };

  const itemFolderDelete = {
    key: "delete",
    label: "Delete",
    icon: "delete-02",
    variant: "destructive",
    onClick: onDelete,
  };

  const separator = (id) => ({ key: `sep-${id}`, type: "separator" });

  const frameModeItems =
    !isVideo && canAddToPrompt
      ? [
          ...(handleAddStartFrame ? [itemAddStartFrame] : []),
          ...(handleAddEndFrame ? [itemAddEndFrame] : []),
          ...(handleAddStartFrame || handleAddEndFrame ? [separator("frames")] : []),
        ]
      : [];

  const referenceModeItems = [
    ...(handleAnimate && !isVideo ? [itemAnimate, separator("animate")] : []),
    ...(!isVideo && canAddToPrompt ? [itemAddToPrompt] : []),
  ];

  const mediaPromptActions = isFrameMode ? frameModeItems : referenceModeItems;

  let rawItems = [];

  switch (type) {
    case "collection":
    case "folder":
      rawItems = [
        itemFolderOpenInNewTab,
        itemFolderNewSubfolder,
        itemFolderEdit,
        itemFolderMoveTo,
        itemFolderLike,
        itemFolderDownload,
        separator("color"),
        itemFolderColor,
        separator("delete"),
        itemFolderDelete,
      ];
      break;

    case "character":
      rawItems = [
        itemLike,
        ...(showReuse && canReuse ? [itemReuse] : []),
        separator("fav"),
        ...(!isFrameMode && !isVideo && canAddToPrompt ? [itemAddToPrompt] : []),
        ...(handleDownload ? [itemDownload] : []),
        ...(onRename ? [itemRename] : []),
        ...(handleSetCover ? [itemSetCover, separator("cover")] : []),
        ...(toggleTileDetails ? [itemTileDetails, separator("details")] : []),
        ...(canDelete ? [itemDelete("Placer dans la corbeille")] : []),
      ];
      break;

    case "element":
      rawItems = [
        itemLike,
        ...(showReuse && canReuse ? [itemReuse] : []),
        separator("fav"),
        ...(!isFrameMode && !isVideo && canAddToPrompt ? [itemAddToPrompt] : []),
        ...(handleDownload ? [itemDownload] : []),
        ...(onRename ? [itemRename] : []),
        ...(handleSetCover ? [itemSetCover, separator("cover")] : []),
        ...(toggleTileDetails ? [itemTileDetails, separator("details")] : []),
        ...(canDelete ? [itemDelete("Placer dans la corbeille")] : []),
      ];
      break;

    case "upload":
      rawItems = [
        itemLike,
        separator("fav"),
        ...mediaPromptActions,
        ...(handleDownload ? [itemDownload] : []),
        ...(onRename ? [itemRename] : []),
        ...(isVideo && handlePublishYoutube ? [itemPublishYoutube] : []),
        ...(handleSetCover ? [itemSetCover, separator("cover")] : []),
        ...(handleReport ? [itemReport, separator("report")] : []),
        ...(toggleTileDetails ? [itemTileDetails, separator("details")] : []),
        ...(canDelete ? [itemDelete("Placer dans la corbeille")] : []),
      ];
      break;

    case "generation":
    default:
      rawItems = [
        itemLike,
        ...(showReuse && canReuse ? [itemReuse] : []),
        separator("fav-reuse"),
        ...mediaPromptActions,
        ...(handleDownload ? [itemDownload] : []),
        ...(onRename ? [itemRename] : []),
        ...(isVideo && handlePublishYoutube ? [itemPublishYoutube] : []),
        ...(handleSetCover ? [itemSetCover, separator("cover")] : []),
        ...(handleReport ? [itemReport, separator("report")] : []),
        ...(toggleTileDetails ? [itemTileDetails, separator("details")] : []),
        ...(canDelete ? [itemDelete("Placer dans la corbeille")] : []),
      ];
      break;
  }

  const activeItems = rawItems.filter(
    (item) => !item || item.type === "separator" || item.key?.startsWith("sep-") || !item.disabled
  );
  return sanitizeSeparators(activeItems);
}
