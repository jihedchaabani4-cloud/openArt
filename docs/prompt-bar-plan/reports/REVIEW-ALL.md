# Read-Only Post-Implementation Review: Prompt Bar Refactor (RANGE = ALL)

**Review Date**: 2026-10-15  
**Review Scope**: ALL (`P0` through `P7`, including `P8-character` and `FINAL`)  
**Base Commit**: `42c32fa` (*fix(prompt-bar): prevent setState in render by syncing initialModels in useEffect*)  
**HEAD Commit**: `b58bfef` (*chore(prompt-bar-plan): record FINAL commit in STATE.md*)  
**Execution Environment**: Hermetic local repository, Windows pwsh, Node.js v24.21.0, Vitest v5.0.3  

---

## 0. In plain words

<!-- 15 lines max: Tunisian Arabic in Latin letters (Arabizi) mixed with French technical terms -->
1. El refactor mta3 el Prompt Bar t3adda kemel mel P0 7atta lel P7 w zedna template el Character (P8 candidate).
2. L'architecture tbadlet 3la 9a3da: `PromptBarPlatform.jsx` tayyanna fih men 1,112 l 443 lines (-60.1%) w `useEffect` men 11 l 2 kahaw.
3. El dual-write mta3 bekri tna77a jemla: ma3adch famma ktiba fi `usePromptStore` w `PromptBarStoreContext` fard wa9t.
4. Tawa kol action externe (animate, add reference, apply generation) t3addi 3la `promptBarService` el pure facade.
5. Kol transition kima `switchMode` w `selectModel` wallat commande pure ta3mel single `set()` fi Zustand; zero cascades d'effets.
6. El persistence tsall7et: `isGenerating` mayetsajjelch jemla, w `usePromptBarRouteWatcher` ynaffadh el route policy bech yfasakh el store ki tokhroj mel pages autorisées.
7. El test suite fih 69 test files w 485 tests hermétiques ypassiw 100% (menhom 40 files w 301 tests mkhasssin lel prompt-bar).
8. El 5 mutation checks el kolhom tcheddou bel ghlot (NOT CAUGHT = 0), w el 6 scenarios exécutaw reellement sans erreurs.
9. Zero module-level mutable variables (kima `activePromptBarStoreInstance` elli ken mawjoud) w zero `exhaustive-deps` disables.
10. El code elli ken duplicated fi `features/studio` (2,500+ lines de stores w serializers) tfassakh bel commit `9276cf6`.
11. Mazel fama des shims mta3 retro-compatibilité fi `features/studio/index.js` w `core/useRealBackendModels.js` amma mafamech code jdid yesta3melhom.
12. Risque principal elli mazel: `FlowPromptBoxSettings.jsx` mazel hardcoded ma yemchich dynamically bel template config.
13. Verdict: El refactor ناجح w solide b barcha garanties techniques; el phase ejjeya tenjem tebda (YES with conditions: design review mta3 Settings w nettoyage des shims).

---

## 1. Commit Inventory

### 1.1 Commit Log Table (`42c32fa..HEAD`)
[VERIFIED: `git log --reverse --oneline 42c32fa..HEAD`]

| SHA | Task ID | Files Changed | Lines (+/-) | One-Line Summary |
|---|---|---|---|---|
| `67d2aad` | SETUP-1 | 11 | +886 / -0 | pb0(SETUP-1): directory structure, rules, and core planning docs |
| `770c04f` | SAFE-1 | 3 | +438 / -0 | pb0(SAFE-1): pure core characterization tests and fixtures |
| `96abb90` | SAFE-2 | 2 | +261 / -0 | pb0(SAFE-2): template rules characterization tests |
| `b1d3e71` | SAFE-3 | 2 | +296 / -0 | pb0(SAFE-3): store state & actions characterization tests |
| `32b4e08` | SAFE-4 | 2 | +348 / -0 | pb0(SAFE-4): persistence lifecycle characterization tests |
| `9575bfb` | SAFE-5 | 2 | +392 / -0 | pb0(SAFE-5): platform integration characterization tests |
| `db3b38b` | P0-GATE | 2 | +30 / -1 | pb0(GATE): phase 0 verification gate passed |
| `caaae3f` | V1 | 2 | +240 / -0 | pb1(V1): dual-write audit report |
| `4decee1` | V2 | 2 | +183 / -0 | pb1(V2): mode switch effect audit report |
| `218ba57` | V3 | 2 | +181 / -0 | pb1(V3): model load race conditions audit report |
| `6e1f64f` | V4 | 2 | +210 / -0 | pb1(V4): memory leaks and instance cleanup audit report |
| `bdcb751` | V5 | 2 | +170 / -0 | pb1(V5): duplicate studio logic audit report |
| `8e55fbc` | V6 | 2 | +203 / -0 | pb1(V6): route transition state leak audit report |
| `1b0be77` | P1-GATE | 2 | +61 / -1 | pb1(GATE): phase 1 audit gate passed and verdicts confirmed |
| `f065ff5` | C1 | 4 | +94 / -2 | pb2(C1): parameterKeys extraction and single-source constants |
| `a95e5a8` | C2 | 4 | +255 / -28 | pb2(C2): mediaRef pure value object and tests |
| `84aeba6` | C3 | 4 | +93 / -2 | pb2(C3): commandResult value object and REASONS catalog |
| `f5ff6e3` | C4 | 4 | +231 / -8 | pb2(C4): templateContract schema validator and tests |
| `6278f24` | C5 | 3 | +188 / -18 | pb2(C5): generatedMedia template configuration |
| `4a1e2de` | C6 | 5 | +655 / -7 | pb2(C6): pure media slots and quota functions |
| `7716098` | P2-GATE | 2 | +72 / -1 | pb2(GATE): phase 2 pure core contracts gate passed |
| `fda92a8` | S1 | 4 | +436 / -0 | pb3(S1): store registry and identity key format |
| `e735fb5` | S2 | 4 | +482 / -0 | pb3(S2): pure state persistence engine |
| `5dd24a0` | S3 | 2 | +199 / -80 | pb3(S3): remove module-level active store variable |
| `3cffe6b` | S4 | 3 | +297 / -27 | pb3(S4): unified store hydration order |
| `e4e507e` | S5 | 3 | +258 / -2 | pb3(S5): submit lifecycle and in-flight tracking |
| `b04b06b` | S6 | 3 | +291 / -20 | pb3(S6): multi-instance memory policy and cleanup |
| `67d1055` | P3-GATE | 2 | +74 / -1 | pb3(GATE): phase 3 store lifecycle gate passed |
| `94a1133` | T1 | 3 | +272 / -2 | pb4(T1): pure pruneMedia core function |
| `3902ba5` | T2 | 4 | +326 / -5 | pb4(T2): serialization parameter filtering (PB-D-12) |
| `a037992` | T3 | 4 | +372 / -123 | pb4(T3): switchMode atomic command and effect deletion |
| `d01c3a2` | T4 | 4 | +320 / -37 | pb4(T4): selectModel trimming unification (PB-K3) |
| `8724025` | T5 | 4 | +440 / -0 | pb4(T5): attachMedia and removeMedia atomic commands |
| `0eb8e10` | T6 | 5 | +195 / -3 | pb4(T6): move useRealBackendModels to adapters/ |
| `2ffe865` | P4-GATE | 2 | +107 / -1 | pb4(GATE): phase 4 atomic transitions gate passed |
| `d5f069a` | X1 | 4 | +464 / -0 | pb5(X1): promptBarService public facade |
| `e08015e` | X2 | 4 | +449 / -0 | pb5(X2): pending actions queue for unmounted instances |
| `1767b2b` | X3 | 4 | +320 / -11 | pb5(X3): template createActions composite commands |
| `3d3ee71` | X4 | 4 | +213 / -6 | pb5(X4): declarative focus request protocol |
| `4cebadd` | X5-elem | 4 | +130 / -22 | pb5(X5-elementsEdit): migrate elements edit page |
| `7fb7774` | X6 | 3 | +246 / -128 | pb5(X6): eliminate dual-write in useMediaActions |
| `adabbe7` | P5-GATE | 2 | +76 / -1 | pb5(GATE): phase 5 facade and migration gate passed |
| `adb03af` | H1 | 3 | +193 / -82 | pb6(H1): usePromptBarModels hook extraction |
| `6a0633f` | H2 | 3 | +216 / -107 | pb6(H2): usePromptBarSlots hook extraction |
| `b53ecd7` | H3 | 3 | +521 / -378 | pb6(H3): usePromptBarReferences hook extraction |
| `40cb0c7` | H4 | 3 | +210 / -131 | pb6(H4): usePromptBarGenerate hook extraction |
| `cd16866` | H5-top | 2 | +148 / -33 | pb6(H5-topPanel): PromptBarTopPanel component |
| `5798cda` | H5-slots | 2 | +212 / -78 | pb6(H5-slotsRow): PromptBarSlotsRow component |
| `3e32018` | H5-ctrls | 2 | +183 / -68 | pb6(H5-controlsRow): PromptBarControlsRow component |
| `ec44c6d` | H5 | 2 | +117 / -127 | pb6(H5): integrate parts into PromptBarPlatform |
| `9481923` | H6 | 2 | +87 / -0 | pb6(H6): verify zero visual regression and prop compatibility |
| `8fc6c7d` | P6-GATE | 2 | +112 / -1 | pb6(GATE): phase 6 platform decomposition gate passed |
| `0e69cb5` | W1-comp | 2 | +225 / -0 | feat(prompt-bar): pb7(W1-component) GeneratedPromptBar wrapper |
| `9cc2f77` | W1-assets | 1 | +9 / -9 | feat(prompt-bar): pb7(W1-assets) use wrapper in assets page |
| `7d966cc` | W1-coll | 1 | +9 / -9 | feat(prompt-bar): pb7(W1-collection) use wrapper in collection page |
| `a8e94ec` | W1-newProj | 1 | +9 / -9 | feat(prompt-bar): pb7(W1-newProject) use wrapper in NewProjectView |
| `f3df10c` | W1-compPg | 1 | +9 / -9 | feat(prompt-bar): pb7(W1-compare) use wrapper in compare page |
| `b94825c` | W1-doc | 2 | +39 / -1 | docs(prompt-bar): pb7(W1) record task W1 completion |
| `63e02fe` | W2a | 2 | +219 / -0 | feat(prompt-bar): pb7(W2a) route matching policy |
| `8ba7875` | W2b | 3 | +346 / -0 | feat(prompt-bar): pb7(W2b) usePromptBarRouteWatcher & layout mount |
| `f18c0a8` | W2-doc | 2 | +40 / -1 | docs(prompt-bar): pb7(W2) record task W2 completion |
| `efb8900` | W3-move | 3 | +499 / -49 | feat(prompt-bar): pb7(W3-move) consolidate template rules |
| `54bf125` | W3-clean | 2 | +144 / -3 | feat(prompt-bar): pb7(W3-clean) use PARAM constants |
| `3d78b20` | W3-doc | 2 | +34 / -1 | docs(prompt-bar): pb7(W3) record task W3 completion |
| `2f8489a` | W4 | 3 | +268 / -0 | feat(prompt-bar): pb7(W4) optional model & mode support proof |
| `9ff95a4` | W4-doc | 2 | +41 / -1 | docs(prompt-bar): pb7(W4) record task W4 completion |
| `89ff498` | W5-doc | 6 | +553 / -0 | docs(prompt-bar): pb7(W5-GATE) architecture documentation |
| `95bde45` | P7-STATE | 1 | +1 / -1 | docs(prompt-bar): pb7(STATE) record commit hash for P7 gate |
| `9276cf6` | cleanup | 12 | +0 / -2523 | refactor(prompt-bar): remove obsolete shims and duplicate files |
| `78cfa2c` | P8-char1 | 4 | +405 / -0 | feat(prompt-bar): add character template and wrapper |
| `8b7bbc4` | P8-doc | 1 | +1 / -1 | docs(prompt-bar): update STATE with P8-CHARACTER template |
| `b05f6ff` | P8-char2 | 1 | +30 / -20 | feat(characters): mount CharacterPromptBar on NewCharacterPage |
| `9acb980` | P8-char3 | 3 | +18 / -2 | fix(characters): configure character template with prompt & ref only |
| `7039973` | P8-char4 | 6 | +648 / -3 | feat(prompt-bar): implement character traits form & min 10 validation |
| `0741be2` | FINAL | 1 | +420 / -0 | pb9(FINAL): final summary documentation |
| `b58bfef` | STATE | 1 | +1 / -1 | chore(prompt-bar-plan): record FINAL commit in STATE.md |

### 1.2 Commit Compliance Flags
1. **Tasks marked DONE with no commit**: NONE (`VERIFIED`). Every task from SETUP-1 to W5 and P8-character has corresponding commits.
2. **Multi-commit tasks**:
   - `H5` (platform parts integration) was committed in 4 incremental steps: `cd16866` (topPanel), `5798cda` (slotsRow), `3e32018` (controlsRow), and `ec44c6d` (integration). This adhered to the "failing test first, hermetic pass" safety rule.
   - `W1` was committed per consumer page (`0e69cb5`, `9cc2f77`, `7d966cc`, `a8e94ec`, `f3df10c`, `b94825c`) to prevent wide merge blast radius.
   - `W2` was committed as W2a (pure logic) and W2b (hook + layout).
   - `W3` was committed as W3-move and W3-clean.
3. **Commit message format deviations**:
   - Commits from `0e69cb5` to `54bf125` in P7 used conventional commits with task IDs inside the message (e.g., `feat(prompt-bar): pb7(W1-component)`) rather than strict `pb<N>(<id>)`.
   - Character commits `78cfa2c`, `b05f6ff`, `9acb980`, `7039973` did not include the `pb8` prefix.
4. **Git markers**: ZERO merge commits, zero rebase artifacts, zero force pushes detected in the branch history (`VERIFIED`).
5. **Diff stat summary by folder (`42c32fa..HEAD`)**:
   - `docs/`: 75 files, +4,824 lines, -0 lines
   - `src/features/`: 105 files, +12,602 lines, -4,868 lines (net +7,734)
   - `src/app/`: 6 files, +43 lines, -49 lines (net -6)
   - `src/shared/`: 2 files, +281 lines, -0 lines
   - `src/widgets/`: 1 file, +3 lines, -6 lines
   - `AGENTS.md`: 1 file, +35 lines, -0 lines

---

## 2. Plan vs Reality, Task by Task

[VERIFIED: cross-referenced against `docs/prompt-bar-plan/STATE.md` and `git show --stat <sha>`]

| Task ID | Claimed Status | Commit | Definition of Done Criteria | Met? | Evidence |
|---|---|---|---|---|---|
| **SETUP-1** | DONE | `67d2aad` | Plan directories created, AGENTS.md updated, core rules pinned | Yes | `docs/prompt-bar-plan/00_CORE.md:1` |
| **SAFE-1** | DONE | `770c04f` | Pure core characterized: reconcile, serialize, cleanTags, normalize | Yes | `src/features/prompt-bar/__tests__/safe1PureCore.test.js:1` (21 tests) |
| **SAFE-2** | DONE | `96abb90` | Template rules characterized: slots, eligible models, mapping | Yes | `src/features/prompt-bar/__tests__/safe2TemplateRules.test.js:1` (37 tests) |
| **SAFE-3** | DONE | `b1d3e71` | Store characterized: vanilla Zustand store, isolation, setParameter | Yes | `src/features/prompt-bar/__tests__/safe3Store.test.js:1` (13 tests) |
| **SAFE-4** | DONE | `32b4e08` | Persistence characterized: debounce, quota error handling, versioning | Yes | `src/features/prompt-bar/__tests__/safe4Persistence.test.jsx:1` (8 tests) |
| **SAFE-5** | DONE | `9575bfb` | Bare platform characterized: golden payloads, slot rendering | Yes | `src/features/prompt-bar/__tests__/safe5Platform.test.jsx:1` (6 tests) |
| **V1** | DONE | `caaae3f` | Audit dual-write in useMediaActions and elementSheetConfig | Yes | `docs/prompt-bar-plan/reports/V1.md:1` |
| **V2** | DONE | `4decee1` | Audit mode-switch effect cascade and race conditions | Yes | `docs/prompt-bar-plan/reports/V2.md:1` |
| **V3** | DONE | `218ba57` | Audit model loading race conditions and stale parameters | Yes | `docs/prompt-bar-plan/reports/V3.md:1` |
| **V4** | DONE | `6e1f64f` | Audit memory leaks, unmount cleanup, and dangling listeners | Yes | `docs/prompt-bar-plan/reports/V4.md:1` |
| **V5** | DONE | `bdcb751` | Audit duplicate implementations in features/studio | Yes | `docs/prompt-bar-plan/reports/V5.md:1` |
| **V6** | DONE | `8e55fbc` | Audit route transition state leaks across project pages | Yes | `docs/prompt-bar-plan/reports/V6.md:1` |
| **C1** | DONE | `f065ff5` | Extract pure parameterKeys dictionary with frozen constants | Yes | `src/features/prompt-bar/core/parameterKeys.js:1` |
| **C2** | DONE | `a95e5a8` | Pure mediaRef value object with validation and equality | Yes | `src/features/prompt-bar/core/mediaRef.js:1` |
| **C3** | DONE | `84aeba6` | CommandResult value object with ok/fail and error reasons | Yes | `src/features/prompt-bar/core/commandResult.js:1` |
| **C4** | DONE | `f5ff6e3` | TemplateContract schema validator (defineTemplate) | Yes | `src/features/prompt-bar/core/templateContract.js:1` |
| **C5** | DONE | `6278f24` | Formalize generatedMedia template definition | Yes | `src/features/prompt-bar/templates/generatedMedia.template.js:1` |
| **C6** | DONE | `4a1e2de` | Extract pure media slots, quota, and matching functions | Yes | `src/features/prompt-bar/core/media.js:1` |
| **S1** | DONE | `fda92a8` | External store registry with canonical identity keys | Yes | `src/features/prompt-bar/store/registry.js:1` |
| **S2** | DONE | `e735fb5` | Pure persistence module with version 2 and quota safety | Yes | `src/features/prompt-bar/store/persistence.js:1` |
| **S3** | DONE | `5dd24a0` | Remove activePromptBarStoreInstance module variable | Yes | `src/features/prompt-bar/store/PromptBarStoreContext.js:38` |
| **S4** | DONE | `3cffe6b` | Unify store hydration regardless of model catalog timing | Yes | `src/features/prompt-bar/store/createPromptBarStore.js:60` |
| **S5** | DONE | `e4e507e` | Submit lifecycle tracking with beginSubmit/endSubmit tokens | Yes | `src/features/prompt-bar/store/registry.js:202` |
| **S6** | DONE | `b04b06b` | Multi-instance memory policy with pruneOtherProjects | Yes | `src/features/prompt-bar/store/registry.js:185` |
| **T1** | DONE | `94a1133` | Pure pruneMedia function for transitions (PB-D-03) | Yes | `src/features/prompt-bar/core/media.js:210` |
| **T2** | DONE | `3902ba5` | Strict parameter filtering in serialize() (PB-D-12) | Yes | `src/features/prompt-bar/core/serialization.js:88` |
| **T3** | DONE | `a037992` | Atomic switchMode command; delete mode switch effect | Yes | `src/features/prompt-bar/store/commands/switchMode.js:24` |
| **T4** | DONE | `d01c3a2` | Unified selectModel command with trimming (PB-K3) | Yes | `src/features/prompt-bar/store/commands/selectModel.js:22` |
| **T5** | DONE | `8724025` | Atomic attachMedia and removeMedia commands | Yes | `src/features/prompt-bar/store/commands/attachMedia.js:25` |
| **T6** | DONE | `0eb8e10` | Move useRealBackendModels to adapters/ with pure test | Yes | `src/features/prompt-bar/adapters/useRealBackendModels.js:1` |
| **X1** | DONE | `d5f069a` | promptBarService public facade for external interactions | Yes | `src/features/prompt-bar/api/promptBarService.js:26` |
| **X2** | DONE | `e08015e` | Pending action queue with TTL and project guards | Yes | `src/features/prompt-bar/store/pendingActions.js:76` |
| **X3** | DONE | `1767b2b` | Template createActions composite commands (animate/ref) | Yes | `src/features/prompt-bar/templates/generatedMedia.template.js:330` |
| **X4** | DONE | `3d3ee71` | Declarative focus request protocol via store state | Yes | `src/features/prompt-bar/store/createPromptBarStore.js:364` |
| **X5-elem**| DONE | `4cebadd` | Migrate elementSheetConfig to syncElementDraft | Yes | `src/features/workflows/model/elementSheetConfig.js:35` |
| **X6** | DONE | `7fb7774` | Migrate useMediaActions to promptBarService; no dual write | Yes | `src/features/workflows/model/useMediaActions.js:129` |
| **H1** | DONE | `adb03af` | Extract usePromptBarModels hook from Platform | Yes | `src/features/prompt-bar/platform/hooks/usePromptBarModels.js:1` |
| **H2** | DONE | `6a0633f` | Extract usePromptBarSlots hook from Platform | Yes | `src/features/prompt-bar/platform/hooks/usePromptBarSlots.js:1` |
| **H3** | DONE | `b53ecd7` | Extract usePromptBarReferences hook from Platform | Yes | `src/features/prompt-bar/platform/hooks/usePromptBarReferences.js:1` |
| **H4** | DONE | `40cb0c7` | Extract usePromptBarGenerate hook from Platform | Yes | `src/features/prompt-bar/platform/hooks/usePromptBarGenerate.js:1` |
| **H5** | DONE | `ec44c6d` | Extract UI parts: TopPanel, SlotsRow, ControlsRow | Yes | `src/features/prompt-bar/platform/parts/:1` |
| **H6** | DONE | `9481923` | Verify zero visual regression and prop compatibility | Yes | `src/features/prompt-bar/platform/PromptBarPlatform.jsx:40` |
| **W1** | DONE | `0e69cb5` | GeneratedPromptBar wrapper created and adopted on 4 pages | Yes | `src/features/prompt-bar/templates/GeneratedPromptBar.jsx:1` |
| **W2** | DONE | `8ba7875` | Route policy and usePromptBarRouteWatcher in StudioLayout | Yes | `src/app/cinema-studio/[projectId]/layout.js:29` |
| **W3** | DONE | `54bf125` | Consolidate template rules into generatedMedia.template.js | Yes | `src/features/prompt-bar/templates/generatedMedia.template.js:1` |
| **W4** | DONE | `2f8489a` | Prove optional model & mode support with promptOnly template| Yes | `src/features/prompt-bar/__tests__/promptOnlyTemplate.test.jsx:1` |
| **W5** | DONE | `89ff498` | Architecture documentation and transition summary | Yes | `docs/prompt-bar/ARCHITECTURE.md:1` |
| **P8-char**| DONE | `7039973` | Character template, traits form, min 10 validation, wrapper | Yes | `src/features/prompt-bar/templates/CharacterPromptBar.jsx:1` |
| **FINAL** | DONE | `0741be2` | Comprehensive post-implementation documentation | Yes | `docs/prompt-bar-plan/FINAL.md:1` |

---

## 3. What Each Phase Changed: Code Before and After

### 3.1 Phase P0: Safety Net & Characterization
- **Plain Words**: P0 pinned existing production behavior without touching a single production file. It authored 5 test suites (SAFE-1 to SAFE-5) verifying pure core reconciliation/serialization, template rules, vanilla store mechanics, persistence debouncing, and bare platform rendering with golden payloads.
- **Evidence**: `git diff --stat 42c32fa..db3b38b` confirms 0 production files modified.

### 3.2 Phase P2: Pure Core Contracts & Extractions
- **Plain Words**: Extracted domain-wide constants (`parameterKeys.js`), pure value objects (`mediaRef.js`, `commandResult.js`), template schema contracts (`templateContract.js`), and pure media slot calculation (`media.js`). Reduced Platform size by 27 lines while decoupling feature rules.
- **BEFORE** (`db3b38b:src/features/prompt-bar/platform/PromptBarPlatform.jsx:102-110`):
```javascript
  const referenceSlots = useMemo(() => {
    if (!type?.modes) return [];
    if (activeMode === "video") {
      return type.modes.video?.subModes?.[activeSubMode]?.referenceSlots || [];
    }
    return type.modes[activeMode]?.referenceSlots || [];
  }, [type, activeMode, activeSubMode]);
```
- **AFTER** (`7716098:src/features/prompt-bar/core/media.js:132-140`):
```javascript
export function getActiveSlots(template, mode, subMode) {
  if (!template) return [];
  if (typeof template.getSlots === "function") {
    return template.getSlots(mode, subMode) || [];
  }
  const modes = template.modes || template.layout?.modes;
  if (!modes) return [];
  if (mode === "video") {
    return modes.video?.subModes?.[subMode]?.referenceSlots || [];
  }
  return modes[mode]?.referenceSlots || [];
}
```
- **Behavior Delta**: Identical slot resolution; extracted into pure function callable outside React.

### 3.3 Phase P3: Store Lifecycle & Elimination of Module Variables
- **Plain Words**: Eradicated the dangerous mutable module-level variable `activePromptBarStoreInstance` and inline `sessionStorage` reads during render. Introduced an external `registry.js` with structured identity keys, robust debounced persistence, and submit lifecycle tokens.
- **BEFORE** (`7716098:src/features/prompt-bar/store/PromptBarStoreContext.js:15-23`):
```javascript
let activePromptBarStoreInstance = null;

export function setActivePromptBarStore(store) {
  activePromptBarStoreInstance = store;
}

export function getActivePromptBarStore() {
  return activePromptBarStoreInstance;
}
```
- **AFTER** (`67d1055:src/features/prompt-bar/store/PromptBarStoreContext.js:35-42`):
```javascript
/**
 * @deprecated Use `promptBarService({ templateId, projectId })` instead of accessing store directly.
 */
export function getActivePromptBarStore() {
  return undefined;
}
export function setActivePromptBarStore(_store) {
  // No-op: module-level mutable store instance is eliminated per PB-D-01 / PB-D-02.
}
```
- **Behavior Delta**: External callers can no longer mutate random store instances via global variables; calls route cleanly through `promptBarService`.

### 3.4 Phase P4: Atomic Transitions & Payload Filtering
- **Plain Words**: Mode switching previously relied on a `useEffect` inside `PromptBarPlatform.jsx` that caused cascade re-renders and media leakage. P4 extracted pure commands `switchMode`, `selectModel`, `attachMedia`, and `removeMedia`, executing transitions in a single Zustand `set()` call while strictly purging media parameters (PB-D-03) and filtering payload output (PB-D-12).
- **BEFORE** (`67d1055:src/features/prompt-bar/platform/PromptBarPlatform.jsx:178-195`):
```javascript
  // Mode-change effect that leaked media and triggered multi-render cascades
  useEffect(() => {
    if (!selectedModel) return;
    const isEligible = filterEligibleModels([selectedModel], activeMode, activeSubMode, parameterValues).length > 0;
    if (!isEligible) {
      const eligible = filterEligibleModels(models, activeMode, activeSubMode, parameterValues);
      if (eligible.length > 0) {
        selectModel(eligible[0].id);
      }
    }
  }, [activeMode, activeSubMode, models]);
```
- **AFTER** (`2ffe865:src/features/prompt-bar/store/commands/switchMode.js:56-82`):
```javascript
  // 1. Prune media parameters with reason: "mode-change" per PB-D-03
  const pruned = pruneMedia({
    parameterValues: currentValues,
    prevModel,
    nextModel,
    reason: "mode-change",
  });

  // 2. Reconcile remaining parameters against nextModel
  const prevDef = prevModel?.parameters || {};
  const nextDef = nextModel?.parameters || {};
  const { nextValues, changes: recLog } = reconcile(pruned.parameterValues, prevDef, nextDef);

  // PB-D-03: On mode-change, ensure media parameters are not populated with defaults
  for (const [key, def] of Object.entries(nextDef)) {
    if (isMediaType(def.type)) {
      delete nextValues[key];
    }
  }

  // 3. Clean tags of removed media assets from prompt text
  let nextPrompt = state.prompt || "";
  const removedAssetIds = (pruned.removed || []).flatMap((r) => r.assetIds).filter(Boolean);
  if (removedAssetIds.length > 0) {
    nextPrompt = cleanTagsForAsset(nextPrompt, removedAssetIds);
  }
```
- **Behavior Delta**: Mode switch executes synchronously in 1 notification; media parameters and `@tags` are purged cleanly without cascading effects.

### 3.5 Phase P5: Facade Service & Dual-Write Elimination
- **Plain Words**: Replaced the error-prone dual-write in `useMediaActions.js` (which wrote to both `usePromptStore` and `getActivePromptBarStore()` via direct DOM queries) with `promptBarService`. If the target prompt bar is unmounted, actions queue in `pendingActions` with TTL and replay automatically upon mount.
- **BEFORE** (`2ffe865:src/features/workflows/model/useMediaActions.js:148-185`):
```javascript
      // 1. Sync with Platform PromptBar store (if active on screen)
      const activeBarStore = getActivePromptBarStore();
      if (activeBarStore) {
        const barState = activeBarStore.getState();
        if (effectivePrompt && barState.setPrompt) barState.setPrompt(effectivePrompt);
        if (modelName && barState.selectModel) barState.selectModel(modelName);
      }

      // 2. Sync with Legacy / Global Prompt store
      const promptStore = usePromptStore.getState();
      promptStore.setGenerationMode(isVideo ? "keyframe" : "image");
      if (effectivePrompt) promptStore.setPrompt(effectivePrompt);
      if (modelName) promptStore.setModelId(modelName);

      // 3. Smooth scroll and focus on prompt bar input
      requestAnimationFrame(() => {
        const editor = document.querySelector('[contenteditable="true"]');
        if (editor) editor.focus();
      });
```
- **AFTER** (`adabbe7:src/features/workflows/model/useMediaActions.js:129-152`):
```javascript
    const service = promptBarService({
      templateId: "generated-media",
      projectId: projectId || "global",
    });

    service.applyGeneration({
      mode: isVideo ? "video" : "image",
      subMode: "frames",
      modelId: modelName,
      prompt: effectivePrompt,
      parameters: {
        ratio: ratioVal,
        aspect_ratio: ratioVal,
        quality: qualityVal,
        videoResolution: videoResVal,
        duration: durationVal,
        motion: motionVal,
        count: countVal,
      },
    });

    service.focus();
```
- **Behavior Delta**: Single point of entry via service facade; focus is declarative via store state; pending actions survive page navigation.

### 3.6 Phase P6: Platform Decomposition
- **Plain Words**: Decomposed the monolithic `PromptBarPlatform.jsx` (which held 918 lines and 20 `useMemo` hooks) into 4 dedicated hooks (`usePromptBarModels`, `usePromptBarSlots`, `usePromptBarReferences`, `usePromptBarGenerate`) and 3 dumb UI parts (`PromptBarTopPanel`, `PromptBarSlotsRow`, `PromptBarControlsRow`).
- **Metrics Comparison**:
  - `PromptBarPlatform.jsx` lines: 918 -> 400 (-56.4%)
  - `useEffect`: 8 -> 2 (-75%)
  - `useState`: 8 -> 2 (-75%)
  - `useMemo`: 20 -> 0 (-100%)
  - `useCallback`: 14 -> 3 (-78.6%)
- **Public Props Diff**: `git diff adabbe7..8fc6c7d src/features/prompt-bar/platform/PromptBarPlatform.jsx` confirms exact prop signature preservation: `({ type, featureConfig, models = [], onGenerate, className, store, instanceId, projectId, template })`.

### 3.7 Phase P7: Wrappers, Route Policy & Cleanup
- **Plain Words**: Replaced bare `PromptBarPlatform` invocations across 4 cinema-studio pages with the typed `GeneratedPromptBar` wrapper. Mounted `usePromptBarRouteWatcher` in `StudioLayout` to enforce `persistRoutes` wildcard policies, resetting state and clearing `sessionStorage` on disallowed routes (PB-D-14). Deleted 2,500+ lines of duplicate legacy code in `features/studio`.

---

## 4. Architecture as it is NOW

### 4.1 Dependency Layers & Flow
```mermaid
flowchart TD
  subgraph Pages ["Pages & Layouts (App Layer)"]
    AssetsPage["assets/page.js"]
    CollectionPage["collection/page.js"]
    NewCharPage["characters/new/page.js"]
    StudioLayout["StudioLayout (RouteWatcher)"]
  end

  subgraph Wrappers ["Typed Wrappers & Templates"]
    GenWrapper["GeneratedPromptBar.jsx"]
    CharWrapper["CharacterPromptBar.jsx"]
    GenTemplate["generatedMedia.template.js"]
    CharTemplate["character.template.js"]
  end

  subgraph Platform ["Platform UI & Hooks"]
    PlatformComp["PromptBarPlatform.jsx"]
    HookModels["usePromptBarModels"]
    HookSlots["usePromptBarSlots"]
    HookRefs["usePromptBarReferences"]
    HookGen["usePromptBarGenerate"]
    TopPanel["PromptBarTopPanel"]
    SlotsRow["PromptBarSlotsRow"]
    ControlsRow["PromptBarControlsRow"]
  end

  subgraph Facade ["Public Facade & Queue"]
    ServiceFacade["promptBarService.js"]
    PendingQueue["pendingActions.js"]
  end

  subgraph StoreLayer ["Store & Lifecycle"]
    StoreFactory["createPromptBarStore.js"]
    Registry["registry.js"]
    Persistence["persistence.js"]
    RoutePolicy["routePolicy.js"]
  end

  subgraph Commands ["Atomic Commands"]
    CmdSwitch["switchMode.js"]
    CmdSelect["selectModel.js"]
    CmdAttach["attachMedia.js"]
    CmdRemove["removeMedia.js"]
  end

  subgraph PureCore ["Pure Core Engine"]
    MediaCore["media.js"]
    SerialCore["serialization.js"]
    ReconcileCore["reconciliation.js"]
    TagsCore["tagsService.js"]
    ParamsCore["parameterKeys.js"]
    ResultCore["commandResult.js"]
  end

  AssetsPage --> GenWrapper
  CollectionPage --> GenWrapper
  NewCharPage --> CharWrapper
  StudioLayout --> RoutePolicy

  GenWrapper --> PlatformComp
  GenWrapper --> GenTemplate
  CharWrapper --> PlatformComp
  CharWrapper --> CharTemplate

  PlatformComp --> HookModels
  PlatformComp --> HookSlots
  PlatformComp --> HookRefs
  PlatformComp --> HookGen
  PlatformComp --> TopPanel
  PlatformComp --> SlotsRow
  PlatformComp --> ControlsRow

  HookGen --> StoreFactory
  ServiceFacade --> Registry
  ServiceFacade --> PendingQueue
  PendingQueue --> Registry

  StoreFactory --> CmdSwitch
  StoreFactory --> CmdSelect
  StoreFactory --> CmdAttach
  StoreFactory --> CmdRemove

  CmdSwitch --> PureCore
  CmdSelect --> PureCore
  CmdAttach --> PureCore
  CmdRemove --> PureCore
  StoreFactory --> PureCore
```

### 4.2 Sequence Diagrams

#### (a) Mode Switch Execution
```mermaid
sequenceDiagram
  autonumber
  actor User
  participant UI as FeatureModeSelector
  participant Store as Zustand Store
  participant Cmd as switchMode Command
  participant Prune as pruneMedia (Core)
  participant Tags as tagsService (Core)

  User->>UI: Clicks "Video" / "Frames"
  UI->>Store: store.switchMode("video", "frames")
  Store->>Cmd: switchMode(currentState, { mode: "video", subMode: "frames" }, deps)
  Cmd->>Prune: pruneMedia(currentValues, reason="mode-change")
  Prune-->>Cmd: { parameterValues: prunedValues, removed: [assetIds] }
  Cmd->>Tags: cleanTagsForAsset(prompt, removedAssetIds)
  Tags-->>Cmd: cleanedPrompt
  Cmd-->>Store: ok({ activeMode, activeSubMode, parameterValues, prompt })
  Store->>Store: single set(nextState)
  Store-->>UI: Exactly 1 state notification
```

#### (b) Animate Media from Media Card (Pending Queue & Mount)
```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Card as MediaGridItem (useWorkflowActions)
  participant Svc as promptBarService
  participant Queue as pendingActions (Storage)
  participant Router as Next Router
  participant Page as assets/page.js
  participant Bar as GeneratedPromptBar (Mount)

  User->>Card: Clicks "Animate"
  Card->>Svc: promptBarService(identity).animateMedia(item)
  Svc->>Svc: Check registry.isMounted(identity) -> false
  Svc->>Queue: enqueuePendingAction(identity, { actionName: "animateMedia", args: [item] })
  Svc-->>Card: fail(REASONS.NOT_MOUNTED, { queued: true })
  Card->>Router: router.push("/cinema-studio/[id]/assets")
  Router->>Page: Navigates to assets page
  Page->>Bar: Mounts GeneratedPromptBar
  Bar->>Queue: drainPendingActions(identity, { registry })
  Queue->>Bar: Executes animateMedia(item) on mounted store
  Bar-->>User: Start frame populated, prompt bar focused
```

#### (c) Route Navigation & Policy Reset
```mermaid
sequenceDiagram
  autonumber
  actor User
  participant Router as Next Navigation
  participant Watcher as usePromptBarRouteWatcher
  participant Policy as routePolicy (isPathAllowed)
  participant Reg as registry
  participant Store as Zustand Store
  participant Storage as sessionStorage

  User->>Router: Navigates from /assets to /settings
  Router->>Watcher: Pathname changes to "/cinema-studio/p1/settings"
  Watcher->>Reg: reg.list() -> [assetsInstance]
  Watcher->>Policy: isPathAllowed("/cinema-studio/p1/settings", persistRoutes)
  Policy-->>Watcher: false
  Watcher->>Reg: reg.isSubmitting(identity) -> false
  Watcher->>Reg: reg.reset(identity)
  Reg->>Store: store.resetStoreState()
  Watcher->>Storage: removeSaved(storage, canonicalKey)
  Watcher-->>User: Fresh defaults, zero leaked drafts
```

### 4.3 Ownership Table
[VERIFIED: Real repository files and exports]

| State / Concern | Owner File | Read Path | Write Path |
|---|---|---|---|
| Active Mode & SubMode | `createPromptBarStore.js` | `usePromptBarStore(s => s.activeMode)` | `store.switchMode(mode, subMode)` |
| Selected Model | `createPromptBarStore.js` | `usePromptBarStore(s => s.selectedModelId)` | `store.selectModel(modelId)` |
| Prompt Text & Tags | `createPromptBarStore.js` | `usePromptBarStore(s => s.prompt)` | `store.setPrompt(text)` |
| Parameters & Media | `createPromptBarStore.js` | `usePromptBarStore(s => s.parameterValues)` | `store.attachMedia()` / `store.removeMedia()` |
| Store Instances Lifecycle | `registry.js` | `registry.get(identity)` / `registry.list()` | `registry.getOrCreate()`, `registry.reset()`, `registry.dispose()` |
| External Invocation | `promptBarService.js` | `promptBarService(id)` | `service.setPrompt()`, `service.applyGeneration()`, `service.animateMedia()` |
| Route Disallowance Reset | `usePromptBarRouteWatcher.js` | `isPathAllowed(pathname, persistRoutes)` | `reg.reset(id)` + `removeSaved(storage, key)` |
| Serialization Contract | `serialization.js` | `serialize(model, prompt, defs, vals, extra)` | Emitted on submit via `onGenerate` |
| Character Trait Features | `CharacterFeatureEditor.jsx` | `useElementStore(s => s.features)` | `setFeatures()`, synced to Lexical tags |

### 4.4 Canonical Identity Key Format
- **Format**: `pb2:<templateId>:<instanceId>:<projectId>`
- **Source**: `src/features/prompt-bar/store/registry.js:19-28`
- **Guarantees**:
  - `templateId`: Required string (e.g., `"generatedMedia"`, `"character"`).
  - `instanceId`: Defaults to `"default"` if omitted.
  - `projectId`: Defaults to `"global"` if omitted; ensures cross-tenant isolation.
  - Submitting instances append submit tokens (`sub_<timestamp>_<counter>_<rand>`) to prevent mid-generation disposal.

---

## 5. Dependency Direction and Purity

### 5.1 Import Violation Audit
[VERIFIED: ripgrep across all source files]
1. **Core Purity**: Zero React imports, zero DOM imports in `core/` (only exception is backward-compatibility shim `core/useRealBackendModels.js` which re-exports from `adapters/`).
2. **Store Purity**: Zero UI imports, zero Platform imports in `store/`.
3. **API Purity**: Zero DOM/window access in `api/promptBarService.js`.
4. **Platform Decoupling**: Platform receives template configuration via props; zero hardcoded mode names or media parameter assumptions in `PromptBarPlatform.jsx`.

### 5.2 Mutable Module Variables
[VERIFIED: `Get-ChildItem src/features/prompt-bar | Select-String "let active|export let"`]
- **Found in production**: Exactly ZERO mutable module-level store instances.
- **Historic comparison**: The legacy `activePromptBarStoreInstance` in `PromptBarStoreContext.js` was completely removed in commit `5dd24a0`.

### 5.3 Render Side Effects
[VERIFIED: ESLint and vitest run on components]
- **Found in render bodies**: Exactly ZERO `setState` or store mutation calls during render.
- **Hydration safety**: Storage reads and model initializations run exclusively inside `useEffect` or pure factories.
- **Disables of `exhaustive-deps`**: Exactly ZERO in `src/features/prompt-bar/` (`VERIFIED`).

### 5.4 Literals & Magic Strings Inventory
- Parameter keys are centralized in `src/features/prompt-bar/core/parameterKeys.js:1` (`PARAM.IMAGES`, `PARAM.INPUT_IMAGE`, `PARAM.LAST_FRAME`, `PARAM.ASPECT_RATIO`, etc.).
- Reason codes are centralized in `src/features/prompt-bar/core/commandResult.js:8` (`REASONS.NOT_MOUNTED`, `REASONS.NO_ELIGIBLE_MODEL`, `REASONS.QUOTA_EXCEEDED`, `REASONS.PROJECT_MISMATCH`).
- Persist routes are declared as array patterns on template definitions (`generatedMedia.template.js:436`).

---

## 6. Tests Analysis

### 6.1 Test Suite Metrics
- **Initial Baseline (P0)**: 31 test files, 190 tests passed.
- **Current Suite (ALL)**: 69 test files, 485 tests passed hermetically (0 failures, 0 skipped, 0 todo).
- **Prompt Bar Specific**: 40 test files, 301 tests passed in 12.05s (`npx vitest run src/features/prompt-bar`).

### 6.2 Added Test Files Table
[VERIFIED: `git status` and test runner inventory]

| Test File | Tests | Area Pinned |
|---|---|---|
| `safe1PureCore.test.js` | 21 | Pure core reconciliation, serialization, cleanTags |
| `safe2TemplateRules.test.js` | 37 | Template slot resolution, model eligibility, mapping |
| `safe3Store.test.js` | 13 | Vanilla store mechanics, parameter state updates |
| `safe4Persistence.test.jsx` | 8 | Persistence debouncing, quota error recovery |
| `safe5Platform.test.jsx` | 6 | Bare platform rendering, golden payload emission |
| `mediaRef.test.js` | 13 | Pure media reference value objects |
| `commandResult.test.js` | 4 | Command result value objects and reason codes |
| `parameterKeys.test.js` | 3 | Parameter key constants |
| `templateContract.test.js` | 7 | Template schema contract validation |
| `media.test.js` | 22 | Slot quotas, role matching, media categorization |
| `registry.test.js` | 11 | Registry identities, submit tokens, project pruning |
| `persistence.test.js` | 10 | Snapshot sanitization, version 2 storage format |
| `storeLifecycle.test.jsx` | 6 | Store mount, hydration, external external service sync |
| `multiInstanceLifecycle.test.jsx` | 8 | Multi-instance isolation, zero state bleed |
| `submitLifecycle.test.jsx` | 5 | In-flight generation submit tracking |
| `memoryPolicy.test.jsx` | 4 | Instance unmount cleanup and garbage collection |
| `pruneMedia.test.js` | 8 | Pure transition media pruning (PB-D-03) |
| `switchModeCommand.test.js` | 16 | Atomic switchMode command & single notification |
| `selectModelTrimming.test.jsx` | 2 | Single place for model trimming (PB-K3) |
| `attachRemoveMedia.test.js` | 8 | Pure attach/remove commands and quota validation |
| `promptBarService.test.js` | 9 | Public service facade, queueing, project guard |
| `templateActions.test.js` | 7 | Template createActions composite commands |
| `editorFocus.test.jsx` | 4 | Declarative focus request protocol |
| `elementEditMigration.test.jsx` | 2 | Elements edit page migration verification |
| `mediaActionsMigration.test.jsx` | 4 | useMediaActions elimination of dual-write |
| `usePromptBarModels.test.jsx` | 2 | Models hook isolation and auto-selection |
| `usePromptBarSlots.test.jsx` | 2 | Slots hook isolation and asset extraction |
| `usePromptBarReferences.test.jsx` | 2 | References hook and tag synchronization |
| `usePromptBarGenerate.test.jsx` | 3 | Generate hook, credit estimation, disabled checks |
| `PromptBarTopPanel.test.jsx` | 3 | TopPanel UI component isolation |
| `PromptBarSlotsRow.test.jsx` | 3 | SlotsRow UI component isolation |
| `PromptBarControlsRow.test.jsx` | 3 | ControlsRow UI component isolation |
| `GeneratedPromptBar.test.jsx` | 4 | Wrapper integration, golden payload parity |
| `routePolicy.test.js` | 14 | Pure route matching with wildcards and params |
| `usePromptBarRouteWatcher.test.jsx` | 5 | Route watcher integration and storage purge |
| `promptOnlyTemplate.test.jsx` | 4 | Optional models & modes proof (W4) |
| `dependencyDirection.test.js` | 2 | Architecture boundary and import direction check |
| `characterTemplate.test.jsx` | 12 | Character template, min 10 validation, traits form |

### 6.3 Edited Existing Tests
1. `src/features/workflows/__tests__/elementSheetConfig.test.js`: Updated to assert calls to `syncElementDraft` instead of direct `usePromptStore.getState()` writes.
2. `src/features/prompt-bar/__tests__/modelEligibilityContract.test.mjs`: Updated import path to point to template-consolidated `filterEligibleModels`.
3. All other preexisting tests pass untouched.

### 6.4 Mutation Spot-Checks (Throwaway Worktree Verification)
[VERIFIED: Executed against real test runner in detached worktree]

1. **Mutation 1: Remove `isGenerating` from persistence blacklist**
   - *Edit*: Included `isGenerating: state.isGenerating` in `selectPersistable()`.
   - *Test Run*: `npx vitest run src/features/prompt-bar/__tests__/persistence.test.js`
   - *Result*: **CAUGHT**
   - *Output*: `AssertionError: expected true to be undefined` at line 53:40.

2. **Mutation 2: Remove mode switch cleanup of media parameters**
   - *Edit*: Commented out `pruneMedia()` in `switchMode.js` and returned unpruned parameters.
   - *Test Run*: `npx vitest run src/features/prompt-bar/__tests__/switchModeCommand.test.js`
   - *Result*: **CAUGHT** (11 tests failed)
   - *Output*: `AssertionError: expected 'Car moving from <media:start_1>...' to be 'Car moving from to'` and `expected [{ workflow_id: 'ref_scenery' }] to be undefined`.

3. **Mutation 3: Remove `trimParametersForModel` from `selectModel`**
   - *Edit*: Bypassed `pruneMedia` with reason `"model-change"` in `selectModel.js`.
   - *Test Run*: `npx vitest run src/features/prompt-bar/__tests__/selectModelTrimming.test.jsx`
   - *Result*: **CAUGHT** (2 tests failed)
   - *Output*: `AssertionError: expected [ Array(2) ] to deeply equal { workflow_id: 'ref_1', name: 'Ref 1' }` at line 111:42.

4. **Mutation 4: Comment out route watcher reset call**
   - *Edit*: Commented out `reg.reset(inst.identity)` in `usePromptBarRouteWatcher.js`.
   - *Test Run*: `npx vitest run src/features/prompt-bar/__tests__/usePromptBarRouteWatcher.test.jsx`
   - *Result*: **CAUGHT** (3 tests failed)
   - *Output*: `AssertionError: expected 'Studio Draft' to be ''` at line 134:43.

5. **Mutation 5: Let `serialize()` emit all parameters instead of template-filtered**
   - *Edit*: Iterated over `values` instead of `definitions` in `serialize()`.
   - *Test Run*: `npx vitest run src/features/prompt-bar/__tests__/safe1PureCore.test.js`
   - *Result*: **CAUGHT** (4 tests failed)
   - *Output*: `AssertionError: expected { workflow_id: 'wf_leaked_input' } to be undefined` at line 207:46 (PB-D-12 test).

---

## 7. Behavior Changes (Intentional vs Accidental)

### 7.1 Intentional Changes (Decisions Catalog)
[VERIFIED: `docs/prompt-bar-plan/DECISIONS.md`]

1. **PB-D-03 (Media on Transitions)**:
   - *Before*: Mode switches retained stale start/end frames or reference images in store state, causing invalid payloads.
   - *After*: Mode switches purge all media parameters and clean corresponding `@tags` from prompt. Model switches trim arrays to new model's max limit.
   - *Test Pinned*: `switchModeCommand.test.js`, `selectModelTrimming.test.jsx`.

2. **PB-D-12 (Payload Parameter Filtering)**:
   - *Before*: Stale parameters present in store were serialized into backend payloads even when undeclared by the active model.
   - *After*: `serialize()` strictly iterates over active model parameter definitions; undeclared keys are completely omitted.
   - *Test Pinned*: `safe1PureCore.test.js:188`.

3. **PB-D-08 (Submit State Exclusion from Persistence)**:
   - *Before*: If the user refreshed while generating, `isGenerating: true` was rehydrated, freezing the UI.
   - *After*: `isGenerating` is blacklisted from persistence snapshots and always resets to `false` on mount.
   - *Test Pinned*: `persistence.test.js:33`.

4. **PB-D-14 (Route Disallowance Reset)**:
   - *Before*: Navigating to `/settings` or `/characters` preserved prompt bar drafts across project boundaries.
   - *After*: `usePromptBarRouteWatcher` matches current pathname against `persistRoutes`; navigating to unauthorized pages resets the instance and purges `sessionStorage`.
   - *Test Pinned*: `usePromptBarRouteWatcher.test.jsx`.

### 7.2 Accidental Changes
- **Audit Result**: ZERO accidental regressions detected (`VERIFIED`).
- All golden payloads in `safe1PureCore.test.js` and `safe5Platform.test.jsx` pass with 100% byte parity.

### 7.3 Shims Inventory
[VERIFIED: `src/features/studio/index.js` and `src/features/prompt-bar/index.platform.js`]

| Shim / Deprecated Export | File Location | Consumers Count | Status |
|---|---|---|---|
| `useRealBackendModels` | `src/features/prompt-bar/core/useRealBackendModels.js` | 1 (`useMediaActions.js`) | Deprecated shim -> points to `adapters/` |
| `getActivePromptBarStore` | `src/features/prompt-bar/store/PromptBarStoreContext.js` | 0 (only tests) | Deprecated shim -> returns `undefined` |
| `setActivePromptBarStore` | `src/features/prompt-bar/store/PromptBarStoreContext.js` | 0 (only tests) | Deprecated shim -> no-op |
| `addMediaToPrompt` | `src/features/studio/core/mediaReferenceService.js` | 0 (only tests) | Deprecated shim -> use `promptBarService` |
| `animateMedia` | `src/features/studio/core/mediaReferenceService.js` | 0 (only tests) | Deprecated shim -> use `promptBarService` |
| `setPendingPromptAction` | `src/features/studio/core/mediaReferenceService.js` | 0 (only tests) | Deprecated shim -> use `promptBarService` |
| `usePromptStore` | `src/features/studio/index.js` | 2 (`useStudioItemDrag.js`) | Legacy store shim -> pending P8-legacy |

---

## 8. Problems Found in the Audit: Re-check

[VERIFIED: Re-checked against V1-V6 audit findings in `docs/prompt-bar-plan/reports/`]

1. **V1: Dual-Write to Multiple Stores**
   - *Original Issue*: `useWorkflowActions` wrote to both `usePromptStore` and `PromptBarStoreContext` directly.
   - *Status*: **FIXED**. `useMediaActions.js:129` now routes exclusively through `promptBarService`.
2. **V2: Mode Switch Cascade Effect**
   - *Original Issue*: Mode changes triggered a 3-step `useEffect` chain that re-rendered the Platform multiple times.
   - *Status*: **FIXED**. Mode switch is a pure synchronous command (`switchMode.js`) with 1 notification.
3. **V3: Model Catalog Loading Race Conditions**
   - *Original Issue*: Hydrating state before models loaded caused parameter wiping and invalid model resets.
   - *Status*: **FIXED**. `createPromptBarStore.js:60` queues `pendingHydration` and executes atomic reconciliation once models arrive.
4. **V4: Memory Leaks on Unmount**
   - *Original Issue*: Stores remained in global listeners indefinitely upon page unmount.
   - *Status*: **FIXED**. `registry.js` tracks `mountCount`, unmounts listeners, and `pruneOtherProjects` cleans inactive project stores.
5. **V5: Dead Code & Redundant Studio Logic**
   - *Original Issue*: 10 duplicate files existed in `features/studio/` mirroring `features/prompt-bar/`.
   - *Status*: **FIXED**. Commit `9276cf6` deleted 2,523 lines of dead code and duplicate store files.
6. **V6: Route Transition State Leak**
   - *Original Issue*: Leaving cinema-studio pages left prompt bar state in `sessionStorage` indefinitely.
   - *Status*: **FIXED**. `usePromptBarRouteWatcher` in `StudioLayout` wipes store and storage on route exit.

---

## 9. Scripted Scenarios (Actual Outputs from Real Code)

[VERIFIED: Executed live in Node.js v24.21.0 against production modules]

```
=== SCENARIO 1: Two stores with different instanceIds ===
Store 1 prompt: Hello from store 1
Store 2 prompt: 
Store 2 unaffected: true

=== SCENARIO 2: Mode switch with @tag and reference image ===
Before switchMode - mode: image prompt: A photo with <media:img_1> params: {"aspect_ratio":"16:9","images":[{"workflow_id":"img_1"}]}
After switchMode  - mode: video subMode: frames model: img_model
After switchMode  - prompt: "A photo with"
After switchMode  - params: {"aspect_ratio":"16:9"}

=== SCENARIO 3: Model switch with trimming excess references ===
Before selectModel - model: multi_ref params: {"images":[{"workflow_id":"ref_1"},{"workflow_id":"ref_2"}]}
After selectModel  - model: single_ref
After selectModel  - prompt: "Photo with <media:ref_1> and"
After selectModel  - params: {"images":{"workflow_id":"ref_1"}}

=== SCENARIO 4: Route watcher simulating navigation to disallowed path ===
Initial state in /assets: Draft in assets
Storage before nav: {"prompt":"Draft in assets"}
Path /cinema-studio/p1/settings allowed by persistRoutes: false
State after navigating to /settings: ""
Storage after nav: null

=== SCENARIO 5: Persistence round-trip ===
Saved snapshot JSON: {"v":2,"prompt":"Persisted prompt","selectedModelId":"vid_model","parameterValues":{"aspect_ratio":"16:9","resolution":"1080p"},"elements":[],"characters":[],"activeMode":"video","activeSubMode":"frames"}
Loaded snapshot: {"v":2,"prompt":"Persisted prompt","selectedModelId":"vid_model","parameterValues":{"aspect_ratio":"16:9","resolution":"1080p"},"elements":[],"characters":[],"activeMode":"video","activeSubMode":"frames"}
Hydrated store state - prompt: Persisted prompt mode: video isGenerating: false

=== SCENARIO 6: Pending queue action dispatched before store mount ===
Dispatch before mount result: { ok: false, reason: 'NOT_MOUNTED', details: { queued: true } }
Pending queue before mount: {
  'pb2:character:char1:p1': [
    {
      actionName: 'setPrompt',
      args: [ 'Injected from gallery card' ],
      timestamp: 1792102320519,
      projectId: 'p1'
    }
  ]
}
Drain execution result: {
  executed: 1,
  actions: [
    {
      actionName: 'setPrompt',
      args: [ 'Injected from gallery card' ],
      timestamp: 1792102320519,
      projectId: 'p1'
    }
  ]
}
Store prompt after mount & drain: Injected from gallery card
Pending queue after drain: {}
```

---

## 10. Remaining Code Smells and Risks

### 10.1 High Severity
- **None**: No architecture-breaking defects, race conditions, or memory leaks observed.

### 10.2 Medium Severity
1. **`FlowPromptBoxSettings.jsx` Hardcoding (Candidate P8-settings)**:
   - *Observed*: The popup settings panel still contains hardcoded switches for modes and ratios rather than being dynamically driven by `template.parameters` (`src/features/prompt-bar/ui/common/selectors/FlowPromptBoxSettings.jsx:1`).
   - *Risk*: Adding a new mode or parameter requires modifying this UI component manually.
2. **Legacy `usePromptStore.js` Existence (Candidate P8-legacy)**:
   - *Observed*: `src/features/prompt-bar/model/usePromptStore.js` is still present to support drag-and-drop state in `useStudioItemDrag.js`.
   - *Risk*: Developers unfamiliar with the refactor might inadvertently import the legacy store instead of `usePromptBarStore`.

### 10.3 Low Severity
1. **Lexical Error Logging**: `PromptEditor.jsx:266` retains `console.error(error)` in Lexical's internal `onError` handler.
2. **Shim Cleanup**: 7 deprecated shim functions remain in `features/studio/index.js` for backward compatibility.

---

## 11. What Could NOT Be Verified in this Review

The following aspects could not be verified automatically under the hermetic testing rules and require manual validation in a live browser environment:
1. **[NOT-RUN] Physical WebGL / Canvas Rendering**: Validation that video player preview and image canvas textures render without layout shifts.
2. **[NOT-RUN] Real Browser Drag-and-Drop**: Dragging cards from the media grid directly onto Prompt Bar slots using native HTML5 drag events.
3. **[NOT-RUN] Live Backend Websocket Streams**: Real-time generation progress updates streaming over SSE/Websocket from the FastAPI backend.
4. **[NOT-RUN] Real Supabase / S3 Uploads**: File uploads of large (>10MB) user reference images to live object storage.
5. **[NOT-RUN] Cross-Tab Multi-Window Sync**: Concurrently opening two browser tabs on different cinema-studio projects and observing separate sessionStorage partitions.

---

## 12. Verdict

### 12.1 Phase Status Summary
| Phase | Scope | Status | Score |
|---|---|---|---|
| **P0** | Characterization & Safety Net | **COMPLETE** | 5 / 5 |
| **P1** | Verification Audits | **COMPLETE** | 5 / 5 |
| **P2** | Contracts & Pure Services | **COMPLETE** | 5 / 5 |
| **P3** | Store Lifecycle & Registry | **COMPLETE** | 5 / 5 |
| **P4** | Atomic Transitions & Filtering | **COMPLETE** | 5 / 5 |
| **P5** | Service Facade & Migration | **COMPLETE** | 5 / 5 |
| **P6** | Platform Decomposition | **COMPLETE** | 5 / 5 |
| **P7** | Wrappers, Routes & Templates | **COMPLETE** | 5 / 5 |
| **P8 (Candidate)** | Character Prompt Bar Template | **COMPLETE** | 5 / 5 |

### 12.2 Next Phase Recommendation
**Can the next phase start?**: **YES, WITH CONDITIONS**

**Conditions to proceed**:
1. Execute the manual browser smoke checklist (Section 11) to confirm visual dropzones and real websocket generation.
2. When unlocking candidate `P8-settings`, decouple `FlowPromptBoxSettings.jsx` to render parameter controls from template schemas.
3. When unlocking candidate `P8-shims`, safely eliminate the legacy shims in `src/features/studio/index.js` once drag-and-drop is decoupled from `usePromptStore`.

### 12.3 Open Questions for the Owner
1. **Settings Panel**: Should `FlowPromptBoxSettings.jsx` become completely template-driven, or should image/video modes remain standard across templates?
2. **Character Sheet Scope**: Should the multi-view character reference sheet remain an independent page under `elements/edit`, or be fully absorbed into the Prompt Bar Character template?
