# 02 — Quiet Actions (ghost / toolbar / sidebar)

States: Default · Hover · Pressed · Focus · Disabled. Tag **[figma]**.
Shared logic: transparent (or 5% white) → hover 10% → pressed 20%; grey fg → white on hover; focus = 1.5px white ring; disabled = opacity .5.

```css
.qa{
  display:inline-flex; align-items:center; border:0; cursor:pointer; position:relative;
  background:var(--qa-bg,transparent); color:var(--qa-fg,var(--text-primary));
  font:500 14px/20px var(--font-ui);
  transition:background-color var(--t-fast), color var(--t-fast), transform var(--t-fast), opacity var(--t-fast);
}
.qa:hover{ background:var(--state-hover); color:var(--text-primary) }
.qa:active{ background:var(--state-pressed); color:var(--text-primary) }
.qa:focus-visible{ background:var(--overlay-5); color:var(--text-primary) }   /* ring comes from global focus-visible */
.qa[aria-expanded="true"],.qa[data-popup-open]{ background:var(--state-hover); color:var(--text-primary) }
```

| # | Component | Size · radius | Default | Hover | Pressed | Focus | Disabled |
|---|---|---|---|---|---|---|---|
| 1 | **Navigation row** | H36 · R12 · pad 6 · gap 8 · icon 20 | transparent, white label | bg 10% | bg 20% | ring + bg 5% | opacity .5 |
| 2 | **Sidebar action** (+ New project) | H36 · R12 · pad 6 · gap 8 · glass tile 24 | text `--text-tertiary`, glass tile icon `--text-secondary` | text white, tile icon white (no row bg) | same as hover | ring around whole row | opacity .5 |
| 3 | **Sidebar action · strong** (All projects) | H36 · R12 · trailing chevron 16 | white text, icon white, chevron `--text-secondary` | row bg 10% | bg 20% | ring + bg 5% | opacity .5 |
| 4 | **Toolbar icon** | 24×24 · R8 · icon 16 | transparent, icon `--text-tertiary` | bg 10%, icon white | bg 20% | ring | opacity .5 |
| 5 | **Close / row action** | 24×24 · R6 · icon 16 | transparent, icon `--text-secondary` | bg 10%, icon white | bg 20% | ring | opacity .5 |
| 6 | **Collapse sidebar** | 36×36 · R12 · icon 16 | bg 5%, icon `--text-tertiary` | bg 10%, icon white | bg 20% | ring + bg 5% | opacity .5 |
| 7 | **Notification** | 36×36 · circle · bell 16 | bg 5%, icon `--text-footer` | bg 10%, icon white | bg 20% | ring (circle) | opacity .5 |
| 8 | **Account action** | H36 · R12 · avatar/glyph 24 · gap 8 | transparent, white label | bg 10% | bg 20% | ring + bg 5% | opacity .5 |
| 9 | **Space switcher** | H36 · R12 · pad `0 12px 0 10px` · gap 6 | bg 5% + `--sh-switcher`, white label, folder icon, chevron | bg 10% | bg 20% | ring | opacity .5 |

> Notification differs from the live app (live = 24px inner circle inside a 36 hit area). **Follow Figma: single 36px circle.**

### Recipes
```css
/* 1 Navigation row / 3 strong / 8 Account */
.qa-row{ height:var(--h-row); padding:6px 10px 6px 6px; gap:8px; border-radius:var(--r-lg); width:100%; text-align:left }
.qa-row svg{ width:20px; height:20px; flex:none }
.qa-row .trail{ margin-left:auto; width:16px; height:16px; color:var(--text-secondary) }

/* 2 Sidebar action */
.qa-sidebar-action{ --qa-fg:var(--text-tertiary); height:var(--h-row); padding:6px; gap:8px; border-radius:var(--r-lg) }
.qa-sidebar-action:hover,.qa-sidebar-action:active{ background:transparent }
.qa-sidebar-action:hover .tile,.qa-sidebar-action:active .tile{ color:var(--text-primary) }
.tile{ width:24px; height:24px; display:grid; place-items:center; border-radius:var(--r-sm);
  background:var(--overlay-8); border:1px solid var(--border-glass); box-shadow:var(--sh-glass); color:var(--text-secondary); transition:color var(--t-base) }

/* 4 Toolbar icon / 5 Close */
.qa-icon-24{ --qa-fg:var(--text-tertiary); width:24px; height:24px; justify-content:center; border-radius:var(--r-sm) }
.qa-icon-24--close{ --qa-fg:var(--text-secondary); border-radius:var(--r-xs) }
.qa-icon-24 svg{ width:16px; height:16px }

/* 6 Collapse sidebar / 7 Notification */
.qa-icon-36{ --qa-bg:var(--overlay-5); --qa-fg:var(--text-tertiary); width:36px; height:36px; justify-content:center; border-radius:var(--r-lg) }
.qa-icon-36--round{ border-radius:var(--r-full); --qa-fg:var(--text-footer) }

/* 9 Space switcher */
.qa-switcher{ --qa-bg:var(--overlay-5); height:var(--h-row); padding:0 12px 0 10px; gap:6px; border-radius:var(--r-lg); box-shadow:var(--sh-switcher) }
```
```html
<button class="qa qa-row"><svg/>Home</button>
<button class="qa qa-sidebar-action"><span class="tile"><svg/></span>New project</button>
<button class="qa qa-row"><svg/>All projects<svg class="trail"/></button>
<button class="qa qa-icon-24" aria-label="Search"><svg/></button>
<button class="qa qa-icon-24 qa-icon-24--close" aria-label="Close"><svg/></button>
<button class="qa qa-icon-36" aria-label="Collapse sidebar"><svg/></button>
<button class="qa qa-icon-36 qa-icon-36--round" aria-label="Notifications"><svg/></button>
<button class="qa qa-switcher"><svg/>Personal<svg/></button>
```
Icon-only buttons MUST have `aria-label`. Row "⋯" buttons inside lists: hidden (`opacity:0`) until row hover/focus-within (`--t-fast`), always visible while `data-popup-open`.

### Active (current page) nav row
`aria-current="page"` → bg `--overlay-5`, label white (hover goes to 10%).
