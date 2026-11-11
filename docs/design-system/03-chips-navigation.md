# 03 — Chips & Navigation

States: Default · Hover · Pressed · Focus · Disabled **[figma]**. Chips live on `--bg-surface` / composer; fill steps are 5% → 10% → 20%.

```css
.chip{
  display:inline-flex; align-items:center; gap:4px; height:var(--h-chip); padding:4px 8px;
  border:0; border-radius:var(--r-sm); cursor:pointer; white-space:nowrap;
  background:var(--overlay-5); color:var(--text-primary); font:500 12px/18px var(--font-ui);
  transition:background-color var(--t-base), color var(--t-fast), opacity var(--t-fast);
}
.chip svg{ width:16px; height:16px; flex:none }
.chip:hover{ background:var(--state-hover) }
.chip:active{ background:var(--state-pressed) }
.chip:focus-visible{ background:var(--overlay-5) }                         /* + global white ring R8 */
.chip[aria-expanded="true"],.chip[data-popup-open]{ background:var(--state-hover) }
```

## 1. Setting chip  `H28 · R8 · 12/18 medium`  e.g. "16:9 ⌄", "10s"
| State | bg | fg |
|---|---|---|
| Default | 5% | white, chevron-down 16 white |
| Hover | 10% | white |
| Pressed | 20% | white |
| Focus | 5% + white ring R8 | white |
| Disabled | 5%, opacity .5 | white |

## 2. Highlighted model  `H28 · brand text + icon`
Same as chip, but label + leading icon = `--brand`; trailing chevron 20px white → `--brand` on hover.
| State | bg | fg |
|---|---|---|
| Default | 5% | `--brand` |
| Hover | 10% | `--brand` (chevron brand) |
| Pressed | 20% | `--brand` |
| Focus | 5% + white ring | `--brand` |
| Disabled | 5%, opacity .5 → olive | `--brand` |
```css
.chip--model{ color:var(--brand); gap:0 } .chip--model .label{ padding:0 4px }
.chip--model .chev{ width:20px; height:20px; color:var(--text-primary) } .chip--model:hover .chev{ color:var(--brand) }
```

## 3. Icon-only chip  `28 × 28 · R8`
`.chip--icon{ width:28px; padding:0; justify-content:center }` — same 5 states. Needs `aria-label`.

## 4. Dropdown chip  `H28 · chevron 20`  e.g. "References ⌄"
`.chip--dropdown .chev{ width:20px; height:20px }` — same 5 states; open state = hover fill.

## 5. Grouped actions  `H28 · R8 · grouped icons`  (+ | image | ⌄)
```css
.chip-group{ display:inline-flex; align-items:center; height:var(--h-chip); border-radius:var(--r-sm); background:var(--overlay-5); overflow:hidden; transition:background-color var(--t-base) }
.chip-group > .chip{ background:transparent; border-radius:0; width:var(--h-chip); padding:0; justify-content:center }
.chip-group > .chip:hover{ background:var(--state-hover) } .chip-group > .chip:active{ background:var(--state-pressed) }
.chip-group > .chip:focus-visible{ outline:none }
.chip-group:focus-within{ outline:var(--focus-ring-width) solid var(--focus-ring-color) }  /* ring on whole group [figma] */
.chip-group .sep{ width:1px; height:16px; background:var(--overlay-10); transition:opacity var(--t-base) }
.chip-group:hover .sep{ opacity:0 }
.chip-group[aria-disabled="true"]{ opacity:var(--disabled-opacity); pointer-events:none }
```
| State | Rule |
|---|---|
| Default | group bg 5%, glyphs white, 1×16 separators 10% |
| Hover | hovered item bg 10%; separators fade out |
| Pressed | hovered item bg 20% |
| Focus | white 1.5px ring around the WHOLE group |
| Disabled | group opacity .5 |

## 6. Mode tab  `64 × 52 · R20`  (Image | Video)
Icon 16 + label 10/12 **700**, column, gap 4, padding `6px 12px`.
| State | bg | fg |
|---|---|---|
| Default | transparent | `--text-secondary` |
| Hover | transparent | `--text-primary` |
| Pressed | 10% | white |
| **Selected** | 5% | white |
| Focus | 5% + white ring R20 | white |
| Disabled | transparent, opacity .5 | secondary |
```css
.mode-tab{ width:64px; height:52px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:6px 12px;
  border:0; border-radius:var(--r-2xl); background:transparent; color:var(--text-secondary); font:700 10px/12px var(--font-ui); cursor:pointer;
  transition:background-color var(--t-base), color var(--t-fast) }
.mode-tab:hover{ color:var(--text-primary) }
.mode-tab:active{ background:var(--overlay-10); color:var(--text-primary) }
.mode-tab[aria-selected="true"]{ background:var(--overlay-5); color:var(--text-primary) }
.mode-tab:focus-visible{ background:var(--overlay-5); color:var(--text-primary) }
.mode-rail{ width:72px; padding:4px; display:flex; flex-direction:column; gap:2px; border-radius:var(--r-3xl); background:var(--bg-surface); box-shadow:var(--sh-rail) }
```
Optional sliding indicator: absolutely positioned 52px-high bg 5% R20, `transform:translateY(n*56px)`, `transition:transform var(--t-base)`; then tabs stay transparent.

## 7. Mobile nav item  `64 × 52 · icon 20 + label`
| State | Rule |
|---|---|
| Default | fg `--text-secondary` |
| Hover | fg white |
| Pressed | fg white, `opacity:.6`, `translateY(2px)` |
| **Active page** | fg white (`aria-current="page"`) |
| Focus | white ring R12, fg white |
| Disabled | opacity .5 |
```css
.nav-m{ width:64px; height:52px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; border-radius:var(--r-lg);
  color:var(--text-secondary); font:500 10px/14px var(--font-ui); background:transparent; border:0; transition:color var(--t-fast), opacity var(--t-fast), transform var(--t-fast) }
.nav-m svg{ width:20px; height:20px }
.nav-m:hover,.nav-m[aria-current="page"]{ color:var(--text-primary) }
.nav-m:active{ opacity:.6; transform:translateY(2px) }
```
Bar container: 5 columns, `padding:4px 4px calc(4px + env(safe-area-inset-bottom))`, top border `1px solid var(--overlay-3)`, backdrop = `linear-gradient(rgba(19,21,23,.8), rgba(3,3,4,.8) 71%)` + `backdrop-filter:blur(4px)`. Center slot = Mobile create button (`01`).

## 8. Create tile  `card action · focus ring`  ("+ New project")
Compact tile ≈ 140 × 72, column, gap 4, icon 24 + label 14/20 500.
| State | bg | fg |
|---|---|---|
| Default | 5% | white |
| Hover | 10% | white |
| Pressed | 20% | white |
| Focus | 5% + white ring R12 | white |
| Disabled | 5%, opacity .5 | white |
```css
.tile-create{ min-width:140px; height:72px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
  border:0; border-radius:var(--r-lg); background:var(--overlay-5); color:var(--text-primary); font:500 14px/20px var(--font-ui); cursor:pointer;
  transition:background-color var(--t-base) }
.tile-create:hover{ background:var(--state-hover) } .tile-create:active{ background:var(--state-pressed) }
.tile-create svg{ width:24px; height:24px }
```
For the 16:9 "Create new project" card in a project grid see `06-cards.md`.
