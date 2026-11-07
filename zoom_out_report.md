# Initial Zoom Out Review: Unified Design Tokens & Surface Primitives

**Document under review:** `docs/designs/unified-design-tokens-and-surface-primitives.md`  
**Review lenses:** `egm-zoom-out` (Altitude, YAGNI, architecture) & `egm-inventive-catalyst` (Contradiction elimination, synthesis)  
**Status:** **REVISE BEFORE PROCEEDING (Critical Blockers Found)**

---

## 1. Executive Summary & Altitude Verdict

The design document aims to solve a genuine problem: pervasive hardcoded hex values, token sprawl, and ad-hoc container layouts across Cinema Studio and the Media Library. The emphasis on zero React Context (RSC-friendly) and Tailwind v4 `@theme inline` with native `color-mix` is architecturally sound.

However, from high altitude, the document exhibits five critical discrepancies that must be reconciled:
1. **NG1 Violation:** Overwriting `src/shared/ui/card.jsx` with dot-notation only removes existing named exports (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`), breaking all current consumers despite NG1 stating *"All existing components in `src/shared/ui/` retain identical export signatures"*.
2. **Hallucinated Canary Paths:** The canary migration targets (`src/widgets/CoreMediaItemView/index.jsx` and `src/components/cinema-studio/common/index.jsx`) do not exist. Real targets are `src/features/media/ui/MediaCard.jsx` and `src/components/cinema-studio/elements/ElementInfoSidebar.jsx`.
3. **Palette Ratchet Trap (Rule U8):** Rule U8 strictly bans `red`, `blue`, `amber` across the entire codebase, yet the design document's Tier 1 token contract defines zero status/accent tokens.
4. **False Claims on Tooling:** `scripts/ui-check.cjs` is line-based regex (not AST-based), and `ui-baseline.json` already utilizes `{ "RULE|path": count }`.
5. **Dropped `ref` in `Card` and Local `cn` Duplication:** `Card` must wrap with `React.forwardRef`, and both primitives must import `cn` from `@/shared/lib/utils` to preserve `customTwMerge` token awareness.

---

## 2. Contradiction Analysis & Remediation Strategy

| # | Inherent Contradiction | Remediation / Inventive Transform |
|---|---|---|
| **1** | **Compound Dot-Notation vs Backward Compatibility (NG1)**<br>Overwriting `card.jsx` breaks existing callers importing named components. | **Dual Export & Synonym Pattern:**<br>Retain all named exports (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardCanvas`) and attach subcomponents to `Card`: `Card.Header = CardHeader; Card.Body = CardContent; Card.Content = CardContent; Card.Description = CardDescription; Card.Canvas = CardCanvas; Card.Footer = CardFooter;`. |
| **2** | **Rule U8 Ban vs Missing Status Tokens**<br>Banning `red`, `blue`, `amber` breaks badges and error messages. | **Constrain Rule U8 to Neutral Palette:**<br>Scope Rule U8 to neutral scales (`zinc|gray|neutral|slate|stone|black|white`), allowing standard semantic badges until status tokens land. |
| **3** | **Zero Context RSC vs Missing `ref` Forwarding**<br>`Card` as a plain function breaks Radix triggers, tooltips, and animations. | **RSC `React.forwardRef` Wrappers:**<br>Wrap `Card` and all subcomponents in `React.forwardRef` with `displayName` and `data-slot`. |
| **4** | **Canary File Alignment**<br>Canary paths in the doc do not exist. | **Grounding to Real Files:**<br>Target `src/features/media/ui/MediaCard.jsx` and `src/components/cinema-studio/elements/ElementInfoSidebar.jsx`. |
| **5** | **Shadow `cn` Definition**<br>Vanilla `twMerge` breaks custom project tokens. | **Canonical Import:**<br>Import `cn` from `@/shared/lib/utils` across all primitives. |

---

## 3. Concrete Findings Matrix

### [Blocker]
* **B1 (NG1 Violation):** Restore backward-compatible named exports in `card.jsx` alongside dot-notation aliases.
* **B2 (Rule U8 Scope):** Constrain Rule U8 regex to neutral palette scales (`zinc|gray|neutral|slate|stone|black|white`).
* **B3 (Canary Path Correction):** Replace fictitious paths with real files (`MediaCard.jsx` and `ElementInfoSidebar.jsx`).

### [Major]
* **M1 (Ref Forwarding):** Wrap `Card` and subcomponents with `React.forwardRef`.
* **M2 (Canonical Utilities):** Use `import { cn } from "@/shared/lib/utils"` instead of declaring local `twMerge`.
* **M3 (Accurate Tooling Description):** Correct references to `ui-check.cjs` as a regex-based line ratchet, acknowledging the baseline already uses rule-path counts.
