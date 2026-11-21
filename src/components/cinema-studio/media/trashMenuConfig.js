/**
 * [FSD Layer: widgets/StudioLayout/GenerationsStudio/MediaGridItem]
 * Builds trash-specific menu items for workflows in the Trash gallery grid:
 * - Restore (calls onRestore)
 * - Delete permanently (calls onDeletePermanently)
 */

export function getTrashMenuItems({ onRestore, onDeletePermanently, isRestoring = false }) {
  return [
    {
      key: "restore",
      icon: "restore-bin",
      label: "Restaurer",
      disabled: Boolean(isRestoring),
      onClick: onRestore,
    },
    {
      key: "delete_permanently",
      icon: "delete-02",
      label: "Supprimer définitivement",
      variant: "destructive",
      onClick: onDeletePermanently,
    },
  ];
}
