/**
 * Tabs Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Tab triggers and lists follow canonical variants.
 * 2. USE CANONICAL VARIANTS: `variant="pills" | "underline" | "studio"`.
 * 3. USE CANONICAL SIZES: `size="default" | "sm"`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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
          variant === "pills" && "rounded-full bg-white/5 p-1 gap-1 border border-white/5",
          variant === "underline" && "gap-4 border-b border-white/10 px-1",
          variant === "studio" && "w-full rounded-lg bg-card p-1 gap-1 border border-white/5",
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
        "disabled:pointer-events-none disabled:opacity-50",
        // Pills variant
        variant === "pills" && [
          isSm ? "h-6 px-2.5 text-xs rounded-full" : "h-7 px-3.5 text-xs rounded-full",
          "text-white/60 hover:text-white hover:bg-white/5",
          "data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:shadow-xs",
        ],
        // Underline variant
        variant === "underline" && [
          isSm ? "h-7 text-xs pb-1" : "h-9 text-sm pb-2",
          "text-white/60 hover:text-white border-b-2 border-transparent",
          "data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:font-semibold",
        ],
        // Studio variant
        variant === "studio" && [
          "flex-1 py-1.5 rounded-sm text-xs uppercase tracking-wider font-semibold",
          "text-white/60 hover:text-white hover:bg-white/5",
          "data-[state=active]:bg-lime-400 data-[state=active]:text-black data-[state=active]:shadow-sm",
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
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
