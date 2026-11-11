# 08 — Feedback

## 1. Toast (Sonner-style)  [captured + derived variants]
```css
.toast{ width:min(28rem,calc(100vw - 32px)); display:flex; gap:8px; padding:16px; border-radius:var(--r-sm);
  background:var(--bg-surface); border:2px solid var(--border-brand-btn); box-shadow:var(--sh-toast); color:var(--text-primary) }
.toast .title{ font:600 14px/20px var(--font-ui) } .toast .desc{ font:400 14px/20px var(--font-ui); color:var(--text-secondary) }
.toast .icon{ width:24px; height:24px; flex:none }
.toast .close{ width:24px; height:24px; border-radius:var(--r-xs); background:var(--overlay-10); color:var(--text-primary); display:grid; place-items:center; opacity:1 }
.toast .close:hover{ background:var(--overlay-20) } .toast .close svg{ width:12px; height:12px }
.toast-viewport{ position:fixed; top:68px; right:16px; left:16px; display:flex; justify-content:flex-end; z-index:var(--z-toast); pointer-events:none; transition:top var(--t-panel) }
body:has(.promo-bar[data-open="true"]) .toast-viewport{ top:116px }
.toast{ pointer-events:auto }
```
| Variant | Icon color | Accent |
|---|---|---|
| Default | `--text-primary` | none |
| Success | `--success` | optional left 2px `--success` |
| Error | `--danger` | border `--danger` |
| Warning | `--warning` | |
| Info | `--info` | |
| Loading | spinner 20px | |
States: enter = slide from right 300ms; hover pauses timer; swipe right to dismiss; close button always visible; action button inside = Chip (`03`).

## 2. Top loader  [captured]
`position:fixed; top:env(safe-area-inset-top); inset-inline:0; height:2px; z-index:var(--z-loader); pointer-events:none` — fill `background:var(--brand); box-shadow:0 0 8px var(--brand); width:0→100%; opacity 0→1→0`.

## 3. Progress ring (avatar credits)  [captured]
SVG 24×24, circles `r=11 cx=12 cy=12 stroke-width=2 fill=none`, track `--text-secondary` @ .4 opacity, value `stroke:var(--brand); stroke-linecap:round; stroke-dasharray:69.115; stroke-dashoffset: calc(69.115 * (1 - p))`, rotate -90°, `transition:stroke-dashoffset .5s`. Avatar 16px circle centered (`object-fit:cover`).

## 4. Spinner  [derived]
16/20/24px, `border:2px solid var(--overlay-20); border-top-color:currentColor; border-radius:50%; animation:spin .7s linear infinite`.

## 5. Skeleton → see `06-cards.md §5`.

## 6. Empty state  [derived]
Centered column, gap 12: icon tile 48 (`--overlay-5`, R12, `--sh-chip-inset`), title 16/24 600 white, description 14/20 `--text-secondary` (max 320px), optional Marketing button.

## 7. Drawer / bottom sheet (Vaul)  [captured]
Handle 32×5, R16, `#E2E2E4` @ .7 (→1 hover/active); slide-in 500ms `cubic-bezier(.32,.72,0,1)`; surface `--bg-surface`, top radius 24.
