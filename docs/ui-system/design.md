# Runway Cinematic Design System (`design.md`)

> **The Single Source of Truth** for UI architecture, tokens, components, and design encapsulation across the codebase (`my-app`).  
> **Core Philosophy (Runway Standard):** A cinematic, photography-first AI creative platform where full-bleed imagery and video carry the entire interface. The interface retreats into near-invisibility — minimal 1px subtle borders, **zero box-shadows**, sharp geometric corners (`4px` buttons, `6px` MAX for cards/menus/popovers/dialogs, `9999px` pills), 8px-based spacing with 48–78px section breathing room, and 1600px cinema-wide container width.  
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
5. **Strict Runway Spacing & Widths:** Always align layout widths and paddings to Runway's 8px base spacing scale and cinema container tiers (1600px max content width).
6. **Need a new look? Extend the primitive:** If a design requires a new variant, add it as a named variant inside the primitive file. **Never hack it inline at the call site.**

---

## 2. Token Architecture: 3-Layer Hierarchy

The system operates across three distinct architectural layers:

```
[ Layer 1: Primitive Tokens ]
  none (0px) ── hairline/xxxs (1px) ── sharp/sm (4px) ── subtle/md (6px MAX) ── full (9999px)
                            │
                            ▼
[ Layer 2: Component Mappings ]
  Media Elements (Images, Videos)                               ──► hairline (1px)
  Button, Input, Badge, Checkbox, Tooltip, Menu Items           ──► sharp (4px)
  Cards, Textareas, Dropdowns, Context Menus, Popovers, Dialogs ──► subtle (6px MAX)
  Pills, Avatars, Radio, Sliders, Switch                        ──► full (9999px)
                            │
                            ▼
[ Layer 3: Implementation Mappings ]
  CSS Variables:        --radius-none | --radius-xxxs | --radius-sm | --radius-md | --radius-full
  Tailwind Utilities:   rounded-none  | rounded-xxxs  | rounded-sm  | rounded-md  | rounded-full
```

### 2.1 The Three Layers Defined

1. **Primitive Tokens (Abstract Scale):** Pure geometric concepts independent of any component (`none`, `xxxs`, `sm`, `md`, `full`).
2. **Component Mapping (Design Intent):** Semantic association binding a UI element category to a primitive token (e.g. Action Targets $\rightarrow$ `sm` 4px; Surfaces, Containers & Overlays $\rightarrow$ `md` 6px MAX; Circular & Pill Controls $\rightarrow$ `full` 9999px).
3. **Implementation Mapping (CSS & Utility Engine):** The physical CSS variables in `:root` and corresponding Tailwind classes declared in `@theme inline` of `src/app/globals.css`.

| Semantic Token | Value | Component Role | CSS Variable | Tailwind Utility |
|---|---|---|---|---|
| **`none`** | **0px** | Flush layouts, full-bleed media | `--radius-none` | `rounded-none` |
| **`hairline` / `xxxs`** | **1px** | Media elements (images, videos, media layers) | `--radius-hairline` / `--radius-xxxs` | `rounded-xxxs` |
| **`sharp` / `sm`** | **4px** | Buttons, Inputs, Badges, Tooltips, Checkboxes, Menu Items | `--radius-sharp` / `--radius-sm` | `rounded-sm` |
| **`subtle` / `md`** | **6px (MAX)** | Cards, Textareas, Dropdowns, Context Menus, Popovers, HoverCards, Dialogs, Modals, Panels | `--radius-subtle` / `--radius-md` | `rounded-md` |
| **`full`** | **9999px**| Filter pills, Avatars, Radio dots, Slider thumbs, Switches | `--radius-full` | `rounded-full` |

### 2.2 Semantic Spacing Scale

The application uses an 8px base scale with precise micro-steps:

| Token | Pixel Value | Typical Application | Tailwind Utility |
|---|---|---|---|
| **`xxs`** | **4px** | Micro gaps, badge inner padding, Studio Media Grid | `p-xxs`, `gap-xxs`, `m-xxs` |
| **`xs`** | **6px** | Small icon-text gaps, compact list item padding | `p-xs`, `gap-xs`, `m-xs` |
| **`sm`** | **8px** | Standard element gap, compact card padding | `p-sm`, `gap-sm`, `m-sm` |
| **`md`** | **12px** | Form field spacing, medium element gaps | `p-md`, `gap-md`, `m-md` |
| **`base`** | **16px** | Standard container padding, dialog interior gutters | `p-base`, `gap-base`, `m-base` |
| **`lg`** | **20px** | Card exterior padding, panel gutters | `p-lg`, `gap-lg`, `m-lg` |
| **`xl`** | **24px** | Section inner margins, modal header spacing | `p-xl`, `gap-xl`, `m-xl` |
| **`xxl`** | **28px** | Feature module margins | `p-xxl`, `gap-xxl`, `m-xxl` |
| **`section`** | **32px** | Standard vertical breathing room between blocks | `p-section`, `gap-section` |
| **`section-lg`**| **48px** | Large hero and editorial section padding | `py-section-lg` |
| **`section-xl`**| **64px** | Landing page feature separation | `py-section-xl` |
| **`section-xxl`**| **78px** | Cinema-grade full bleed page spacing | `py-section-xxl` |

### 2.3 Component Default Token Bindings

Every shared component has explicit default bindings. Feature callsites must NOT override these defaults:

| Component | Default Radius | Default Height / Sizing | Default Padding | Default Spacing | Default Surface / Border |
|---|---|---|---|---|---|
| **`<Button />`** | Variant-owned (`sharp` 4px / `full` 9999px) | Variant-owned (32px standard / 40px large / 24px micro) | Variant-owned | `gap-2` | Variant-owned colors, borders, and interaction states |
| **`<ButtonGroup />`** | `sharp` (4px) / `full` (pill) | Content-driven | `p-1` container | `gap-0.5` | `border-none shadow-none` |
| **`<Input />`** | `sharp` (4px) | 40px (h-10) / 42px (search) | `px-3 py-2` | `gap-2` | Hairline `border-white/10`, `shadow-none` |
| **`<Textarea />`** | `subtle` / `md` (6px) | Min 160px, auto-resize | `p-4` | `gap-1.5` | Hairline `border-white/8`, `shadow-none` |
| **`<Card />`** | `subtle` / `md` (6px) | Content-driven | `p-4 sm:p-5` | `gap-1.5` | `bg-card`, hairline `border-white/5`, `shadow-none` |
| **`<Badge />`** | `sharp` (4px) / `full` (pill) | 20px (h-5) / 16px (h-4) | `px-2 py-0.5` | `gap-1` | Hairline border or solid flat, `shadow-none` |
| **`<Dialog />`** | `subtle` / `md` (6px) | Max-w-lg overlay | `p-6` | `gap-4` | `bg-background`, hairline `border-white/10`, `shadow-none` |
| **`<DropdownMenu />`** | `subtle` / `md` (6px) panel | Panel: min-w-48; Item: 34px | Panel: `p-1.5`; Item: `pl-3 pr-4 py-2` | `gap-0.5` | `bg-popover`, hairline `border-white/10`, `shadow-none` |
| **`<ContextMenu />`** | `subtle` / `md` (6px) panel | Panel: min-w-48; Item: 34px | Panel: `p-1.5`; Item: `pl-3 pr-4 py-2` | `gap-0.5` | `bg-popover`, hairline `border-white/10`, `shadow-none` |
| **`<Select />`** | `sharp` (4px) trigger / `md` (6px) panel | Trigger: 40px; Panel: min-w-48 | Trigger: `px-3 py-2.5`; Item: `px-2 py-1.5`| `gap-1` | Hairline `border-white/10`, `shadow-none` |
| **`<Checkbox />`** | `sharp` (4px) | 16x16px (`size-4`) | `p-0` | N/A | Hairline `border-white/20`, checked `bg-white` |
| **`<RadioGroup />`** | `full` (9999px) | 16x16px (`size-4`) | `p-0` | `gap-2.5` | Hairline `border-white/20`, checked indicator |
| **`<Slider />`** | `full` (9999px) track & thumb | Track: 6px (h-1.5); Thumb: 16px | `p-0` | N/A | Flat track `bg-white/20`, solid thumb `bg-white` |
| **`<Switch />`** | `full` (9999px) track & thumb | Root: 36x20px (sm) / 44x24px | `p-0.5` | N/A | Flat track `bg-white/20`, solid thumb `bg-white` |
| **`<Tabs />`** | `full` (pills) / `subtle` (6px studio) | List: 36px (h-9); Trigger: 28px (h-7) | List: `p-1`; Trigger: `px-3 py-1.5` | `gap-1` | Flat `bg-white/5`, active solid `bg-white` |
| **`<Tooltip />`** | `sharp` (4px) | Auto fit | `px-2.5 py-1` | `gap-1.5` | `bg-card`, hairline `border-white/10`, `shadow-none` |
| **`<Popover />`** | `subtle` / `md` (6px) | Width: 288px (w-72) | `p-4` | `gap-2` | `bg-card`, hairline `border-white/10`, `shadow-none` |
| **`<SharedGalleryGrid />`** | `hairline` / `xxxs` (1px) media | Rows-layout responsive | N/A | Dynamic: S (`xxs` 4px, default), M (`sm` 8px), L (`base` 16px) | Flat surface, hairline `border-white/10`, `shadow-none` |
| **`<Skeleton />`** | Shape-mapped (`sharp`/`subtle`/`full`) | Sizing via caller | `p-0` | N/A | `bg-white/5 animate-pulse`, `border-none` |

> [!NOTE]
> **Cinema Studio Media Grid Spacing:** Managed by user display settings (`StudioSettingsDropdown`, label `"Space between media"`), persisted in `localStorage` under `studio-ui-settings.gridSpacing`, and maps directly to canonical spacing tokens:
> - **S (Default):** 4px (`--spacing-xxs`, `gap-xxs`)
> - **M:** 8px (`--spacing-sm`, `gap-sm`)
> - **L:** 16px (`--spacing-base`, `gap-base`)

---

## 3. Simplified Button Hierarchy (6 Core Semantic Variants)

Button uses **6 core semantic variants**, with `className` available for standard Tailwind sizing, shapes, and custom styling:

```
[ Tier 1: Primary ]   ──► variant="primary"    ──► High-contrast white CTA on dark surface, 32px standard height, 4px radius
[ Tier 2: Secondary ] ──► variant="secondary"  ──► Standard surface container action button (#282a2c), 32px height, 4px radius
[ Tier 3: Outline ]   ──► variant="outline"    ──► Bordered surface action button, 32px height, 4px radius
[ Tier 4: Ghost ]     ──► variant="ghost"      ──► Subtle transparent background action button (default), 32px height, 4px radius
[ Tier 5: Danger ]    ──► variant="danger"     ──► Semantic danger/destructive action button (#fe6e6e), 32px height, 4px radius
[ Tier 6: Link ]      ──► variant="link"       ──► Inline text action button with underline
```

### Customization via `className`:
Specialized sizing, shapes, and icon geometries are applied via `className` and seamlessly override variant defaults using `tailwind-merge`:
- **Larger CTAs:** `<Button variant="primary" className="h-10 px-6 text-sm">`
- **Micro triggers:** `<Button variant="secondary" className="h-6 px-2 text-xs">`
- **Pills / Circular buttons:** `<Button variant="primary" className="rounded-full px-4">`
- **Icon buttons:** `<Button variant="ghost" className="size-8 p-0" aria-label="...">`
- **Full-width layouts:** `<Button variant="primary" className="w-full">`

---

## 4. Shared UI Components Specification Catalog

Every shared primitive in `src/shared/ui/` has an exact, verified contract.

### 4.1 `<Button />` (`@/shared/ui/button`)
* **Role:** Universal interactive action target.
* **Architecture:** 6 Core Semantic Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`, `link`). Default is `ghost`.
* **Radius Tokens:** Base variant default is `sharp` = **4px** (`rounded-sm`). Sizing and shapes (such as `rounded-full` or `rounded-md`) are overridden at the call site via `className` using `tailwind-merge`.
* **Geometry & Sizing:** Standard base dimensions: `h-8 px-3.5 text-xs` (32px height). Call sites customize height, padding, and text size via `className` (e.g. `h-10 px-6 text-sm` or `h-6 px-2 text-xs`).
* **Icon Buttons:** Use `className="size-8 p-0"` or `className="size-9 p-0"`.
* **Internal Spacing / Gap:** `gap-2` (`[&_svg]:size-4 shrink-0`).
* **Border & Shadow:** `shadow-none`. Default variants have `border-none`, except `outline` which declares `border border-(--mat-sys-outline-variant,#444746)`.
* **Variants:** Strictly the 6 core semantic variants listed in Section 3.
* **States:**
  * **Hover:** Handled per variant (`hover:bg-white/90`, `hover:bg-(--foreground-state-15)`, `hover:bg-(--foreground-state-10)`).
  * **Active:** `active:scale-95`.
  * **Focus:** `outline-none focus-visible:ring-2 focus-visible:ring-white/40`.
  * **Disabled:** `disabled:pointer-events-none disabled:opacity-50`.

---

### 4.2 `<ButtonGroup />` (`@/shared/ui/button-group`)
* **Role:** Layout wrapper grouping related buttons into a unified container.
* **Radius Token:** `sharp` = **4px** (`rounded-sm`) for `default`; `full` = **9999px** (`rounded-full`) for `pill`.
* **Padding Rules:** `p-1` (4px interior container padding).
* **Internal Spacing / Gap:** `gap-0.5` (2px between items).
* **Height & Sizing:** `max-w-fit`, height determined by child buttons.
* **Border & Shadow:** `border-0 border-none shadow-none`.
* **Variants:**
  * `default`: `bg-[var(--foreground-state-05)] rounded-sm p-1`.
  * `pill`: `bg-white/60 backdrop-blur-md rounded-full p-1`.
* **States:** Inherits child button states.
* **Exceptions:** None.

---

### 4.3 `<Input />` (`@/shared/ui/input`)
* **Role:** Single-line text input, search fields, inline rename fields.
* **Radius Token:** `sharp` = **4px** (`var(--radius-sm)`, `rounded-sm`).
* **Padding Rules:**
  * `variant="default"`: `px-3 py-2 text-sm`.
  * `variant="search"`: `px-2.5 gap-2 text-sm`.
  * `variant="blurinput"`: `py-[2px] pr-[10px] pl-[14px] gap-2 text-sm font-medium`.
  * `variant="navbar"`: `p-0 text-md font-medium tracking-tight`.
* **Internal Spacing / Gap:** `gap-2` between prefix, icon, input, clear button, and right element.
* **Height & Sizing:**
  * `default`: `min-h-[52px]` (form container stack).
  * `search`: `h-[42px] min-h-[42px]`.
  * `blurinput`: `h-9 min-h-[36px]`.
  * `navbar`: Single line inline fit.
* **Border & Shadow:** `shadow-none`. Search has `border border-[var(--foreground-state-05)]`; default is borderless.
* **Variants:** `default`, `search`, `blurinput`, `navbar`.
* **States:**
  * **Hover:** `hover:bg-[var(--foreground-state-05)]` (default); `hover:bg-[var(--foreground-state-15)]` (search).
  * **Focus:** `focus-within:bg-[var(--foreground-state-15)] focus-within:border-[rgba(218,220,224,0.18)]`.
  * **Disabled:** `disabled:cursor-not-allowed disabled:opacity-50`.
* **Exceptions:** Embedded icon triggers and clear buttons use canonical Button `ghost` with `size="icon"`.

---

### 4.4 `<Textarea />` (`@/shared/ui/textarea`)
* **Role:** Auto-resizing multi-line text and prompt editor.
* **Radius Token:** `subtle` / `md` = **6px** (`var(--radius-md)`, `rounded-md`) for `default` and `personality`; `sharp` = **4px** (`var(--radius-sm)`, `rounded-sm`) for `blur`.
* **Padding Rules:** `p-4` (default), `p-3.5 sm:p-4` (personality), `p-3` (blur).
* **Internal Spacing / Gap:** `gap-1.5` between container label, helper, and textarea.
* **Height & Sizing:** Dynamic auto-resizing via `scrollHeight` between `minHeight` (160px default) and `maxHeight` (300px default).
* **Border & Shadow:** `shadow-none`. Hairline border `border border-[var(--mat-sys-outline-variant,rgba(255,255,255,0.08))]` (Level 1).
* **Variants:** `default`, `personality` (flow prompt box), `blur`.
* **States:**
  * **Hover:** `hover:bg-[var(--foreground-state-10)]`.
  * **Focus:** `focus-within:bg-[var(--foreground-state-15)] focus-within:border-[var(--mat-sys-primary,#a8c7fa)]`.
  * **Disabled:** `disabled:opacity-50 disabled:cursor-not-allowed`.
* **Exceptions:** None.

---

### 4.5 `<Checkbox />` (`@/shared/ui/checkbox`)
* **Role:** Binary multi-selection control.
* **Radius Token:** `sharp` = **4px** (`var(--radius-sm)`, `rounded-sm`).
* **Padding Rules:** `p-0` (`flex items-center justify-center`).
* **Internal Spacing / Gap:** N/A.
* **Height & Sizing:** `size="default"` is `size-4` (16x16px); `size="lg"` is `size-5` (20x20px). Indicator check: `size-3` (default), `size-3.5` (lg).
* **Border & Shadow:** `shadow-none`. Hairline border `border border-white/20`.
* **Variants:** `default` (white active fill), `neon` (lime-400 active fill).
* **States:**
  * **Hover:** `hover:border-white/40 hover:bg-white/10`.
  * **Checked:** `data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-black` (or lime-400).
  * **Focus:** `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black`.
  * **Disabled:** `disabled:cursor-not-allowed disabled:opacity-50`.
* **Exceptions:** None.

---

### 4.6 `<RadioGroup />` & `<RadioGroupItem />` (`@/shared/ui/radio-group`)
* **Role:** Single-option selection control.
* **Radius Token:** `full` = **9999px** (`rounded-full`) for item container and dot indicator.
* **Padding Rules:** `p-0` (`flex items-center justify-center`).
* **Internal Spacing / Gap:** `gap-2.5` on parent `<RadioGroup />` stack.
* **Height & Sizing:** `size="default"` is `size-4` (16x16px); `size="lg"` is `size-5` (20x20px). Dot indicator: `size-2` (default), `size-2.5` (lg).
* **Border & Shadow:** `shadow-none`. Hairline border `border border-white/20`.
* **Variants:** `default`, `neon`.
* **States:**
  * **Hover:** `hover:border-white/40 hover:bg-white/10`.
  * **Checked:** `data-[state=checked]:border-white` (default); `data-[state=checked]:border-lime-400` (neon).
  * **Focus:** `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black`.
  * **Disabled:** `disabled:cursor-not-allowed disabled:opacity-50`.
* **Exceptions:** None.

---

### 4.7 `<Slider />` (`@/shared/ui/slider`)
* **Role:** Continuous value selection (video duration, CFG scale, motion strength).
* **Radius Token:** `full` = **9999px** (`rounded-full`) for track and thumb; `sharp` = **4px** (`rounded-sm`) for `bar` track.
* **Padding Rules:** 0 (`py-1` optional layout wrapper).
* **Internal Spacing / Gap:** N/A.
* **Height & Sizing:**
  * Root: `h-5` (default), `h-3` (sm), `h-8` (bar).
  * Track: `h-1.5` (default), `h-1` (sm), `h-full` (bar).
  * Thumb: `size-4` (default), `size-3` (sm), `w-1 h-5` (bar).
* **Border & Shadow:** `border-none`. Default thumb uses `shadow-md` (Runway tactile thumb exception); `bar` uses `shadow-none`.
* **Variants:** `default`, `bar` (PromptBar slider).
* **States:**
  * **Hover:** `hover:bg-white/30` on track; `hover:scale-110` on thumb.
  * **Focus:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black`.
  * **Disabled:** `opacity-50 cursor-not-allowed disabled:pointer-events-none`.
* **Exceptions:** Supports single numeric values or array values transparently.

---

### 4.8 `<Card />` (`@/shared/ui/card`)
* **Role:** Content container, media grid tile, settings group.
* **Radius Token:** `subtle` / `md` = **6px** (`var(--radius-md)`, `rounded-md`).
* **Padding Rules:** `p-4 sm:p-5` on `CardHeader`, `CardContent`, and `CardFooter`.
* **Internal Spacing / Gap:** `gap-1.5` (header), `gap-2` (footer).
* **Height & Sizing:** Content driven.
* **Border & Shadow:** `shadow-none` (Zero box-shadow law). Hairline border `border border-white/5` (default) or `border border-white/10` (glass).
* **Variants:** `default` (`bg-card`), `interactive` (hoverable card), `glass` (`bg-white/5 backdrop-blur-md`).
* **States:**
  * **Hover:** `hover:bg-white/10 hover:border-white/10` (interactive).
  * **Active:** `active:scale-95` (interactive).
* **Exceptions:** None.

---

### 4.9 `<Badge />` (`@/shared/ui/badge`)
* **Role:** Status chip, model indicator, metadata pill.
* **Radius Token:** `sharp` = **4px** (`var(--radius-sm)`, `rounded-sm`).
* **Padding Rules:** `px-2` (default), `px-1.5` (sm).
* **Internal Spacing / Gap:** `gap-1` (default), `gap-0.5` (sm).
* **Height & Sizing:** `size="default"` is `h-5 text-xs`; `size="sm"` is `h-4 text-xs`.
* **Border & Shadow:** `shadow-none`. Hairline border `border border-white/10` (default) or semantic status borders.
* **Variants:** `default`, `secondary`, `neon`, `success`, `danger`, `warning`, `outline`.
* **States:** Static display token.
* **Exceptions:** None.

---

### 4.10 `<Dialog />` (`@/shared/ui/dialog`)
* **Role:** Modal overlay, deletion confirmation, creation wizard.
* **Radius Token:** `subtle` / `md` = **6px** (`var(--radius-md)`, `rounded-md`).
* **Padding Rules:** `p-6` (default, Runway 24px alert container spec), `p-2` (small).
* **Internal Spacing / Gap:** `gap-4` between title, description, content body, and action footer.
* **Height & Sizing:** `w-full max-w-[calc(100%-2rem)] sm:max-w-6xl` (default), `sm:max-w-lg` (glass), `w-75` (floating), `max-w-[250px]` (small), `w-screen h-screen` (full).
* **Border & Shadow:** `shadow-none`. Hairline border `border border-white/10`.
* **Overlay:** `fixed inset-0 z-50 bg-black/70 backdrop-blur-80`.
* **Variants:** `default` (`bg-(--background-state-90) backdrop-blur-80`), `glass` (`bg-(--background-state-90) backdrop-blur-80`), `floating`, `small`, `full`.
* **States:** Entrance/exit animations (`data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95`).
* **Exceptions:** `showCloseButton` mounts top-right close icon (`size-7 p-1.5`).

---

### 4.11 `<DropdownMenu />` (`@/shared/ui/dropdown-menu`)
* **Role:** Contextual action list, selection menu.
* **Surface & Blur:** `bg-(--background-state-90) backdrop-blur-80 border border-white/10 shadow-none`.
* **Radius Token:** `subtle` / `md` = **6px** (`var(--radius-md)`, `rounded-md`) on menu container; `sharp` = **4px** (`rounded-sm`) on menu items.
* **Padding Rules:** `p-1.5` on content container; `px-2.5 py-1.5` on items.
* **Internal Spacing / Gap:** `gap-0.5` on item list stack; `gap-2` inside item (icon to text).
* **Height & Sizing:** `w-52 min-w-[12rem]`.
* **Border & Shadow:** `border border-white/10 shadow-none`.
* **Variants:** Items support `default` and `destructive`.
* **States:**
  * **Highlight:** `focus:bg-white/10 focus:text-white`.
  * **Disabled:** `data-[disabled]:pointer-events-none data-[disabled]:opacity-40`.
* **Exceptions:** None. All studio menus conform to canonical `rounded-md` (6px) container shape.

---

### 4.12 `<ContextMenu />` (`@/shared/ui/context-menu`)
* **Role:** Right-click context actions on media items.
* **Radius Token:** `subtle` / `md` = **6px** (`var(--radius-md)`, `rounded-md`) on container; `sharp` = **4px** (`rounded-sm`) on items.
* **Padding Rules:** `p-1.5` on container; `px-2.5 py-1.5` on items.
* **Internal Spacing / Gap:** `gap-0.5` on item stack; `gap-2` icon-to-text.
* **Height & Sizing:** `min-w-[12rem] w-52`.
* **Border & Shadow:** `border border-white/10 shadow-none`.
* **Variants & States:** Mirrors `<DropdownMenu />`.
* **Exceptions:** None. All context menus conform to canonical `rounded-md` (6px) container shape.

---

### 4.13 `<Popover />` (`@/shared/ui/popover`)
* **Role:** Floating inspector panel, color picker, filter popdown.
* **Radius Token:** `subtle` / `md` = **6px** (`var(--radius-md)`, `rounded-md`).
* **Padding Rules:** `p-4` (16px).
* **Internal Spacing / Gap:** Layout determined by interior content.
* **Height & Sizing:** `w-72` (288px default), `sideOffset = 6`.
* **Border & Shadow:** `border border-white/10 shadow-none`.
* **Background:** `bg-card backdrop-blur-md`.
* **States:** Entrance/exit slide animations.
* **Exceptions:** None.

---

### 4.14 `<Tabs />` (`@/shared/ui/tabs`)
* **Role:** View switcher, mode toggle (Prompt Bar, Studio).
* **Radius Token:**
  * `pills`: Container `rounded-full`, trigger `rounded-full` (9999px).
  * `underline`: Flat container with `border-b border-white/10`, trigger `border-b-2 border-transparent`.
  * `studio`: Container `rounded-md` (6px), trigger `rounded-sm` (4px).
* **Padding & Sizing:**
  * `pills`: List `p-1 gap-1`, trigger `h-7 px-3.5 text-xs` (`default`) / `h-6 px-2.5 text-xs` (`sm`).
  * `underline`: List `gap-4 px-1`, trigger `h-9 text-sm pb-2` (`default`) / `h-7 text-xs pb-1` (`sm`).
  * `studio`: List `p-1 gap-1`, trigger `py-1.5 text-xs uppercase tracking-wider font-semibold`.
* **Border & Shadow:** `shadow-none`. Hairline border `border border-white/5` (pills, studio); `border-b border-white/10` (underline).
* **Variants:** `pills`, `underline`, `studio`.
* **States:**
  * **Active:** `data-[state=active]:bg-white data-[state=active]:text-black` (pills); `data-[state=active]:border-white data-[state=active]:text-white` (underline); `data-[state=active]:bg-lime-400 data-[state=active]:text-black` (studio).
  * **Hover:** `hover:text-white hover:bg-white/5`.
* **Exceptions:** None.

---

### 4.15 `<Tooltip />` (`@/shared/ui/tooltip`)
* **Role:** Hover micro-help and hotkey indicator.
* **Radius Token:** `sharp` = **4px** (`var(--radius-sm)`, `rounded-sm`).
* **Padding Rules:** `px-2.5 py-1` (horizontal 10px, vertical 4px).
* **Internal Spacing / Gap:** N/A.
* **Height & Sizing:** Fit content, `sideOffset = 6`, `delayDuration = 200ms`.
* **Border & Shadow:** `border border-white/10 shadow-none`.
* **Background:** `bg-card backdrop-blur-md text-white text-xs font-medium`.
* **States:** Animate in (`fade-in-0 zoom-in-95`) and out (`fade-out-0 zoom-out-95`).
* **Exceptions:** None.

---

### 4.16 `<Switch />` (`@/shared/ui/switch`)
* **Role:** Binary settings toggle.
* **Radius Token:** `full` = **9999px** (`rounded-full`).
* **Padding Rules:** `p-0.5`.
* **Height & Sizing:** `size="default"` is `h-6 w-11`; `size="sm"` is `h-5 w-9`.
* **Border & Shadow:** `border-transparent shadow-none`.
* **Variants:** `default` (white active track with black thumb), `neon` (electric lime track), `primary` (Google blue track).
* **States:**
  * **Checked:** `data-[state=checked]:bg-white` (default); `data-[state=checked]:bg-lime-400` (neon). Thumb translates horizontally (`translate-x-5`).
* **Exceptions:** None.

---

## 5. Runway 100% Token Scales (Preserved Color System)

### 5.1 Border Radius Tokens (Runway Standard 5-Tier Scale — Max `rounded-md` + `rounded-full`)
| UI Element Category | Base Token | Value | Canonical Tailwind Class | Description |
|---|---|---|---|---|
| **Flush Layouts & Full-Bleed Media** | `--radius-none` | **0px** | `rounded-none` | Edge-to-edge full-bleed canvases |
| **Media Elements (Images, Videos, Media Layers)** | `--radius-xxxs` | **1px** (`hairline`) | `rounded-xxxs` | Hairline precision radius for media items |
| **Buttons, Inputs, Badges, Menu Items, Tooltips** | `--radius-sm` | **4px** (`sharp`) | `rounded-sm` | Sharp geometric corners across all action targets |
| **Cards, Textareas, Dropdowns, Context Menus, Popovers, HoverCards, Dialogs, Modals, Panels** | `--radius-md` | **6px** (`subtle` / MAX) | `rounded-md` | Maximum standard container and overlay radius |
| **Pills, Avatars, Switches, Sliders, Radios** | `--radius-full` | **9999px** | `rounded-full` | Filter pills and circular controls |

> [!IMPORTANT]
> **Single Token Class Law:** Always use the standard Tailwind class directly (`rounded-none`, `rounded-xxxs`, `rounded-sm`, `rounded-md`, `rounded-full`). Never use `rounded-lg`, `rounded-xl`, `rounded-2xl`, or `rounded-3xl`. Updating `--radius-sm` or `--radius-md` in `:root` automatically cascades across all components globally.

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

### 5.3 Runway Spacing Scale (8px Base Grid + Micro Steps)
All paddings, margins, and gaps follow Runway's 8px base spacing ladder:

| Spacing Token | Value | Tailwind Class Equivalent | Runway Intended Usage |
|---|---|---|---|
| `xxs` | **4px** | `gap-1`, `p-1`, `space-x-1` | Micro labels, icon-label offsets |
| `xs` | **6px** | `gap-1.5`, `py-1.5`, `px-2` | Button content gaps, badge internal padding |
| `sm` | **8px** | `gap-2`, `p-2` | Base unit: card interior gaps, item groups |
| `md` | **12px** | `gap-3`, `p-3` | Form field stacks, toolbar groupings |
| `base` | **16px** | `gap-4`, `p-4` | Standard card internal padding, navigation tap targets |
| `lg` | **20px** | `gap-5`, `p-5` | Component group separations, medium cards |
| `xl` | **24px** | `gap-6`, `p-6` | Alert container padding, modal footer action rows |
| `xxl` | **28px** | `gap-7`, `p-7` | Large card interiors |
| `section` | **32px** | `py-8` | Compact section separators |
| `section-lg` | **48px** | `py-12` | Major section vertical padding |
| `section-xl` | **64px** | `py-16` | Light editorial section padding (`light-section`) |
| `section-xxl` | **78px** | `py-[78px]` | Cinematic hero and mission statement bands (`dark-section`) |

---

### 5.4 Runway Container Widths & Layout Hierarchy
| Layout Container | Max Width | Utility Class | Description |
|---|---|---|---|
| **Cinema Wide** | **1600px** | `.container-cinema` / `max-w-[1600px]` | Maximum cinema-grade viewport width for full-bleed studio |
| **Editorial Content** | **1280px** | `.container-editorial` / `max-w-[1280px]` | Standard desktop content container with centered margins |
| **Compact Container** | **980px** | `.container-compact` / `max-w-[980px]` | Focused inspector panels, media info strips, form cards |
| **Modal / Dialog** | **960px / 480px** | `max-w-4xl` / `max-w-md` | Standard confirmation & workflow creation dialogs |

---

### 5.5 Typography Scale (Runway Cinematic Hierarchy)
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

### 5.6 Preserved Color System (User Verified Scheme)
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
* **U1:** No raw color literals (`#hex`, `rgba()`, `oklch()`, `oklab()`) outside token files.
* **U2:** No Tailwind arbitrary values (`w-[437px]`, `p-[13px]`, `rounded-[15px]`).
* **U3:** No raw `<button>` outside primitives (use `<Button>`).
* **U4:** No `fetch()` inside components, features, or widgets (use API clients or hooks).
* **U5:** No static inline `style={{ }}` (use tokens and Tailwind classes).
* **U6:** No dead radius classes (`rounded-button`, `rounded-card`, etc.).
