# Google Flow Studio Design System (`design.md`)

> **The Single Source of Truth** for UI architecture, design tokens, component primitives, and visual engineering across the codebase (`my-app`).  
> **Core Visual Philosophy:** Inspired directly by **Google Flow** (VideoFX / ImageFX / Google Labs AI Studio) and Material Design 3 (M3). A dark-first, cinematic, generative workspace engineered for high-density creativity. The interface recedes into the background using deep OLED canvas (`#000000`), subtle dark surface container elevations (`#131314` to `#333537`), frosted dark glass overlays (`rgba(22, 23, 24, 0.90)` with `blur(40px)`), hairline white borders (`rgba(218, 220, 224, 0.05)`), typography powered by **Google Sans Text**, and **zero drop-shadows**.

---

## 1. Core Architectural Laws

1. **Token Encapsulation Law:** Never hardcode arbitrary hex colors (`#1a1a1a`), pixel paddings (`p-[13px]`), or custom radiuses in call-site JSX. All visual variables derive 100% from CSS variables in `src/app/globals.css` and their mapped Tailwind classes.
2. **Zero Box-Shadow Law:** Elevation and depth come exclusively from surface container contrast (`surface-container`, `surface-container-high`, `surface-container-highest`) and 1px hairline borders (`outline-variant`), never from blurry drop shadows.
3. **Primitive Ownership:** All HTML controls (`button`, `input`, `textarea`, `dropdown`, `card`, `dialog`) are owned by canonical primitives in `src/shared/ui/`. Features and pages never reconstruct controls from raw HTML.
4. **Dual Scalability:** The system honors Google Flow's authentic color palette and dimensions while strictly respecting the project's geometric radius scale (4px / 6px / 9999px) and 8px base spacing scale.

---

## 2. Token Architecture: Google Flow Material 3 Hierarchy

```
[ Layer 1: Google Flow Surface Ladder ]
  Lowest (#000000) ── Base (#131314) ── Low (#1b1b1b) ── Container (#1e1f20) ── High (#282a2c) ── Highest (#333537)
                                      │
                                      ▼
[ Layer 2: Semantic Roles in Tailwind ]
  Canvas:           bg-surface-container-lowest / bg-black
  Panel / Shell:    bg-surface (#131314)
  Card / Tile:      bg-surface-container (#1e1f20)
  Prompt Bar / Pop: bg-surface-container-high (#282a2c) / bg-surface-overlay (glass)
  Active / Modal:   bg-surface-container-highest (#333537)
                                      │
                                      ▼
[ Layer 3: Interaction & Outlines ]
  Hairline Border:  border-outline-variant (5% white / #444746)
  Default Border:   border-outline (14% white / #8e918f)
  Interactive Ring: border-outline-interactive (25% white)
  Hover Layer:      hover:bg-white/[0.08]
  Focus Layer:      focus-visible:ring-1 focus-visible:ring-primary
```

---

## 3. Surface & Elevation Palette (Dark Mode M3)

| Token Name | CSS Variable | Hex / RGBA Value | Tailwind Utility | Component Role |
|---|---|---|---|---|
| **Canvas** | `--surface-container-lowest` | `#000000` | `bg-surface-container-lowest` | Deepest viewport background / media bleed canvas |
| **Surface** | `--surface` | `#131314` | `bg-surface` | Persistent App Shell, Desktop Header, Sidebars |
| **Sunken** | `--surface-container-low` | `#1b1b1b` | `bg-surface-container-low` | Recessed toolbars, inactive panel zones |
| **Container (Card)** | `--surface-container` | `#1e1f20` | `bg-surface-container` | Standard cards, media tiles, inspectors |
| **High Container** | `--surface-container-high` | `#282a2c` | `bg-surface-container-high` | Floating toolbars, dropdown menus, popovers |
| **Highest Container**| `--surface-container-highest`| `#333537` | `bg-surface-container-highest` | Active selected state, modals, focused cards |
| **Surface Bright** | `--surface-bright` | `#37393b` | `bg-surface-bright` | High-contrast container fill, active tabs |
| **Glass Overlay** | `--surface-overlay` | `rgba(22, 23, 24, 0.90)` | `bg-surface-overlay` | Prompt Bar frosted glass (`backdrop-blur-[40px]`) |

---

## 4. Typography & Content Tokens

The typography is rendered using variable **Google Sans Text** (body, controls) and **Google Sans** (headings, titles):

| Role | CSS Variable | Hex Value | Tailwind Class | Usage |
|---|---|---|---|---|
| **On Surface (Base)** | `--on-surface` | `#f5f5f5` / `#e3e3e3` | `text-on-surface` | Primary headlines, prompt input text, active labels |
| **On Surface Variant** | `--on-surface-variant`| `#8e8e93` / `#c4c7c5` | `text-on-surface-variant`| Descriptions, secondary labels, settings text |
| **On Surface Subtle** | `--on-surface-subtle` | `#636366` | `text-on-surface-subtle` | Inactive placeholders, shortcut keys, disabled meta |

---

## 5. Line & Outline Tokens

| Role | CSS Variable | Value | Tailwind Class | Usage |
|---|---|---|---|---|
| **Outline Variant** | `--outline-variant` | `rgba(218, 220, 224, 0.05)` | `border-outline-variant` | Hairline card separation, subtle divider lines |
| **Outline Default** | `--outline` | `rgba(218, 220, 224, 0.14)` | `border-outline` | Standard input borders, panel frames |
| **Outline Interactive**| `--outline-interactive`| `rgba(255, 255, 255, 0.25)` | `border-outline-interactive`| Hovered card borders, active input rings |

---

## 6. Accents, Brand & Status Tokens

| Accent Role | CSS Variable | Hex Value | Tailwind Utility | Application |
|---|---|---|---|---|
| **Google Primary** | `--primary` | `#a8c7fa` | `text-primary` / `bg-primary` | Focused ring, primary action submit, active chips |
| **Primary Container**| `--primary-container` | `#0842a0` | `bg-primary-container` | Active selected filter pill background |
| **On Primary** | `--on-primary` | `#062e6f` | `text-on-primary` | Label text when placed over solid primary fill |
| **Cinema Neon** | `--brand-neon` | `#EFFE17` | `text-brand-neon` / `bg-brand-neon` | High-impact CTA, generation badges |
| **Error** | `--error` | `#fe6e6e` | `text-error` | Validation errors, delete confirmations |
| **Error Container** | `--error-container` | `#8c1d18` | `bg-error-container` | Error toast banner background |
| **Success** | `--success` | `#80da88` | `text-success` | Generation completed, upload verified |
| **Warning** | `--warning` | `#fcbd00` | `text-warning` | Rate limit alerts, credits threshold |

---

## 7. Geometric Scales: Radius & Spacing

### 7.1 Border Radius Hierarchy (Frozen Standards)
Enforced strictly across all UI components:

| Geometry Role | Value | CSS Token | Tailwind Utility | Allowed UI Components |
|---|---|---|---|---|
| **Sharp** | `4px` | `--radius-sm` | `rounded-sm` | Buttons, Inputs, Badges, Dropdown Items, Tooltips |
| **Container (MAX)** | `6px` | `--radius-md` | `rounded-md` | Cards, Textareas, Menus, Popovers, Dialogs, Drawers |
| **Pill / Circle** | `9999px`| `--radius-full` | `rounded-full` | Filter Pills, Avatars, Generate Icon Button, Toggles |

### 7.2 Semantic Spacing Ladder (8px Base Scale)
| Token | Pixels | Tailwind Utility | Application |
|---|---|---|---|
| `xxs` | 4px | `p-xxs`, `gap-xxs` | Micro badge margins, icon-text gap |
| `xs` | 6px | `p-xs`, `gap-xs` | Compact list items, button inner gutters |
| `sm` | 8px | `p-sm`, `gap-sm` | Standard element gap, chip padding |
| `md` | 12px | `p-md`, `gap-md` | Form field spacing, panel interior padding |
| `base` | 16px | `p-base`, `gap-base` | Card interior padding, dialog gutter |
| `lg` | 20px | `p-lg`, `gap-lg` | Card exterior padding, studio panel gaps |
| `xl` | 24px | `p-xl`, `gap-xl` | Modal header spacing, section margins |
| `xxl` | 28px | `p-xxl`, `gap-xxl` | Module separations |
| `section` | 32px | `p-section`, `gap-section`| Block breathing room |

---

## 8. Google Flow Component Specifications

### 8.1 The Frosted Prompt Box (`flow-prompt-box`)
* **Container Width:** Max `37.5rem` (600px), compact `41.25rem` (660px).
* **Min Height:** `5.625rem` (90px), expanding dynamically up to `min(28.75rem, 65vh)`.
* **Surface Fill:** `rgba(22, 23, 24, 0.90)` with `backdrop-filter: blur(40px)`.
* **Border:** `1px solid rgba(218, 220, 224, 0.05)`.
* **Settings Flyout Panel:** Width `17.5rem` (280px), wide `21rem` (336px).
* **Generation Snake Glow Animation:** Houdini `@property --border-glow-snake-progress` rotating gradient light during inference.

### 8.2 Buttons & Action Controls
* **Button Height Scale (`size` parameter — defaults to `m`):**
  - **Small (`s`):** `--button-height-s: 32px;` (Tailwind `h-button-s`). Compact density actions, tree items, dense toolbars.
  - **Medium (`m` — Default):** `--button-height-m: 36px;` (Tailwind `h-button-m`). Standard studio controls, navbar action items, default button height.
  - **Large (`l`):** `--button-height-l: 42px;` (Tailwind `h-button-l`). Symmetrical sidebar navigation items, prominent modal actions, menu drawer controls.
* **Settings Trigger Chip (`flow-button-chip`):** Background `rgba(218, 220, 224, 0.05)`, text `rgba(218, 220, 224, 0.75)`, 11px font size, font-weight 500, no borders.
* **Generate Button (`flow-button-generate`):** Circular `rounded-full`, primary or neon state when valid, disabled state `rgba(218, 220, 224, 0.05)` with 50% opacity icon.
* **Transparent Icon Button (`flow-icon-button-transparent`):** Zero background, hover state `hover:bg-white/[0.08]`.

### 8.3 The Studio Header (`header-base`)
* **Height:** `52px` (`var(--studio-navbar-height)`, `h-studio-navbar`, `max-h-studio-navbar`).
* **Background:** Transparent with feathered backdrop gradient overlay (`.header-backdrop.header-backdrop-visible`).
* **Title & Breadcrumb:** Inline seamless navigation breadcrumbs (`Assets`, `Assets / [collection]`, `Elements`, `Characters`, `Trash`) with `EditableDisplayName`.
* **Controls Sizing:** Action buttons and search inputs scale dynamically to `h-8` / `h-9` with `max-h-full` to prevent vertical container overflow.

### 8.4 Studio Layout Dimensions & Rail Geometry
* **Studio Navbar Height:** `52px` (`--studio-navbar-height: 52px;`, Tailwind utility `h-studio-navbar` / `max-h-studio-navbar`).
  - Sits as a `relative shrink-0` static flex item directly preceding the content column.
  - Constant horizontal padding: `5px` (`--studio-navbar-padding: 5px;`, Tailwind utility `px-studio-navbar-padding`), perfectly aligning with the 5px sidebar padding.
  - Controls (`Input`, `Button`, `DropdownMenuTrigger`) are bounded by `max-h-full min-h-0` for fluid dynamic shrinking.
* **Studio Sidebar Rail Width (Collapsed):** `52px` (`--studio-sidebar-width: 52px;`, Tailwind utility `w-studio-sidebar`).
  - Forms a symmetrical 52px × 52px geometric alignment with the 52px Studio Navbar at the top-left corner.
  - Constant horizontal padding: `5px` (`--studio-sidebar-padding: 5px;`, Tailwind utility `px-studio-sidebar-padding`), cleanly accommodating centered 48px navigation item icons (`w-[48px]`) without layout jump or disappearing padding during expand/collapse.
  - Default state: Collapsed rail (`isExpanded: false`).
* **Studio Sidebar Width (Expanded):** `230px` (`--studio-sidebar-width-expanded: 230px;`, Tailwind utility `w-studio-sidebar-expanded`).
  - Constant horizontal padding: `px-studio-sidebar-padding` (5px) with full typographic labels and smooth bezier width animations (`rail-smooth-transition`).
* **Zero-Padding Flex Flow Law:**
  - Content containers (`assets`, `collection`, `elements`, `characters`, `trash`) stack directly below the 52px navbar in a normal `flex flex-col` document flow without artificial top padding (`pt-0`, no `pt-[72px]`).
  - Gallery scroll containers use `p-0` (zero horizontal and zero vertical padding), allowing media tiles and collections to bleed cleanly edge-to-edge against the sidebar rail and viewport boundaries.

---

## 9. Rule Enforcement & Developer Guide

1. **No inline styles for static design:** Always use token classes (`bg-surface-container`, `text-on-surface`, `border-outline-variant`).
2. **Never install ad-hoc CSS:** If a new component requires styling, consult this document and compose from the existing token primitives.
3. **Run `npm run ui:check`:** Ensures 0 new raw color literals, 0 new arbitrary values, and full token compliance.
