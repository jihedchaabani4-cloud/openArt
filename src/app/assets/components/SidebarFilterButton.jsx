"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export function SidebarFilterButton({ label, icon: Icon, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-[14px] transition",
        active ? "bg-white/12 text-white" : "text-white/54 hover:bg-white/6 hover:text-white/88"
      )}
    >
      <span className="flex items-center gap-2.5">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span>{label}</span>
      </span>
    </button>
  );
}

export function SidebarDropdownButton({ label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-[14px] transition",
        active ? "bg-white/12 text-white" : "text-white/54 hover:bg-white/6 hover:text-white/88"
      )}
    >
      <span>{label}</span>
      <ChevronDown className="h-4 w-4 rotate-[-90deg] text-white/32" />
    </button>
  );
}
