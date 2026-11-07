# Optimistic Updates: task plan

Règle pour chaque mutation convertie : `cancelQueries` → snapshot → patch de toutes les clés liées (`onMutate`) · l'API part tout de suite, le handler n'attend pas · `onError` → restauration du snapshot + toast · `onSettled` → invalidate (sync avec le serveur, vrais ids).
Fin de chaque phase : ESLint 0 nouvelle erreur · build OK · tests ≥ baseline · smoke test · un commit par tâche · STOP en attendant "go".

## Open questions (à trancher avant Phase 1)

1. **Pas de test runner frontend.** Proposition : `vitest` + `@testing-library/react` + `jsdom` en devDependencies, plus un script `"test": "vitest run"`. Je n'installe rien sans ton accord.
2. **Pas de librairie de toast.** Options : (a) ajouter `sonner` (~3 kB, s'intègre avec shadcn) ; (b) un petit composant toast maison dans `shared/ui`. Recommandé : (a).
3. **Pas de logger frontend.** Options : (a) créer `shared/lib/logger.js` (wrapper avec niveau + champs ; no-op en prod sauf `error`) ; (b) pas de log, seulement le toast. Recommandé : (a). Le prompt interdit d'en inventer un sans accord.
4. **Règle `isMutating > 1` de T1.1.** Il faut un `mutationKey` par entité (ex. `["folder", folderId]`) pour que `queryClient.isMutating({ mutationKey })` cible le bon item. Proposition : `useOptimisticMutation` accepte un `getMutationKey(vars)` optionnel ; sans lui, invalidate normal.

## Phase 0: état actuel ✅
- [x] T0.1 Baseline ESLint / tests / build | docs/optimistic/baseline.md | 0 err / 220 warn, pas de runner, build NOT-RUN
- [x] T0.2 Inventaire des handlers UI | baseline.md §T0.2 | 6 appels fire-and-forget sur mutations pessimistes trouvés
- [x] T0.3 Ce plan | docs/optimistic/plan.md | relu par l'humain

## Phase 1: fondations (aucun hook existant converti) ✅
- [x] T1.0 Mettre en place les décisions des open questions 1-3 (devDeps, script test, toast provider, logger) | package.json, app layout, shared/lib/logger.js | commit 206f8ea
- [x] T1.1 `useOptimisticMutation` | shared/lib/optimistic/useOptimisticMutation.js | commit e730df1
- [x] T1.2 `cacheOps` (fonctions pures) : patchWorkflowFolder, patchFolderParent, patchFolderName, removeById, matchWorkflowId | shared/lib/optimistic/cacheOps.js + docs/optimistic/cacheops-audit.md | commit e730df1
- [x] T1.3 `notifyOptimisticError` | shared/lib/optimistic/notifyOptimisticError.js | sonner toast + logger
- [x] T1.4 Tests unitaires | shared/lib/optimistic/__tests__/ | 32/32 tests passants
- [x] T1.5 Vérification + rapport | docs/optimistic/phase-1-report.md | commit e730df1

## Phase 2: folders + move (la référence) ✅
- [x] T2.1 `useMoveAssetToFolder` → optimiste (projectData : 4 variantes folder_id) | features/folders/mutations/useMoveAssetToFolder.js | commit 844805f
- [x] T2.2 `useUpdateFolder` → optimiste (rename + move parentId/parent_id) dans folders.byProject + projectData | useUpdateFolder.js | commit 844805f
- [x] T2.3 `useDeleteFolder` → optimiste ; FOLDER_NOT_EMPTY → restauration + toast | useDeleteFolder.js | commit 844805f
- [x] T2.4 Nettoyage des handlers : enlever les catch vides et les commentaires faux, delete/rename sans attente bloquante | MediaGridItem, StudioNavbarLeft, collection page | commit 844805f
- [x] T2.5 Smoke test + rapport | docs/optimistic/phase-2-report.md | commit 844805f

## Phase 3: priorité 1 (gros impact UX) ✅
- [x] T3.1 `useUpdateWorkflow` (display_name + metadata.displayName dans workflows[] / characters[] / elements[]) | workflows/api/mutations/useUpdateWorkflow.js | commit 3b7fc70
- [x] T3.2 `useUpdateCharacter` | characters/hooks/useUpdateCharacter.js | commit 3b7fc70
- [x] T3.3 `useDeleteMedia`, `useRemoveWorkflowItem`, `useDeleteMediaItem` (sur le modèle de `useRemoveAsset`) | 3 fichiers | commit 3b7fc70
- [x] T3.4 `useCreateFolder` : id temporaire remplacé par le vrai id dans onSuccess | useCreateFolder.js | commit 3b7fc70
- [x] T3.5 EditNavbar delete sans attente bloquante, navigation directe ; EditableDisplayName gère le rejet | EditNavbar.jsx, EditableDisplayName.jsx | commit 3b7fc70

## Phase 4: priorité 2 ✅
- [x] T4.1 `useSetPrimaryMedia`, `useDetachMedia` | 2 fichiers | instantané + restauration | commit fec7786
- [x] T4.2 `useAddImageToElement`, `useAddMediaToCharacter`, `useSetCharacterSheetMedia` (aperçu blob + statut uploading, comme `useBatchUploadAssets`) | 3 fichiers | aperçu immédiat, URLs blob révoquées | commit fec7786

## Phase 5: bugs connus ✅
- [x] T5.1 `removeDetailImage` → en réalité `useRemoveMediaFromCharacter` (fichier split) : optimiste + restauration si l'API échoue | characters/hooks/useRemoveMediaFromCharacter.js | commit d8c439b
- [x] T5.2 `useBatchUploadAssets` écrit les 4 variantes folder_id sur le workflow optimiste | media/api/mutations/useBatchUploadAssets.js | commit d8c439b
- [x] T5.3 `console.*` → logger dans les 6 hooks/UI déjà touchés par l'initiative (le reste listé dans phase-5-report) | commit d8c439b
- [x] T5.4 Stub mort `useMoveWorkflow` : JSDoc @deprecated, non supprimé | useMoveWorkflow.js | commit d8c439b

## Phase 6: race conditions ✅
- [x] T6.1 move puis delete sur le même item : seul le dernier settle invalide (tracker par entité ; l'ancien guard `isMutating` ne se déclenchait jamais) | useOptimisticMutation + entityTracker | commit e298557
- [x] T6.2 Plusieurs mutations sur le même item : rollback seulement si seule et la plus récente, sinon sync serveur par le dernier settle | useOptimisticMutation | commit e298557

## Phase 7: projects ✅
- [x] T7.1 create / update / delete project optimistes | features/projects/api/projectsApi.js | commit 14f110c

## Restent pessimistes (le serveur génère des données qu'on ne peut pas deviner)
`useCheckout`, auth, `useGenerateCharacterDescriptionMutation`, `useAnalyzeElementVision`, `useExtendVideoMutation`, `useGenerateCharacterSheetMutation`.
