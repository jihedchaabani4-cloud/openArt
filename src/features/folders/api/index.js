// [FSD Layer: features/folders/api] — Barrel export for folder hooks (1 hook / file pattern).
// Exact export names preserved to match legacy foldersApi.js contract (baseline.md §0.2 T2).
export { useProjectFolders } from "./queries/useProjectFolders";
export { useCreateFolder } from "./mutations/useCreateFolder";
export { useUpdateFolder } from "./mutations/useUpdateFolder";
export { useDeleteFolder } from "./mutations/useDeleteFolder";
export { useMoveAssetToFolder } from "./mutations/useMoveAssetToFolder";
export { useFolderMove, getParentFolderId, resolveMoveOutTarget, parseTransferPayload, isFolderDescendant } from "../model/useFolderMove";
export { useDownloadCollection, downloadCollectionAsZip } from "../model/useDownloadCollection";
