"use client";

import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/components/base/button";

export function SidebarFilterButton({ label, icon: Icon, active = false, onClick }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      className="w-full justify-between px-3 text-left text-[14px]"
    >
      <span className="flex items-center gap-2.5">
        {Icon ? (typeof Icon === "string" ? <HugeIcon name={Icon} className="text-base" /> : React.isValidElement(Icon) ? Icon : typeof Icon === "function" ? React.createElement(Icon, { className: "text-base" }) : null) : null}
        <span>{label}</span>
      </span>
    </Button>
  );
}

export function SidebarDropdownButton({ label, active = false, onClick }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      className="w-full justify-between px-3 text-left text-[14px]"
    >
      <span>{label}</span>
      <HugeIcon name="arrow-down-01" className="text-base -rotate-90 text-on-surface-subtle" />
    </Button>
  );
}
