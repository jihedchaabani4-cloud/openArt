# Element Sheet Builder & Generation System Prompts

Full specifications and copy-pasteable system prompts for each phase of the Element Reference Pipeline.

---

## 1. Vision Analysis & Master Identity Extractor

**Role**: Vision LLM (e.g. Gemini 2.0 Flash / Pro, GPT-4o, Claude 3.5 Sonnet)

**System Prompt**:
```text
You are a precision Vision Product Analyzer. You are provided with 1 to 6 reference images of a single subject (product, object, or character).

Your task is to analyze all provided views and synthesize a single canonical identity profile. Focus ONLY on invariant features that must remain identical across future renderings.

Provide your response in JSON format matching the following structure:
{
  "element_name": "<Short 2-4 word name>",
  "category": "<Product | Character | Object | Environment | Vehicle>",
  "master_identity": "<Comprehensive 3-4 sentence paragraph specifying shape, proportions, key materials, surface finish, exact colors, structural details, and signature visual elements>",
  "consistency_rules": [
    "<Rule 1: Proportions/silhouette constraint>",
    "<Rule 2: Material/texture constraint>",
    "<Rule 3: Logo/branding placement constraint>"
  ],
  "variable_aspects": "<Aspects that can change depending on scene, e.g., lighting, placement, environment>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}
```

---

## 2. Reference Sheet Generation Prompt (Pure AI Pass)

**Role**: Image Generation Engine Prompt Builder

**Prompt Construction Logic**:
```python
def build_reference_sheet_prompt(master_identity: str, category: str) -> str:
    return (
        f"An orthographic studio product reference sheet displaying three clean, aligned views: "
        f"[1] Front view on the left, [2] Side profile view in the middle, and [3] Rear view on the right. "
        f"Subject description: {master_identity}. "
        f"Style: Ultra-clean 3-view orthographic studio render, neutral plain light gray studio background, "
        f"soft even studio light setup, zero perspective distortion, photorealistic, 16:9 aspect ratio."
    )
```

---

## 3. Prompt Builder Pro: Multi-Element Scene Assembly Engine

**Role**: Final Image Generation Payload Builder (Combining $N$ Elements + User Prompt)

**Prompt Construction Logic**:
```python
def build_multi_element_scene_prompt(
    user_prompt: str, 
    elements: list[dict] # list of {"name": str, "compact_identity": str, "rules": list[str]}
) -> str:
    prompt_parts = []
    
    # 1. Main Scene Description
    prompt_parts.append(f"Main Scene: {user_prompt}")
    
    # 2. Add Subject Identities
    for idx, elem in enumerate(elements, 1):
        rules_str = ", ".join(elem["rules"])
        prompt_parts.append(
            f"Subject {idx} ({elem['name']}): {elem['compact_identity']} [Constraints: {rules_str}]"
        )
    
    # 3. Global Quality & Style Anchor
    prompt_parts.append("Style: Cinematic composition, natural lighting interaction between subjects, photorealistic, highly detailed.")
    
    return " | ".join(prompt_parts)
```
