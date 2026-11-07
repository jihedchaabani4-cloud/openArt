# OpenArt — Runway Design System Migration Plan

**Project:** OpenArt / Labveil Frontend (`my-app`)  
**Branch:** `runway-design`  
**Purpose:** Replace the current visual design language with the supplied Runway Design specification across the frontend, while preserving OpenArt's existing brand colors and keeping the existing component-variant API compatible.

---

## 1. Executive decision

OpenArt will adopt the supplied **Runway Design Markdown file** as the primary visual-design specification.

The migration is a **full visual-system replacement**, not a small polish pass:

- Replace the old spacing, sizing, radius, typography, borders, shadows, surfaces, component styling, interaction states, and layout conventions with the Runway specification.
- Preserve OpenArt's existing website color identity. Do **not** blindly import Runway's color palette.
- Keep existing public component variant names and existing call sites working. Restyle their implementation according to Runway where appropriate.
- Add new variants only when the Runway specification or a real, repeated OpenArt use case requires them.
- Do not delete old variants during this migration. If an old variant becomes visually obsolete, retain it as a compatibility alias or restyle it; document any future deprecation separately.
- Migrate the actual application UI to the new system, not just the documentation or showcase.
- Work in controlled phases with visual and functional verification after each phase.

The Runway Markdown file is the authority for visual rules. OpenArt's current brand palette is the authority for colors. Existing application behavior and accessibility must remain intact unless an explicit issue is discovered and approved.

## 2. Sources of truth and precedence

Use this precedence order:

1. **Runway Design Markdown supplied by the user:** visual rules for spacing, dimensions, radius, typography, borders, shadows, surfaces, component appearance, and interaction states.
2. **OpenArt's existing brand colors:** preserve the current palette and its semantic roles. Map Runway's color roles to the closest existing OpenArt roles; do not introduce Runway colors just because they appear in its file.
3. **This migration plan:** migration boundaries, compatibility requirements, sequencing, and validation rules.
4. **Existing repository behavior:** preserve existing functionality, accessibility, responsive behavior, and public APIs unless a change is explicitly required by the new specification.

If the Runway file conflicts with the preserved OpenArt palette, keep OpenArt colors and adapt the relevant token mapping. If the Runway file is ambiguous, record the ambiguity and ask one focused question rather than inventing a rule.

## 3. Non-goals

Do not:

- Redesign product flows or change business logic.
- Change backend APIs, data models, workflow execution, billing, authentication, or media handling.
- Replace the whole UI framework or styling stack.
- Introduce a second component library just to obtain a visual style.
- Rewrite feature components that do not need visual-system changes.
- Delete existing Button variants or other public variants as part of this migration.
- Add variants for one-off differences that can be handled locally.
- perform a blind global find-and-replace of Tailwind classes.
- claim visual parity based only on unit tests or a successful build.

## 4. Target frontend architecture

Keep the existing project architecture unless the audit proves a specific boundary is broken.

```text
Runway Design Markdown
        |
        v
OpenArt design tokens
(CSS variables / Tailwind theme)
        |
        v
Shared UI primitives and components
(Button, Input, Card, Dialog, ...)
        |
        v
Feature-level components
(Cinema Studio, Image, Video, Workflow, ...)
        |
        v
Application pages
```

Responsibilities:

- **Runway Markdown:** describes the intended visual system.
- **`globals.css` / Tailwind theme:** implements the tokens and utility mappings.
- **`src/shared/ui/`:** implements reusable primitives and shared components with stable APIs.
- **`src/features/`:** composes shared components into product-specific interfaces.
- **`/dev/ui` or the existing component showcase:** provides a visual verification surface.
- **Design-system checks and tests:** detect regressions and enforce agreed conventions.

Do not create extra architectural layers unless the repository needs them.

## 5. Required compatibility rules

### 5.1 Existing variants

- Inventory every existing variant and its usages before changing implementation.
- Preserve all existing variant names and accepted prop values.
- Preserve the existing six Button variants reported in the current implementation (`primary`, `secondary`, `outline`, `ghost`, `danger`, and `link`) and any additional variants that actually exist in the checked-out code.
- Do not rename, remove, merge, or silently reinterpret existing variants.
- Update their visual implementation to match Runway where applicable.
- If Runway requires a genuinely new reusable visual treatment, add a new variant without breaking old call sites.
- A new variant must represent a meaningful, reusable semantic or visual difference—not a single page's arbitrary dimensions.
- Keep a compatibility test for every public variant.
- Any later removal must be a separate, explicitly approved deprecation project with usage evidence.

### 5.2 Props and customization

- Do not add generic `size` or `shape` props to Button unless the supplied Runway spec explicitly requires them and the user approves.
- Preserve existing props and behavior.
- Use component variants for stable, repeated patterns.
- Use `className` for truly local layout or one-off differences.
- Do not move every Tailwind class into a variant.
- Do not create feature-specific copies of shared components when composition is sufficient.

### 5.3 Colors

- Preserve OpenArt's current brand color values and semantic color roles.
- Audit current color tokens and direct color literals before editing.
- Replace legacy non-brand colors only when they are clearly old design-system values and a Runway semantic equivalent exists.
- Do not unintentionally change status colors, semantic feedback colors, contrast, or dark-mode behavior.
- Record every color mapping and any unresolved mismatch.

## 6. Execution phases

Each phase must finish with a report containing changed files, decisions, checks, screenshots/evidence where applicable, and unresolved issues. Do not silently continue past a failed gate.

### Phase 0 — Repository and input verification (read-only)

1. Confirm repository, branch, package manager, framework, Tailwind version, and working-tree status.
2. Locate and read the exact Runway Design Markdown supplied by the user.
3. Confirm whether the file is complete and identify its sections.
4. Read current `design.md`, `.agents/rules`, `globals.css`, Tailwind config/theme, `components.json`, `src/shared/ui`, feature components, `/dev/ui`, tests, and UI-check scripts.
5. Identify all existing design tokens, component APIs, variants, and styling conventions.
6. Capture baseline screenshots for representative routes/states if browser tooling is available.
7. Produce an inventory and migration-risk report.

**Gate:** Do not edit code until the Runway file is found and read, the current state is inventoried, and the color-preservation/variant-compatibility rules are understood.

### Phase 1 — Translate Runway into an OpenArt implementation map

Create a mapping table:

| Design concern | Runway rule | Current OpenArt implementation | Migration decision |
|---|---|---|---|
| Spacing | ... | ... | Replace/map |
| Radius | ... | ... | Replace/map |
| Typography | ... | ... | Replace/map |
| Borders | ... | ... | Replace/map |
| Shadows | ... | ... | Replace/map |
| Surfaces | ... | ... | Replace/map |
| Component states | ... | ... | Replace/map |
| Brand colors | Ignore Runway palette | Existing OpenArt palette | Preserve |

Identify missing or ambiguous Runway rules. Do not invent missing specifications.

### Phase 2 — Implement tokens and theme foundation

1. Define the new canonical tokens from Runway for spacing, radius, typography, borders, shadows, sizing, and surfaces.
2. Preserve and map OpenArt brand colors.
3. Implement tokens in the existing CSS/Tailwind architecture (`globals.css` and Tailwind v4 theme as appropriate).
4. Remove or replace obsolete token definitions only after all usages are identified.
5. Ensure light/dark themes and semantic states remain coherent if the project supports them.
6. Avoid duplicate token systems and avoid keeping old and new tokens active indefinitely.
7. Add or update token-level tests/checks where practical.

**Gate:** Token map reviewed; no unexplained duplicate source of truth; representative pages still render.

### Phase 3 — Migrate shared UI components

Migrate components in dependency order, starting with low-level primitives and then composed components.

Suggested order (adjust to actual dependencies):

1. Typography and layout primitives.
2. Button and icon-button patterns.
3. Input, Textarea, Select, Checkbox, RadioGroup.
4. Badge, Avatar, Separator, Skeleton, Progress.
5. Tooltip, Popover, Dropdown Menu, Tabs.
6. Dialog and other overlays.
7. Card and reusable data-display components.

For each component:

- Read its current implementation and all call sites.
- Translate the Runway specification into the component's default styling and states.
- Preserve its public API and existing variants.
- Add variants only when justified by the spec and repeated use.
- Preserve keyboard behavior, focus visibility, ARIA, disabled/loading behavior, and responsive behavior.
- Update unit tests and the component showcase.
- Verify the component visually in all meaningful states.

**Button-specific rule:** Keep all existing Button variants and names. Apply the new Runway visual rules to their styling. Do not repeat the previous Button API simplification or remove variants.

### Phase 4 — Migrate feature UI across the application

Perform a repository-wide inventory of feature-level styling, then migrate in controlled feature slices.

Suggested order:

1. Shared application shell and navigation.
2. Cinema Studio.
3. Image generation.
4. Video generation.
5. Workflow editor/canvas.
6. Elements and Characters.
7. Remaining settings, account, billing, and supporting pages.

For each feature:

- Replace old spacing, radius, typography, borders, shadows, surfaces, and component styling with the new system.
- Replace duplicated local controls with shared components where behavior and intent match.
- Keep feature-specific components inside their feature folders.
- Preserve data flow, state management, API calls, routes, permissions, and user interactions.
- Preserve existing OpenArt colors.
- Do not alter unrelated logic.
- Compare before/after screenshots at the same viewport and state.

Do not migrate every feature in one enormous unreviewable diff. Complete and validate one feature slice at a time.

### Phase 5 — Remove obsolete visual rules safely

After migrations:

1. Search for old token names, obsolete utility patterns, old radius/spacing conventions, and duplicated component styling.
2. Classify each remaining usage as migrated, intentionally retained, or requiring a documented exception.
3. Remove obsolete definitions only when no active usages remain.
4. Do not remove compatibility variants.
5. Update `design.md` and `.agents/rules/frontend-design-system.md` so they describe the Runway-based system and OpenArt color exception.
6. Ensure there is one canonical source for each design decision.

### Phase 6 — Enforcement and developer workflow

Update or add lightweight checks that fit the current repository:

- Detect deprecated token usage and known forbidden raw values where practical.
- Ensure feature code uses shared UI components for common controls.
- Keep checks targeted; avoid brittle rules that flag legitimate one-off layouts.
- Update `/dev/ui` with all variants and important states.
- Document the workflow: find existing component → use its default/variant → local `className` only when needed → add a reusable variant only for repeated need → create a new component only for a distinct reusable behavior/pattern.

Do not add heavyweight tooling without a clear benefit.

### Phase 7 — Final verification and handoff

Run the repository's actual scripts, based on `package.json`:

- Relevant component tests.
- Full test suite.
- UI/design-system checks.
- ESLint.
- Type checking if configured.
- Production build.
- Browser visual checks for representative routes and states.

Compare baseline and final screenshots. Check desktop and responsive layouts, focus/hover/disabled/loading states, dialogs/menus/popovers, and any complex editor surfaces.

Produce `runway-design-system-migration-report.md` containing:

- Summary and final architecture.
- Runway-to-OpenArt token mapping.
- Preserved OpenArt color palette and mappings.
- Existing variants preserved and new variants added.
- Components and features migrated.
- Files changed.
- Before/after visual evidence.
- Test/lint/typecheck/build results.
- Remaining exceptions and risks.
- Confirmation that no business logic or backend behavior was changed.

## 7. Working method and change control

- Use small, reviewable commits or implementation slices if the repository workflow supports them.
- Keep a migration checklist in the report and update it as work proceeds.
- Before a broad or destructive edit, show the exact scope and evidence.
- Do not overwrite user changes or discard uncommitted work.
- If a decision conflicts with this plan, stop and ask one focused question.
- Do not claim a phase is complete without actual command output or browser evidence.
- Do not claim the whole app is migrated if any routes/components remain unreviewed.

## 8. Definition of done

The migration is complete only when:

- Runway rules are implemented consistently across the frontend.
- OpenArt's existing brand colors are preserved.
- Existing public component variants and call sites still work.
- New variants are added only when justified.
- Shared components and feature interfaces follow the new system.
- Obsolete visual tokens/rules are removed or explicitly documented.
- Documentation and developer rules match the code.
- Tests, UI checks, lint, typecheck (if configured), and production build pass.
- Representative browser visual checks pass.
- A final migration report records evidence and remaining exceptions.
