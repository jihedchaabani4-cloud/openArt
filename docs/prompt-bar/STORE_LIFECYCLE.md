# Prompt Bar Store Lifecycle & Persistence

## 1. Store Identity & Isolation
Every Prompt Bar instance in the application is managed through the external `registry` (`src/features/prompt-bar/store/registry.js`). Instances are strictly scoped by three coordinates:
- `templateId`: Identifier of the prompt bar composition type (e.g., `"generated-media"`, `"character"`, `"default"`).
- `instanceId`: Disambiguates concurrent bars of the same template within the same screen/project (defaults to `"default"`, or custom e.g., `"compare-left"`, `"modal"`).
- `projectId`: Scoped project identifier (resolved from route path `/cinema-studio/:projectId` or `"global"`).

No global singleton store exists. Two bars mounted on the same page or across projects never share state unless explicitly assigned identical identity coordinates.

## 2. Storage Key Format
State is persisted to browser storage (default: `sessionStorage`) using the canonical versioned key:
```
pb2:<templateId>:<instanceId>:<projectId or "global">
```
Examples:
- `pb2:generated-media:default:proj_abc123`
- `pb2:character:modal:global`

Legacy unversioned keys (`studio-prompt-bar_<projectId>`) are supported for fallback reads during migration and mirrored for backwards compatibility.

## 3. Persisted State Shape
Only stable, serializable parameters defined in PB-D-07 with schema version `v: 2` are written to storage:
- `prompt`: String prompt text.
- `selectedModelId`: Currently selected model ID.
- `activeMode` & `activeSubMode`: UI composition modes (`"image"`, `"video"`, `"frames"`, `"reference"`).
- `parameterValues`: Map of model parameter values (excluding transient blobs/files).
- `elements` & `characters`: Entity ID arrays (clean string IDs, never raw blob URLs).

### Strict Exclusions:
- `isGenerating`: Never persisted. Generation loading state is strictly transient.
- Temporary files and URLs: `File`, `Blob`, `blob:...`, and `data:...` URLs are stripped prior to serialization.

## 4. Write Schedule & Debounce
Writes to storage do not happen during React component rendering.
- State changes trigger a trailing debounce of `DEFAULT_PERSIST_DEBOUNCE_MS = 300ms` via `createSaver`.
- On component unmount, `saver.flush()` writes pending mutations synchronously before stopping the subscriber.
- Storage write exceptions (quota errors, disabled storage) are caught and logged safely without throwing.

## 5. Hydration & Loading Order
Storage is read **after mount** inside `useEffect`, ensuring zero SSR hydration mismatch:
- **First render**: Uses clean initial defaults (or `initialConfig`) with zero storage access.
- **Hydration before models load**: If models are fetching asynchronously (React Query), hydrated values are staged in `pendingHydration`. Once `setModels` executes, the saved model and parameters are reconciled against the loaded models catalog.
- **Hydration after models load**: Saved model and parameters are immediately reconciled against available models.

## 6. Memory Eviction & Clearing Policy
- **Project Switching**: When navigating between projects (e.g. Project A to Project B), unmounted instances belonging to other projects are pruned from `registry` memory via `registry.pruneOtherProjects(currentProjectId)`. Their state remains safely persisted in storage and hydrates upon return.
- **Explicit Clearing**: Calling `clearPersistentPromptBarStores()` disposes all registry instances and removes matching keys from storage.

## 7. Submit Lifecycle & In-Flight Token Rule
- When generation begins, `beginSubmit()` registers an in-flight token with `registry.beginSubmit(identity)` and sets `isGenerating: true`.
- When generation finishes (in `finally`), `endSubmit(token)` validates the token. Old or mismatched tokens are rejected.
- If a component mounts and finds `isGenerating: true` in memory while `registry.isSubmitting(identity)` is false (e.g., after aborted navigation or stale memory), `isGenerating` is automatically reset to `false`.
