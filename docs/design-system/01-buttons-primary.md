# 01 — Primary Actions (lime)

Tokens: `tokens.css`. States: Default · Hover · Pressed · Focus · Disabled (see `00-README.md`).
Tags: **[figma]** state grid · **[captured]** live CSS.

All lime buttons share this base. Text/icons are ALWAYS `--text-on-brand` (#131517) (`--text-on-promo` #1A1A1A for Marketing).

```css
.btn-brand{
  position:relative; isolation:isolate; overflow:hidden;
  display:inline-flex; align-items:center; justify-content:center;
  border:0; cursor:pointer; background:var(--brand); color:var(--text-on-brand);
  transition:filter var(--t-base), opacity var(--t-base), transform var(--t-pop);
}
.btn-brand:hover{ filter:brightness(.9) }                    /* ≈ #BCE515 */
.btn-brand:active{ filter:brightness(.8) }                   /* ≈ #A7CB12 */
.btn-brand:focus-visible{                                    /* [figma] lime gets a light ring, brighter fill */
  filter:brightness(1.05);
  outline:var(--focus-ring-width) solid var(--focus-ring-brand); outline-offset:2px;
}
.btn-brand:disabled,.btn-brand[aria-disabled="true"]{ opacity:var(--disabled-opacity-brand) } /* olive look, shadow fades with it */
```
> Focus on lime is subtle in Figma (brighter fill + light edge). If Figma shows no ring, delete the `outline` line and keep `brightness(1.05)`.

---

## 1. Generate · hero  `120 × 80 · R12 · 12/18 bold`
| State | Fill | Shadow | Label | Notes |
|---|---|---|---|---|
| Default | `--brand` | `--sh-brand-btn` | Space Grotesk 12/18 700 UPPER `--text-on-brand`, `text-shadow:0 0 8px rgba(255,255,255,.45)` | credits row below: sparkle 12px + number, 12/16 500 |
| Hover | `brightness(.9)` | same | same | |
| Pressed | `brightness(.8)` | same | same | |
| Focus | `brightness(1.05)` + ring (see base) | same | same | |
| Disabled | opacity .4 | same (faded) | same | `cursor:not-allowed` |

```css
.btn-generate-hero{
  width:120px; height:80px; padding:14px 24px 16px; border-radius:var(--r-lg);
  flex-direction:column; gap:0; box-shadow:var(--sh-brand-btn);
  font:700 12px/18px var(--font-display); text-transform:uppercase; text-shadow:0 0 8px rgba(255,255,255,.45);
}
.btn-generate-hero .credits{display:flex;gap:2px;align-items:center;font:500 12px/16px var(--font-display);text-transform:none}
.btn-generate-hero::before{ /* glow */
  content:""; position:absolute; left:39px; top:36px; width:76px; height:136px; border-radius:50%;
  background:var(--brand-glow); filter:blur(41.5px); transform:rotate(102.79deg) skewX(.89deg);
  mix-blend-mode:plus-lighter; pointer-events:none; z-index:-1;
}
.btn-generate-hero::after{ /* inner bottom hairline */
  content:""; position:absolute; inset:0; border-radius:14px; border-bottom:2.2px solid var(--border-brand-btn); pointer-events:none;
}
```
```html
<button class="btn-brand btn-generate-hero"><span>Generate</span><span class="credits"><svg width="12" height="12"/>30</span></button>
```

## 2. Generate · compact  `36 × 36 · R10 · icon 16`
| State | Fill | Notes |
|---|---|---|
| Default | `--brand`, border `1.5px solid --border-brand-btn`, `--sh-brand-compact` | sparkle 16px `--text-on-brand` |
| Hover | brightness .9 | |
| Pressed | brightness .8 | |
| Focus | brightness 1.05 + ring | |
| Disabled | opacity **.5** | |
```css
.btn-generate-compact{ width:36px; height:36px; border-radius:var(--r-md); border:1.5px solid var(--border-brand-btn); box-shadow:var(--sh-brand-compact) }
.btn-generate-compact::before{ content:""; position:absolute; left:50%; top:28px; width:48px; height:64px; margin-left:-24px; border-radius:50%;
  background:var(--brand); filter:blur(16px); transform:rotate(102.79deg) skewX(.89deg); mix-blend-mode:plus-lighter; pointer-events:none; z-index:-1 }
```
Holder (optional): `padding:2px; background:var(--overlay-5); border-radius:var(--r-lg)`.

## 3. Mobile create  `66 × 44 · R12 · icon 24`
| State | Rule |
|---|---|
| Default | `--brand`, `box-shadow:var(--sh-brand-mobile)`, `filter:drop-shadow(0 32px 12px rgba(0,0,0,.15))`, icon 24px `#2F3907` (4-point star) |
| Hover | brightness .9 |
| Pressed | brightness .8 + `translateY(2px)` |
| Focus | ring (base) |
| Disabled | opacity .4 |
```css
.btn-mobile-create{ width:66px; height:44px; border-radius:var(--r-lg); box-shadow:var(--sh-brand-mobile); filter:drop-shadow(0 32px 12px rgba(0,0,0,.15)); overflow:visible }
.btn-mobile-create:active{ transform:translateY(2px) }
```
(Because it has its own `filter`, apply hover/pressed brightness by chaining: `filter:drop-shadow(...) brightness(.9)`.)

## 4. Marketing primary  `H40 · R10 · 14/16 medium`
| State | Rule |
|---|---|
| Default | bg `linear-gradient(180deg,rgba(255,255,20,0),var(--brand-yellow)), var(--brand)`; `--sh-marketing-btn`; text `--text-on-promo` 14/16 500; trailing arrow-up-right 16px; padding `0 14px 0 16px`; gap 8 |
| Hover | brightness .9 |
| Pressed | brightness .8 |
| Focus | ring (base) |
| Disabled | opacity .4 |
| Reveal variant | inside a media card: rest `scale(.95)`, parent hover/focus → `scale(1)` (`--t-pop`) |
```css
.btn-marketing{ height:var(--h-btn-md); padding:0 14px 0 16px; gap:8px; border-radius:var(--r-md);
  background:linear-gradient(180deg,rgba(255,255,20,0) 0%,var(--brand-yellow) 100%), linear-gradient(90deg,var(--brand),var(--brand));
  color:var(--text-on-promo); font:500 14px/16px var(--font-ui); box-shadow:var(--sh-marketing-btn); overflow:visible }
.btn-marketing--reveal{ transform:scale(.95) }
.group:hover .btn-marketing--reveal,.group:focus-within .btn-marketing--reveal{ transform:scale(1) }
```

## 5. Promo pill  `H32 · full radius · dark`
Dark button used on lime/colored promo bars and as a quiet CTA.
| State | Fill | Text | Ring |
|---|---|---|---|
| Default | `--bg-root` (#0F1113; on lime bar use `--bg-page`) | `--text-primary` 14/16 500 | none |
| Hover | `--bg-surface` | same | none |
| Pressed | `#26282A` *(derived: surface + 10% white)* | same | none |
| Focus | transparent | same | **1.5px solid white** pill |
| Disabled | `--bg-root` | opacity .4 (text looks grey) | none |
```css
.btn-pill{ height:var(--h-btn-sm); padding:0 14px; border:0; border-radius:var(--r-full); background:var(--bg-root); color:var(--text-primary);
  font:500 14px/16px var(--font-ui); cursor:pointer; transition:background-color var(--t-base) }
.btn-pill:hover{ background:var(--bg-surface) }
.btn-pill:active{ background:#26282A }
.btn-pill:focus-visible{ background:transparent }
.btn-pill:disabled{ opacity:var(--disabled-opacity-brand) }
```

## Variant API suggestion
`<Button variant="generate-hero | generate-compact | mobile-create | marketing | pill" disabled loading />` — `loading` replaces label/icon with a 16px spinner (`--text-on-brand`), keeps size, sets `aria-busy`.

## Don't
- Don't use two lime buttons in the same view region. One primary per screen area.
- Don't recolor lime; don't put white text on lime.
