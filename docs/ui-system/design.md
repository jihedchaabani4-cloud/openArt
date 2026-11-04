# OpenArt / Labveil — Unified Design System (`design.md`)

> **The Single Source of Truth** for UI architecture, tokens, components, and design encapsulation across the codebase (`my-app`).  
> **The Golden Law:** Decide a value once (token), build a component once (primitive with variants), use it everywhere.

---

## 1. The Zero Call-Site Restyling Law (Strict Encapsulation)

> [!CAUTION]
> **NO DIRECT CSS OR TAILWIND STYLING AT CALL SITES**  
> Any designer, developer, or AI agent working on this codebase **MUST NOT** write ad-hoc colors, borders, paddings, or radiuses on components.  
> All visual variations are defined **100% inside the primitive component** (e.g. `Button.jsx`, `Switch.jsx`, `Input.jsx`). Callers choose only `variant` and `size`.

### The Core Rules:
1. **Never write raw HTML controls:** Never use raw `<button>`, `<input>`, `<textarea>`, or checkbox toggles. Always import canonical primitives from `@/shared/ui/*`.
2. **Never hack styles in `className`:** The `className` prop at the call site is **exclusively for layout & positioning** (e.g. `w-full`, `shrink-0`, `col-span-2`, `self-end`).
3. **Never hardcode arbitrary values:** No hex codes (`#fe6e6e`), no arbitrary Tailwind classes (`p-[13px]`, `rounded-[15px]`, `w-[320px]`).
4. **Need a new look? Extend the primitive:** If a design requires a new variant, add it as a named variant inside the primitive file. **Never hack it inline at the call site.**

---

## 2. Standardized Button Hierarchy (The 5 Core Tiers)

Instead of maintaining 19 fragmented button variants, the entire platform is unified into **5 Canonical Hierarchy Tiers** + **2 Specialized Variants**:

```
[ Tier 1: Primary CTA ]    ──► variant="white" (or "primary")  ──► High-contrast white (#fff) on black
[ Tier 2: Secondary ]      ──► variant="secondary"             ──► Solid dark surface container (#282a2c)
[ Tier 3: Outline ]        ──► variant="outline"               ──► Bordered ghost (border border-white/10)
[ Tier 4: Ghost / Icon ]   ──► variant="ghost" (or "default")  ──► Transparent with subtle state hover
[ Tier 5: Destructive ]    ──► variant="danger"                ──► Red ghost text & icon (#fe6e6e)
                               variant="destructive-filled"    ──► Crimson filled container (modal confirms)
[ Accent: Studio Neon ]    ──► variant="neon"                  ──► Electric lime (#EFFE17) Cinema CTA
[ Toggle: Filter Pills ]   ──► variant="pill" / "pill-active"  ──► Rounded-full filter chips
```

### 2.1 The Canonical `<Button />` API (`@/shared/ui/button`)

```jsx
import { Button } from "@/shared/ui/button";

// 1. Primary High-Contrast CTA (White) — Save, Generate, Create
<Button variant="white" size="default">Generate</Button>

// 2. Secondary Dark Surface — Duplicate, Export, Menu action
<Button variant="secondary" size="default">Duplicate</Button>

// 3. Outline — Cancel, Dismiss, Secondary toggles
<Button variant="outline" size="default">Cancel</Button>

// 4. Ghost — 3-dots trigger, toolbar actions, text buttons
<Button variant="ghost" size="icon"><GoogleIcon name="more_vert" /></Button>

// 5. Danger Ghost — Delete item in cards/sidebars/lists
<Button variant="danger" size="default">Delete</Button>

// 6. Destructive Filled — Permanent delete confirmation in modal
<Button variant="destructive-filled" size="default">Permanently Delete</Button>

// 7. Studio Neon — High-energy Cinema Studio hero action
<Button variant="neon" size="default">Create Video</Button>

// 8. Filter Pills — Media filtering
<Button variant="pill">All</Button>
<Button variant="pill-active">Videos</Button>
```

#### Canonical Button Sizes:
* `size="default"` (`h-8 px-3.5 text-xs`): **The universal default across all screens.**
* `size="sm"` (`h-8 px-3 text-xs`): Compact cards, sub-toolbars.
* `size="xs"` (`h-6 px-2 text-xs`): Mini chips, table actions.
* `size="lg"` (`h-10 px-6 text-sm`): Hero banners, high-profile forms.
* `size="icon"` (`size-9 p-0`): **Universal standalone icon button (36x36px).**
* `size="icon-sm"` (`size-8 p-0`) / `size="icon-xs"` (`size-6 p-0`): Compact toolbar icons.

---

## 3. Menus Buttons Standard (`DropdownMenu` & `ContextMenu`)

Menus do NOT need special one-off button variants (like `user-menu-*`). Every menu is standardized to **2 canonical items**:

1. **Standard Menu Item:**
   ```jsx
   <DropdownMenuItem onClick={handleEdit}>
     <GoogleIcon iconName="edit" />
     <span>Rename</span>
   </DropdownMenuItem>
   ```
2. **Destructive Menu Item:**
   ```jsx
   <DropdownMenuItem variant="destructive" onClick={handleDelete}>
     <GoogleIcon iconName="delete" />
     <span>Move to Trash</span>
   </DropdownMenuItem>
   ```
3. **Buttons inside Menu Footers:**
   Always use standard `<Button variant="secondary">` or `<Button variant="outline">` inside menu dialogs/popovers (e.g. `UserDropdown`).

---

## 4. Other Core Primitives Catalog

### 4.1 `<Switch />` (`@/shared/ui/switch`)
* **Role:** Binary toggle switches for settings and options.
* **Tech:** `@radix-ui/react-switch`.
* **Variants:** `default` (white active track with black thumb), `neon` (electric lime track), `primary` (Google blue track).
* **Sizes:** `default` (`h-6 w-11`), `sm` (`h-5 w-9`).
* **Usage:**
  ```jsx
  import { Switch } from "@/shared/ui/switch";

  <Switch checked={enabled} onCheckedChange={setEnabled} />
  <Switch variant="neon" size="sm" checked={autoEnhance} onCheckedChange={setAutoEnhance} />
  ```

---

### 4.2 `<Input />` (`@/shared/ui/input`)
* **Role:** Text fields, search bars, header in-place renaming.
* **Variants:** `default` (standard form field), `search` (with icon & blur background), `blurinput` (glass header).
* **Usage:**
  ```jsx
  import { Input } from "@/shared/ui/input";

  <Input variant="search" placeholder="Search assets..." googleIcon="search" className="w-full" />
  <Input label="Asset Title" placeholder="Enter title" />
  ```

---

### 4.3 `<Textarea />` (`@/shared/ui/textarea`)
* **Role:** Auto-resizing prompt editor and descriptions.
* **Variants:** `default`, `blur`, `personality`.

---

### 4.4 `<Dialog />` (`@/shared/ui/dialog`)
* **Role:** Modal dialogs, sheets, and confirmation popups.
* **Variants:** `glass` (frosted cinema-grade dark glass overlay with blur-100px), `default`.

---

### 4.5 `<ButtonGroup />` (`@/shared/ui/button-group`)
* **Role:** Horizontal segmented pill grouping multiple icon/text buttons.
* **Usage:**
  ```jsx
  import { ButtonGroup } from "@/shared/ui/button-group";
  import { Button } from "@/shared/ui/button";

  <ButtonGroup>
    <Button variant="ghost" size="icon-sm"><GoogleIcon name="thumb_up" /></Button>
    <Button variant="ghost" size="icon-sm"><GoogleIcon name="share" /></Button>
  </ButtonGroup>
  ```

---

## 5. Strict Token Scales (No Arbitrary Values)

### 5.1 Border Radius Tokens
| Component Type | Canonical Token | Value | Allowed Class |
|---|---|---|---|
| **Buttons, Inputs, Switches** | `--radius-button` / `--radius-input` | **12px** | `rounded-button` / `rounded-md` |
| **Cards, Panels, Dropdowns** | `--radius-card` / `--radius-panel` | **16px** | `rounded-card` / `rounded-xl` |
| **Dialogs & Modals** | `--radius-dialog` | **24px** | `rounded-dialog` / `rounded-2xl` |
| **Badges & Small Tags** | `--radius-badge` | **8px** | `rounded-badge` / `rounded-sm` |
| **Pills, Avatars, Switches** | `--radius-pill` / `--radius-full` | **9999px** | `rounded-full` / `rounded-pill` |

---

### 5.2 Spacing & Gap Scale (4px Base)
* `gap-1` (4px) — Micro text and tight badges.
* `gap-1.5` (6px) — **Default for button contents (icon + label).**
* `gap-2` (8px) — Button groups, breadcrumbs, tags.
* `gap-3` (12px) — Form field stacks.
* `gap-4` (16px) — Card internal spacing, sidebar items.
* `gap-6` (24px) — Modal action rows, section grids.

---

### 5.3 Color System & Surfaces
| Role | Semantic Variable | Tailwind Safe Token | Usage |
|---|---|---|---|
| **Canvas Background** | `var(--background-primary)` | `bg-black` / `#000000` | Deep OLED black viewport |
| **Card / Panel** | `var(--mat-sys-surface-container)` | `#1e1f20` / `#161718` | Containers, sidebars, cards |
| **Elevated Surface** | `var(--mat-sys-surface-container-high)`| `#282a2c` | Hovered cards, secondary buttons |
| **Primary Text** | `text-white` | `#ffffff` | Headings, button text |
| **Body Text** | `var(--mat-sys-on-surface)` | `#e3e3e3` | Paragraphs, values, descriptions |
| **Muted Text** | `text-muted-foreground` | `#c4c7c5` / `#8e918f` | Labels, placeholders, timestamps |
| **Studio Neon** | `#EFFE17` / `#D4FF00` | Accent lime | Studio action buttons, active tab line |
| **Google Blue** | `var(--mat-sys-primary)` | `#a8c7fa` | Primary confirms, selected chips |
| **Danger / Error** | `var(--foreground-color-danger)` | `#fe6e6e` | Error text, delete actions |
| **Success** | `var(--mat-sys-success)` | `#80da88` | Success badges, upload checkmarks |
| **Subtle Border** | `border-white/5` or `border-white/10` | 5%–10% white | Hairline borders and dividers |

---

## 6. UI Quality Gate (`npm run ui:check`)

The UI ratchet enforces these rules automatically. Running `npm run ui:check` in `my-app` checks:
* **U1:** No raw color literals (`#hex`, `rgba()`) outside token files.
* **U2:** No Tailwind arbitrary values (`w-[437px]`, `p-[13px]`, `rounded-[15px]`).
* **U3:** No raw `<button>` outside primitives (use `<Button>`).
* **U4:** No `fetch()` inside components (use hooks/API clients).
* **U5:** No static inline `style={{ }}` (use tokens and Tailwind classes).

---

*This document is locked and universally binding. All screens and components must strictly adhere to these primitives and tokens.*
