# Frontend Design System Usage Rules (`usage-rules.md`)

> **Strict Rules for Engineers & Agents** working in `my-app/`.  
> Non-negotiable principles that keep the design system clean, scalable, and resilient.

---

## The Zero Call-Site Restyling Law

1. **Never write raw HTML controls**:
   - 🚫 Prohibited: `<button>`, `<input>`, `<textarea>`, `<select>`.
   - ✅ Required: Always import canonical primitives from `@/shared/ui/button`, `@/shared/ui/input`, `@/shared/ui/textarea`, `@/shared/ui/select`, `@/shared/ui/switch`, `@/shared/ui/checkbox`.

2. **Call-site `className` is exclusively for layout & positioning**:
   - ✅ Allowed: `w-full`, `max-w-md`, `shrink-0`, `flex items-center gap-2`, `col-span-2`, `self-end`.
   - 🚫 Prohibited: Overriding component background colors, borders, paddings, shadows, or corner radiuses at the call site.

3. **No arbitrary Tailwind brackets**:
   - 🚫 Prohibited: `p-[13px]`, `w-[320px]`, `rounded-[15px]`, `text-[12px]`, `bg-[#1e1f20]`.
   - ✅ Required: Use the 4px spacing scale (`gap-1.5`, `p-2`, `p-4`), canonical text sizes (`text-xs`, `text-sm`, `text-base`), and geometric tokens (`rounded-button`, `rounded-card`, `rounded-badge`, `rounded-dialog`, `rounded-full`).

4. **No raw color literals in JSX**:
   - 🚫 Prohibited: `#fe6e6e`, `#EFFE17`, `rgba(255,255,255,0.08)`.
   - ✅ Required: Use semantic tokens or canonical variants (`variant="neon"`, `variant="danger"`, `text-muted-foreground`, `border-white/10`).

---

## Extending the Design System

If a new visual appearance or interaction is genuinely required by design:
1. **Never hack it inline at the call site**.
2. **Extend the primitive**: Add the named variant inside the primitive file (e.g. `src/shared/ui/button.jsx`).
3. Document the new variant in `docs/ui-system/components.md`.
4. Showcase the new variant in `/dev/ui` (`src/app/dev/ui/page.jsx`).

---

## Automated Ratchet Verification (`npm run ui:check`)

Before submitting code:
```bash
cd my-app && npm run ui:check
```
- **Rule U1**: 0 raw color literals outside token files.
- **Rule U2**: 0 arbitrary Tailwind brackets.
- **Rule U3**: 0 raw `<button>` outside primitives.
- **Rule U4**: 0 `fetch()` calls inside components.
- **Rule U5**: 0 static inline `style={{ }}`.

A new violation means: **fix the code, never edit `ui-baseline.json` by hand.**
