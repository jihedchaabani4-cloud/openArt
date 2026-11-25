"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const PillTabs = React.forwardRef(function PillTabs({ className, ...props }, ref) {
  return <TabsPrimitive.Root ref={ref} data-slot="pill-tabs" className={cn("flex flex-col gap-2", className)} {...props} />;
});
PillTabs.displayName = "PillTabs";

const PillTabsList = React.forwardRef(function PillTabsList(
  { className, variant = "default", ...props },
  ref
) {
  const isSegmented = variant === "segmented";
  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="pill-tabs-list"
      data-variant={variant}
      className={cn(
        "inline-flex items-center gap-1",
        isSegmented && "p-1 rounded-subtle bg-white/5 border border-white/10",
        className
      )}
      {...props}
    />
  );
});
PillTabsList.displayName = "PillTabsList";

const PillTabsTrigger = React.forwardRef(function PillTabsTrigger(
  { className, variant = "pill", ...props },
  ref
) {
  const isComposer = variant === "composer";
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="pill-tabs-trigger"
      data-variant={variant}
      className={cn(
        "focus-workspace cursor-pointer disabled:pointer-events-none disabled:opacity-50",
        isComposer ? "ds-composer-tab" : "ds-tab-pill",
        className
      )}
      {...props}
    />
  );
});
PillTabsTrigger.displayName = "PillTabsTrigger";

const PillTabsContent = React.forwardRef(function PillTabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      data-slot="pill-tabs-content"
      className={cn("focus-workspace", className)}
      {...props}
    />
  );
});
PillTabsContent.displayName = "PillTabsContent";

export { PillTabs, PillTabsList, PillTabsTrigger, PillTabsContent };
