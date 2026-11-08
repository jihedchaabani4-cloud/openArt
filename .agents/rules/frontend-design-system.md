---
trigger: always_on
description: Strict frontend design system enforcement from design.md. Zero call-site restyling, no arbitrary tailwind values, no raw HTML buttons or colors.
---

## Frontend Design System Enforcement (`design.md`)

All code written in `my-app/` MUST strictly comply with the canonical design system defined in `design.md` (and `my-app/docs/ui-system/design.md`).

### The Zero Call-Site Restyling Law:
1. **Never write raw HTML controls**:
   - Prohibited: `<button>`, `<input>`, `<textarea>`, or `<select>`.
   - Required: Always use canonical primitives from `@/shared/ui/button`, `@/shared/ui/switch`, `@/shared/ui/input`, `@/shared/ui/dialog`.
2. **No arbitrary Tailwind values**:
   - Prohibited: `w-[...]`, `h-[...]`, `p-[...]`, `m-[...]`, `rounded-[...]`, `text-[...]`.
   - Required: Use the standard Tailwind 4px spacing scale (`gap-1`, `gap-1.5`, `gap-2`, `gap-4`, `p-2`, `p-4`) and standard tokens.
3. **No raw color literals**:
   - Prohibited: `#hex`, `rgb(...)`, `rgba(...)`, `hsl(...)` in component JSX.
   - Required: Use semantic design tokens (`bg-black`, `text-white`, `text-muted-foreground`, `border-white/10`, `border-white/5`, `var(...)`).
4. **Strict Border Radius Hierarchy (Canonical Tokens)**:
   - Shared primitives own their corner radius geometry. Call sites must not pass ad-hoc radius classes.
   - Buttons, Inputs, Menu Items: `rounded-sm` (`4px`, sharp geometric hierarchy).
   - Badges, Small Chips: `rounded-sm` (`4px`).
   - Cards, Media Containers, Panels: `rounded-lg` (`8px`, comfortable card geometry).
   - Dropdowns and Standard Menus: `rounded-lg` (`8px`).
   - Dialogs & Modals: `rounded-2xl` (`16px`, generous modal overlay geometry).
   - Pills, Avatars & Circular Controls: `rounded-full` (`9999px`).
   - **Prohibited Dead Classes:** Never use `rounded-button`, `rounded-card`, `rounded-dialog`, `rounded-badge`, or `rounded-input`. These do not exist in Tailwind v4 and are blocked by Rule U6.
5. **Component Ownership vs. Call-Site Layout (`className`)**:
   - **Shared Primitives Own Visual Styling:** Backgrounds, borders, internal padding, corner radius, focus rings, and elevation belong to the primitive component. Choose styling via primitive `variant="..."` and `size="..."` props.
   - **`className` is Exclusively for Layout & Positioning:** Call sites may use `className` strictly for positioning within parent layouts (e.g. `w-full`, `max-w-fit`, `shrink-0`, `col-span-2`, `flex`, `grid`, `self-end`, `hidden sm:flex`).
   - **Prohibited in `className`:** Overriding component background colors, borders, internal padding, shadows, or corner radiuses when those styles belong to the shared primitive.
6. **Mandatory Ratchet Gate**:
   - After any frontend edit, run `cd my-app && npm run ui:check`. New violations (U1, U2, U3, U4, U5, U6) are strictly prohibited and must be fixed immediately.
