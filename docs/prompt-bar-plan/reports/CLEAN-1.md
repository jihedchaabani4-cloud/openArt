# CLEAN-1 Report: Remove Unused Variables Added by the Plan

## 1. Measurement (`42c32fa` vs `HEAD` before cleanup)

- **Why earlier whole-repo runs showed `277` vs `279`**:
  - `npx eslint .` (via `npm run lint`) lints the entire repository root, including untracked or scratch scripts in `scratch/audit.js` (1 warning) and temporary scripts in `docs/prompt-bar-plan/scratch/` (1–2 warnings during audit runs).
  - Running `npx eslint src -f json` scopes linting deterministically to `src/`. Two consecutive runs at `6fdfb25` (`src_head1.json` and `src_head2.json`) produced identical output (`[VERIFIED]`).

| Scope | Base (`42c32fa`) | Before CLEAN-1 (`6fdfb25`) | After CLEAN-1a (`e54265f`) | After CLEAN-1b |
|---|---|---|---|---|
| `npx eslint src` warnings | `234` (1 error in `MediaGridItem.jsx`) | `275` (1 error in `MediaGridItem.jsx`) | `253` (1 error) | `231` (1 error) |
| `npx eslint src/features/prompt-bar` | `0 errors, 37 warnings` | `0 errors, 71 warnings` | `0 errors, 57 warnings` | `0 errors, 35 warnings` |
| Added `no-unused-vars` in `src/` (`42c32fa..HEAD`) | `0` | `44` (`22` prod + `22` test) | `22` (`0` prod + `22` test) | `0` (`0` prod + `0` test) |

## 2. Set Difference of Warnings (`42c32fa` -> `6fdfb25`)

Every warning in the set difference (`HEAD \ base`) belonged to a file created or modified by `42c32fa..6fdfb25`:

### Production `no-unused-vars` Fixed in `pb7(CLEAN-1a)` (`e54265f`) — 22 warnings across 13 files
1. `src/features/prompt-bar/api/promptBarService.js:43` — `'targetKey'` (kept `identityKey(targetIdentity)` validation call).
2. `src/features/prompt-bar/model/usePromptStore.js:10` — `'get'` parameter.
3. `src/features/prompt-bar/platform/PromptBarPlatform.jsx:3,108,215` — `'React'`, `'store'`, `'currentRatio'` (3 warnings).
4. `src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx:1` — `'React'`.
5. `src/features/prompt-bar/platform/parts/PromptBarTopPanel.jsx:1` — `'React'`.
6. `src/features/prompt-bar/store/commands/selectModel.js:8` — `'fail'`, `'REASONS'` (2 warnings).
7. `src/features/prompt-bar/store/createPromptBarStore.js:20,22` — `'getEntityImageCount'`, `'getModelReferenceCapability'` (2 warnings).
8. `src/features/prompt-bar/store/usePromptBarRouteWatcher.js:3` — `'useRef'`.
9. `src/features/prompt-bar/templates/CharacterPromptBar.jsx:3` — `'React'`.
10. `src/features/prompt-bar/templates/GeneratedPromptBar.jsx:3` — `'React'`.
11. `src/features/studio/core/mediaReferenceService.js:21,40,233,271` — `'autoAssignReference'`, `'getAssetId'`, `'cleanTagsForAsset'`, `'e'`, and 2x `'featureConfig'` aliased to `_featureConfig` (6 warnings).
12. `src/features/workflows/model/useMediaActions.js:23,124` — `'isEditPage'`, `'refs'` (2 warnings).
13. `src/shared/ui/selector-card.jsx:3` — `'React'`.

### Test `no-unused-vars` Fixed in `pb7(CLEAN-1b)` — 22 warnings across 14 files
1. `src/features/prompt-bar/__tests__/GeneratedPromptBar.test.jsx:2` — `'React'`.
2. `src/features/prompt-bar/__tests__/PromptBarControlsRow.test.jsx:2` — `'React'`.
3. `src/features/prompt-bar/__tests__/PromptBarSlotsRow.test.jsx:2` — `'React'`.
4. `src/features/prompt-bar/__tests__/PromptBarTopPanel.test.jsx:2,25` — `'React'`, `'container'` (2 warnings).
5. `src/features/prompt-bar/__tests__/characterTemplate.test.jsx:1` — `'React'`.
6. `src/features/prompt-bar/__tests__/editorFocus.test.jsx:10` — `'screen'`.
7. `src/features/prompt-bar/__tests__/minPromptLengthContract.test.jsx:1` — `'React'`.
8. `src/features/prompt-bar/__tests__/multiInstanceLifecycle.test.jsx:8` — `'React'`.
9. `src/features/prompt-bar/__tests__/promptBarService.test.js:11,15,80` — `'identityKey'`, `'enqueuePendingAction'`, `'serviceB'` (kept `promptBarService(identityB, ...)` call) (3 warnings).
10. `src/features/prompt-bar/__tests__/promptOnlyTemplate.test.jsx:13,72` — `'React'`, `'renderResult'` (kept `mountPromptOnlyBar()` call) (2 warnings).
11. `src/features/prompt-bar/__tests__/selectModelTrimming.test.jsx:10` — `'React'`.
12. `src/features/prompt-bar/__tests__/switchModeCommand.test.js:11,229` — `'fixtureModels'`, `'expectedModelId'` (2 warnings).
13. `src/features/prompt-bar/__tests__/templateActions.test.js:12` — `'fixtureModels'`.
14. `src/features/prompt-bar/__tests__/usePromptBarRouteWatcher.test.jsx:2,7,99` — `'React'`, `'act'`, `'removeSaved'`, `'studioIdentity'` (4 warnings).

### Non-`no-unused-vars` Warnings Left Untouched (Per Scope Rule 2)
- `src/features/prompt-bar/platform/PromptBarPlatform.jsx:126,127` (`react-hooks/exhaustive-deps` on `setActiveMode`/`setActiveSubMode` fallback expressions)
- `src/features/prompt-bar/store/PromptBarStoreContext.js:227` (`react-hooks/exhaustive-deps` on `instanceMeta`)
- `src/features/prompt-bar/platform/parts/PromptBarControlsRow.jsx:59` (`@next/next/no-img-element` — moved from `PromptBarPlatform.jsx`)
- `src/shared/ui/selector-card.jsx:54` (`@next/next/no-img-element`)
- Pre-existing `231` warnings in `src/` and `1` error in `src/widgets/StudioLayout/GenerationsStudio/MediaGridItem/MediaGridItem.jsx:294`.

## 3. Verification (`[VERIFIED]`)
- `npx eslint src/features/prompt-bar`: `0 errors, 35 warnings` (<= 37 base).
- `npx eslint src`: `231 warnings` (<= 234 base).
- `npm test -- --run`: `72 passed (72)`, `494 passed (494)`.
- `npm run build`: Passes cleanly.

## 4. Self-Review Rubric (2.3)
- Scope & Minimality: 20/20
- Tests & Hermeticity: 20/20
- Architecture & Purity: 20/20
- Honesty & Evidence: 20/20
- Zero Visual / Behavior Change: 20/20
- **Total: 100/100**
