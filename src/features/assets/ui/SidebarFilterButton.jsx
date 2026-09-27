"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export function SidebarFilterButton({ label, icon: Icon, active = false, onClick }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "flex h-8 w-full items-center justify-between rounded-xl px-3 text-left text-[14px] transition",
        active ? "bg-white/12 text-white hover:bg-white/12" : "hover:bg-white/6"
      )}
    >
      <span className="flex items-center gap-2.5">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span>{label}</span>
      </span>
    </Button>
  );
}

export function SidebarDropdownButton({ label, active = false, onClick }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "flex h-8 w-full items-center justify-between rounded-xl px-3 text-left text-[14px] transition",
        active ? "bg-white/12 text-white hover:bg-white/12" : "hover:bg-white/6 hover:text-white/88"
      )}
    >
      <span>{label}</span>
      <ChevronDown className="h-4 w-4 rotate-[-90deg] text-white/32" />
    </Button>
  );
}
