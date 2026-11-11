# 04 — Inputs

Only the search field + prompt editor exist in the live app **[captured]**. Other fields are **[derived]** from them (same tokens). Don't invent new styles.

States for every field: **Default · Hover · Focus · Filled · Error · Disabled** (+ Read-only).
Focus on fields = **1.5px white ring** (outline) on the field shell; the native input has no outline.

## Shared field shell
```css
.field{
  display:flex; align-items:center; gap:6px; height:var(--h-field); padding:4px 8px;
  background:var(--bg-surface-2); border:1px solid var(--border-default); border-radius:var(--r-lg);
  box-shadow:var(--sh-input); color:var(--text-primary);
  transition:border-color var(--t-fast), background-color var(--t-fast), opacity var(--t-fast);
}
.field input,.field textarea,.field select{
  flex:1; min-width:0; background:transparent; border:0; outline:0; color:var(--text-primary); font:500 14px/16px var(--font-ui);
}
.field input::placeholder,.field textarea::placeholder{ color:var(--text-tertiary) }
.field:hover{ border-color:var(--border-strong) }
.field:focus-within{ outline:var(--focus-ring-width) solid var(--focus-ring-color); outline-offset:0; border-color:transparent }
.field[data-invalid="true"]{ border-color:var(--danger) }                       /* [derived] */
.field[data-invalid="true"]:focus-within{ outline-color:var(--danger) }
.field[data-disabled="true"],.field:has(input:disabled){ opacity:var(--disabled-opacity); pointer-events:none }
.field[data-readonly="true"]{ box-shadow:none; background:var(--overlay-5) }
.field .icon{ width:16px; height:16px; color:var(--text-tertiary); flex:none }
.field:focus-within .icon{ color:var(--text-primary) }
```
| State | Border | Background | Text / placeholder | Ring | Opacity |
|---|---|---|---|---|---|
| Default | `--border-default` | `--bg-surface-2` | placeholder `--text-tertiary` | – | 1 |
| Hover | `--border-strong` | same | same | – | 1 |
| Focus | transparent | same | value white | 1.5px white | 1 |
| Filled | `--border-default` | same | value white | – | 1 |
| Error | `--danger` | same | value white | focus ring = `--danger` | 1 |
| Disabled | `--border-default` | same | same | – | .5 |
| Read-only | `--border-default` | `--overlay-5`, no shadow | value `--text-body` | – | 1 |

## 1. Search field  `H36 · R12` [captured]
Leading search icon 16px, input 14/16 500, trailing close button (`qa-icon-24--close`, visible only when filled).
```html
<label class="field"><svg class="icon"/><input type="search" placeholder="Find project.."/><button class="qa qa-icon-24 qa-icon-24--close" aria-label="Clear"><svg/></button></label>
```

## 2. Text field  `H36 (default) / H44 (large)` [derived]
`.field--lg{ height:var(--h-field-lg); padding:8px 12px } .field--lg input{ font:500 16px/24px var(--font-ui) }`
Anatomy (top→bottom): label 12/16 500 `--text-primary` (gap 6) → field → helper 12/16 400 `--text-tertiary` (gap 6) / error text 12/16 400 `--danger` with 12px alert icon.
```css
.form-item{ display:flex; flex-direction:column; gap:6px }
.form-label{ font:500 12px/16px var(--font-ui); color:var(--text-primary) }
.form-help{ font:400 12px/16px var(--font-ui); color:var(--text-tertiary) }
.form-error{ font:400 12px/16px var(--font-ui); color:var(--danger) }
```
Variants: with leading icon · with trailing action (button/clear/eye) · with prefix/suffix text (`--text-tertiary`).

## 3. Textarea  [derived]
`.field--textarea{ height:auto; min-height:88px; align-items:flex-start; padding:10px 12px; border-radius:var(--r-lg) } textarea{ resize:vertical; font:400 14px/20px var(--font-ui) }` — same state table.

## 4. Prompt editor (composer)  [captured]
Contenteditable, no border/background, inside composer inner area (`--overlay-5`, R20, padding 12).
```css
.prompt{ font:400 14px/20px var(--font-ui); color:var(--text-primary); caret-color:var(--text-primary); min-height:40px; white-space:pre-wrap; word-break:break-word; outline:0; scrollbar-width:none }
.prompt:empty::before{ content:attr(data-placeholder); color:var(--text-secondary); pointer-events:none }
```
| State | Rule |
|---|---|
| Default | placeholder `--text-secondary` |
| Focus | caret visible; **composer shell** (not the text) shows white ring: `.composer:focus-within{ outline:var(--focus-ring-width) solid var(--focus-ring-color) }` |
| Filled | white text |
| Disabled | composer opacity .5, `contenteditable="false"` |
| Error | inner area ring `--danger` *(derived)* |
| Collapsed (mobile) | single line, `font:500 14px/20px`, color `rgba(255,255,255,.5)`, truncate |

## 5. Select field  [derived]
Closed = `.field` with a text value + chevron-down 16 (`--text-secondary`). Click opens `05-dropdown-menu.md` menu panel with same width as the trigger, `margin-top:4px`. Open state = focus ring on field. Native `<select>`: `appearance:none`, colour-scheme dark.

## 6. Hidden file input
`accept="image/*,video/mp4,video/quicktime" multiple class="hidden"` triggered by the "+" chip.

## A11y
Every input has a visible `<label>` or `aria-label`; errors linked via `aria-describedby`; `aria-invalid="true"` mirrors `data-invalid`.
