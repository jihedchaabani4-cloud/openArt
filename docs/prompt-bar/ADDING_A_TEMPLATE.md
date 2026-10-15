# Adding a Prompt Bar Template

This guide explains how to add a new Prompt Bar template to the Platform architecture.
The target footprint for any new bar is **two files**:
1. A Template Definition file: `src/features/prompt-bar/templates/<name>.template.js`
2. A Wrapper Component: `src/features/prompt-bar/templates/<Name>PromptBar.jsx`

---

## 1. What the Core Platform Does For You

When you create a template, you do **not** write state management, persistence, or UI chrome from scratch. The Core Platform provides:
- **Registry & Identity**: Isolated per-instance Zustand vanilla store lifecycle (`pb2:<templateId>:<instanceId>:<projectId>`).
- **Debounced Persistence**: Safe serialization (`selectPersistable`) with automatic storage hydration and media stripping.
- **Route Persistence Policy (`persistRoutes`)**: Automatic state reset and storage cleanup when users navigate outside allowed routes.
- **Reconciliation & Serialization**: Parameter trimming against manifest schemas, golden payload emission via backend keys.
- **Atomic Transitions**: `applyComposite` executing multi-step command sequences as a single synchronous batch.
- **Modular Layout**: Top panel (@mentions, import drawer), middle slots row, prompt editor, parameter drawer, and action buttons.

---

## 2. Template Definition: `src/features/prompt-bar/templates/<name>.template.js`

Use `defineTemplate` to declare rules, slot requirements, model eligibility, and external actions.

```javascript
import { defineTemplate } from "../core/templateContract.js";
import { PARAM } from "../core/parameterKeys.js";
import { applyComposite } from "../core/composite.js";
import { ok, fail, REASONS } from "../core/commandResult.js";

// 1. Slot Definitions
const SLOTS = [
  { role: "front", label: "Front View", accepts: "image/*" },
  { role: "side",  label: "Side View",  accepts: "image/*" },
];

export const characterSheetTemplate = defineTemplate({
  id: "character-sheet",

  // 2. Allowed Routes (state persists only on these routes; resets on exit)
  persistRoutes: [
    "/cinema-studio/:projectId/characters/*",
  ],

  // 3. UI Chrome Visibility
  layout: {
    showPromptInput: true,
    showModelSelector: false,     // false when template does not need model selection
    showParameterDrawer: false,   // false when template has no dynamic drawer
    showAttachmentBar: true,
    showModeSelector: false,
  },

  // 4. Feature Capabilities (PB-D-13)
  features: {
    models: false, // Model selector disabled
    modes: false,  // Mode tabs disabled
  },

  // 5. Default State
  defaultState: {
    prompt: "",
    parameterValues: {},
  },

  // 6. Slot Resolver: (mode, subMode, model) => SlotDef[]
  getSlots(mode, subMode, model) {
    return SLOTS;
  },

  // 7. Model Eligibility: (models, mode, subMode, parameterValues) => Model[]
  filterEligibleModels(models) {
    return models;
  },

  // 8. Parameter Mapping: (model, role) => backendKey | null
  resolveParameterMapping(model, role) {
    if (role === "front") return "front_image";
    if (role === "side") return "side_image";
    return null;
  },

  // 9. External Actions Factory: (core) => actions
  createActions(core) {
    return {
      setFrontImage(media) {
        if (!media) return fail(REASONS.INVALID_ARGUMENT);
        return core.attachMedia("front", media);
      },
    };
  },
});
```

---

## 3. Wrapper Component: `src/features/prompt-bar/templates/<Name>PromptBar.jsx`

The wrapper pre-binds the template definition and exposes a clean consumer API without repeating boilerplate.

```jsx
"use client";

import React from "react";
import { PromptBarPlatform } from "../platform/PromptBarPlatform.jsx";
import { characterSheetTemplate } from "./characterSheet.template.js";

export function CharacterSheetPromptBar({
  instanceId = "default",
  persistKey = "character-sheet-prompt-bar",
  projectId,
  ...restProps
}) {
  return (
    <PromptBarPlatform
      type={characterSheetTemplate}
      featureConfig={characterSheetTemplate}
      templateId={characterSheetTemplate.id}
      instanceId={instanceId}
      persistKey={persistKey}
      projectId={projectId}
      {...restProps}
    />
  );
}
```

---

## 4. Exporting in Public API

Export the new template and wrapper from `src/features/prompt-bar/index.platform.js`:

```javascript
export { CharacterSheetPromptBar } from "./templates/CharacterSheetPromptBar.jsx";
export { characterSheetTemplate } from "./templates/characterSheet.template.js";
```

Pages simply render `<CharacterSheetPromptBar onGenerate={...} />`.
