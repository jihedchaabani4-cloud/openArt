# Design System — Higgsfield "Cinema Studio" (Dark UI)

> Source: computed CSS + DOM captured from `higgsfield.ai/generate` (theme `data-theme="default-dark"`, `color-scheme: dark`).
> Purpose: give this file to a coding/design agent so it can rebuild the same look 1:1.
> Legend: **[captured]** = value read directly from computed CSS. **[class-derived]** = inferred from Tailwind class names (hover/active/focus states, not computed in the capture). **[derived]** = not present in the capture (e.g. open dropdown menu panel) so built from the same tokens — verify visually.

---

## 0. Style summary (read this first)

- **Mood:** cinematic, dark, "pro tool". Near-black canvas, soft translucent white layers on top, ONE loud accent: **electric lime `#D1FE17`**.
- **Depth is made with:** (1) white-alpha overlays (5% / 10% / 20%) instead of grey fills, (2) very subtle 1px white-alpha borders, (3) long soft black drop-shadows, (4) inner highlight shadows (`inset 0 1px 0 …`) on primary buttons.
- **Primary CTAs are "tactile":** lime fill + dark-lime bottom inner edge (`inset 0 -3px 0 #829B19`) + stacked drop shadows + soft white glow blob + dark text.
- **Everything else is quiet:** ghost / 5%-white buttons, grey text `#898A8B` / `#828282`, white text on hover.
- **Fonts:** `Inter` for UI/body. `Space Grotesk` for hero headline, badges and the Generate button (uppercase, bold, tight tracking).
- **Shape language:** generous radii (8 → 12 → 16 → 24). Pills only for promo CTA and avatars.
- **Layout:** floating rounded panels on a 4px gutter (app shell), sidebar 320px, centered composer 876px wide.

---

## 1. Design tokens

### 1.1 CSS variables (copy-paste)

```css
:root {
  color-scheme: dark;

  /* ---------- Backgrounds ---------- */
  --bg-root:            #0F1113;            /* html */                         /* [captured] rgb(15,17,19) */
  --bg-page:            #131416;            /* body, panels (qc-background-primary) */ /* [captured] rgb(19,20,22) */
  --bg-surface:         #1C1E20;            /* composer, mode tabs, cards (surface-primary) */ /* [captured] rgb(28,30,32) */
  --bg-surface-2:       #1C1E21;            /* search input (q-background-secondary) */ /* [captured] rgb(28,30,33) */
  --bg-inverse-btn:     #131416;            /* black pill button on lime promo bar */

  /* ---------- White-alpha overlays (the main "fill" system) ---------- */
  --overlay-3:   rgba(255,255,255,0.03);
  --overlay-5:   rgba(255,255,255,0.05);    /* default chip / ghost hover / card hover */
  --overlay-8:   rgba(255,255,255,0.08);    /* glass icon tile */
  --overlay-10:  rgba(255,255,255,0.10);    /* hover on 5% / "+" button / selected */
  --overlay-20:  rgba(255,255,255,0.20);    /* active/pressed */

  /* ---------- Text ---------- */
  --text-primary:    #FFFFFF;               /* titles, labels, button text */
  --text-body:       #F7F7F8;               /* body default */                 /* [captured] rgb(247,247,248) */
  --text-secondary:  #898A8B;               /* placeholders, inactive icons/tabs */ /* [captured] rgb(137,138,139) */
  --text-tertiary:   #828282;               /* section labels, meta, ghost buttons */ /* [captured] rgb(130,130,130) */
  --text-footer:     rgba(255,255,255,0.60);
  --text-disabled:   rgba(255,255,255,0.50);
  --text-on-brand:   #131517;               /* text/icons on lime */           /* [captured] rgb(19,21,23) */
  --text-on-promo:   #1A1A1A;               /* text on lime promo / marketing button */ /* [captured] rgb(26,26,26) */
  --icon-on-brand-mobile: #2F3907;

  /* ---------- Brand (lime) ---------- */
  --brand:           #D1FE17;               /* [captured] rgb(209,254,23) */
  --brand-edge:      #829B19;               /* dark lime bottom edge */        /* [captured] rgb(130,155,25) */
  --brand-glow:      #CDFF00;               /* glow blob */
  --brand-yellow:    #FFFF14;               /* top-to-bottom sheen on marketing button */
  --brand-border-on: rgba(209,254,23,0.48); /* focus ring shadow colour on chips */

  /* ---------- Accent / promo ---------- */
  --pink-500: #ED1572;  --pink-400: #ED2D84;  --pink-300: #EE4596;   /* badge gradient stops */
  --pink-tint-6: color(srgb 1 0 0.356863 / 0.06);                     /* Pricing nav bg */
  --blue-promo: #0256FE;                                              /* "Special offer" tag */

  /* ---------- Borders ---------- */
  --border-subtle:   rgba(255,255,255,0.05);   /* panels, sidebar, dividers */  /* [captured] */
  --border-default:  rgba(255,255,255,0.10);   /* inputs */                     /* [captured] */
  --border-glass:    rgba(197,197,197,0.30);   /* glass icon buttons */         /* [captured] */
  --border-glass-sm: rgba(197,197,197,0.24);   /* nav icon tiles */             /* [captured] */
  --border-brand-btn:rgba(217,217,217,0.04);   /* inner edge on lime button */  /* [captured] */
  --ring-focus:      rgba(255,255,255,0.30);   /* focus-visible ring (cards) */ /* [class-derived] */
  --ring-focus-strong: rgba(255,255,255,0.70); /* focus ring on hero cards */   /* [class-derived] */

  /* ---------- Radii ---------- */
  --r-xs: 6px;   /* tiny icon buttons */
  --r-sm: 8px;   /* chips, nav icon tiles, input-action group */
  --r-md: 10px;  /* marketing button, small generate */
  --r-lg: 12px;  /* nav rows, search, thumbnails, big generate, brand buttons */
  --r-xl: 16px;  /* panels, project cards, sidebar */
  --r-2xl: 20px; /* composer inner area, mode tab */
  --r-3xl: 24px; /* composer shell, mode-tab rail */
  --r-full: 9999px;

  /* ---------- Spacing helpers ---------- */
  --gutter: 4px;            /* app-shell gap between sidebar and main */
  --sidebar-w: 320px;       /* min 231 / max 320 / collapsed 52 */
  --composer-w: 876px;      /* max 1140 */
  --content-max: 1440px;    /* "max-w-360" */
  --hero-max: 1150px;       /* "max-w-287.5" */

  /* ---------- Fonts ---------- */
  --font-ui: Inter, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;      /* preloaded, not seen in visible UI */
  --font-serif: "Instrument Serif", Georgia, serif;           /* preloaded, not seen in visible UI */

  /* ---------- Motion ---------- */
  --t-fast: 150ms cubic-bezier(.4,0,.2,1);
  --t-base: 200ms cubic-bezier(.4,0,.2,1);
  --t-pop:  180ms cubic-bezier(.23,1,.32,1);     /* marketing button scale */
  --t-panel: 300ms ease-in-out;                  /* header/promo collapse */

  /* ---------- Shadows (named) ---------- */
  --sh-brand-btn:
    10px 34px 24px 0 rgba(0,0,0,.15),
    8px 21px 6px 0 rgba(0,0,0,.01),
    3px 7px 5px 0 rgba(0,0,0,.25),
    1px 3px 4px 0 rgba(0,0,0,.43),
    0 1px 2px 0 rgba(0,0,0,.49),
    inset 0 -3px 0 0 #829B19,
    inset 0 -2px 0 0 #829B19,
    inset 0 1px 0 0 #D1FE17;
  --sh-marketing-btn:
    inset 0 -3px 0 0 #829B19,
    0 6px 4px 0 rgba(0,0,0,.25),
    0 32px 24px 0 rgba(0,0,0,.15);
  --sh-glass:
    inset 0 -0.3px 5.36px 0 rgba(185,185,185,.35),
    0 5.06px 5.65px 0 rgba(0,0,0,.10),
    0 20.53px 10.27px 0 rgba(0,0,0,.09),
    0 46.42px 13.99px 0 rgba(0,0,0,.05);
  --sh-tile:   0 4px 2px 0 rgba(0,0,0,.08), inset 0 2px 4px 0 rgba(255,255,255,.24);
  --sh-chip-inset: inset 0 2px 3px 0 rgba(255,255,255,.15);
  --sh-rail:   0 4px 6px 0 rgba(0,0,0,.16), 0 4px 16px 0 rgba(0,0,0,.08);
  --sh-composer: 0 4px 6px 0 rgba(0,0,0,.10), 0 4px 16px 0 rgba(0,0,0,.10);
  --sh-input:  0 2px 2px 0 rgba(0,0,0,.08), inset 0 -6px 12px 0 rgba(255,255,255,.04);
  --sh-switcher: 0 2px 8px 0 rgba(0,0,0,.06);
  --sh-hero-card:
    -15.6px 0 31.2px 0 rgba(0,0,0,.32),
    15.6px 0 31.2px 0 rgba(0,0,0,.32),
    0 5.2px 20.8px 0 rgba(0,0,0,.24),
    inset 0 1.3px 2.6px 0 rgba(255,255,255,.12);
  --sh-hero-card-side:
    -20.8px 0 41.6px 0 rgba(0,0,0,.32),
    20.8px 0 41.6px 0 rgba(0,0,0,.32),
    0 4.5px 4.5px 0 rgba(0,0,0,.08),
    inset 0 1.7px 3.5px 0 rgba(255,255,255,.12);
  --sh-toast:  0 .5rem .375rem rgba(0,0,0,.12);
  --sh-promo-tag: inset 0 -2px 2px 0 rgba(255,255,255,.4), inset 0 2px 2px 0 rgba(255,255,255,.4);
}
```

### 1.2 Semantic token names used by the original (useful for mapping)

| Original name | Value |
|---|---|
| `qc-background-primary` | `#131416` |
| `surface-primary` | `#1C1E20` |
| `q-background-secondary` | `#1C1E21` |
| `qc-border-subtle` | `rgba(255,255,255,.05)` |
| `q-border-default` | `rgba(255,255,255,.10)` |
| `separator-card` | `rgba(217,217,217,.04)` (same as lime-button inner edge) |
| `neutral-primary-reverted-5 / 10 / 20` | `rgba(255,255,255,.05 / .10 / .20)` |
| `qc-overlay-hover` / `q-overlay-hover` | white 5–10% |
| `font-primary` / `text-primary` | `#FFFFFF` |
| `font-secondary` / `icon-secondary` | `#898A8B` |
| `q-text-secondary` | `#828282` |
| `icon-brand` / `surface-brand` | `#D1FE17` |
| `font-primary-reverted` / `icon-primary-reverted` | `#131517` |

---

## 2. Typography

Base: `font-family: var(--font-ui)`, `-webkit-font-smoothing: antialiased`, body default `16px/24px`, color `#F7F7F8`.

| Token | Font | Size / Line-height | Weight | Letter-spacing | Color | Where |
|---|---|---|---|---|---|---|
| `display-hero` | Space Grotesk | **40px / 36px** (fluid: `clamp(1.25rem, 6vw, 2.5rem)` / `clamp(1.625rem, 7vw, 2.25rem)`) | 700 | **-0.04em** (-1.6px) | gradient text (see below) | Hero H1 "BRING YOUR STORIES TO LIFE" — UPPERCASE, `font-feature-settings:"ss04" 1`, `white-space:nowrap`, centered |
| `heading-section` | Inter | 16px / 24px | 600 | 0 | `#FFF` | "My projects" |
| `label-md` (`text-sm-medium`) | Inter | 14px / 20px | 500 | 0 | `#FFF` | Sidebar nav, space name, account name, project card title (16px line) |
| `label-sm` (`q-label-sm-medium`) | Inter | 14px / 16px | 500 | 0 | `#FFF` | Card titles, "All projects", "New project" |
| `caption-md-medium` | Inter | 12px / 16px | 500 | 0 | `#828282` | Sidebar section title ("Projects") |
| `caption-sm` (`q-caption-sm-regular`) | Inter | 12px / 16px | 400 | 0 | `#828282` | Card meta ("Private") |
| `chip-label` (`text-xs-semi`) | Inter | 12px / 18px | 500 (spans) · 600 (button text) | 0 | `#FFF` | Composer chips: "16:9", "10s", "References" |
| `mode-tab` | Inter | 10px / 12px | 700 | 0 | `#898A8B` → `#FFF` selected | Image / Video tab labels |
| `nav-mobile` (`text-xxs-medium`) | Inter | 10px / 14px | 500 | 0 | `#898A8B` → `#FFF` active | Bottom nav labels |
| `body-prompt` | Inter | 14px / 20px | 400 | 0 | `#FFF` (placeholder `#898A8B`) | Prompt textarea |
| `promo-text` | Inter | 14px / 20px | 600 | 0 | `#1A1A1A` | Top promo bar message |
| `tag-label` | Inter | 12px / 16px | 600 | 0 | `#FFF` | "Special offer" tag |
| `button-marketing` | Inter | 14px / 16px | 500 | 0 | `#1A1A1A` | "Explore" lime button |
| `button-generate` | **Space Grotesk** | 12px / 18px | **700, UPPERCASE** | 0 | `#131517` + `text-shadow: 0 0 8px rgba(255,255,255,.45)` | Big lime GENERATE |
| `generate-credits` | Space Grotesk | 12px / 16px | 500 | 0 | `#131517` | "✦ 30" under label |
| `badge` | Space Grotesk Bold | 12px / 0 (flex centered) | 700, UPPERCASE | 0 | `#FFF` | "30% OFF" |
| `nav-pricing` | Inter | 14px / 20px | 500 | 0.1px | `#FFF` | Pricing link |
| `nav-pricing-discount` | Inter | 10px / 20px | 500 | 0.1px | `#FFF` | "-30%" inline |
| `footer` | Inter | 14px / 20px | 400 (text) · 500 (links) | 0 | `rgba(255,255,255,.6)` text · `#F7F7F8` links | Footer |

### Hero gradient text
```css
.display-hero {
  font: 700 clamp(1.25rem,6vw,2.5rem)/clamp(1.625rem,7vw,2.25rem) var(--font-display);
  letter-spacing: -0.04em; text-transform: uppercase; text-align: center; white-space: nowrap;
  font-feature-settings: "ss04" 1;
  background: linear-gradient(180deg, #fff 14%, rgba(255,255,255,.41) 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
```

### Text states
- Default secondary → hover primary: `#898A8B` / `#828282` → `#FFFFFF` (`transition: color .15s`).
- Truncation: single-line labels use `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`.
- Links in footer: hover `filter: brightness(.6)` (`hover:brightness-60`).

---

## 3. Buttons — all variations

All buttons: `cursor:pointer; border:0; appearance:button; font-family: inherit`. Press feedback is either `scale(.96–.99)` or `brightness(.8)`.

### 3.1 Primary — "GENERATE" (big, hero CTA)
- Size **120 × 80**, radius **12px**, padding `14px 24px 16px`, column layout (label top, credits below), `isolation:isolate`, `overflow:hidden`.
- Background `#D1FE17`, border `0` (+ inner 2.2px bottom edge via overlay span `rgba(217,217,217,.04)`, radius 14px).
- Shadow `--sh-brand-btn`.
- Text: Space Grotesk 12/18 **700 UPPERCASE** `#131517`, `text-shadow: 0 0 8px rgba(255,255,255,.45)`.
- Credit row: sparkle icon 12px + number, 12/16 500.
- **Glow blob** (absolute, decorative): `left:39px; top:36px; width:76px; height:136px; border-radius:50%; background:#CDFF00; filter:blur(41.5px); transform: rotate(102.79deg) skewX(.89deg); mix-blend-mode:plus-lighter`.
- Hover `filter:brightness(.9)` · Active `brightness(.8)` · Disabled `opacity:.4; cursor:not-allowed` · transition `filter .2s`.

```css
.btn-generate{
  position:relative; isolation:isolate; overflow:hidden;
  width:120px; height:80px; padding:14px 24px 16px; border:0; border-radius:12px;
  background:var(--brand); color:#131517;
  font:700 12px/18px var(--font-display); text-transform:uppercase;
  text-shadow:0 0 8px rgba(255,255,255,.45);
  box-shadow:var(--sh-brand-btn);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  transition:filter .2s;
}
.btn-generate:hover{filter:brightness(.9)}
.btn-generate:active{filter:brightness(.8)}
.btn-generate:disabled{opacity:.4;cursor:not-allowed}
.btn-generate::before{ /* glow */
  content:""; position:absolute; left:39px; top:36px; width:76px; height:136px; border-radius:50%;
  background:#CDFF00; filter:blur(41.5px); transform:rotate(102.79deg) skewX(.89deg);
  mix-blend-mode:plus-lighter; pointer-events:none; z-index:-1;
}
```

### 3.2 Primary — compact generate (icon only, mobile composer)
- **36 × 36**, radius **10px**, bg `#D1FE17`, border `1.5px solid rgba(217,217,217,.04)`.
- Icon: 16px sparkle, color `#131517`.
- Shadow: `10px 34px 24px rgba(0,0,0,.15), 8px 21px 6px rgba(0,0,0,.01), 3px 7px 5px rgba(0,0,0,.25), 1px 3px 4px rgba(0,0,0,.43), 0 1px 2px rgba(0,0,0,.49), inset 0 1px 0 #D1FE17`.
- Glow: `48×64`, top `28px`, centered, `blur(16px)`, same rotate/skew/blend.
- Hover `brightness(.9)` · Active `brightness(.8)` · Disabled `opacity:.5`.
- Wrapped in a `rgba(255,255,255,.05)` rounded-12 holder with 2px padding.

### 3.3 Primary — mobile nav center button
- **66 × 44**, radius 12px, bg `#D1FE17`, shadow `inset 0 -3px 0 #829B19`, `filter: drop-shadow(0 32px 12px rgba(0,0,0,.15))`, icon 24px `#2F3907` (4-point star).
- Active: `opacity:.9; translateY(2px)`.

### 3.4 Marketing primary — "Explore" (lime, sm)
- Height **40px**, padding `0 14px 0 16px` (`pr-3.5`), radius **10px**, gap 8, inline-flex centered.
- Background (layered): `linear-gradient(180deg, rgba(255,255,20,0) 0%, #FFFF14 100%), linear-gradient(90deg, #D1FE17, #D1FE17)`.
- Text 14/16 500 `#1A1A1A`, trailing icon 16px (arrow-up-right).
- Shadow `--sh-marketing-btn`.
- Rest `scale(.95)`; on parent hover/focus `scale(1)` — `transition: transform .18s cubic-bezier(.23,1,.32,1)`.

### 3.5 Pill — dark CTA on lime promo bar
- Height 32, padding `0 14px`, radius full, bg `#131416`, text `#FFF` 14/16 500, hover `opacity:.9`, `transition: opacity .2s`.

### 3.6 Ghost / quiet buttons

| Variant | Size | Radius | Rest | Hover | Notes |
|---|---|---|---|---|---|
| **Nav row** (Home, My generations…) | h36, pad 6, gap 8 | 12 | transparent, text `#FFF` | bg `rgba(255,255,255,.05)` | Active = bg `.05` already on |
| **Sidebar action** ("New project") | h36, px 6, gap 8 | 12 | text `#828282` | text `#FFF` | leading 24px glass tile |
| **Sidebar action strong** ("All projects") | h36 | 12 | text `#FFF` | bg white 5–10% | trailing chevron 16px `#898A8B` |
| **Icon 24** (search, sort) | 24×24 | 8 | color `#828282` | bg overlay-hover, color `#FFF`; active `scale(.96)` | |
| **Icon 24 small** (close search / row "⋯") | 24×24 | 6 | color `#898A8B` | bg `rgba(255,255,255,.10)`, color white | row "⋯" fades in on row hover (`opacity 0→1`, 150ms) |
| **Collapse sidebar** | 36×36 | 12 | bg `rgba(255,255,255,.05)`, icon `#828282` | bg `rgba(255,255,255,.10)` | |
| **Notification** | 36 hit / 24 inner circle | full | inner bg `rgba(255,255,255,.05)`, icon 12px `rgba(255,255,255,.6)` | inner bg `.10`, icon `#FFF` | |
| **Account** | h36, pad 6, gap 8 | 12 | text `#FFF` 14/500 | bg `rgba(255,255,255,.05)` | avatar 24 w/ progress ring |
| **Space switcher** | h36, pl 10 / pr 12 | 12 | bg `rgba(255,255,255,.05)`, shadow `--sh-switcher` | bg `.10` | logo tile 20–24 + label + 2-segment chevron |

### 3.6.1 Glass icon tile (used inside "New project")
```css
.glass-tile{
  width:24px;height:24px;border-radius:8px;display:grid;place-items:center;
  background:rgba(255,255,255,.08); border:1px solid rgba(197,197,197,.30);
  box-shadow:var(--sh-glass); color:#898A8B; transition:color .2s;
}
.glass-action:hover .glass-tile{color:#fff}
```

### 3.7 Chip buttons (composer settings: model, ratio, duration, references)
- Height **28**, radius **8**, padding `4px 8px`, gap 4, bg `rgba(255,255,255,.05)`, no shadow, no border (transparent 1px).
- Text 12/18 500 `#FFF`; icons 16px `#FFF` (secondary icons `#898A8B` before hover).
- Hover: bg `.10`. Active: bg `.20`. Focus: no ring (`focus:ring-0`), `brightness(1.5)` on non-highlight chips.
- **Highlighted model chip:** text + icon `#D1FE17`, label `Kling 4.0 Flash`, trailing chevron 20px white → `#D1FE17` on hover.
- **Icon-only chip** (references "◎"): 28×28, centered, radius 8 (or 0 inside the grouped action bar).
- **Chip with dropdown caret** ("References ⌄"): caret 24px chevron-down, 4px gap.
- **Group bar:** `display:flex; height:28; border-radius:8; background:rgba(255,255,255,.05); overflow:hidden`, items separated by a `1px × 16px` divider `rgba(255,255,255,.10)` that fades out when the group is hovered. First item = "+" add button (28×28, bg `.10`, hover `.20`).
- Overflow row scroll: `overflow-x:auto; scrollbar-width:none`; left/right arrow buttons 28×28 radius 8 bg `.05`, `opacity:0; pointer-events:none` until scrollable.

### 3.8 Mode tab (Image | Video)
- Rail: width **72px**, padding 4, radius **24px**, bg `#1C1E20`, shadow `--sh-rail`, `isolation:isolate`.
- Tab: **64px wide, ~52px high**, radius **20px**, flex column, gap 4, padding `6px 12px`, icon 16px + label 10/12 **700**.
- Rest: `#898A8B`. Selected: `#FFFFFF`. Hover: text → `#FFF`.
- Sliding indicator (absolute): radius 20, height 52, bg `rgba(255,255,255,.05)`, `transform: translateY(56px)` for 2nd tab (animate with `transform .2s`).
- Focus ring: `box-shadow: 0 0 0 0 rgba(209,254,23,.48)` (set spread >0 on `:focus-visible`).

### 3.9 Mobile bottom-nav item
- 5 columns grid, item padding 6, radius 12, icon 20 + label 10/14 500, gap 2, centered.
- Rest `#898A8B`; active `#FFF`; press `opacity:.6; translateY(2px)`.

### 3.10 Card as button (project card / create tile)
- See §7. Active `scale(.99)`; focus `ring 2px rgba(255,255,255,.30)`.

---

## 4. Badges, tags & promo

### 4.1 Pink skewed badge ("30% OFF")
```css
.badge-pink{ display:inline-block; transform:skewX(-10.7deg); /* matrix(1,0,-.188541,.98,0,0) */ }
.badge-pink .surface{
  padding:0 6px; border-radius:2px; height:15px;
  background:radial-gradient(39.43% 136.54% at 51.64% 117.31%, #EE4596 0%, #ED2D84 50%, #ED1572 100%);
}
.badge-pink .label{ font:700 12px/15px var(--font-display); color:#fff; text-transform:uppercase; white-space:nowrap }
```
Parent `Pricing` nav pill: bg `color(srgb 1 0 .356863 / .06)`, radius 12, text 14/500 `#FFF`, letter-spacing .1px; transitions `filter .15s, color/bg/box-shadow/height/width/padding .3s ease-in-out`.

### 4.2 "Special offer" blue tag (promo bar)
- Padding `4px 8px 4px 6px`, radius 8, border `1.1px solid rgba(255,255,255,.05)`, gap 6.
- Background (3 layers):
  `radial-gradient(70% 200% at 73% 50%, rgba(29,99,239,.6) 0%, rgba(81,80,208,.45) 25%, rgba(133,60,176,.3) 50%, rgba(237,21,114,0) 100%), radial-gradient(25% 42% at 85% 37%, rgba(255,255,255,.6) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, #0256FE, #0256FE)`
- Shadow `--sh-promo-tag`. Text 12/16 600 `#FFF`.

### 4.3 Promo bar (top, collapsible)
- Min height 48, padding `8px 16px`, bg `linear-gradient(90deg,#4B4B4B 0%,#000 50%,#4B4B4B 100%)`, `background-blend-mode: color-dodge`, bottom border `1px solid rgba(255,255,255,.2)`.
- Message 14/20 600, CTA = pill button §3.5, close icon button 28×28 radius 8 (icon stroke 1.5px).
- Collapse animation: `grid-template-rows: 1fr → 0fr`, 300ms ease-out.

---

## 5. Inputs, text fields, prompt

### 5.1 Search field (sidebar)
```css
.input-search{
  height:36px; display:flex; align-items:center; gap:6px; padding:4px 6px;
  background:#1C1E21; border:1px solid rgba(255,255,255,.10); border-radius:12px;
  box-shadow:var(--sh-input);
}
.input-search input{ flex:1; background:transparent; border:0; outline:0; color:#fff; font:500 14px/16px var(--font-ui) }
.input-search input::placeholder{ color:#828282 }
```
Leading search icon 24-hit/16px `#828282`; trailing close button 24×24 radius 6.

### 5.2 Prompt editor (composer)
- Contenteditable, no border, transparent, `14/20`, text `#FFF`, caret `#FFF`, `scrollbar-width:none`, `white-space:pre-wrap; word-break:break-word`, `min-height:40px`.
- Placeholder: absolutely positioned top-left, `#898A8B`, `pointer-events:none; user-select:none`. Text: "Describe the video you want to create..."
- Mobile collapsed prompt: text 14/20 500 `rgba(255,255,255,.5)`, truncated.

### 5.3 File input (hidden) — accept `image/*,video/mp4,video/quicktime`, multiple.

---

## 6. Dropdowns / selects / menus

Triggers use class `q-dropdown-trigger` (Base UI): `aria-haspopup="menu"`, `aria-expanded`, `data-popup-open` when open.

### 6.1 Triggers [captured]
| Trigger | Look |
|---|---|
| Sort projects | Icon button 24×24, radius 8, `#828282`; open state: bg `overlay-hover` + text `#FFF` (`data-popup-open`) |
| Folder "⋯" | 24×24 radius 6, `#898A8B`; open: bg white 10% |
| Account | See §3.6 |
| Space switcher | Chevron icon made of two segments (`top`/`bottom` paths) that flip with `scaleY(-1)` ↔ `scaleY(1)`, `transition: transform .18s cubic-bezier(.77,0,.175,1)`. The submenu expands inline with `grid-template-rows 0fr → 1fr` + `opacity 0 → 1` (180ms ease-out), items are 36px rows (icon 20 + label 14/500, hover `rgba(255,255,255,.05)`) |
| Language selector | Text button 14/20 400 `#F7F7F8`, flag 20px circle (bg `#1C1E20`) + label + 16px chevron; hover color `rgba(255,255,255,.6)`; focus ring 2px |
| Composer chips with dropdown | See §3.7 |

### 6.2 Open menu panel **[derived — not in capture]**
Build from the same tokens so it matches the app:
```css
.menu{
  min-width:200px; padding:4px;
  background:#1C1E20; border:1px solid rgba(255,255,255,.10); border-radius:12px;
  box-shadow:0 16px 32px rgba(0,0,0,.40), 0 4px 8px rgba(0,0,0,.24);
  z-index:100;
}
.menu-item{ height:36px; padding:0 10px; border-radius:8px; display:flex; align-items:center; gap:8px;
  font:500 14px/20px var(--font-ui); color:#fff; }
.menu-item:hover,.menu-item[data-highlighted]{ background:rgba(255,255,255,.05) }
.menu-item[data-selected]{ background:rgba(255,255,255,.10) }
.menu-item.danger{ color:#FF6B6B }
.menu-sep{ height:1px; margin:4px; background:rgba(255,255,255,.05) }
.menu-label{ padding:6px 10px; font:500 12px/16px var(--font-ui); color:#828282 }
```
Open animation: `opacity 0→1` + `scale .98→1`, 120–150ms. Typeahead listbox layer uses `z-index:100`.

---

## 7. Cards

### 7.1 Project card (grid)
- Grid: `display:grid; grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr)); gap:16px`.
- Card: padding `4px 4px 6px`, radius **16px**, bg transparent, flex column, gap 4, `cursor:pointer`.
  Hover bg `rgba(255,255,255,.05)` · Active `scale(.99)` · transition `background-color, scale .2s ease-out` · focus ring 2px `rgba(255,255,255,.30)`.
- Thumbnail: `aspect-ratio:16/9`, radius **12px**, overflow hidden, plus 1px gradient border overlay
  `linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.11))` using mask-composite exclude.
- Footer row: padding `4px 8px`, gap 4. Title 14/16 500 `#FFF` truncate (flex 1). Meta 12/16 `#828282` with 14px lock icon. Row "⋯" action: `width 0 → 24px`, `opacity 0 → 1` on hover (200ms `cubic-bezier(.23,1,.32,1)`).
- **Empty thumbnail pattern:** one big tile (flex 1) + two stacked squares, `gap:8px`, each tile bg `rgba(255,255,255,.05)` radius 12, with a giant brand-logo watermark (`160cqmax`, rotated `-12deg`, fill `rgba(255,255,255,.05)`) continuing across tiles.

### 7.2 "Create new project" tile
- Same card geometry; thumbnail bg `rgba(255,255,255,.05)`, centered **circle** (padding 16 + 24 icon, ~58px) with border `1px solid rgba(197,197,197,.30)`, bg `rgba(255,255,255,.05)`, shadow `0 20.5px 20.5px rgba(0,0,0,.09), inset 0 -0.3px 5.36px rgba(185,185,185,.35)`; hover `scale(1.05)`.

### 7.3 Hero carousel card (center "featured" + side cards)
- Container: `aspect-ratio:687/166; width:min(100%,687px); position:relative`.
- Each card: `position:absolute; left:29.8156%; top:3.012%; width:40.3688%; aspect-ratio:16/9; transform-origin:center; will-change:transform; backface-visibility:hidden`.
- **Active (center):** `transform: translate3d(0,0,0) scale(1)`; radius 12; shadow `--sh-hero-card`; z-index 10.
- **Left side:** `translate3d(-64.173%,0,0) scale(.721154)`. **Right side:** `translate3d(64.173%,0,0) scale(.721154)`. Radius 11.1px (0.6933rem); shadow `--sh-hero-card-side`. Off-stage cards: `opacity:0; translate3d(142%,0,0)`.
- Media: `<video muted loop playsinline preload="none" poster=…>` `object-fit:cover`, bg `rgba(0,0,0,.2)`, with a top sheen overlay `linear-gradient(to top, transparent, rgba(255,255,255,.24))` at `opacity:.6`.
- Gradient ring (all cards): padding 2.6px (center) / 1.7px (side), `linear-gradient(180deg, rgba(255,255,255,.44), rgba(255,255,255,.30) 48%, rgba(255,255,255,.12))`, mask-composite exclude.
- Hover overlay on side card: bg `rgba(0,0,0,.3)` + centered "Explore" button (§3.4), `opacity 0 → 1`, `transition .18s cubic-bezier(.23,1,.32,1)`.

### 7.4 Sidebar icon tiles (24×24, radius 8)
Layers: (1) gradient bg + `--sh-tile`, (2) `linear-gradient(0deg, rgba(0,0,0,0), rgba(255,255,255,.2))` `mix-blend-mode:overlay`, (3) `linear-gradient(0deg, rgba(0,0,0,0), rgba(255,255,255,.32))` `mix-blend-mode:hard-light`, (4) border `1px solid rgba(197,197,197,.24)`, (5) 18px white-gradient glyph.

| Item | Gradient (135deg, 3.87% → 93.45%) |
|---|---|
| Home | `#222221 → #3B3C3A` |
| My generations | `#51E2E0 → #125C8D` |
| My elements | `#4188BE → #0E2772` |
| My favorites | `#E251B4 → #8D1237` |
| Community | `#A5A5A5 → #3D3D3D` |

Folder/project icon tile: 24×24 radius 8, bg `rgba(255,255,255,.05)`, `--sh-chip-inset`, logo glyph `rgba(255,255,255,.15)` scaled 1.2.

---

## 8. Layout

### 8.1 App shell
```
body: bg #131416 (html #0F1113), overflow hidden, height 100%
 └ shell: display:flex; gap:4px; padding:4px  (padding 0 on mobile)
    ├ Sidebar   — width 320px (resizable 231–320, collapsed 52), radius 16, border 1px rgba(255,255,255,.05), bg #131416
    └ Main      — flex 1, radius 16, border 1px rgba(255,255,255,.05), bg #131416, overflow-y:auto (scrollbar hidden)
```
- Sidebar blocks (top→bottom): sticky header (min-h 52, px 8 py 8, bg `#131416`, space switcher + collapse btn) → primary nav (px 8, gap 2) → Projects list (section label, search/sort, "New project", folder rows 36px) → "All projects" footer (sticky bottom, bg `#131416`, with 64px fade gradient above) → account block (border-top `1px rgba(255,255,255,.05)`, padding 8; Pricing link, account + bell).
- Fade gradients: `linear-gradient(to bottom, #131416, transparent)` (top) / reversed (bottom), height 64, inset-x 8, shown only when content is scrolled.
- Sidebar resize handle: 12px hit area at the right edge; visible line `1px`, `linear-gradient(to bottom, transparent 0, rgba(255,255,255,.2) 18%, rgba(255,255,255,.2) 82%, transparent)`, shown on hover; cursor `ew-resize`.
- Split-view divider: 1px `rgba(255,255,255,.05)` → hover `rgba(255,255,255,.15)`, cursor `col-resize`.

### 8.2 Home page vertical rhythm
1. Hero block: padding-top 54px → carousel → 40px gap → H1.
2. Composer block: padding-inline 12px, padding-bottom 20px.
3. "My projects": container `max-width:1440px`, padding-inline `clamp(1rem, 100cqw - 46rem, 2rem)`, gap 32px, section gap 16px, heading px 8.

### 8.3 Composer (video generation panel)
```
[ mode rail 72w ] [ panel (flex 1, radius 24, bg #1C1E20, padding 4) ]
                    └ inner area (radius 20, bg rgba(255,255,255,.05), padding 12, min-h 108)
                        ├ prompt editor (flex 1, px 4)
                        └ toolbar row (h 28, gap 4): [+ | ◎] [model chip] [scrollable chips…]      [ GENERATE 120×80 ]
```
- Width `min(100%, 876px)` (max 1140). Total height 116.
- Collapsed/mobile morph: single bar radius 20, bg `#1C1E20`, padding 4, inner radius 16 bg `rgba(255,255,255,.05)`, prompt-preview text left, 36px compact generate on right.

### 8.4 Mobile (< 768px)
- Sidebar hidden; bottom nav (sticky, `padding: 4px 4px calc(4px + env(safe-area-inset-bottom))`, `border-top:1px solid rgba(255,255,255,.03)`), background glow: `inset:-72px … ; height:180px; filter:blur(36px)`, inner `linear-gradient(in oklab, rgba(19,21,23,.8), rgba(3,3,4,.8) 71%)` + `backdrop-filter:blur(4px)`.
- Shell padding 0.

---

## 9. Feedback components

### 9.1 Toast (Sonner-based "q-sonner")
- Width 28rem (448px), padding 16, gap 8, bg `#1C1E20`, border `2px solid rgba(217,217,217,.04)`, radius 8 (default), shadow `--sh-toast`.
- Title 14/… semi-bold white; icon 24px; close button 24×24 radius 6 bg `rgba(255,255,255,.10)` hover `.20`, icon 12px, always visible.
- Position: top-right under header (`top:68px`, `+ 48px` when promo bar open), `z-index` above everything (toast layer), pointer-events only on toasts.
- Library fallback colours (Sonner dark): normal bg `#000` / border `hsl(0 0% 20%)`; success `hsl(150 100% 6%)`/text `hsl(150 86% 65%)`; info `hsl(215 100% 6%)`/`hsl(216 87% 65%)`; warning `hsl(64 100% 6%)`/`hsl(46 87% 65%)`; error `hsl(358 76% 10%)`/`hsl(358 100% 81%)`.

### 9.2 Top loading bar
`position:fixed; top:env(safe-area-inset-top); left:0; right:0; height:2px; z-index:9999; pointer-events:none` — fill `var(--brand)` with `box-shadow:0 0 8px var(--brand)`; width animates 0→100%.

### 9.3 Progress ring (avatar credits)
SVG 24×24, circles `r=11`, stroke 2, track `#575757`-ish grey, value stroke `#D1FE17`, `stroke-linecap:round`, `stroke-dasharray:69.115` (2πr), rotated -90°, `transition: all .5s`. Avatar inside: 16×16 circle, `object-fit:cover`.

### 9.4 Drawer (Vaul bottom sheet)
Handle 32×5 radius 1rem `#E2E2E4` opacity .7 (→1 on hover/active); slide in 500ms `cubic-bezier(.32,.72,0,1)`.

---

## 10. Elevation & z-index cheat sheet

| Layer | Treatment |
|---|---|
| Page | `#0F1113` / `#131416` flat |
| Panel (sidebar, main) | `#131416`, 1px `rgba(255,255,255,.05)`, radius 16, no shadow |
| Raised surface (composer, rail) | `#1C1E20`, shadow `--sh-rail` or none |
| Inner field on surface | `rgba(255,255,255,.05)` radius 20 |
| Chip on field | `rgba(255,255,255,.05)` radius 8 (hover .10) |
| Glass tile | `rgba(255,255,255,.08)` + `--sh-glass` + glass border |
| Featured media | `--sh-hero-card` + gradient ring |
| Primary CTA | `--sh-brand-btn` |
| Menus/popups | z-index 100 · Toasts 9999 · Loading bar 9999 · Sticky sidebar header 30 · Promo/header 3 |

---

## 11. Motion rules
- Color/background hover: `150–200ms cubic-bezier(.4,0,.2,1)`.
- Press: `scale(.96)` for icon buttons, `.99` for cards, `brightness(.8)` for lime buttons, `opacity .6 + translateY(2px)` for mobile nav.
- Pop-in (Explore button, hover reveal): `180ms cubic-bezier(.23,1,.32,1)`.
- Collapse/expand: grid-rows `0fr↔1fr` + opacity, 180–300ms.
- Carousel: transform + opacity (GPU: `will-change:transform; backface-visibility:hidden`).
- Respect `prefers-reduced-motion` (`motion-reduce:transition-none`).

---

## 12. Icons
- 24×24 viewBox, stroke icons `stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round`, color `currentColor`.
- Rendered at **16px** inside chips/buttons, **18px** inside gradient tiles, **20px** in mobile nav, **24px** for emphasis.
- Colors: default `#898A8B`, hover/active `#FFFFFF`, brand `#D1FE17`, on-lime `#131517`.
- Brand logo mark: single glyph filled with `currentColor` (placeholder watermark uses white 5%).

---

## 13. Quick component → recipe index (for the agent)

| Need | Use |
|---|---|
| Main CTA | §3.1 `.btn-generate` (hero) / §3.2 (compact) / §3.4 (marketing "Explore") |
| Secondary action | Chip §3.7 |
| Tertiary / toolbar | Icon button §3.6 |
| Sidebar link | Nav row §3.6 + tile §7.4 |
| Segmented switch | Mode tab §3.8 |
| Text field | §5.1 / §5.2 |
| Dropdown | Trigger §6.1 + Menu §6.2 |
| Card | §7.1 / §7.2 / §7.3 |
| Badge / promo | §4 |
| Toast | §9.1 |

---

## 14. Rules for the agent (do / don't)
**Do**
- Keep the canvas dark (`#131416` / `#1C1E20`); build all fills from white-alpha overlays.
- Use lime `#D1FE17` ONLY for the primary action, the highlighted model, progress, and the loading bar.
- Put dark text (`#131517` / `#1A1A1A`) on lime.
- Use Space Grotesk only for hero headline, GENERATE, badges.
- Keep radii consistent with §1.1; nest radii (24 → 20 → 8).

**Don't**
- Don't use pure black panels or grey hex fills; don't add borders heavier than 1px (toasts 2px, lime button inner edge only).
- Don't use lime for body links or large backgrounds.
- Don't use Space Grotesk for body copy.
- Don't add light-mode colors (theme is dark-only: `color-scheme: dark only`).
