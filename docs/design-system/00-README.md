# 00 — Global Design System Rules: Higgsfield "Cinema Studio"

## 1. The 5-State Interactive Model

Every interactive element in the system implements the 5 standard states plus contextual extra states:

1. **Default (Rest):**
   - Base resting styles according to component spec.
   - Transitions for smooth state changes: `transition: background-color var(--t-fast), color var(--t-fast), border-color var(--t-fast), opacity var(--t-fast), transform var(--t-fast);`.

2. **Hover (`:hover`):**
   - Quiet actions / chips: background shifts from `transparent` or `5%` white (`var(--overlay-5)`) to `10%` white (`var(--overlay-10)` / `var(--state-hover)`). Text shifts to white (`#FFFFFF`).
   - Primary lime actions: `filter: brightness(0.9)`.
   - Dark pill: `background: var(--bg-surface)`.

3. **Pressed (`:active`):**
   - Quiet actions / chips: background shifts to `20%` white (`var(--overlay-20)` / `var(--state-pressed)`).
   - Primary lime actions: `filter: brightness(0.8)`.
   - Dark pill: `background: #26282A` /* derived */.
   - Tactile scale: cards `scale(0.99)`, mobile create `translateY(2px)`.

4. **Keyboard Focus (`:focus-visible`):**
   - Global standard: **1.5px solid white ring** (`outline: var(--focus-ring-width) solid var(--focus-ring-color); outline-offset: 2px;`).
   - Focus outline is never shown on mouse click (strictly `:focus-visible` or `.focus-visible`).
   - Fields: outline on `.field` wrapper with `outline-offset: 0; border-color: transparent;`.
   - Brand buttons: `filter: brightness(1.05); outline: var(--focus-ring-width) solid var(--focus-ring-brand); outline-offset: 2px;`.
   - Menu items: internal outline with `outline-offset: -1.5px`.

5. **Disabled (`:disabled`, `[aria-disabled="true"]`):**
   - Quiet actions / chips / fields / cards: `opacity: var(--disabled-opacity, 0.5); pointer-events: none; cursor: not-allowed;`.
   - Brand buttons: `opacity: var(--disabled-opacity-brand, 0.4); cursor: not-allowed; pointer-events: none;`.

### Extra Contextual States
- **Selected (`aria-selected="true"`, `aria-checked="true"`, `data-state="checked"`):**
  - Mode tabs: `background: var(--overlay-5); color: var(--text-primary);`.
  - Checkbox / Radio / Switch: `background: var(--brand); color: var(--text-on-brand);`.
  - Menu items: `background: var(--overlay-10);` with trailing checkmark.
- **Open (`aria-expanded="true"`, `data-popup-open="true"`):**
  - Triggers adopt hover styling (`background: var(--state-hover); color: var(--text-primary);`).
  - Chevrons rotate 180deg (`transform: rotate(180deg); transition: transform var(--t-pop);`).
- **Loading (`aria-busy="true"`):**
  - Spinner replaces icon/label (`width: 16px; height: 16px; border: 2px solid var(--overlay-20); border-top-color: currentColor; border-radius: 50%; animation: spin 0.7s linear infinite;`).
- **Error / Invalid (`data-invalid="true"`, `aria-invalid="true"`):**
  - Border and focus ring adopt `var(--danger)` (`#ED1572`).

---

## 2. Token Precedence & Architecture
- **Single Source of Truth:** `tokens.css` defines all variables (`:root`).
- **No Raw Hardcoded Values:** No hex, rgb, rgba, px values for colors, radii, shadows, fonts, or transitions inside component markup or classes.
- **Dark Theme Only:** `color-scheme: dark;` on `:root` and `html`. Light theme is entirely removed.
