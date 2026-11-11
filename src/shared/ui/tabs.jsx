"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/utils";

function Tabs({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

const TabsListContext = React.createContext({ variant: "pills", size: "default" });

function TabsList({
  className,
  variant = "pills",
  size = "default",
  ...props
}) {
  return (
    <TabsListContext.Provider value={{ variant, size }}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        data-size={size}
        className={cn(
          "inline-flex items-center justify-center font-sans antialiased",
          variant === "pills" && "rounded-full bg-[var(--overlay-5)] p-1 gap-1 border border-[var(--border-subtle)]",
          variant === "underline" && "gap-4 border-b border-[var(--border-subtle)] px-1",
          variant === "studio" && "w-full rounded-[var(--r-sm)] bg-[var(--bg-surface)] p-1 gap-1 border border-[var(--border-subtle)]",
          className
        )}
        {...props}
      />
    </TabsListContext.Provider>
  );
}

function TabsTrigger({
  className,
  ...props
}) {
  const { variant, size } = React.useContext(TabsListContext);
  const isSm = size === "sm";

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-medium transition-all outline-none",
        "disabled:pointer-events-none disabled:opacity-40",
        // Pills variant
        variant === "pills" && [
          isSm ? "h-6 px-2.5 text-xs rounded-full" : "h-7 px-3.5 text-xs rounded-full",
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-10)]",
          "data-[state=active]:bg-[var(--brand)] data-[state=active]:text-[var(--text-on-brand)] data-[state=active]:font-semibold",
        ],
        // Underline variant
        variant === "underline" && [
          isSm ? "h-7 text-xs pb-1" : "h-9 text-sm pb-2",
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-b-2 border-transparent",
          "data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)] data-[state=active]:font-semibold",
        ],
        // Studio variant
        variant === "studio" && [
          "flex-1 py-1.5 rounded-[var(--r-xs)] text-xs uppercase tracking-wider font-semibold",
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-10)]",
          "data-[state=active]:bg-[var(--brand)] data-[state=active]:text-[var(--text-on-brand)]",
        ],
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
export default Tabs;
