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
  workflow = null,
  item = null,
  actions = {},
  state = {},
}) {
  const {
    handleAddToPrompt,
    handleAnimate,
    handleLike,
    handleReuseSettings,
    handleDownload,
    handleCopy,
    handleSetCover,
    handleReport,
    handlePublishYoutube,
    onDelete,
    toggleTileDetails,
    onRename,
  } = actions;

  const {
    isLiked = false,
    isVideo = false,
    isDownloading = false,
    showTileDetails = false,
    canDelete = true,
    canReuse = false,
    canAddToPrompt = true,
  } = state;

  const mediaUrl = item?.url || workflow?.url || workflow?.primary_media?.url || "";

  // 1. Favorite / Like
  const itemLike = {
    key: "like",
    icon: "favorite",
    label: isLiked ? "Retirer des favoris" : "Ajouter aux favoris",
    iconClassName: isLiked ? "fill-white" : undefined,
    fill: isLiked,
    onClick: handleLike,
  };

  // 2. Reuse prompt / settings
  const itemReuse = {
    key: "reuse",
    icon: "keyboard_return",
    label: "Réutiliser le prompt",
    onClick: handleReuseSettings,
  };

  // 3. Animate (Image to Video start frame - upload & generation only)
  const itemAnimate = {
    key: "animate",
    icon: "movie",
    label: "Animer",
    onClick: handleAnimate,
  };

  // 4. Add to prompt
  const itemAddToPrompt = {
    key: "add",
    icon: "add_2",
    label: "Ajouter au prompt",
    disabled: !canAddToPrompt,
    onClick: handleAddToPrompt,
  };

  // 5. Download
  const itemDownload = {
    key: "download",
    icon: "download",
    label: "Télécharger",
    onClick: handleDownload,
  };

  // 6. Copy
  const itemCopy = {
    key: "copy",
    icon: "content_copy",
    label: "Copier",
    onClick: handleCopy || (() => {
      if (mediaUrl && typeof navigator !== "undefined") {
        navigator.clipboard?.writeText?.(mediaUrl);
      }
    }),
  };

  // 7. Rename
  const itemRename = {
    key: "rename",
    icon: "edit",
    label: "Renommer",
    onClick: onRename,
  };

  // 8. Publish to YouTube (video only)
  const itemPublishYoutube = {
    key: "youtube",
    icon: "video_library",
    label: "Publier sur YouTube",
    onClick: handlePublishYoutube,
  };

  // 9. Set project cover
  const itemSetCover = {
    key: "cover",
    icon: "photo_library",
    label: "Définir la couverture du projet",
    onClick: handleSetCover,
  };

  // 10. Report result
  const itemReport = {
    key: "report",
    icon: "flag",
    label: "Signaler le résultat",
    onClick: handleReport,
  };

  // 11. Tile details (optional toggle)
  const itemTileDetails = {
    key: "tileDetails",
    icon: showTileDetails ? "visibility_off" : "visibility",
    label: showTileDetails ? "Masquer les détails" : "Afficher les détails",
    onClick: toggleTileDetails,
  };

  // 12. Delete
  const itemDelete = (label = "Placer dans la corbeille") => ({
    key: "delete",
    icon: "delete",
    label,
    disabled: !canDelete,
    variant: "destructive",
    onClick: onDelete,
  });

  // Folder / Collection specific items
  const itemFolderLike = {
    key: "like",
    label: isLiked ? "Unlike collection" : "Like collection",
    icon: "favorite",
    fill: isLiked,
    iconClassName: isLiked ? "text-red-400 fill-red-400" : undefined,
    onClick: handleLike,
  };

  const itemFolderDownload = {
    key: "download",
    label: isDownloading ? "Downloading..." : "Download collection",
    icon: "download",
    disabled: isDownloading,
    onClick: handleDownload,
  };

  const itemFolderDelete = {
    key: "delete",
    label: "Delete",
    icon: "delete",
    variant: "destructive",
    onClick: onDelete,
  };

  const separator = (id) => ({ key: `sep-${id}`, type: "separator" });

  let rawItems = [];

  switch (type) {
    case "collection":
    case "folder":
      rawItems = [
        itemFolderLike,
        ...(handleDownload ? [itemFolderDownload] : []),
        ...(onRename ? [itemRename] : []),
        itemFolderDelete,
      ];
      break;

    case "character":
      rawItems = [
        itemLike,
        separator("fav"),
        itemAddToPrompt,
        ...(handleDownload ? [itemDownload] : []),
        ...(onRename ? [itemRename] : []),
        ...(handleSetCover ? [itemSetCover, separator("cover")] : []),
        ...(toggleTileDetails ? [itemTileDetails, separator("details")] : []),
        itemDelete("Placer dans la corbeille"),
      ];
      break;

    case "element":
      rawItems = [
        itemLike,
        separator("fav"),
        itemAddToPrompt,
        ...(handleDownload ? [itemDownload] : []),
        ...(onRename ? [itemRename] : []),
        ...(handleSetCover ? [itemSetCover, separator("cover")] : []),
        ...(toggleTileDetails ? [itemTileDetails, separator("details")] : []),
        itemDelete("Placer dans la corbeille"),
      ];
      break;

    case "upload":
      rawItems = [
        itemLike,
        separator("fav"),
        ...(handleAnimate && !isVideo ? [itemAnimate, separator("animate")] : []),
        itemAddToPrompt,
        ...(handleDownload ? [itemDownload] : []),
        ...(onRename ? [itemRename] : []),
        ...(isVideo && handlePublishYoutube ? [itemPublishYoutube] : []),
        ...(handleSetCover ? [itemSetCover, separator("cover")] : []),
        ...(handleReport ? [itemReport, separator("report")] : []),
        ...(toggleTileDetails ? [itemTileDetails, separator("details")] : []),
        itemDelete("Placer dans la corbeille"),
      ];
      break;

    case "generation":
    default:
      rawItems = [
        itemLike,
        ...(canReuse || handleReuseSettings ? [itemReuse] : []),
        separator("fav-reuse"),
        ...(handleAnimate && !isVideo ? [itemAnimate, separator("animate")] : []),
        itemAddToPrompt,
        ...(handleDownload ? [itemDownload] : []),
        ...(onRename ? [itemRename] : []),
        ...(isVideo && handlePublishYoutube ? [itemPublishYoutube] : []),
        ...(handleSetCover ? [itemSetCover, separator("cover")] : []),
        ...(handleReport ? [itemReport, separator("report")] : []),
        ...(toggleTileDetails ? [itemTileDetails, separator("details")] : []),
        itemDelete("Placer dans la corbeille"),
      ];
      break;
  }

  return sanitizeSeparators(rawItems);
}
