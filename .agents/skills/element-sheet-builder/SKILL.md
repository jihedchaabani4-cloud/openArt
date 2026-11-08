---
name: "element-sheet-builder"
description: "AI Element Reference System: Convert 1-6 user images into a unified 3-view Reference Sheet and build multi-element generation prompts."
compatibility: "Requires Vision LLM and Image Generation API (e.g. DALL-E, Flux, Midjourney, Wavespeed)"
metadata:
  author: "antigravity"
  version: "1.0.0"
---

# AI Element Reference System Skill

This skill defines the complete prompt engineering and pipeline architecture for creating persistent **AI Elements** and using them in multi-subject image generations.

---

## Skill Capabilities

1. **Vision Analysis & Master Identity Extraction**: Extract immutable shape, material, and visual identity from 1–6 user photos.
2. **AI Reference Sheet Prompt Builder**: Generate a unified orthographic 3-view (Front, Side, Back) studio reference sheet in a single AI pass.
3. **Multi-Element Scene Builder**: Combine multiple AI Elements into a single cohesive generation prompt without token bloat or attribute bleeding.

---

## Workflow Steps

### Phase 1: Ingestion & Vision Analysis

When a user uploads 1–6 reference images for a new AI Element:

```json
{
  "step": "VISION_ANALYSIS",
  "system_prompt": "You are an expert product vision analyzer. Analyze the attached 1-6 reference images of the target object. Extract only invariant identity traits.",
  "output_format": {
    "name": "<Short Element Name>",
    "master_identity": "<Detailed 2-3 sentence paragraph describing invariant silhouette, proportions, materials, colors, and key details>",
    "consistency_rules": [
      "Keep identical proportions",
      "Do not alter material finish",
      "Preserve logo/branding placement"
    ],
    "category": "<Product / Character / Object / Vehicle>",
    "tags": ["tag1", "tag2"]
  }
}
```

---

### Phase 2: AI Reference Sheet Generation Prompt Construction

Construct the exact prompt to send to the Image Generation Model alongside the 1–6 user reference images:

```text
An orthographic studio product reference sheet displaying exactly three views: 
[1] Front view (left), [2] Side profile view (center), [3] Rear view (right) 
of {MASTER_IDENTITY}. 
Set against a clean, neutral studio background with soft studio lighting. 
High detail, orthographic projection, no perspective distortion, 16:9 aspect ratio.
```

* **Inputs to Image Model**:
  - `prompt`: The generated string above.
  - `image_references`: The 1–6 original user images attached as image-to-image / IP-Adapter conditionings.
* **Output**: A single 3-view AI Reference Sheet stored with the Element record (`element.reference_sheet_url`).

---

### Phase 3: Multi-Element Scene Generation Prompt Builder

When a user builds a prompt containing $N$ AI Elements (e.g., Element 1 + Element 2 + Scene Description):

```text
[SCENE DESCRIPTION]: {USER_PROMPT}

[SUBJECT 1 - {ELEMENT_1_NAME}]:
Visual Identity: {ELEMENT_1_COMPACT_IDENTITY}
Key Rules: {ELEMENT_1_HIDDEN_RULES}
Image Reference: [Attached Reference Sheet 1]

[SUBJECT 2 - {ELEMENT_2_NAME}]:
Visual Identity: {ELEMENT_2_COMPACT_IDENTITY}
Key Rules: {ELEMENT_2_HIDDEN_RULES}
Image Reference: [Attached Reference Sheet 2]

[GLOBAL STYLE]: Clean photography, realistic lighting, cohesive composition.
```

---

## References & Templates

See `resources/prompt_templates.md` for full copy-pasteable system prompts and API payload adapters.
