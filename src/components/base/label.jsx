import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Canonical form, control, and section Label primitive (`DESIGN.md` `.ds-label`).
 *
 * Visuals live in `src/styles/tokens/typography.css` & `src/styles/tokens/text-roles.css`:
 * - `default`: Tier 1 `small` (`13px · 400 · lh 1.3 · -0.20px`) in `var(--text-muted-fg)` (`#A1A1AA`), sentence case
 * - `caption`: Tier 1 `caption-label` (`14px · 500 · lh 1.3 · 0.35px`) in `var(--text-muted-fg)`
 * - `primary`: Tier 1 `small` in `var(--text-primary)` (`#FFFFFF`)
 *
 * @prop {"label" | "span" | "div"} [as="label"] - Rendered element tag.
 * @prop {"default" | "caption" | "primary"} [variant="default"] - Semantic label style variant.
 * @prop {boolean} [disabled=false] - Applies disabled visual state (`data-disabled="true"`).
 * @prop {string} [className] - Layout/positioning classes only.
 */
const Label = React.forwardRef(function Label(
  { as = "label", variant = "default", disabled = false, className, children, ...props },
  ref
) {
  const Comp = as;
  return (
    <Comp
      ref={ref}
      data-slot="label"
      data-variant={variant}
      data-disabled={disabled ? "true" : undefined}
      className={cn(
        "ds-label",
        variant === "caption" && "ds-label-caption",
        variant === "primary" && "ds-label-primary",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});

Label.displayName = "Label";

export { Label };
export default Label;
