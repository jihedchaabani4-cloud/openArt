# 05 — Dropdown & Menu

Triggers = **[captured/figma]** (they are the chips/quiet buttons already defined). Menu panel + items are **[derived]** (the open menu was not in the capture) — built from the same tokens.

## Triggers (`aria-haspopup="menu"`, `aria-expanded`, `data-popup-open`)
| Trigger | Component | Open state |
|---|---|---|
| Composer settings (ratio, duration, references, model) | Chip (`03`) | bg 10%, chevron rotates 180° |
| Sort / row "⋯" | Toolbar icon / Close-row (`02`) | bg 10%, icon white |
| Account / Space switcher | Quiet row (`02`) | bg 10% |
| Language selector | Text button 14/20 400 `--text-body`, flag 20px circle (`--bg-surface`), chevron 16 | color `--text-footer` |
| Select field | Field (`04`) | focus ring |
Chevron: `transition:transform var(--t-pop)`; open → `transform:rotate(180deg)`. (Space switcher uses a 2-segment chevron that flips with `scaleY(-1)` and `cubic-bezier(.77,0,.175,1)` 180ms.)

## Menu panel
```css
.menu{
  min-width:200px; max-width:320px; padding:4px; z-index:var(--z-menu);
  background:var(--bg-surface); border:1px solid var(--border-default); border-radius:var(--r-lg); box-shadow:var(--sh-menu);
  transform-origin:var(--origin,top left); animation:menu-in 140ms cubic-bezier(.23,1,.32,1);
}
@keyframes menu-in{ from{ opacity:0; transform:scale(.98) } to{ opacity:1; transform:scale(1) } }
```
Placement: 4px gap from trigger, flips when no space, `max-height:min(360px, 60vh)` with `overflow:auto; scrollbar-width:none`.

## Menu item  `H36 · R8 · 14/20 medium`
| State | bg | fg | Extra |
|---|---|---|---|
| Default | transparent | `--text-primary` | icon 16–20 `--text-secondary` |
| Hover / Highlighted (`data-highlighted`, keyboard arrows) | 5% | white | icon white |
| Pressed | 10% | white | |
| Selected (`aria-checked/selected`) | 10% | white | trailing check 16 white |
| Focus-visible | 5% + white ring R8 inside (`outline-offset:-1.5px`) | white | |
| Disabled | transparent | opacity .5 | `pointer-events:none` |
| Danger | as default | `--danger` | hover bg `--danger-bg` |
```css
.menu-item{ display:flex; align-items:center; gap:8px; height:var(--h-row); padding:0 10px; border-radius:var(--r-sm); font:500 14px/20px var(--font-ui);
  color:var(--text-primary); cursor:pointer; user-select:none; transition:background-color var(--t-fast) }
.menu-item:hover,.menu-item[data-highlighted]{ background:var(--overlay-5) }
.menu-item:active{ background:var(--overlay-10) }
.menu-item[aria-checked="true"],.menu-item[aria-selected="true"]{ background:var(--overlay-10) }
.menu-item:focus-visible{ outline-offset:-1.5px }
.menu-item .icon{ width:16px; height:16px; color:var(--text-secondary) } .menu-item:hover .icon{ color:var(--text-primary) }
.menu-item .check{ margin-left:auto }
.menu-item--danger{ color:var(--danger) } .menu-item--danger:hover{ background:var(--danger-bg) }
.menu-sep{ height:1px; margin:4px 6px; background:var(--border-subtle) }
.menu-label{ padding:6px 10px; font:500 12px/16px var(--font-ui); color:var(--text-tertiary) }
```
Item with description: second line 12/16 `--text-tertiary`, item height auto (min 44).
Shortcut hint: right-aligned 12/16 `--text-tertiary`.

## Inline expand (Space-switcher pattern)  [captured]
Closed content collapses with `display:grid; grid-template-rows:0fr → 1fr; opacity:0 → 1; transition:180ms ease-out`. Items = 36px quiet rows (`02`), `mt:2px`.

## Typeahead / listbox
Same panel; `role="listbox"`, items `role="option"`; layer `z-index:100`.

## Keyboard
↑/↓ move highlight · Enter/Space select · Esc close + return focus to trigger · Tab closes · typeahead jumps.
