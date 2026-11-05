# Runway Cinematic Design System (`design.md`)

> **The Single Source of Truth** for UI architecture, tokens, components, and design encapsulation across the codebase (`my-app`).  
> **Core Philosophy (Runway Standard):** A cinematic, photography-first AI creative platform where full-bleed imagery and video carry the entire interface. The interface retreats into near-invisibility — minimal 1px subtle borders, **zero box-shadows**, sharp geometric corners (4px buttons, 8px cards, 16px dialogs), and tight film-title typographic density.  
> **The Golden Law:** Decide a value once (token), build a component once (primitive with variants), use it everywhere.

---

## 1. The Zero Call-Site Restyling Law (Strict Encapsulation)

> [!CAUTION]
> **NO DIRECT CSS OR TAILWIND STYLING AT CALL SITES**  
> Any designer, developer, or AI agent working on this codebase **MUST NOT** write ad-hoc colors, borders, paddings, or radiuses on components.  
> All visual variations are defined **100% inside the primitive component** (e.g. `Button.jsx`, `Switch.jsx`, `Input.jsx`, `dialog.jsx`). Callers choose only `variant` and `size`.

### The Core Rules:
1. **Never write raw HTML controls:** Never use raw `<button>`, `<input>`, `<textarea>`, or checkbox toggles. Always import canonical primitives from `@/shared/ui/*`.
2. **Never hack styles in `className`:** The `className` prop at the call site is **exclusively for layout & positioning** (e.g. `w-full`, `shrink-0`, `col-span-2`, `self-end`).
3. **Never hardcode arbitrary values:** No hex codes (`#fe6e6e`), no arbitrary Tailwind classes (`p-[13px]`, `rounded-[15px]`, `w-[320px]`).
4. **The Zero Box-Shadow Law (Runway Elevation):** The entire system uses **zero box-shadow** (`shadow-none`). Depth comes from photography, full-bleed media, dark/light section alternation, and 1px hairline borders (`border-white/10`). Never use drop shadows for elevation.
5. **Need a new look? Extend the primitive:** If a design requires a new variant, add it as a named variant inside the primitive file. **Never hack it inline at the call site.**

---

## 2. Standardized Button Hierarchy (Runway Sharp 4px Geometry)

All buttons run on Runway's geometric shape language (`rounded-button` = **4px**), 14px size, weight 600 (`font-semibold`), line-height 1.25, and **zero box-shadow**:

```
[ Tier 1: Primary CTA ]    ──► variant="white" (or "primary")  ──► High-contrast white (#fff) on black, 4px radius
[ Tier 2: Secondary ]      ──► variant="secondary"             ──► Solid dark surface container (#282a2c), 4px radius
[ Tier 3: Outline ]        ──► variant="outline"               ──► Bordered ghost (border border-white/10), 4px radius (Runway button-primary)
[ Tier 4: Ghost / Icon ]   ──► variant="ghost" (or "default")  ──► Transparent with subtle state hover, 4px radius
[ Tier 5: Destructive ]    ──► variant="danger"                ──► Red ghost text & icon (#fe6e6e)
                               variant="destructive-filled"    ──► Crimson filled container (modal confirms)
[ Accent: Studio Neon ]    ──► variant="neon"                  ──► Electric lime (#EFFE17) Cinema CTA
[ Toggle: Filter Pills ]   ──► variant="pill" / "pill-active"  ──► Filter chips
```

### 2.1 The Canonical `<Button />` API (`@/shared/ui/button`)

```jsx
import { Button } from "@/shared/ui/button";

// 1. Primary High-Contrast CTA (White) — Save, Generate, Create
<Button variant="white" size="default">Generate</Button>

// 2. Secondary Dark Surface — Duplicate, Export, Menu action
<Button variant="secondary" size="default">Duplicate</Button>

// 3. Outline — Runway Button Primary (Transparent + 1px border)
<Button variant="outline" size="default">Runway Action</Button>

// 4. Ghost — 3-dots trigger, toolbar actions, text buttons
<Button variant="ghost" size="icon"><GoogleIcon name="more_vert" /></Button>

// 5. Danger Ghost — Delete item in cards/sidebars/lists
<Button variant="danger" size="default">Delete</Button>

// 6. Destructive Filled — Permanent delete confirmation in modal
<Button variant="destructive-filled" size="default">Permanently Delete</Button>

// 7. Studio Neon — High-energy Cinema Studio hero action
<Button variant="neon" size="default">Create Video</Button>
```

#### Canonical Button Sizes:
* `size="default"` (`h-8 px-3.5 text-xs` or `h-9 px-4 text-sm font-semibold`): **Universal default across all screens.**
* `size="sm"` (`h-8 px-3 text-xs`): Compact cards, sub-toolbars.
* `size="xs"` (`h-6 px-2 text-xs`): Mini chips, table actions.
* `size="lg"` (`h-10 px-6 text-sm`): Hero banners, high-profile forms.
* `size="icon"` (`size-9 p-0`): **Universal standalone icon button (36x36px).**
* `size="icon-sm"` (`size-8 p-0`) / `size="icon-xs"` (`size-6 p-0`): Compact toolbar icons.

---

## 3. Menus & Popovers (`DropdownMenu`, `ContextMenu`, `Select`)

Menus and popovers follow Runway's comfortable card geometry (**8px radius**) with **zero shadow** and subtle 1px border (`border-white/10`):

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
3. **Menu Container:**
   Uses `rounded-card` (8px), `border border-white/10`, `backdrop-blur-[100px]`, and `box-shadow: none`.

---

## 4. Other Core Primitives Catalog

### 4.1 `<Switch />` (`@/shared/ui/switch`)
* **Role:** Binary toggle switches for settings and options.
* **Tech:** `@radix-ui/react-switch`.
* **Variants:** `default` (white active track with black thumb), `neon` (electric lime track), `primary` (Google blue track).
* **Sizes:** `default` (`h-6 w-11`), `sm` (`h-5 w-9`).

---

### 4.2 `<Input />` (`@/shared/ui/input`)
* **Role:** Text fields, search bars, header in-place renaming.
* **Radius:** `rounded-input` (**4px** sharp geometry).
* **Shadow:** `shadow-none`.
* **Variants:** `default` (standard form field), `search` (with icon & blur background), `blurinput` (glass header).

---

### 4.3 `<Textarea />` (`@/shared/ui/textarea`)
* **Role:** Auto-resizing prompt editor and descriptions.
* **Radius:** `rounded-card` (**8px**) or `rounded-button` (**4px**).
* **Variants:** `default`, `blur`, `personality`.

---

### 4.4 `<Dialog />` (`@/shared/ui/dialog`)
* **Role:** Modal dialogs, sheets, and confirmation popups.
* **Radius:** `rounded-dialog` (**16px** Runway generous geometry).
* **Shadow:** `shadow-none` (Zero box-shadow law).
* **Border:** 1px hairline border (`border-white/10`).
* **Variants:** `glass` (dark overlay with blur), `default`.

---

## 5. Runway Token Scales & Preserved Color System

### 5.1 Border Radius Tokens (Runway 4-Tier Scale)
| Component Type | Canonical Token | Value | Allowed Class |
|---|---|---|---|
| **Buttons, Inputs, Switches** | `--radius-button` / `--radius-input` | **4px** (`sharp`) | `rounded-button` / `rounded-input` / `rounded-md` |
| **Cards, Panels, Dropdowns** | `--radius-card` / `--radius-panel` / `--radius-menu` | **8px** (`comfortable`) | `rounded-card` / `rounded-panel` / `rounded-lg` / `rounded-xl` |
| **Dialogs & Modals** | `--radius-dialog` | **16px** (`generous`) | `rounded-dialog` / `rounded-2xl` |
| **Badges & Micro Tags** | `--radius-badge` | **4px** (`sharp`) | `rounded-badge` / `rounded-sm` |
| **Pills & Avatars** | `--radius-pill` | **9999px** | `rounded-full` / `rounded-pill` |

---

### 5.2 Elevation & Shadows (The Zero Box-Shadow Law)
| Level | Treatment | Use |
|---|---|---|
| **Flat (Level 0)** | `shadow-none`, no border | Full-bleed video, images, background canvases |
| **Bordered (Level 1)**| `shadow-none`, `1px solid border-white/10` | Alert containers, dialogs, cards, popover panels |
| **Dark Section (Level 2)**| `#000000` / `#131314` / `#1e1f20` surface | Hero, studio timeline, sidebars |
| **Light Section (Level 3)**| `#e9ecf2` / `#ffffff` background with dark text | Research and documentation bands |

> Depth is communicated through dark/light section alternation, photographic depth-of-field, and overlay transparency — **NEVER through CSS box-shadow**.

---

### 5.3 Typography Scale (Runway Cinematic Hierarchy)
| Token Role | Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| **Display Hero** | 48px | 400 | 1.00 | -1.2px (`tracking-tighter`) | Cinematic hero headlines |
| **Section Heading** | 40px | 400 | 1.05 | -1.0px (`tracking-tight`) | Feature section titles |
| **Sub-Heading / Mission** | 36px | 400 | 1.00 | -0.9px (`tracking-tight`) | Mission statements, secondary headers |
| **Card / Feature Title** | 24px | 400 | 1.00 | 0 | Research article & media card headings |
| **Body Standard** | 16px / 14px | 400 | 1.40 | -0.16px | Paragraphs, descriptions, dialog body |
| **Button Label** | 14px | 600 | 1.25 | 0 | Button text (`font-semibold`) |
| **Caption Label** | 14px | 500 | 1.30 | +0.35px (`uppercase`) | Section labels, uppercase headers |
| **Small** | 13px | 400 | 1.30 | -0.20px | Compact metadata, timestamps |
| **Micro Tag** | 11px | 450/500 | 1.30 | 0 (`uppercase`) | Category tags, tiny badges |

---

### 5.4 Spacing Scale (8px Base Scale with Micro Steps)
* `xxs` (4px) — Micro text and tight badge icon gaps.
* `xs` (6px) — Button content gap (icon + label).
* `sm` (8px) — Base unit: button groups, breadcrumbs, tags.
* `md` (12px) — Form field stacks.
* `base` (16px) — Card internal padding, sidebar item gap.
* `lg` (20px) — Panel separators.
* `xl` (24px) — Modal action rows, section grid gaps.
* `xxl` (28px) — Large element spacing.
* `section` (32px) to `section-xxl` (78px) — Section vertical padding and breathing room.

---

### 5.5 Preserved Color System (User Verified Scheme)
| Role | Semantic Variable | Value | Usage |
|---|---|---|---|
| **Canvas Background** | `var(--background-primary)` | `#000000` | Deep OLED black viewport |
| **Persistent Panel** | `var(--surface-panel)` | `#131314` | Persistent navigation bars, rails, sidebars |
| **Card Surface** | `var(--surface-card)` | `#1e1f20` | Grid cards, media item tiles, inspector boxes |
| **Elevated Surface** | `var(--surface-elevated)` | `#282a2c` | Secondary buttons, dropdown panels |
| **Highest Surface** | `var(--surface-highest)` | `#333537` | Active selection containers |
| **Primary Text** | `text-white` | `#ffffff` | Headings, button text |
| **Body Text** | `var(--mat-sys-on-surface)` | `#e3e3e3` | Paragraphs, values, descriptions |
| **Cool Slate Muted** | `text-muted-foreground` | `#8e918f` / `#767d88` | Runway signature cool-slate secondary text |
| **Cinema Neon** | `--color-brand-neon` | `#EFFE17` / `#D4FF00` | Cinema Studio hero CTA, active Studio tabs |
| **Accent Blue** | `--color-accent-blue` | `#a8c7fa` | Primary confirms, selected chips |
| **Danger Red** | `--color-danger` | `#fe6e6e` | Error text, delete actions |
| **Success Green** | `--color-success` | `#80da88` | Success badges, upload checkmarks |
| **Subtle Border** | `border-white/10` | 10% white / `#27272a` | Hairline containment borders (Level 1) |

---

## 6. UI Quality Gate (`npm run ui:check`)

The UI ratchet enforces these rules automatically:
* **U1:** No raw color literals (`#hex`, `rgba()`) outside token files.
* **U2:** No Tailwind arbitrary values (`w-[437px]`, `p-[13px]`, `rounded-[15px]`).
* **U3:** No raw `<button>` outside primitives (use `<Button>`).
* **U4:** No `fetch()` inside components (use hooks/API clients).
* **U5:** No static inline `style={{ }}` (use tokens and Tailwind classes).
