# Prompt Bar External Actions Guide

## Overview
External actions allow UI components outside the prompt bar (e.g. Asset Cards, Gallery Context Menus, Turnaround Sheets) to communicate with mounted Prompt Bar instances or queue actions for unmounted instances across page transitions.

External components never mutate global stores, never query the DOM, and never depend on React Context from other routes. All cross-component actions go through `promptBarService`.

---

## 1. The Service API

```javascript
import { promptBarService } from "@/features/prompt-bar/api/promptBarService";

const service = promptBarService({
  templateId: "generated-media", // target template
  projectId: "proj_123",         // target project
});
```

### Public Methods
| Method | Signature | Description |
|---|---|---|
| `setPrompt(text)` | `(string) => CommandResult` | Replaces prompt text |
| `focus()` | `() => CommandResult` | Requests focus on the prompt input/editor |
| `reset()` | `() => CommandResult` | Resets store state to defaults |
| `addReference(media)` | `(object) => CommandResult` | Attaches a reference media asset to an available slot |
| `animateMedia(media, [options])` | `(object, [object]) => CommandResult` | Switches to video/frames, clears old refs, and sets input_image |
| `applyGeneration(oldSettings)` | `(object) => CommandResult` | Reuses past generation parameters, mode, model, and prompt |
| `getSnapshot()` | `() => object` | Read-only state snapshot (`prompt`, `selectedModelId`, `activeMode`, `isGenerating`) |
| `run(actionName, ...args)` | `(string, ...any) => CommandResult` | Dispatches an arbitrary action by name |

---

## 2. Reasons Table (CommandResult)

Every action returns a canonical result object: `{ ok: boolean, reason?: string, details?: object }`.

| Reason | Meaning | Typical Handling |
|---|---|---|
| `ok: true` | Action applied directly to mounted store | Update UI / trigger focus |
| `NOT_MOUNTED` | Store is not mounted; action queued | If cross-page navigation is needed, navigate to the target route |
| `PROJECT_MISMATCH` | Action project does not match active instance project | Denied (cross-tenant safety guard) |
| `NO_ELIGIBLE_MODEL` | No model in catalog satisfies action requirements | Show toast: "No compatible model found" |
| `UNKNOWN_MODEL` | Specified model ID is not registered in catalog | Fallback to current model or reject |
| `NO_SLOT_FOR_ROLE` | Active template composition has no slot for reference role | Show toast: "Active mode does not support this slot" |
| `CAPACITY_EXCEEDED` | Exceeds model maximum reference capacity | Prompt user to remove references |
| `INVALID_ARGUMENT` | Missing required parameters or media | Validate inputs before calling |

---

## 3. The Queue Rule
When an instance is not mounted on the current screen (e.g. user clicks "Animate" on a Characters page):
1. **Automatic Enqueue**: `promptBarService` enqueues the action into `sessionStorage` under `openart_promptbar_pending_v1`.
2. **Project Scoped**: Actions are strictly scoped to `projectId`. Mismatched project keys are rejected.
3. **TTL Expiry**: Queued actions expire after 120 seconds (`DEFAULT_PENDING_TTL_MS`). Expired entries are discarded.
4. **Atomic Pop-Before-Run**: Entries are deleted from storage *before* execution on mount. Actions are applied once and never twice.
5. **Mount Drain**: When `PromptBarStoreProvider` mounts and models are populated, `drainPendingActions` automatically drains and executes the queued actions.

---

## 4. Usage Example: Asset Card Actions

```javascript
import { promptBarService } from "@/features/prompt-bar/api/promptBarService";
import { useRouter } from "next/navigation";

export function useAssetCardActions({ media, projectId, currentPath }) {
  const router = useRouter();
  const service = promptBarService({
    templateId: "generated-media",
    projectId: projectId || "global",
  });

  // 1. Add Reference
  const handleAddReference = () => {
    const res = service.addReference(media);
    if (!res.ok && res.details?.queued && !currentPath?.includes("/assets")) {
      router.push(`/cinema-studio/${projectId}/assets`);
    }
  };

  // 2. Animate Media
  const handleAnimate = () => {
    const res = service.animateMedia(media);
    if (!res.ok && res.details?.queued && !currentPath?.includes("/assets")) {
      router.push(`/cinema-studio/${projectId}/assets`);
      return;
    }
    service.focus();
  };

  // 3. Reuse Settings
  const handleReuseSettings = (historyItem) => {
    service.applyGeneration({
      mode: historyItem.isVideo ? "video" : "image",
      subMode: "frames",
      modelId: historyItem.modelId,
      prompt: historyItem.prompt,
      parameters: {
        ratio: historyItem.ratio,
        aspect_ratio: historyItem.ratio,
        quality: historyItem.quality,
        videoResolution: historyItem.videoResolution,
      },
    });
    service.focus();
  };

  return { handleAddReference, handleAnimate, handleReuseSettings };
}
```
