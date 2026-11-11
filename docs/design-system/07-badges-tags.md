# 07 — Badges, Tags & Promo

Static (non-interactive) unless wrapped in a button/link → then use the states of the wrapper (`02`).

## 1. Pink skewed badge ("30% OFF")  [captured]
```css
.badge-pink{ display:inline-block; transform:skewX(-10.7deg); pointer-events:none }
.badge-pink .surface{ display:flex; align-items:center; height:15px; padding:0 6px; border-radius:2px;
  background:radial-gradient(39.43% 136.54% at 51.64% 117.31%, var(--pink-300) 0%, var(--pink-400) 50%, var(--pink-500) 100%) }
.badge-pink .label{ font:700 12px/15px var(--font-display); color:var(--text-primary); text-transform:uppercase; white-space:nowrap; transform:skewX(10.7deg) }
```
Inline mini variant (inside "Pricing" link): `font:500 10px/20px var(--font-ui)` text "-30%", shown only on narrow widths.
Parent "Pricing" link: bg `--pink-tint-6`, R12, 14/20 500, letter-spacing .1px → states: hover bg `rgba(255,0,91,.12)` *(derived)*, pressed `.18`, focus white ring, disabled .5.

## 2. "Special offer" tag  [captured]
`padding:4px 8px 4px 6px; gap:6px; border-radius:var(--r-sm); border:1.1px solid var(--overlay-5); box-shadow:var(--sh-promo-tag); font:600 12px/16px var(--font-ui); color:#fff`
bg = `radial-gradient(70% 200% at 73% 50%, rgba(29,99,239,.6) 0%, rgba(81,80,208,.45) 25%, rgba(133,60,176,.3) 50%, rgba(237,21,114,0) 100%), radial-gradient(25% 42% at 85% 37%, rgba(255,255,255,.6) 0%, rgba(255,255,255,0) 100%), linear-gradient(90deg, var(--blue-promo), var(--blue-promo))`. Leading icon 16px white.

## 3. Promo bar (top)  [captured]
```css
.promo-bar{ min-height:48px; padding:8px 16px; display:flex; align-items:center; justify-content:space-between; gap:16px;
  background:linear-gradient(90deg,#4B4B4B 0%,#000 50%,#4B4B4B 100%); background-blend-mode:color-dodge;
  border-bottom:1px solid rgba(255,255,255,.2); color:var(--text-on-promo); font:600 14px/20px var(--font-ui) }
```
Contains: Special-offer tag + message + **Promo pill** (`01 §5`) + close icon button (28×28, R8, stroke 1.5).
Dismiss/collapse: wrapper `display:grid; grid-template-rows:1fr→0fr; transition:grid-template-rows var(--t-panel)`; when open, toasts offset +48px.

## 4. Status badges  [derived]
`height:20px; padding:0 8px; border-radius:var(--r-xs); font:500 12px/16px var(--font-ui); display:inline-flex; align-items:center; gap:4px`
| Variant | bg | fg |
|---|---|---|
| Neutral | `--overlay-10` | `--text-primary` |
| Brand | `--brand` | `--text-on-brand` |
| Success | `--success-bg` | `--success` |
| Warning | `--warning-bg` | `--warning` |
| Danger | `--danger-bg` | `--danger` |
| Info | `--info-bg` | `--info` |
Dot variant: 6px dot `currentColor` before text.

## 5. Counter / credits  [captured]
Sparkle icon 12px + number 12/16 500 (inherits color). In Generate button: `--text-on-brand`.
