# 06 — Cards

States: Default · Hover · Pressed · Focus · Disabled/Loading. Tags [captured]/[figma].

## 1. Project card (grid)  [captured]
Grid: `display:grid; grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr)); gap:16px`.
```css
.card-project{ display:flex; flex-direction:column; gap:4px; width:100%; padding:4px 4px 6px; border-radius:var(--r-xl); background:transparent; cursor:pointer; text-align:left;
  transition:background-color var(--t-base), scale var(--t-base) }
.card-project:hover{ background:var(--overlay-5) }
.card-project:active{ scale:.99; background:var(--overlay-10) }
.card-project:focus-visible{ background:var(--overlay-5) }          /* + global white ring R16 */
.card-project[aria-disabled="true"]{ opacity:var(--disabled-opacity); pointer-events:none }
.card-project .thumb{ position:relative; aspect-ratio:16/9; border-radius:var(--r-lg); overflow:hidden; background:var(--overlay-5) }
.card-project .thumb::after{ content:""; position:absolute; inset:0; border-radius:inherit; padding:1px; pointer-events:none;
  background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.11));
  -webkit-mask:linear-gradient(#fff 0 0) content-box exclude, linear-gradient(#fff 0 0); mask:linear-gradient(#fff 0 0) content-box exclude, linear-gradient(#fff 0 0) }
.card-project .meta{ display:flex; align-items:center; gap:4px; padding:4px 8px }
.card-project .title{ flex:1; min-width:0; font:500 14px/16px var(--font-ui); color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.card-project .sub{ display:flex; align-items:center; gap:4px; font:400 12px/16px var(--font-ui); color:var(--text-tertiary) }
.card-project .row-action{ width:0; opacity:0; overflow:hidden; transition:width var(--t-pop), opacity var(--t-pop) }
.card-project:hover .row-action,.card-project:focus-within .row-action,.card-project:has([data-popup-open]) .row-action{ width:24px; opacity:1 }
```
| State | bg | Extra |
|---|---|---|
| Default | transparent | thumb 16:9 R12 + 1px gradient ring |
| Hover | 5% | row "⋯" action reveals |
| Pressed | 10% | `scale(.99)` |
| Focus | 5% + white ring R16 | |
| Disabled | opacity .5 | |
| Loading | thumb = skeleton (see below) | `aria-busy` |

**Empty thumbnail pattern:** big tile (flex 1) + two stacked squares, gap 8, each `--overlay-5` R12, with a rotated (-12°) brand-logo watermark `fill:--overlay-5` spanning tiles.

## 2. Create card (project grid)  [captured/figma]
Same card geometry; thumb bg `--overlay-5`, centered 58px circle: `padding:16px; border:1px solid var(--border-glass); background:var(--overlay-5); box-shadow:0 20.5px 20.5px rgba(0,0,0,.09), inset 0 -.3px 5.36px rgba(185,185,185,.35); border-radius:999px`, plus icon 24 white; label "Create new project" 14/16 500.
| State | Rule |
|---|---|
| Hover | card bg 5%; circle `scale(1.05)` |
| Pressed | card bg 10%; `scale(.99)` |
| Focus | white ring R16 |
| Disabled | opacity .5 |
(Compact version = "Create tile" in `03`.)

## 3. Hero carousel card  [captured]
Container: `position:relative; aspect-ratio:687/166; width:min(100%,687px)`. Card: `position:absolute; left:29.8156%; top:3.012%; width:40.3688%; aspect-ratio:16/9; will-change:transform; backface-visibility:hidden`.
| Position | Transform | Radius | Shadow | z |
|---|---|---|---|---|
| Active | `translate3d(0,0,0) scale(1)` | 12 | `--sh-hero-card` | 10 |
| Left | `translate3d(-64.173%,0,0) scale(.721154)` | 11.1 | `--sh-hero-card-side` | 0 |
| Right | `translate3d(64.173%,0,0) scale(.721154)` | 11.1 | `--sh-hero-card-side` | 20 |
| Off | `translate3d(142%,0,0) scale(.721154)`, `opacity:0` | – | – | – |
- Gradient ring: padding 2.6px (active) / 1.7px (side), `linear-gradient(180deg,rgba(255,255,255,.44),rgba(255,255,255,.30) 48%,rgba(255,255,255,.12))`.
- Media: `<video muted loop playsinline preload="none" poster>` `object-fit:cover`, bg `rgba(0,0,0,.2)`, top sheen `linear-gradient(to top,transparent,rgba(255,255,255,.24))` @ .6.
- **Side-card hover:** overlay `rgba(0,0,0,.3)` fades in + centered Marketing button (`01 §4`, reveal variant). **Active-card hover:** none. **Focus:** white 2px ring (`--ring-focus` strong).
- Click on a side card = bring to center (button covering the card, `aria-label="Show <title>"`).

## 4. Icon tiles (sidebar)  `24×24 · R8`
Layers: gradient bg + `--sh-tile` → overlay-blend gradient (white .2, `mix-blend-mode:overlay`) → hard-light gradient (white .32) → `1px solid --border-glass-sm` → 18px glyph.
| Tile | 135° gradient (3.87% → 93.45%) |
|---|---|
| Home | `#222221 → #3B3C3A` |
| Generations | `#51E2E0 → #125C8D` |
| Elements | `#4188BE → #0E2772` |
| Favorites | `#E251B4 → #8D1237` |
| Community | `#A5A5A5 → #3D3D3D` |
Folder/project tile: bg `--overlay-5`, `--sh-chip-inset`, logo `rgba(255,255,255,.15)`.

## 5. Skeleton  [derived]
`background:linear-gradient(90deg,var(--overlay-5) 25%,var(--overlay-10) 50%,var(--overlay-5) 75%); background-size:200% 100%; animation:sk 1.4s linear infinite; border-radius:inherit` — `@keyframes sk{to{background-position:-200% 0}}`.
