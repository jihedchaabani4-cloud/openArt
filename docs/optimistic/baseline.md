# Optimistic Updates: Phase 0 baseline + état actuel

Date: 2026-10-10 · Scope: my-app/ only · Aucune modification de code dans cette phase.

## T0.1 Baseline

| Check | Résultat | Tag |
|---|---|---|
| ESLint (`npx eslint src`, my-app) | **0 errors, 220 warnings** | VERIFIED |
| Frontend tests | **Pas de test runner.** `package.json` scripts = `dev`, `build`, `start`, `lint`. Ni jest, ni vitest, ni @testing-library dans les devDependencies | VERIFIED |
| `next build` | NOT-RUN : l'utilisateur a demandé de ne plus lancer le build dans cette session (le dev server tourne, `.next/` est verrouillé). Commande pour l'humain : `cd my-app; npx next build`. Dernier build OK connu : Phase D (`cd79f41`) | NOT-RUN |
| Backend tests | Pas lancés (hors scope ; 13 échecs workflowMedia connus et préexistants) | NOT-RUN |
| Working tree my-app | **12 fichiers modifiés non commités, pas de moi** : assets/page.js, collection/[collectionId]/page.js, shared/api/client.js, shared/lib/displayUtils.js, CoreMediaItemView, NavbarBackButton, MediaGridItem, StudioNavbar (+Center/Left/Right), ConfirmDeleteDialog. L'analyse T0.2 porte sur la **version du working tree** | VERIFIED (`git status --short`) |

### Vérification du contexte du prompt

| Hypothèse du prompt | Réalité | Tag |
|---|---|---|
| foldersApi pessimiste (onSuccess + invalidate) | **Vrai.** `useCreateFolder`, `useUpdateFolder`, `useDeleteFolder`, `useMoveAssetToFolder` (dans `features/folders/mutations/`) n'ont aucun `onMutate` ni `onError`. `foldersApi.js` est un shim d'une ligne | VERIFIED |
| `cacheHelpers.js` a 2 exports | **Vrai** : `stripWorkflowPrefix`, `matchMediaId` | VERIFIED |
| `queryKeys.projectData.byProject`, `queryKeys.folders.byProject` | Vrai, plus `queryKeys.folders.all()` (invalidé aussi par les 4 mutations folders) | VERIFIED `shared/api/queryKeys.js:38-44` |

> [!WARNING]
> `docs/refactor/final-report.md` (Phase F, commit `aaa39b4`) dit que `cacheHelpers.js` a 5 helpers (`matchWorkflowId`, `patchFolderIds`, `matchFolderId`…). **C'est faux** : seuls 2 existent. Le rapport sera corrigé dans un commit docs séparé.

## T0.2 Les handlers UI aujourd'hui

Les 4 mutations folders, plus `useUpdateWorkflow` et `useDeleteMedia`, sont **pessimistes** : rien ne change dans le cache avant `onSuccess` → invalidate → refetch.

| Fichier:ligne | Handler → mutation | `await` ? | Ce qui se passe aujourd'hui dans l'app |
|---|---|---|---|
| `MediaGridItem.jsx:743` | `handleDrop` → `moveAsset` | ❌ fire-and-forget, `.catch(() => {})` | La carte **ne bouge pas** avant PATCH + refetch de `projectData` + `folders`. Si erreur : **avalée en silence**, aucun message, rien à annuler |
| `MediaGridItem.jsx:754` | `handleDrop` → `updateFolder({parentId})` | ❌ fire-and-forget, catch vide | Pareil. Un `FOLDER_CYCLE` ne s'affiche jamais |
| `MediaGridItem.jsx:813` | `handleRename` → `updateFolder({name})` | ✅ await | `InlineRenamePill` reste en "saving" jusqu'au PATCH, puis se ferme. L'invalidate n'est pas attendu, donc l'ancien nom peut réapparaître un instant (INFERRED). Si erreur : `console.error`, la pill reste ouverte, aucun message |
| `MediaGridItem.jsx:820` | `handleDelete` → `deleteFolder` | ✅ await | Le dialog reste ouvert jusqu'au DELETE. Si erreur : `alert()` puis rethrow (c'est le seul endroit où `FOLDER_NOT_EMPTY` est visible) |
| `StudioNavbarLeft.jsx:108` | `executeMoveToParent` → `moveAsset` | ❌ fire-and-forget, `.catch(() => {})` | Même problème que MediaGridItem:743 |
| `StudioNavbarLeft.jsx:116` | `executeMoveToParent` → `updateFolder({parentId})` | ❌ fire-and-forget, catch vide | Pareil |
| `StudioNavbarLeft.jsx:182` | `handleSaveName` → `updateFolder({name})` | ✅ await | Bloquant. `EditableDisplayName` attend `onSave` **sans try/catch** : si erreur → unhandled rejection, `setIsEditing(false)` n'est jamais appelé, l'input reste en mode édition |
| `StudioNavbarLeft.jsx:192` | `handleDelete` → `deleteFolder` | ✅ await | Bloquant. Si erreur : **seulement `console.error`**, le dialog reste ouvert, l'utilisateur ne voit pas `FOLDER_NOT_EMPTY` |
| `collection/[collectionId]/page.js:147` | `handleRootDrop` → `moveAsset` | ❌ fire-and-forget, catch vide | Même problème que MediaGridItem:743 |
| `collection/[collectionId]/page.js:158` | `handleRootDrop` → `updateFolder({parentId})` | ❌ fire-and-forget, catch vide | Pareil |
| `EditNavbar.jsx:102` | `handleEditWorkflowName` → `updateWorkflow` | ✅ await (via EditableDisplayName) | Bloquant. Même bug no-catch que `StudioNavbarLeft:182` |
| `EditNavbar.jsx:130` | `handleDeleteMedia` → `deleteMedia` | ✅ await | Bloquant, puis redirect si c'était le dernier item. Si erreur : unhandled rejection, aucun message |
| `InlineRenamePill.jsx:46-54` | wrapper `onSave` | ✅ await + try/catch | Si erreur : `console.error`, reste ouvert |
| `EditableDisplayName.jsx:55-63` | wrapper `onSave` (onBlur) | ✅ await, **pas de try/catch** | Si erreur : rejet non géré, reste en mode édition |

### Constat principal (à corriger en Phase 2, PAS maintenant)

> [!IMPORTANT]
> **6 appels dans 3 handlers** (MediaGridItem `handleDrop`, StudioNavbarLeft `executeMoveToParent`, collection page `handleRootDrop`) sont **fire-and-forget avec un catch vide, posés sur des mutations pessimistes**. Leurs commentaires disent « optimistic update runs in onMutate / onError restores » : **ce `onMutate` n'existe pas** (il a disparu avec le revert de foldersApi).
> Résultat aujourd'hui pour **move** (drag/drop) : pas de retour instantané **et** erreurs totalement invisibles.
> Pour **rename** et **delete folder** : bloquant. Les erreurs sont visibles seulement dans MediaGridItem (alert) et invisibles dans StudioNavbarLeft.

## Ce que j'ai remarqué sans y toucher
- Pas de librairie de toast dans le projet (ni sonner, ni react-hot-toast, ni react-toastify, ni useToast). VERIFIED (`rg` sur package.json et src)
- Pas de logger structuré côté frontend (aucun fichier `*logger*` dans `my-app/src`). VERIFIED
- `console.error` dans `StudioNavbarLeft.jsx:207` et `InlineRenamePill.jsx:52`
