# 09 — Overlays & Controls  (ALL [derived] — not in the capture)

Built from the same tokens. Mark `/* derived */`. Each has Default · Hover · Pressed · Focus · Disabled (+ checked states).

## Tooltip
`padding:6px 8px; border-radius:var(--r-sm); background:var(--bg-surface); border:1px solid var(--border-default); box-shadow:var(--sh-menu); font:500 12px/16px var(--font-ui); color:var(--text-primary); max-width:240px; z-index:var(--z-menu)`. Delay 400ms in / 0 out; shortcut hint `--text-tertiary`.

## Modal / Dialog
```css
.modal-backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.6); backdrop-filter:blur(4px); z-index:var(--z-menu) }
.modal{ width:min(480px,calc(100vw - 32px)); padding:24px; border-radius:var(--r-3xl); background:var(--bg-surface); border:1px solid var(--border-default); box-shadow:var(--sh-modal) }
.modal h2{ font:600 16px/24px var(--font-ui) } .modal p{ font:400 14px/20px var(--font-ui); color:var(--text-secondary) }
.modal-actions{ display:flex; justify-content:flex-end; gap:8px; margin-top:24px }
```
Actions: primary = Marketing/Pill lime variant (`01`), secondary = Chip-style button (`03`), destructive = quiet + `--danger`. Close = `qa-icon-24--close` top-right. Esc / backdrop closes; focus trapped; return focus on close.

## Checkbox  `16×16 · R4`
| State | Box | Mark |
|---|---|---|
| Default | `border:1.5px solid var(--text-secondary)`, bg transparent | – |
| Hover | border white, bg `--overlay-5` | – |
| Pressed | bg `--overlay-10` | – |
| Checked / Indeterminate | bg `--brand`, border `--brand` | check/dash `--text-on-brand` |
| Focus | white ring offset 2px | – |
| Disabled | opacity .5 | – |
| Error | border `--danger` | – |
Label 14/20 500 white, gap 8.

## Radio  `16×16 · circle` — same as checkbox; checked = `--brand` border + 6px `--brand` dot.

## Switch  `36×20 · track R full · thumb 16`
| State | Track | Thumb |
|---|---|---|
| Off | `--overlay-10` | white |
| Off hover | `--overlay-20` | white |
| On | `--brand` | `--text-on-brand` |
| On hover | `--brand` brightness .9 | same |
| Pressed | thumb width 20 (stretch) | |
| Focus | white ring offset 2px | |
| Disabled | opacity .5 | |
Thumb slide `transform:translateX(16px)` `--t-pop`.

## Tabs (underline/segment)  [derived]
Segmented: container `--bg-surface` R12 padding 4; tab = Mode-tab logic horizontally (H32, R8, 14/20 500). Underline tabs not used in this system — prefer segmented.

## Slider  `track 4px, thumb 16`
Track `--overlay-10`, fill `--brand`, thumb white with `--sh-tile`; hover thumb `scale(1.1)`; focus white ring on thumb; disabled .5.
