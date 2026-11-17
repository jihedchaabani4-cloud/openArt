import * as React from "react";
import { cn } from "@/shared/lib/utils";

const SECTION_CARD_VARIANTS = {
  frosted: "ds-section-card",
  composer: "ds-composer-card",
  media: "ds-media-card",
};

const SectionCard = React.forwardRef(function SectionCard(
  { className, variant = "frosted", children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="section-card"
      data-variant={variant}
      className={cn(SECTION_CARD_VARIANTS[variant] || SECTION_CARD_VARIANTS.frosted, className)}
      {...props}
    >
      {children}
    </div>
  );
});
SectionCard.displayName = "SectionCard";

export { SectionCard, SECTION_CARD_VARIANTS };
