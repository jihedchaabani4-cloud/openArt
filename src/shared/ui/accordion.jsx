"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";

function Accordion({ ...props }) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({ className, ...props }) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-white/10 last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  icon,
  iconClassName,
  ...props
}) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "h-6 w-full flex items-center justify-between text-sm font-medium uppercase leading-[18px] tracking-[0.1px] text-white/50 hover:text-white transition-colors outline-none cursor-pointer [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>.google-symbols]:rotate-180",
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
}

function AccordionContent({
  className,
  children,
  ...props
}) {
  return (
    <AccordionPrimitive.Content
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
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
