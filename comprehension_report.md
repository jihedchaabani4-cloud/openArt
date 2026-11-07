# Comprehension Test Report: `docs/designs/unified-design-tokens-and-surface-primitives.md`

**Reviewer Mode:** Isolated Zero-Context Goldfish Reviewer (Stage 6 Comprehension Test)  
**Target Document:** `docs/designs/unified-design-tokens-and-surface-primitives.md` (Lines 1–350)
**Verdict:** **Conditional Pass with Required Revisions (Score: 78/100)**

---

## 1. Executive Summary & Clarity Verdict

The design document presents a cohesive, elegant architectural vision: a strict three-tier separation of tokens, headless/composite layout primitives, and domain feature components, fortified by an automated ratchet. The mental model is intuitive, and the technical rationale for rejecting React Context (RSC preservation) and channel-splitting CSS variables (Tailwind v4 `color-mix`) is well articulated.

However, the document suffers from two critical blockers and several specification gaps:
1. **CUJ 2 vs. Rule U8 Enforcement Contradiction:** CUJ 2 uses `bg-black`, but Rule U8 bans `black` outside `globals.css` and `shared/ui`. A semantic token `--color-surface-canvas: #000000` is needed.
2. **`CardHeader` Layout Regression:** Hardcoding `CardHeader` as a horizontal row with a forced bottom border breaks existing stacked title/description layouts across the repository.
3. **Rule U8 Regex Directional Borders Gap:** The regex missed directional borders (`border-t-zinc-800`, `border-b-white/10`).
4. **Baseline Schema Discrepancy:** Standardizing all references on the actual dictionary format `{ "RULE_ID|path": count }`.

---

## 2. Classified Findings Matrix

### [Blocker]
* **B1 (CUJ 2 vs Rule U8 Contradiction):** Introduce `--color-surface-canvas: #000000` under `@theme inline` and update CUJ 2 to `<Card.Canvas className="aspect-video bg-surface-canvas">`.
* **B2 (CardHeader Layout Regression):** Retain canonical vertical stacking (`flex flex-col gap-1.5 p-4 sm:p-5`) in `CardHeader` without a forced divider, supporting title and description stacking out of the box.

### [Major]
* **M1 (Rule U8 Directional Border Coverage):** Update regex to `\b(bg|text|border(-[trblxy])?|ring|fill|stroke)-(zinc|gray|neutral|slate|stone|white|black)(?:-\d+)?(?:\/\d+)?\b`.
* **M2 (Unify Baseline Schema):** Standardize all descriptions on `{ "RULE_ID|path": count }` and document existing `--init-baseline` and `--shrink-baseline` CLI flags.
* **M3 (CUJ 1 Border Harmonization):** Align CUJ 1 wording with `Card`'s default `border-border-default`.

### [Nit]
* **N1 (Diagram Component Names):** Update Tier 3 diagram to match real canary targets (`MediaCard.jsx` and `ElementInfoSidebar.jsx`).
* **N2 (Include `usage-rules.md` in Phase Steps):** Add step in Phase 1 updating `docs/ui-system/usage-rules.md`.
