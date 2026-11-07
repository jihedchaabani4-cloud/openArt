# Optimistic Updates Audit — Full-Stack Data & Mutations Map

> Scope: Frontend (`my-app/`) + Backend API (`apiOpenArt/`). Goal: inventory every entity, endpoint, mutation hook, cache key, and current optimistic status so the **Optimistic Updates pattern** can be applied consistently (snapshot on `onMutate`, restore on `onError`, reconcile on `onSettled`).

---

## 0. Reference Documents Read

- Project rules: [`docs/plan/00_CORE.md`](file:///c:/Users/jihad/Desktop/open%20art/docs/plan/00_CORE.md)
- Feature plan: [`specs/033-prompt-bar-platform/plan.md`](file:///c:/Users/jihad/Desktop/open%20art/specs/033-prompt-bar-platform/plan.md)
- Folders plan: [`docs/plan/04_P3_folders.md`](file:///c:/Users/jihad/Desktop/open%20art/docs/plan/04_P3_folders.md)

---

## 1. ENTITIES (Items / Records)

### Legend
- **ID aliases**: The frontend normalizes two shapes (snake_case + camelCase) because both the backend and legacy UI emit both. Every optimistic updater must write **both forms** to avoid cache/view desync.
- **Canonical ID field**: The backend treats `name` (or `workflow.name`) as the stable workflow identifier. `id` is often aliased to the same value; the UI reads both in filters and comparisons.

---

### 1.1 Project

| Field | Value |
|---|---|
| **Represents** | Top-level workspace container owned by a user. Holds folders, workflows, media, elements, characters. |
| **Cache keys** | `queryKeys.projects.all()` → `["projects"]` (list); `queryKeys.projects.list()` → `["projects","list"]`; **`queryKeys.projectData.byProject(projectId)` → `["projectData", projectId]`** — **primary source of truth used by ALL studio views**. |
| **Backend endpoints** | `GET/POST /projects`, `PATCH/DELETE /projects/:id`. |
| **Shape (main fields)** | `id`/`project_id` (UUID), `name`, `user_id`/`userId`, `created_at`, `updated_at`. |
| **Relations** | owns Folder (FK `project_id`), owns Workflow (FK `project_id`), owns Media (FK `project_id`). |
| **UI locations** | Projects grid (landing page), studio breadcrumb, project switcher, URL `/cinema-studio/:projectId/...`. |

---

### 1.2 Folder / Collection

| Field | Value |
|---|---|
| **Represents** | Hierarchical container for workflows (called **Collection** in the UI). Supports arbitrary nesting. |
| **Cache keys** | `queryKeys.folders.byProject(projectId)` → `["folders", projectId]`; `queryKeys.folders.all()` → `["folders"]`. Also rendered via `projectData` workflows (filter on `folder_id`). |
| **Backend endpoints** | `GET/POST /projects/:projectId/folders`; **`PATCH /folders/:folderId`** (rename + move); **`DELETE /folders/:folderId`**. |
| **Shape (main fields)** | `id` (UUID), `name`, `project_id`/`projectId`, **`parentId` / `parent_id`** (self-FK for nesting), `position`, `created_at`/`updated_at`. |
| **Relations** | `parentId` → Folder (self); Workflow has `folder_id` → Folder; Folder has implicit children via `projectFolders.parentId`. |
| **UI locations** | Root Assets page cards (only folders with `!parentId && !parent_id`), Collection page nested child lists, "Move into" drop target on MediaGridItem, "Move out" drop target on StudioNavbarLeft, CreateCollectionDialog. |

---

### 1.3 Workflow (also called Generation / Asset / Upload)

| Field | Value |
|---|---|
| **Represents** | A logical container for one "job": generation (AI image/video), UPLOAD, CHARACTER sheet, ELEMENT sheet. |
| **Cache keys** | **`queryKeys.projectData.byProject(projectId)` → `projectContents.workflows[]`** (single source of truth); `queryKeys.workflows.byProject(projectId)` → `["workflows", projectId]` (legacy alias = same as generations); `queryKeys.generations.byProject(projectId)` → same alias; `queryKeys.library.user(...)` → user-wide library; `queryKeys.library.detail(workflowId)`. |
| **Backend endpoints** | `POST /images/generated`, `POST /video/generated` (create); `PATCH /workflows/workflows/:id` (update); `DELETE /workflows/workflows/:id` or batch `DELETE /workflows/workflows` body `{ workflow_ids: ids[] }`; `POST /assets/upload` (UPLOAD type); `GET /workflows/project-data/:projectId` — returns a single aggregated `{projectName, projectContents:{workflows, media, characters, elements}}` blob. |
| **Shape (main fields)** | `name` / `id` (UUID primary), `projectId` / `project_id`, **`workflow_type` / `workflowType`** ∈ {`GENERATION`, `UPLOAD`, `CHARACTER`, `CHARACTER_SHEET`, `ELEMENT_SHEET`, `ELEMENT`}, **`folder_id` / `folderId`** (FK → Folder), `type: "upload"`/`is_upload: true` (for UPLOAD), `metadata: { displayName, createTime, favorited, primaryMediaId, source, isUpload, folder_id, folderId, elementType, display_name }`, `display_name`, `description`, `character_info`, `primary_media_id`/`primaryMediaId`. |
| **Relations** | `folder_id` → Folder; owns Media (FK `workflowId`); Character entity has `workflow_id` → Workflow; Element entity has `workflow_id` → Workflow. |
| **UI locations** | Root Assets grid (only `!folder_id && !folderId` + `workflow_type !== CHARACTER/ELEMENT`), Collection page grid (only `folder_id === collectionId`), Asset details (`/cinema-studio/:projectId/assets/edit/:workflowId`), Elements page (`/cinema-studio/:projectId/elements`), Characters page (`/cinema-studio/:projectId/characters`), Generation edit page (`/cinema-studio/:projectId/generations/edit/:workflowId`), Library (`AssetsLibraryPage.jsx`), Context menu (StudioItemMenu) → move/rename/delete/like. |

---

### 1.4 Media / Asset Item (single image/video inside a Workflow)

| Field | Value |
|---|---|
| **Represents** | One generated/imported file (image or video) attached to a workflow. Also called `item` in many components. |
| **Cache keys** | **`queryKeys.projectData.byProject(projectId)` → `projectContents.media[]`** (aggregated); `queryKeys.assets.byProject(projectId, offset, type, mediaType)` → paginated raw assets; `queryKeys.library.user(...)` → merged with workflow. |
| **Backend endpoints** | `POST /assets/upload` (creates media + UPLOAD workflow); `DELETE /assets/:assetId`; `DELETE /workflows/items/:itemId` (legacy alias); `DELETE /workflows/media/:mediaId`; `PATCH /workflows/items/:itemId/like`; `POST /workflows/detach-media` (promote media item → standalone UPLOAD workflow). |
| **Shape (main fields)** | `id` / `name` (UUID), `workflowId` / `workflow_id` → Workflow, **`status`** ∈ {`pending`, `processing`, `success`/`completed`, `failed`/`error`, `uploading`}, `url`/`file_url`, `is_liked` / `is_Like`, **`step_id` / `workflowStepId`** ∈ {`GEN`, `upload`, `character_sheet`, `character_detail`, `CAE`, `…`}, `mediaMetadata: { createTime, visibility }`, `generationConfig: { prompt, model, ratio, … }`, `projectId`, `folder_id`/`folderId`, **`media_type` / `type`** ∈ {`image`,`video`}, `width`/`height`/`ratio`/`aspectRatio`, `[image|video].dimensions`, `duration_ms`, `mime_type`, `params:{…}`. |
| **Relations** | `workflowId` → Workflow; FK-owned by Workflow. |
| **UI locations** | WorkflowMediaGallery (edit page grid), MediaGridItem primary card preview (via `getPrimaryMedia`), CoreMediaItemView, EditNavbar detail view, like heart icon, processing overlay (status pending), character sheet carousel, element references strip. |

---

### 1.5 Character Entity

| Field | Value |
|---|---|
| **Represents** | Character sheet record — separate entity from Workflow but tightly coupled (`workflow_id` FK + `characters[]` array inside `projectContents`). |
| **Cache keys** | **`queryKeys.projectData.byProject(projectId)` → `projectContents.characters[]`** (list); `character detail by ID` via Workflow page (`/cinema-studio/:projectId/characters/:characterId`). |
| **Backend endpoints** | `POST /characters/create` (creates Workflow + Character + media placeholder); `PATCH /characters/:id` (update); `DELETE /characters/:id` (cascade); `POST /characters/:id/generate-sheet` (regen AI turnaround); `POST /characters/:id/sheet-media` (set primary sheet image); `POST /characters/:id/media` (add detail img); `DELETE /characters/:id/media/:mediaId` (remove detail img); `POST /characters/generate-description` (AI prompt gen). |
| **Shape (main fields)** | `id` (UUID), **`workflow_id`** (FK → Workflow), `project_id`/`projectId`, `name` / `title`, `description` / `character_info`, optional `traits:{}`. |
| **Relations** | `workflow_id` → Workflow; detail images via `projectContents.media` + `step_id === "character_detail"`. |
| **UI locations** | Characters page cards (filter by `workflow_type === "CHARACTER"`/`"CHARACTER_SHEET"`), CharacterEditNavbar, CharacterDetailsGallery, CharacterSheetSection, CharacterTabSwitch, CharacterInfoSidebar. |

---

### 1.6 Element Entity

| Field | Value |
|---|---|
| **Represents** | Reference sheet for a visual element (object, prop, location, item, weapon, pet, etc.) used in prompt @-mentions. |
| **Cache keys** | **`queryKeys.projectData.byProject(projectId)` → `projectContents.elements[]`**; `GET /v2/elements/project/:projectId`. |
| **Backend endpoints** | `POST /v2/elements` (creates Workflow + Element + media placeholder); `GET /v2/elements/:id`; `PATCH /v2/elements/:id` (update name/description/guidelines/element_type); `DELETE /v2/elements/:id`; `POST /v2/elements/:id/images` (add ref image); `DELETE /v2/elements/:id/images/:mediaId` (remove ref image); `POST /v2/elements/analyze` (multimodal vision → keywords/guidelines); `POST /v2/elements/build-prompt`. |
| **Shape (main fields)** | `id` (UUID), **`workflow_id`** (FK → Workflow), `project_id`/`projectId`, `name`, `description`, `guidelines` (string | string[]), **`element_type` / `elementType`** ∈ {`object`, `location`, `prop`, `item`, `weapon`, `pet`, `character`, `…`}. |
| **Relations** | `workflow_id` → Workflow; ref images via `projectContents.media`. |
| **UI locations** | Elements page cards (filter by `workflow_type === "ELEMENT_SHEET"`/`"ELEMENT"`), ElementCardKrea, NewElementCardKrea, CreateElementModal, ElementEditNavbar, ElementDetailsGallery, ElementInfoSidebar, prompt-bar @-mention dropdown, PromptBarPlatform reference chips. |

---

### 1.7 User / Auth Session

| Field | Value |
|---|---|
| **Represents** | Authenticated user record + wallet balance. |
| **Cache keys** | `queryKeys.auth.me()` → `["auth","me"]`; `queryKeys.auth.walletBalance()` → `["auth","walletBalance"]`. |
| **Backend endpoints** | `POST /auth/signup`, `POST /auth/login`, `GET /auth/google`, `GET /auth/microsoft`, `GET /auth/callback`, `GET /auth/me`, `POST /auth/logout`, `GET /auth/wallet/balance`. |
| **Shape (main fields)** | `id` (UUID), `email`, `name`, `avatar`, `credits_balance`/`walletBalance`, `subscription_plan`, `isAdmin`. |
| **UI locations** | UserDropdown (StudioNavbarRight), AuthGuard, NavbarImportButton (credits shown), LoginDialog, Landing page "Se connecter". |

---

### 1.8 Credit Packages / Payments

| Field | Value |
|---|---|
| **Represents** | Lemon Squeezy credit packages, user checkout, subscription purchase history. |
| **Cache keys** | ad-hoc `["credit-packages"]`. |
| **Backend endpoints** | `GET /payments/packages`; `POST /payments/checkout` → redirect to Lemon Squeezy; `POST /payments/webhook` (signed — handled by backend only); `GET /payments/history`. |
| **Shape (main fields)** | packages: `id`, `price`, `credits`, `title`, `description`; checkout: `checkoutUrl`. |
| **UI locations** | `/pricing` page (`PackageSelectionDialog`, `PricingSection`), UserDropdown "Upgrade" CTA. |

---

### 1.9 Model (AI Provider)

| Field | Value |
|---|---|
| **Represents** | Registered generation model + cost metadata (used by PromptBar dropdown & billing). |
| **Cache keys** | `queryKeys.models.studio()` → `["studioModels"]`; also fetched inside `useRealBackendModels({projectId})` via `/models` endpoint. |
| **Backend endpoints** | `GET /models` (returns `{ models: […] }`); `GET /modelsRoute` → `/models`. |
| **Shape (main fields)** | `id`, `name`, `domain` ∈ {`image`/`video`}, `provider`, `cost_per_call`, `credit_cost`, `enabled`. |
| **UI locations** | PromptBar model selector dropdown, Pricing page models comparison table. |

---

### 1.10 Like / Favorite (virtual relations)

| Field | Value |
|---|---|
| **Represents** | Virtual boolean on Media (`is_liked`) and Workflow (`metadata.favorited`). Not a separate DB row — a flag. |
| **Cache keys** | Inside `projectContents.media[].is_liked` and `projectContents.workflows[].metadata.favorited`. |
| **Backend endpoints** | `PATCH /workflows/items/:itemId/like` (toggle media like); `PATCH /workflows/workflows/:id/like` or batch `PATCH /workflows/workflows/like` body `{ workflow_ids, favorited? }` (toggle/set workflow favorite). |
| **UI locations** | Heart icons on MediaGridItem, AssetsLibraryPage, "Liked" filter toggle (useLibraryFilter / `_elementFilters.liked`). |

---

## 2. API LAYER — Endpoints & Actions

> Conventions: **All routes live under `/api/...`** (prefixed automatically by the `api` HTTP client). Columns: Method, URL, Entity touched, Action, Payload, Response, Known error codes, Frontend caller.

---

### 2.1 Auth

| Method | URL | Entity | Action | Payload / Response | Error codes | Frontend caller |
|---|---|---|---|---|---|---|
| `POST` | `/auth/signup` | User | create | Payload `{ email, password, name }`, Response user + cookie | `VALIDATION_ERROR`, `EMAIL_TAKEN` | `auth.js` → `useAuthSession` (indirect) |
| `POST` | `/auth/login` | User | login | Payload `{ email, password }`, Response user + cookie | `INVALID_CREDENTIALS` | same |
| `GET`  | `/auth/google` | User | OAuth redirect | — | — | LoginDialog |
| `GET`  | `/auth/microsoft` | User | OAuth redirect | — | — | LoginDialog |
| `GET`  | `/auth/callback` | User | OAuth callback | Redirects, sets cookie | — | browser |
| `GET`  | `/auth/me` | User | read session | `{ id, email, name, avatar, subscription_plan, isAdmin }` | `UNAUTHENTICATED` 401 → `auth.me()` |
| `POST` | `/auth/logout` | User | session destroy | — | — | UserDropdown |
| `GET`  | `/auth/wallet/balance` | User | read wallet | `{ balance, credits }` | — | NavbarImportButton |

---

### 2.2 Projects

| Method | URL | Entity | Action | Payload / Response | Error codes | Frontend caller |
|---|---|---|---|---|---|---|
| `GET`  | `/projects` | Project | list | Response `[{id, project_id, name, …}]` | 401 | `useProjects()` (projectsApi.js) |
| `POST` | `/projects` | Project | create | Payload `{ name, … }`, Response new project | `VALIDATION_ERROR` | `useCreateProject()` |
| `PATCH`| `/projects/:id` | Project | update | Payload `{ name?, … }` | 404 if foreign project (returns 404 per rules) | `useUpdateProject()` |
| `DELETE`| `/projects/:id` | Project | delete | `{ ok: true }` | 404 | `useDeleteProject()` |
| `GET`  | `/projects/:projectId/folders` | Folder | list project folders | `[{id, name, parentId, position, …}]` | 404 | `useProjectFolders()` (foldersApi.js) |
| `POST` | `/projects/:projectId/folders` | Folder | create | Payload `{ name, parentId? }`, Response new folder | `FOLDER_NAME_INVALID`, 404 project | `useCreateFolder()` (foldersApi.js) |
| `GET`  | `/projects/:projectId/assets` | Media | legacy list | `[{…assets…}]` | 404 | legacy consumers |

---

### 2.3 Folders / Collections

| Method | URL | Entity | Action | Payload / Response | Error codes | Frontend caller |
|---|---|---|---|---|---|---|
| `PATCH`| **`/folders/:folderId`** | Folder | **rename OR move** (same endpoint, generic `patch`) | Payload `{ name?:string }` OR `{ parentId?: UUID\|null }`; Response patched folder | ✅ Defined in `FolderService.js`: `FOLDER_NAME_INVALID` (400), `NOT_FOUND` (404 project/folder), **`FOLDER_CYCLE` (400 — move into self/descendant)**, `PARENT_NOT_FOUND` (404 target parent), `NAME_DUPLICATE` (postgreSQL 23505) → `FOLDER_ALREADY_EXISTS`, `VALIDATION_ERROR` (400 bad position). | ✅ **`useUpdateFolder()`** — foldersApi.js — **now optimistic** |
| `DELETE`| **`/folders/:folderId`** | Folder | **delete** | Returns deleted folder UUID | ✅ `FolderService.js`: `NOT_FOUND` (404), **`FOLDER_NOT_EMPTY` (400 — postgreSQL 23503 FK violation: folder still holds workflows/children)**. | ✅ **`useDeleteFolder()`** — foldersApi.js — **now optimistic** |

---

### 2.4 Workflows / Generations (bulk)

| Method | URL | Entity | Action | Payload / Response | Error codes | Frontend caller |
|---|---|---|---|---|---|---|
| `GET`  | `/workflows/project-data/:project_id` | Project(aggregate) | **read ALL** (workflows + media + chars + elems) | Response `{ projectName, projectContents: { workflows:[], media:[], characters:[], elements:[] } }`. **Single dominant fetch. 30s stale; polls every 30s while `media.status===processing/pending`.** | 404 if foreign project → returns 404, never 403 (per rules) | ✅ `useProjectData()` → workflowsApi.js |
| `GET`  | `/workflows/library` | Workflow | user-wide list | Query `{ limit, offset, project_id? }`, Response `{ data:[], total, hasMore }` | — | `useUserLibrary()`, `useInfiniteUserLibrary()` |
| `GET`  | `/workflows/library/:workflow_id` | Workflow+Media | detail | `{ …wf, items:[…] }` | 404 | `useLibraryWorkflowDetail()` |
| `GET`  | `/workflows/assets/:project_id` | Media | paginated list | Query `{ limit, offset, type?, media_type? }` → `{ data:[], hasMore }` | — | `useAssets()` (mediaApi.js) |
| `GET`  | `/workflows/workflow-by-media/:media_id` | Workflow | lookup | `{ workflow: … }` | 404 | internal only |
| `PATCH`| `/workflows/workflows/:id` | Workflow | **update** (rename, description, any field) | Payload generic `{ display_name?, description?, character_info?, metadata?, … }` | 404 | ✅ `useUpdateWorkflow()` workflowsApi.js — writes cache **onSuccess** — **not optimistic** |
| `DELETE`| `/workflows/workflows/:id` OR `DELETE /workflows/workflows` (batch body `{ workflow_ids: ids[] }`) | Workflow(+Media) | **delete single / batch** | Response deleted ids array | 404 | ✅ **`useRemoveWorkflow()`** — workflowsApi.js — **ALREADY optimistic (onMutate filters cache; onError rolls back)** |
| `PATCH`| `/workflows/workflows/:id/like` OR `/workflows/workflows/like` (batch) | Workflow | **toggle favorite** | Payload single → none (toggle); batch → `{ workflow_ids, favorited?: bool }` | 404 | ✅ **`useToggleWorkflowLike()`** — workflowsApi.js — **ALREADY optimistic** |
| `PATCH`| `/workflows/items/:id/like` | Media | **toggle like** | No body (toggle) | 404 | ✅ **`useToggleLike()`** — workflowsApi.js — **ALREADY optimistic** |
| `PATCH`| `/workflows/workflows/:id/primary-media` | Workflow | set primary media id | Body `{ media_id: UUID }` | 404 | `useSetPrimaryMedia()` — NOT optimistic |
| `POST` | `/workflows/detach-media` | Media→Workflow | promote media → new workflow | Body `{ media_id, project_id, display_name? }` | 404 | `useDetachMedia()` — NOT optimistic |
| `DELETE`| `/workflows/items/:itemId` OR `/workflows/media/:mediaId` | Media | delete single media item | `{ ok: true }` | 404 | `useRemoveWorkflowItem()`, `useDeleteMedia()`, `useDeleteMediaItem()` — NOT optimistic (only invalidate on success) |

---

### 2.5 Generation Create (Images / Videos / Extend)

| Method | URL | Entity | Action | Payload / Response | Error codes | Frontend caller |
|---|---|---|---|---|---|---|
| `POST` | `/images/generated` | Workflow+Media | **create image generation** | Body `{ model, prompt, project_id, parameters:{…}, references:[], elements:[], characters:[] }` → 202 Accepted + background job | `INSUFFICIENT_CREDITS`, `VALIDATION_ERROR`, `MODEL_DISABLED`, backend Usecase errors | ✅ **`useGenerateMutation()`** workflowsApi.js — **ALREADY optimistic (inserts optimistic-gen-* workflow + pending media)** |
| `POST` | `/video/generated` | Workflow+Media | **create video generation** | Same shape, routed by `isVideo=true` | Same | Same |
| `POST` | `/video/extend` | Media | extend video (upscale / duration) | Body `{ media_id, duration?, prompt? }` | Same | `useExtendVideoMutation()` — **NOT optimistic** (only scroll+log) |

---

### 2.6 Assets (Uploads / Deletes / Moves)

| Method | URL | Entity | Action | Payload / Response | Error codes | Frontend caller |
|---|---|---|---|---|---|---|
| `POST` | **`/assets/upload`** (FormData) | Workflow+Media | **UPLOAD media + create standalone UPLOAD-type workflow** | Multipart `file`, fields: `{ project_id, folder_id?, folderId?, collection_id?, width, height, ratio, … }`. Response: `{ ok:true, url, media_id, workflow_id, folder_id, folderId, collection_id, workflow_type:"UPLOAD", asset_id, type, width, height, ratio, size }` | ✅ Known: `PAYLOAD_TOO_LARGE` (413 Image>20MB/Video>100MB), `UNSUPPORTED_MEDIA_TYPE` (415 mimetype), `NOT_FOUND` (project/folder), `APP_ERROR` (generic). | ✅ **`useBatchUploadAssets()`** mediaApi.js — **ALREADY optimistic** (+blob URLs + revoke on 2s delay after settle) |
| `DELETE` | `/assets/:id` (= media.id) | Media (+ Workflow if last media) | **delete single media, cascades parent workflow if it was the last item** | `{ ok: true }` | 404 | ✅ **`useRemoveAsset()`** mediaApi.js — **ALREADY optimistic** (cascades workflow removal if remaining count = 0; onError rollback) |
| `PATCH`| **`/assets/:assetId/folder`** | Workflow | **MOVE workflow/asset INTO folder / OUT OF folder** | Body `{ folderId: UUID \| null }`. `null` → move to root. Response patched `{ ...workflow, folder_id }` | ✅ Defined: `NOT_FOUND` (404 project/folder/asset — ownership-scoped), `VALIDATION_ERROR` (400 bad UUIDs). Uses `workflowService.moveToFolder`. | ✅ **`useMoveAssetToFolder()`** — foldersApi.js — **now optimistic** |

---

### 2.7 Characters

| Method | URL | Entity | Action | Payload / Response | Error codes | Frontend caller |
|---|---|---|---|---|---|---|
| `POST` | `/characters/create` (alias `/characters` / `/characters/character`) | Character (+Workflow+Media) | create character sheet | Multipart (optional file) or JSON `{ project_id, name, prompt, references:[] }` | `VALIDATION_ERROR`, `NOT_FOUND` project | `characterService.createCharacter()` → ✅ **`useCreateCharacterMutation()`** useCharacter.js — **ALREADY optimistic** (triple: workflow + media + character) |
| `PATCH`| `/characters/:characterId` | Character (+Workflow) | update (name/desc/…) | Body `{ name?, title?, description?, character_info?, … }` | 404 | `characterService.updateCharacter()` → `useUpdateCharacter()` — writes cache **onSuccess** — **NOT optimistic** |
| `DELETE`| `/characters/:characterId` | Character (+Workflow) | delete (cascade) | `{ ok: true }` | 404 | `useWorkflowDelete()` — routes via `workflowType:"CHARACTER"` endpoint → `DELETE /characters/{id}`. **Optimistic cache update inside useWorkflowDelete** |
| `POST` | `/characters/:characterId/generate-sheet` | Media | AI regen turnaround sheet | Body `{ prompt, references:[], projectId }` | `INSUFFICIENT_CREDITS`, MODEL errors | `characterService.generateSheet()` → `useGenerateCharacterSheetMutation()` — NOT optimistic |
| `POST` | `/characters/:characterId/sheet-media` | Character (+Media) | set / upload primary sheet image | Body multipart file `file` or JSON `{ mediaId, imageUrl, projectId }` | `NOT_FOUND`, media errors | `characterService.setSheetMedia()` → `useSetCharacterSheetMedia()` — NOT optimistic |
| `POST` | `/characters/:characterId/media` | Media | add detail reference image | Body same as above | same | `characterService.addDetailMedia()` → `useAddMediaToCharacter()` — NOT optimistic |
| `DELETE`| `/characters/:characterId/media/:mediaId` | Media | remove detail image | `{ ok: true }` | 404 | `characterService.removeDetailMedia()` → `useRemoveMediaFromCharacter()` — NOT optimistic (cache invalidate only; BUG: detail images also use **local state `addedDetailImages`** in `useCharacter.uploadDetailFiles()` which has separate optimistic handling + rollback per file) |
| `POST` | `/characters/generate-description` | (prompt) | AI prompt gen for new character | Body `{ concept, archetype, style }` | LLM errors | `useGenerateCharacterDescriptionMutation()` — NOT optimistic (no cache effect) |

---

### 2.8 Elements

| Method | URL | Entity | Action | Payload / Response | Error codes | Frontend caller |
|---|---|---|---|---|---|---|
| `POST` | `/v2/elements` | Element (+Workflow+Media) | create element sheet (type != character) | Body `{ projectId, project_id, name, prompt, description?, guidelines?, element_type }` — if type=="character" routed to `/characters/create` | `VALIDATION_ERROR`, `NOT_FOUND` | ✅ **`useCreateElementSheetMutation()`** useElement.js — **ALREADY optimistic** (workflow + media inserted) |
| `GET`  | `/v2/elements/project/:projectId` | Element[] | list | `{ elements:[…] }` (also already merged into `projectContents.elements[]`) | 404 | internal — currently `projectContents.elements[]` is primary |
| `GET`  | `/v2/elements/:id` | Element | detail | Entity body | 404 | Element detail page |
| `PATCH`| `/v2/elements/:id` | Element (+Workflow) | update name/description/guidelines/element_type | Body `{ name?, description?, guidelines?, element_type? }` | 404 | ✅ **`useUpdateElementMetadata()`** useElement.js — **ALREADY optimistic** (onMutate patches workflows[] + elements[]; onError rollback) |
| `DELETE`| `/v2/elements/:id` | Element (+Workflow) | delete cascade | `{ ok: true }` | 404 | `useWorkflowDelete()` routes → `DELETE /v2/elements/{id}`. Optimistic cache update via useWorkflowDelete. |
| `POST` | `/v2/elements/:id/images` | Media | add element reference image | Multipart file or JSON `{ mediaId, imageUrl, projectId }` | 404, media errors | `useAddImageToElement()` — NOT optimistic |
| `DELETE`| `/v2/elements/:id/images/:mediaId` | Media | remove reference image | `{ ok: true }` | 404 | No dedicated hook; shared by `useDeleteMediaItem()` but calls `/workflows/media/:mediaId` generic endpoint |
| `POST` | `/v2/elements/analyze` | Element | multimodal AI vision → keywords + guidelines | Body `{ projectId, workflowId, imageUrls:[], elementName, elementType }` | LLM / vision errors | `useAnalyzeElementVision()` — NOT optimistic (cache invalidate on success) |
| `POST` | `/v2/elements/build-prompt` | Element | compose prompt from references | Body element fields | validation errors | prompt-bar internal |

---

### 2.9 Payments / Credits

| Method | URL | Entity | Action | Payload / Response | Error codes | Frontend caller |
|---|---|---|---|---|---|---|
| `GET`  | `/payments/packages` | Package | list | `{ packages:[{id,price,credits,title,description,…}], modelsComparison:{image,video} }` | — | `usePackages()` paymentsApi.js |
| `POST` | `/payments/checkout` | Order | create | Body `{ packageId }` → `{ checkoutUrl }` (Lemon Squeezy redirect) | `PACKAGE_NOT_FOUND` | `useCheckout()` paymentsApi.js — NOT optimistic (redirect) |
| `POST` | `/payments/webhook` | Event | server-side only (signed) | Lemon Squeezy signature validation → apply credits | server only | server only |
| `GET`  | `/payments/history` | History | list user purchases | `{ orders:[] }` | — | future billing page (not yet built) |

---

### 2.10 Other / Misc Routes (no optimistic effect expected)

| Method | URL | Entity | Action | Notes |
|---|---|---|---|---|
| `GET`  | `/health` | Server | status | No UI effect |
| `GET`  | `/ready` | Server | readiness | No UI effect |
| `GET`  | `/models` | Model | list | Triggered by PromptBar / Pricing page |
| `POST` | `/prompt` | Prompt | legacy prompt | Used by old flows |
| `POST` | `/media-ingest/…` | Media | presigned URLs / presign | Backend only |
| `GET`  | `/wallet/…` | Wallet | admin operations | No front-end mutations that need optimistic |
| `POST` | `/admin/…` | Admin | admin ops | Strictly `requireAdmin` → no user-facing UX that needs optimistic |
| v2 routes | `/v2/workflows/*` | Workflow | v2 engine endpoints | Some routed via `/api/elements/analyze` BFF (`my-app/src/app/api/…/route.js`) |

---

## 3. HOOKS / FILE ORGANIZATION (Frontend React Query Layer)

### 3.1 File map and exported hooks

| File | Exported hook(s) | Optimistic? | Notes |
|---|---|---|---|
| **`features/workflows/api/workflowsApi.js`** (625 lines — **central mutations hub**) | `useProjectData(projectId)` | — (read) | **Single source of truth** for `projectData.byProject()`. Returns `{projectName, projectContents:{workflows, media, characters, elements}}`. Stale 30s, polls every 30s if any media is pending. |
| (same) | `useGenerateMutation()` | ✅ **YES** | `onMutate`: snapshot + inserts `optimistic-gen-{ts}` workflow + pending media. `onError`: restore. `onSuccess`: invalidateQueries + 500ms delay. **Duplicate `useCharacter` creation. Also applies to video.** |
| (same) | `useExtendVideoMutation()` | ❌ No | No cache update at all, just scroll+log onError. |
| (same) | `useRemoveWorkflow()` | ✅ **YES** | Single + batch. `onMutate` filters by IDs on both wf.id **and** wf.name. Rolls back media too. |
| (same) | `useRemoveWorkflowItem()` | ❌ No | Just invalidateQueries("projectData") after success. Users may notice wait. |
| (same) | `useToggleLike()` (media item) | ✅ **YES** | Flips `is_liked`/`is_Like`. ID compare `m.id===itemId || m.name===itemId`. Rollback on error. |
| (same) | `useToggleWorkflowLike()` | ✅ **YES** | Single + batch. Flips `wf.metadata.favorited`. Normalizes ids array. Rollback. |
| (same) | `useUpdateWorkflow()` | ⚠️ **PARTIAL (post-success)** | No `onMutate`. Patches cache inside `onSuccess` only. Mutations that need optimistic before round-trip will feel laggy. Also updates `characters[]` and `elements[]` by `cleanId` matching. |
| (same) | `useSetPrimaryMedia()` | ❌ No | No optimistic. Just invalidate. |
| (same) | `useMoveWorkflow()` | ❌ No (stub) | Returns `{ok:true}` without API call. Legacy dead code. Move is actually done via `useMoveAssetToFolder()` (foldersApi.js). |
| (same) | `useDetachMedia()` | ❌ No | Just invalidate. Could benefit from optimistic (promote media → new workflow entry in cache immediately). |
| (same) | `useDeleteMedia()` | ❌ No | Just invalidateQueries("projectData") after success. |
| (same) | **Re-exports** from `features/characters` | — | `useCharacter`, `useCharacterWorkflows`, `useCreateCharacterMutation`, `useUpdateCharacter`, `useGenerateCharacterSheetMutation`, `useGenerateCharacterDescriptionMutation`, `useAddMediaToCharacter`, `useRemoveMediaFromCharacter`, `useSetCharacterSheetMedia` (see below). |
| (same) | **Re-exports** from `features/elements` | — | `useElement`, `useElementSheetWorkflows`, `useCreateElementSheetMutation`, `useUpdateElementMetadata`, `useAddImageToElement`, `useDeleteMediaItem`, `useAnalyzeElementVision` (see below). |
| **`features/folders/api/foldersApi.js`** | `useCreateFolder()` | ❌ No | No optimistic. Just invalidates on success. Would be a nice addition (instant new collection card). |
| (same) | **`useUpdateFolder()`** | ✅ **NOW YES (this session)** | Rename (`patch.name`) + move (`patch.parentId`). `onMutate`: snapshot + map by folder id/folderId/_id. `onError`: restore. |
| (same) | **`useDeleteFolder()`** | ✅ **NOW YES (this session)** | Removes by id/folderId/_id. Rolls back on error (covers `FOLDER_NOT_EMPTY` which is server-rejected). |
| (same) | **`useMoveAssetToFolder()`** | ✅ **NOW YES (this session)** | Patches `wf.folder_id/folderId/metadata.folder_id+folderId`. Normalizes workflow ids (strip `workflows/` prefix + compare both wf.id & wf.name & workflowId). |
| (same) | `useProjectFolders(projectId)` | — (read) | Wraps `GET /projects/:projectId/folders`. Used by root assets grid. |
| **`features/media/api/mediaApi.js`** | `useAssets()` | — (read) | Paginated `GET /workflows/assets/:project_id`. Rarely used. |
| (same) | `useUserLibrary()` / `useInfiniteUserLibrary()` | — (read) | `GET /workflows/library`. |
| (same) | `useLibraryWorkflowDetail()` | — (read) | `GET /workflows/library/:id`. |
| (same) | **`useBatchUploadAssets()`** | ✅ **YES** | `onMutate`: blob URL from `URL.createObjectURL(file)` + inserts optimistic-upload-{ts} entries into BOTH `generations.all()` AND `projectData.byProject()` caches. Writes folder_id/media_type too. onError: revokes blob URLs immediately. onSettled: revokes blobs after 2000ms (avoids flicker while server data refetch). Sophisticated pattern. |
| (same) | **`useRemoveAsset()`** | ✅ **YES** | Deletes media + cascades parent workflow removal if it was the last remaining media item. Snapshot + rollback. |
| (same) | `downloadMediaItem()` | N/A | Pure helper. No cache. |
| **`features/projects/api/projectsApi.js`** | `useProjects()` | — (read) | list all user projects. Normalizes `project_id ← p.project_id ?? p.id`. |
| (same) | `useCreateProject()` | ❌ No | Just invalidates on success. Would be nice (optimistic insert into list). |
| (same) | `useUpdateProject()` | ❌ No | Just invalidates on success. |
| (same) | `useDeleteProject()` | ❌ No | Just invalidates on success. Optimistic here is also low-risk because after success you navigate to projects list anyway. |
| **`features/payments/api/paymentsApi.js`** | `usePackages()` | — (read) | Credit packages + modelsComparison. Stale 10 min. |
| (same) | `useCheckout()` | ❌ No (no cache effect) | Immediate `window.location.href = checkoutUrl`. |
| **`features/characters/hooks/useCharacter.js`** (~900 lines — master domain hook) | `useCharacterWorkflows()` | — (read) | Memo-filter from `projectContents.workflows` where `workflow_type ∈ {CHARACTER, CHARACTER_SHEET}`. Enriches with mainMedia, status, items. |
| (same) | **`useCreateCharacterMutation()`** | ✅ **YES** | Uses dedicated `characterService.buildOptimistic* helpers` → triple insert (workflow, media, character) in cache. Snapshot + rollback. |
| (same) | `useUpdateCharacter()` | ⚠️ **PARTIAL (post-success)** | Same pattern as `useUpdateWorkflow()` — writes patch cache on success, not onMutate. |
| (same) | `useGenerateCharacterSheetMutation()` | ❌ No | No optimistic (generates sheet image in background — no cache row added/removed). |
| (same) | `useAddMediaToCharacter()` | ❌ No | Just invalidate on success. (Detail images shown via projectContents.media with step_id="character_detail") |
| (same) | `useRemoveMediaFromCharacter()` | ❌ No | Just invalidate. Note: the `uploadDetailFiles` local state flow (useCharacter line ~719) has a **separate local optimistic path** that rolls back on per-file failure, but this is NOT the same as the cache mutation. |
| (same) | `useSetCharacterSheetMedia()` | ❌ No | Just invalidate. |
| (same) | `useGenerateCharacterDescriptionMutation()` | ❌ No | No cache effect (pure AI prompt response). |
| (same) | **`useCharacter({projectId, characterId})` — master unified hook** | mixed | Wires together all above. Contains **local state only optimistic patterns** inside (optimisticSheetUrl + addedDetailImages[]). Those patterns use try/catch + setState, not `onMutate/onError`. Bug exists: `removeDetailImage()` handler (line ~800) does optimistic setState remove but **NEVER rolls back if the DELETE call fails** (returns silently). This is a desync candidate. |
| **`features/characters/services/characterService.js`** | `characterService` object (pure API + builders) | N/A | Standalone API calls + 3 optimistic builder helpers (`buildOptimisticWorkflow / buildOptimisticMedia / buildOptimisticCharacter`). Pattern is correct and reused. Contains `console.error` → violates AGENTS.md "never console.*, use structured logger". |
| **`features/elements/hooks/useElement.js`** (~700 lines — master domain hook) | `useElementSheetWorkflows()` | — (read) | Memo-filter from `projectContents.workflows` where `workflow_type ∈ {ELEMENT_SHEET, ELEMENT}`. Enriches from `projectContents.elements[]` via `Map()`. Supports likes, text search sort. |
| (same) | **`useCreateElementSheetMutation()`** | ✅ **YES** | Optimistic workflow + media insert (triple if character-type routed). Rollback. |
| (same) | **`useUpdateElementMetadata()`** | ✅ **YES** | Patches BOTH `workflows[]` (display_name/metadata) AND `elements[]` (name/description/guidelines/element_type) synchronously in `onMutate`. Rolls back. Clean pattern. |
| (same) | `useAddImageToElement()` | ❌ No | Just invalidate on success. |
| (same) | `useDeleteMediaItem()` | ❌ No | Calls generic `/workflows/media/:mediaId`. Just invalidate. |
| (same) | `useAnalyzeElementVision()` | ❌ No | Just invalidate. No UI cache writes before call. |
| (same) | **`useElement({projectId, elementId})` — unified hook** | mixed | Wires together + `useWorkflowDelete()`. No extra local optimistic state. |
| **`features/workflows/model/useWorkflowDelete.js`** (new unified delete service) | **`useWorkflowDelete()`** — promptDelete → confirmDelete → deleteMutation | ✅ **YES** | Three-phase: dialog confirm → instant close → background mutation. One `onMutate`: removes by id/name from `projectContents.workflows[]` + cascades media. `onError` restores. Used by `useCharacter.deleteCharacter`, `useElement.deleteElement`. Bug: uses `console.error` (violates AGENTS.md logger rule). Supports only single workflow; batch is only in legacy `useRemoveWorkflow()`. |
| **`features/workflows/model/useFilteredWorkflows.js`** | `useFilteredWorkflows()` | — (read) | Master view-aggregator. Memoizes `data?.projectContents?.{workflows, media, characters, elements}` → `filteredWorkflows[]` (used by root assets page & asset list views). Normalizes each wf → `{ id: wf.name, name: wf.name, … }` — this is why **ID matching MUST compare wf.name alongside wf.id** in optimistic updaters. |
| **`features/workflows/model/useWorkflowsStore.js`** (Zustand) | useWorkflowsStore | N/A (client state only) | Holds UI only: selectedProjectId, activeStudioTab, gridSize, isNavbarHidden, _elementFilters, drag flags, scroll callbacks, activeCollectionId. **No server data lives here** so optimistic mutations generally do NOT need to touch it (but MediaGridItem.drop relies on `usePromptStore.draggedItem` to communicate between components). |
| **`features/prompt-bar/model/usePromptStore.js`** (Zustand) | usePromptStore | N/A (client state) | Stores `isDraggingGalleryItem`, `draggedItem`. This store is used as a fallback when `e.dataTransfer` returns null during drop handlers. Optimistic moves don't need to patch it — it only carries the *action payload*, not result state. |

---

### 3.2 Query Keys Reference (central file)

File: `my-app/src/shared/api/queryKeys.js` (46 lines)

```js
queryKeys = {
  auth:        { me: () => ["auth","me"], walletBalance: ()=>["auth","walletBalance"] },
  projects:    { all: () => ["projects"], list: () => ["projects","list"] },
  workflows:   { all: () => ["workflows"], byProject: pId => ["workflows", pId], paginated: page => ["allWorkflows", page] },
  generations: { all: () => ["workflows"], byProject: pId => ["workflows", pId] }, // alias of workflows
  assets:      { all: () => ["assets"], byProject: (pId, off, t, mT) => ["assets", pId, off, t, mT] },
  library:     { all: () => ["library"], user: params => ["library","user", params], detail: wfId => ["library","detail", wfId] },
  models:      { studio: () => ["studioModels"] },
  projectData: { byProject: pId => ["projectData", pId] }, // ⭐ PRIMARY cache key for all studio optimistic operations
  folders:     { all: () => ["folders"], byProject: pId => ["folders", pId] },
}
```

> 🚨 **Rule of thumb:** Any mutation that affects workflows/media/chars/elements should write to `queryKeys.projectData.byProject(projectId)`. Folder operations touch `queryKeys.folders.byProject(projectId)` + optionally projectData.

---

## 4. CURRENT OPTIMISTIC STATUS SUMMARY TABLE — EVERY MUTATION HOOK

Legend: ✅ = Optimistic (onMutate + onError rollback). ⚠️ = Patches cache on SUCCESS only (retarded UX). ❌ = No cache write, pure invalidation / blocking UX. BUG = broken path (no rollback or desync).

| # | Hook / Operation | File | Entity | Current | Notes / Gaps |
|---|---|---|---|---|---|
| 1 | `useGenerateMutation()` (image) | workflowsApi.js | Workflow+Media | ✅ | OK pattern |
| 2 | `useGenerateMutation()` (video / isVideo=true) | workflowsApi.js | Workflow+Media | ✅ | OK pattern (same hook) |
| 3 | `useExtendVideoMutation()` | workflowsApi.js | Media | ❌ | No optimistic. Would insert pending media if we choose to extend UX. |
| 4 | `useRemoveWorkflow()` (single + batch) | workflowsApi.js | Workflow (+Media) | ✅ | Good. Deletes both wf[] + media[] via id+name match. |
| 5 | `useRemoveWorkflowItem()` (legacy DELETE `/items/:itemId`) | workflowsApi.js | Media | ❌ | Just invalidate. Rarely used; duplicate of `useRemoveAsset()`/`useDeleteMedia()`. |
| 6 | `useToggleLike()` (media) | workflowsApi.js | Media (flag) | ✅ | Good pattern. |
| 7 | `useToggleWorkflowLike()` (wf favorite — single/batch) | workflowsApi.js | Workflow (flag) | ✅ | Good pattern. |
| 8 | `useUpdateWorkflow()` (rename/desc/any field) | workflowsApi.js | Workflow + chars + elems | ⚠️ | No `onMutate`. User sees delay during edit → save. Would benefit from optimistic. |
| 9 | `useSetPrimaryMedia()` | workflowsApi.js | Workflow | ❌ | Just invalidate. Optimistic could swap primary cover image instantly. |
| 10 | `useDetachMedia()` → new standalone UPLOAD workflow | workflowsApi.js | Workflow+Media | ❌ | No optimistic. Missing: insert new workflow + media into cache immediately (like useBatchUploadAssets pattern). |
| 11 | `useDeleteMedia()` (`/workflows/media/:id`) | workflowsApi.js | Media | ❌ | Same as item delete — no optimistic. |
| 12 | `useCreateFolder()` | foldersApi.js | Folder | ❌ | No optimistic. Low hanging fruit: instant new collection card inserted in `folders.byProject[]`. |
| 13 | `useUpdateFolder()` — rename + move | foldersApi.js | Folder | ✅ | **NOW OPTIMISTIC (this session)**. Parent ID move + name patched. |
| 14 | `useDeleteFolder()` | foldersApi.js | Folder | ✅ | **NOW OPTIMISTIC (this session)**. Covers `FOLDER_NOT_EMPTY` rollback. |
| 15 | `useMoveAssetToFolder()` — workflow move in/out folder | foldersApi.js | Workflow (folder_id) | ✅ | **NOW OPTIMISTIC (this session)**. Writes folder_id + folderId + metadata variants, ids normalized. |
| 16 | `useBatchUploadAssets()` | mediaApi.js | Workflow+Media (UPLOAD) | ✅ | Complex — good reference pattern for blob URL + revoke timing. |
| 17 | `useRemoveAsset()` (delete single media → cascade wf if empty) | mediaApi.js | Media (+Workflow) | ✅ | Good pattern + cascade logic. |
| 18 | `useCreateProject()` | projectsApi.js | Project | ❌ | Just invalidate. |
| 19 | `useUpdateProject()` | projectsApi.js | Project | ❌ | Just invalidate. |
| 20 | `useDeleteProject()` | projectsApi.js | Project | ❌ | Just invalidate. |
| 21 | `usePackages()` (read) | paymentsApi.js | Package | N/A | (read) |
| 22 | `useCheckout()` | paymentsApi.js | Order | ❌ | Immediate redirect. No need. |
| 23 | `useCreateCharacterMutation()` | useCharacter.js | Character (triple: wf+media+char) | ✅ | Good pattern, uses builders. |
| 24 | `useUpdateCharacter()` | useCharacter.js | Character + Workflow | ⚠️ | Patches cache on **success** (not onMutate). |
| 25 | `useGenerateCharacterSheetMutation()` | useCharacter.js | Media | ❌ | No optimistic. Low priority — job-based, returns later anyway. |
| 26 | `useAddMediaToCharacter()` (detail img) | useCharacter.js | Media | ❌ | Just invalidate. Could insert new media with status "uploading" + blob preview. |
| 27 | `useRemoveMediaFromCharacter()` (detail img DELETE) | useCharacter.js | Media | ❌ (BUG in parallel local path) | Server mutation is pure invalidate. SEPARATE BUG inside `useCharacter.removeDetailImage`: local state remove BEFORE call but never rolls back → desync on error. |
| 28 | `useSetCharacterSheetMedia()` (primary sheet) | useCharacter.js | Character + Media | ❌ | Just invalidate. Optimistic could set main_media_url / mainMedia preview instantly via blob. |
| 29 | `useGenerateCharacterDescriptionMutation()` | useCharacter.js | (text) | ❌ | No cache effect. No need. |
| 30 | `useWorkflowDelete()` (delete dialog wrapper for GENERATION / CHARACTER_SHEET / ELEMENT_SHEET) | useWorkflowDelete.js | Any workflow type (+cascade) | ✅ | Good pattern. Note: only single deletes (batch only in legacy useRemoveWorkflow). Uses console.error — AGENTS.md logger violation. |
| 31 | `useCharacter local states` (uploadDetailFiles / optimisticSheetUrl) | useCharacter.js | UI-local media previews | ⚠️ | Local try/catch optimistics, well done for uploads but buggy for removeDetailImage (no rollback). |
| 32 | `useCreateElementSheetMutation()` | useElement.js | Element (workflow+media) | ✅ | Good pattern. |
| 33 | `useUpdateElementMetadata()` | useElement.js | Element + Workflow | ✅ | Clean pattern — onMutate patches workflows[] + elements[] synchronously. Best reference example. |
| 34 | `useAddImageToElement()` (ref image) | useElement.js | Media | ❌ | Just invalidate. Optimistic could add uploading preview. |
| 35 | `useDeleteMediaItem()` (generic /workflows/media/:id) | useElement.js | Media | ❌ | Just invalidate. |
| 36 | `useAnalyzeElementVision()` | useElement.js | Element (guidelines) | ❌ | Just invalidate. Async AI task, low priority. |
| 37 | `Auth signup / login / logout` (auth.js) | shared/api/auth.js | User | ❌ | Session-based; redirects. No optimistic needed. |
| 38 | **Drop handlers (UI callers): MediaGridItem.handleDrop, StudioNavbarLeft.executeMoveToParent, collection page.handleRootDrop** | 4 UI files | Workflow / Folder move | ✅ **NOW FIRE-AND-FORGET** | Previously: `await moveAsset()` (blocking UI → user could feel lag). This session: removed `await` → fire-and-forget, `onMutate` runs synchronously in same event tick → instant UX. Catch is empty because mutation-level `onError` already restores old state. |
| 39 | `EditableDisplayName.jsx` / `InlineRenamePill.jsx` (folder/workflow rename UI triggers) | shared/ui | Folder / Workflow names | mixed | If rename calls `useUpdateFolder`/`useUpdateWorkflow` → gets optimistic level of respective hook. |

---

## 5. THE CANONICAL OPTIMISTIC PATTERN (Reference — already used in this repo)

Every mutation that touches the **primary server cache** (`projectData.byProject` or `folders.byProject`) should follow this 5-step recipe. Copy `useToggleLike` or `useUpdateElementMetadata` as a template.

```js
useMutation({
  mutationFn: async (vars) => {
    // 1. Call API; throw on !ok so TanStack treats it as failure.
    const res = await api.patch(`/endpoint/${id}`, vars.body);
    if (res?.ok === false) throw new Error(res?.message || "Failed");
    return res?.data ?? res;
  },

  onMutate: async (vars) => {
    // 2. Cancel in-flight queries → never race a refetch against the optimistic write.
    const key = queryKeys.projectData.byProject(vars.projectId);     // OR folders.byProject(...)
    await queryClient.cancelQueries({ queryKey: key });

    // 3. Snapshot previous state. This is your rollback token.
    const previousData = queryClient.getQueryData(key);

    // 4. Write the optimistic update to cache (SYNCHRONOUSLY so user sees it NOW).
    if (previousData) {
      queryClient.setQueryData(key, (old) => {
        // Always write BOTH snake_case + camelCase variants of any field being changed.
        // Always compare IDs on multiple aliases: (id AND name AND clean strip-prefix version).
        return mutateAppropriately(old, vars);
      });
    }

    // 5. Return context = { previousData, key } so onError can restore.
    return { previousData, key };
  },

  onError: (_err, _vars, context) => {
    // Restore the full snapshot. Do NOT try to re-apply logic — just restore.
    if (context?.previousData) queryClient.setQueryData(context.key, context.previousData);
    // Log via structured logger (NEVER console.* — AGENTS.md rule).
  },

  onSettled: (_res, _err, vars) => {
    // Reconcile with server. This both confirms the success write AND fixes any drift
    // from fields the server overwrote (timestamps, UUIDs, credit balances…).
    if (vars?.projectId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(vars.projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.byProject(vars.projectId) });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.folders.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.library.all() });
  },
});
```

### 5.1 Naming / field variants rules (critical to avoid "optimistic update not visible" bugs)

Always write ALL of these variants when changing an optimistic value. The UI filters and data normalizers read different keys depending on page.

| Field you're changing | Variants to write together (same value) |
|---|---|
| Folder relation (workflow) | `folder_id`, `folderId`, and also `metadata.folder_id`, `metadata.folderId` (the 4 together) |
| Folder parent | `parentId` and `parent_id` (2) |
| Workflow type / upload | `workflow_type`, `workflowType`, `type`, `is_upload` (4) |
| Workflow display name | `display_name`, `metadata.displayName`, `name` (for wf fallback display) |
| Workflow description / character info | `description` AND `character_info` (for character wf compatibility) |
| Element type | `element_type` AND `metadata.elementType` (and inside the elements[] entity row: `element_type`) |
| Character name | `name` AND `title` (in characters[] entity) |
| Media like | `is_liked` AND `is_Like` (both) |
| Media step / sheet role | `step_id` AND `workflowStepId` |
| Primary media (workflow) | `primary_media_id` AND `primaryMediaId` AND `metadata.primaryMediaId` |
| Media creation timestamp | `create_time`, `created_at`, `createTime`, `mediaMetadata.createTime` (pick sensible subset) |

### 5.2 ID comparison rules (never match on a single field)

Always compare on all these aliases. Prefer stripping `workflows/` prefix before compare.

```js
const cleanAssetId = String(vars.assetId || "").replace(/^workflows\//, "");
wfIdsMatch = (wf.id === assetId)
          || (wf.name === assetId)
          || (wf.workflowId === assetId)
          || (String(wf.id   || "").replace(/^workflows\//, "") === cleanAssetId)
          || (String(wf.name || "").replace(/^workflows\//, "") === cleanAssetId);
```

Reason: `useFilteredWorkflows.js` normalizes `{ id: wf.name, name: wf.name }` for views, so a mismatch on `name`-only filter will hide the item despite the cache row being updated.

---

## 6. KNOWN BACKEND ERROR CODES (used by UI rollback decisions & alert messages)

Aggregated from routes, FolderService.js, assets.js, character routes.

### 6.1 FolderService-specific (FolderError extends AppError)

| Code | HTTP | When |
|---|---|---|
| `FOLDER_NAME_INVALID` | 400 | folder name empty / non-string |
| `FOLDER_CYCLE` | 400 | move target = own descendant or self |
| `FOLDER_ALREADY_EXISTS` | 409 | unique name in same parent (postgreSQL 23505) |
| `FOLDER_NOT_EMPTY` | 400 | DELETE fails because folder contains workflows / subfolders (postgreSQL 23503 FK) → UI currently alerts "Cannot delete collection with items inside" |
| `PARENT_NOT_FOUND` / `NOT_FOUND` | 404 | project / folder / target parent does not exist or not owned |
| `VALIDATION_ERROR` | 400 | missing projectId, bad position integer, non-UUID folderId |

### 6.2 Assets / Upload errors

| Code | HTTP | When |
|---|---|---|
| `PAYLOAD_TOO_LARGE` | 413 | Image >20MB or Video>100MB (upload) |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | mimetype not in whitelist |
| `NOT_FOUND` | 404 | Project / folder / asset not owned |
| `APP_ERROR` / `INTERNAL_ERROR` | 500 | Storage / DB failures |

### 6.3 Generation errors

| Code | HTTP | When |
|---|---|---|
| `INSUFFICIENT_CREDITS` | 402 | balance below generation cost |
| `MODEL_DISABLED` | 400 | provider/model not in active roster |
| `RATE_LIMIT_EXCEEDED` | 429 | wallet/rate limiting |
| `VALIDATION_ERROR` | 400 | bad model parameters, missing prompt |
| AppError codes from provider runners | 502/500 | provider failures |

### 6.4 Rules that affect response shape and 404 semantics

AGENTS.md rule: *"Every id from a client must be ownership-checked and project-scoped. **Cross-tenant access returns 404, never 403**."* → Any `NOT_FOUND`/404 response can mean either (a) record doesn't exist OR (b) user isn't the owner — the frontend must never differentiate. For rollback purposes, ANY 4xx/5xx → full cache snapshot restore.

---

## 7. UI LOCATIONS THAT TRIGGER MUTATIONS — INVENTORY

| UI surface | Mutation(s) triggered | Current async feel? |
|---|---|---|
| MediaGridItem drop ONTO collection card | `useMoveAssetToFolder(workflow→folderId)` + `useUpdateFolder(draggedFolder→parentId)` | ✅ **NOW INSTANT** (fire-and-forget + optimistic) |
| StudioNavbarLeft "Move out of collection" back drop-zone | `useMoveAssetToFolder(workflow→parentId\|null)` + `useUpdateFolder(draggedFolder→parentId\|null)` | ✅ **NOW INSTANT** (same) |
| Collection page background (root drop) | Same two | ✅ **NOW INSTANT** (same) |
| MediaGridItem → right-click → "Placer dans la corbeille" (delete) | `useMediaActions.handleDelete()` → `useRemoveWorkflow()` or `useRemoveAsset()` | ✅ Already optimistic (legacy delete; if CHARACTER/ELEMENT dialog-based flow → useWorkflowDelete also optimistic). |
| Collection page → Navbar back button delete (StudioNavbarLeft.handleDelete) | `useDeleteFolder(collectionId)` then `router.push(backHref)` | ✅ **NOW OPTIMISTIC** (folder removed synchronously from cache). Navigate happens after success — might still feel blocked if user clicks the back button delete but the route transition itself is the bottleneck (not the API wait). Consider: fire delete then navigate immediately; rollback stays local. |
| Collection page / root assets → InlineRenamePill / EditableDisplayName on a collection card | `useUpdateFolder({ patch:{name} })` | ✅ **NOW OPTIMISTIC** (rename field written before API round-trip). |
| AssetsLibraryPage → bulk select → delete | `useRemoveWorkflow([ids])` batch | ✅ Already optimistic. |
| Workflow edit page → EditNavbar → Delete media (single) | `useDeleteMedia({mediaId})` then `router.push` if last item | ❌ **Blocking** (awaits + router.push). User sees stale media during delete call. |
| Workflow edit → Toggle media heart | `useToggleLike({itemId})` | ✅ Already optimistic. |
| Grid heart on MediaGridItem / Library card | `useToggleWorkflowLike()` (workflow favorite) | ✅ Already optimistic. |
| PromptBar → Generate (image/video) | `useGenerateMutation(payload, isVideo)` | ✅ Already optimistic. |
| NavbarImportButton → Upload media batch into collection | `useBatchUploadAssets({files, projectId, folderId:currentCollectionId})` | ✅ Already optimistic, instant blob previews inserted with `uploading` status. |
| Characters page → New Character (dialog) | `useCreateCharacterMutation` | ✅ Already optimistic. |
| Character detail → Edit name / description (inline) | `useUpdateCharacter` | ⚠️ **After-success patch** → feels laggy. |
| Character detail → Upload primary sheet → `setSheetMediaMutation` | `useSetCharacterSheetMedia` (via upload + FormData) | ❌ Blob preview exists in `optimisticSheetUrl` local state but server response invalidates entire `projectData.byProject` → sometimes causes flicker back to old image before server's new image loads. |
| Character detail → Add detail image (file or media picker) | `useAddMediaToCharacter` + local `addedDetailImages` state inside `uploadDetailFiles()` | ⚠️ Upload has local optimistic blob. Adding by media picker has no optimistic path. |
| Character detail → Remove detail image ❌ → `removeDetailImage` handler | `useRemoveMediaFromCharacter` mutation (invalidate only) + **BUGGY local `setAddedDetailImages` rollback missing** | BUGGY. Local item removed before call; if API call fails the UI stays inconsistent. Path: `useCharacter` line ~800. |
| Elements page → Create element dialog | `useCreateElementSheetMutation` | ✅ Already optimistic. |
| Element detail → Edit name/description/guidelines/type (inline) | `useUpdateElementMetadata` | ✅ **Already synchronous optimistic** → gold reference. |
| Element detail → Add reference image → file picker | `useAddImageToElement` | ❌ User sees empty slot wait for network. |
| Element detail → Delete reference image | `useDeleteMediaItem` → `/workflows/media/:id` generic | ❌ No optimistic. |
| Element detail → Analyze images (AI keywords) | `useAnalyzeElementVision` | ❌ Async task — invalidates on success. Expected UX. |
| Projects page → New project → dialog | `useCreateProject` → navigate | ❌ Navigate after success. Usually fine. Could insert optimistic card. |
| Projects page → Rename project → context menu | `useUpdateProject` | ❌ Just invalidates + list refetch → small delay. |
| Projects page → Delete project → confirm dialog | `useDeleteProject` → navigate | ❌ After success navigate. Expected. |
| Pricing → "Get Started" → package CTA | `useCheckout(packageId)` → redirect | ❌ Redirect is final step — no need for optimistic. |
| `/login` page → Email/password dialog | Auth `login()` | ❌ Session-based redirect. Correct. |

---

## 8. HIGH-LEVEL GAPS & RECOMMENDATIONS (Order: highest UX impact first)

1. **Rename & general field edits are success-time-only writes, not synchronous** (useUpdateWorkflow, useUpdateCharacter). These are visible on detail pages and delay "Save" feedback → apply `onMutate` snapshot pattern using the same triple-array cache patch they already implement correctly in their `onSuccess` path today.

2. **Media single deletes (`useDeleteMedia`, `useRemoveWorkflowItem`, `useAddImageToElement`, `useDeleteMediaItem` …) are still invalidate-and-wait**. Especially important on detail pages where the media grid is the whole view — insert `onMutate` filter/remove with rollback mirroring `useRemoveAsset()` pattern.

3. **Character sheet set + add/remove detail image desync**:
   - `useSetCharacterSheetMedia()` should insert optimistic blob URL like `useBatchUploadAssets` does, into `projectContents.media[].url` for the matching sheet-step media row.
   - Fix the silent `useCharacter.removeDetailImage` path: wrap the delete call in try/catch/finally and RESTORE `addedDetailImages` on failure.

4. **Character + Element set-primary / add-reference media optimistics**: insert media entries with `status: "uploading"` + blob URL synchronously in `onMutate`, mirroring the upload flow that already works.

5. **Delete Folder navigation race**: Currently MediaGridItem `handleDelete` awaits and then navigates only on success. Consider firing the delete mutation + navigating instantly (optimistic remove already happened). If rollback happens on the destination page or back, data still restored correctly — but this is a UX call, not a correctness issue.

6. **`console.error` → structured logger**: AGENTS.md rule "use structured logger, never console.*" is violated in 5+ locations (`useGenerateMutation.onError`, `useWorkflowDelete.onError`, `useCreateCharacterMutation.onError`, `useUpdateElementMetadata.onError`, `useCreateElementSheetMutation.onError`, `characterService.js downloadImage`, mediaApi.js `downloadMediaItem`, `removeDetailImage` catch block…). Replace with `useLogger()` or whatever the frontend logger hook is.

7. **Logger rule also applies to back-end** (AGENTS.md), and back-end already has `createLogger("route:assets")` so the infra exists; front-end counterpart should be audited separately.

8. **No unified `setQueriesData` wrapper for folder_id writes.** Today move + upload + delete each replicate folder_id variants. If a new variant (`wf.folderUuid`) is ever introduced we have 6+ locations to patch. Consider a shared helper `setFolderOnWorkflow(wf, folderId)` + `normalizeWorkflowMatches(wf, assetId)` exported from `domainNormalizer.js` and reuse everywhere.

9. **Project-list mutations (create/update/delete) have no optimistic writes**: low impact because they navigate away or show toast, but for consistency easy to apply `queryKeys.projects.all()` insert/filter pattern with rollback.

10. **`setQueriesData` vs `setQueryData`**: Today `useUpdateWorkflow` uses `setQueriesData({queryKey:['projectData']})` (broad) while all others use `setQueryData(projectData.byProject(pId))` (narrow). The broad version is safer if a user has two project tabs open; the narrow version is less churn. Standardize on: **mutations that receive `projectId` → narrow `byProject(pId)`**. Mutations that don't know the project (today: none — all receive it) → broad.

11. **Batch vs single delete**: Only `useRemoveWorkflow` (legacy) supports batch. `useWorkflowDelete` dialog system is single only. If you ever want bulk delete dialog for characters/elements, unify them.

---

## 9. FILES INDEX (for future PRs applying optimistic across the board)

### 9.1 Frontend mutation files that need optimistic additions

| Absolute path |
|---|
| [workflowsApi.js](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/workflows/api/workflowsApi.js) — useUpdateWorkflow, useSetPrimaryMedia, useDetachMedia, useDeleteMedia, useExtendVideoMutation |
| [foldersApi.js](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/folders/api/foldersApi.js) — useCreateFolder only (others already done) |
| [projectsApi.js](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/projects/api/projectsApi.js) — useCreateProject, useUpdateProject, useDeleteProject (optional low) |
| [useCharacter.js](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/characters/hooks/useCharacter.js) — useUpdateCharacter onMutate; add/remove detail; setSheetMedia; removeDetailImage local state bugfix |
| [characterService.js](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/characters/services/characterService.js) — logger rule (cosmetic/rule compliance) |
| [useElement.js](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/elements/hooks/useElement.js) — addImageToElement, deleteMediaItem (apply removeAsset style) |
| [useWorkflowDelete.js](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/workflows/model/useWorkflowDelete.js) — logger rule compliance (replace console.error) |
| [EditNavbar.jsx](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/widgets/EditNavbar/EditNavbar.jsx) — single media delete currently `await`s → fire-and-forget like the drop handlers |
| [domainNormalizer.js](file:///c:/Users/jihad/Desktop/open%20art/my-app/src/features/workflows/model/domainNormalizer.js) — candidate to host shared helpers: `normalizeWorkflowId()`, `workflowMatchesId()`, `patchFolderOnWorkflow()`. |

### 9.2 Backend service files that emit error codes referenced above

| Absolute path |
|---|
| [FolderService.js](file:///c:/Users/jihad/Desktop/open%20art/apiOpenArt/src/domain/folder/FolderService.js) — FolderError codes |
| [assets.js](file:///c:/Users/jihad/Desktop/open%20art/apiOpenArt/routes/assets.js) — upload + move + delete error responses |
| [routes/folders.js](file:///c:/Users/jihad/Desktop/open%20art/apiOpenArt/routes/folders.js) — folder update/delete endpoints |
| [routes/workflows.js](file:///c:/Users/jihad/Desktop/open%20art/apiOpenArt/routes/workflows.js) — workflow patch/delete/like endpoints |
| [AppError.js](file:///c:/Users/jihad/Desktop/open%20art/apiOpenArt/src/utils/AppError.js) — base domain error class |

---

End of audit.
