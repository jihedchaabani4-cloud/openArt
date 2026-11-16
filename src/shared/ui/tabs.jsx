"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const TabsContext = React.createContext({ variant: "pills" });

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

function TabsList({
  className,
  variant = "pills",
  ...props
}) {
  return (
    <TabsContext.Provider value={{ variant }}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(
          "inline-flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10 font-sans antialiased",
          className
        )}
        {...props}
      />
    </TabsContext.Provider>
  );
}

function TabsTrigger({
  className,
  ...props
}) {
  const { variant } = React.useContext(TabsContext);
  const isStudio = variant === "studio";

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "h-8 rounded-full px-3 text-sm font-medium bg-white/10 text-white hover:bg-white/15 transition-all outline-none cursor-pointer",
        "data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow",
        "disabled:pointer-events-none disabled:opacity-50",
        isStudio && "tracking-wider uppercase",
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
        "outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
