"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";
import { cn } from "@/shared/lib/utils";

function Accordion({ ...props }) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

const AccordionItem = React.forwardRef(function AccordionItem(
  { className, ...props },
  ref
) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      data-slot="accordion-item"
      className={cn("border-b border-white/10 last:border-b-0", className)}
      {...props}
    />
  );
});
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef(function AccordionTrigger(
  {
    className,
    children,
    icon,
    iconClassName,
    ...props
  },
  ref
) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        data-slot="accordion-trigger"
        className={cn(
          "ds-accordion-trigger focus-workspace hover:text-[var(--text-primary)] transition-colors cursor-pointer [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>.google-symbols]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        {icon ?? (
          <GoogleIcon
            iconName="keyboard_arrow_down"
            className={cn("text-base transition-transform duration-200", iconClassName)}
          />
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef(function AccordionContent(
  {
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden text-sm text-white/70 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down pt-3",
        className
      )}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
