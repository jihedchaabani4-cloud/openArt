# Stage 7 Critic Review: Unified Design Tokens & Composite Surface Architecture

**Target:** `docs/designs/unified-design-tokens-and-surface-primitives.md` (Lines 1–278: FeatureRange)  
**Reviewers:** `egm-design`, `egm-structural`, `egm-style`  
**Verdict:** **REVISE BEFORE PROCEEDING (3 Blockers, 4 Majors Identified)**

---

## Executive Summary & Verdict

The design document outlines a clean conceptual direction (a 3-tier system: `@theme inline` tokens, headless RSC layout primitives, and automated AST ratchet checks). However, in its current state (lines 1–278), it contains breaking layout changes to `CardHeader`, rule violations inside its own code (`active:scale-[0.995]`), and awkward token naming (`border-border-*`).

---

## 1. Concrete Findings Matrix

### [Blocker]
* **B1 (CardHeader Layout Shift & Dropped `variant` Prop):**
  - Existing `CardHeader` stacks vertically (`flex flex-col gap-1.5 p-4 sm:p-5`). Forcing `flex-row justify-between` with a mandatory divider breaks all existing cards.
  - Dropping `variant` strips styles from existing callers using `variant="interactive" | "glass"`.
  - *Remediation:* Retain vertical column layout in `CardHeader`, support optional row/divider styling via props, and map `variant` to `tone`/`interactive` in `Card`.
* **B2 (Self-Violating Primitive & Contradictory CUJ 2):**
  - `active:scale-[0.995]` is an arbitrary bracket violation banned by Rule U2.
  - CUJ 2 uses `bg-black`, which Rule U8 outlaws.
  - *Remediation:* Use canonical `active:scale-95` in `Card` and update CUJ 2 to `<Card.Canvas className="aspect-video bg-surface-sunken">`.
* **B3 (Missing CI Baseline Bootstrap for Rule U8):**
  - Section 3 & 4 must explicitly specify running `node scripts/ui-check.cjs --init-baseline` to capture existing neutral palette violations before CI turns on enforcement.

### [Major]
* **M1 (Stuttering Token Naming):**
  - `--color-border-subtle` creates awkward classes like `border-border-subtle`.
  - *Remediation:* Rename to `--color-line-subtle`, `--color-line-default`, `--color-line-interactive` generating clean classes: `border-line-subtle`, `border-line-default`.
* **M2 (Dynamic CSS Variables for Zero-Touch Light Mode):**
  - Define root variables in `:root` (`--surface-base: #0f1011; --line-subtle: rgba(255,255,255,0.07);`) and reference them in `@theme inline` via `var(--...)`.
* **M3 (Directional Borders & Dividers in Rule U8):**
  - Update regex to `\b(bg|text|border(?:-[tblrxy])?|divide(?:-[xy])?|ring|fill|stroke|outline)-(zinc|gray|neutral|slate|stone|white|black)(?:-\d+)?(?:\/(?:\d+|\[[^\]]+\]))?\b`.
* **M4 (Keyboard Focus Invariants on Interactive Cards):**
  - Add `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-line-interactive` to interactive `Card` state for WCAG compliance.

### [Nit]
* **N1 (Decision Rule for Surface vs. Card):**
  - Clarify: Use `Surface` for atomic structural framing and layout panes; use `Card` when content is partitioned into discrete header, canvas, body, or footer zones.
