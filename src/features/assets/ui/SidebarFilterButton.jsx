"use client";

import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export function SidebarFilterButton({ label, icon: Icon, active = false, onClick }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      className="w-full justify-between px-3 text-left text-[14px]"
    >
      <span className="flex items-center gap-2.5">
        {Icon ? (typeof Icon === "string" ? <GoogleIcon iconName={Icon} className="text-base" /> : React.isValidElement(Icon) ? Icon : typeof Icon === "function" ? React.createElement(Icon, { className: "text-base" }) : null) : null}
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
      <GoogleIcon iconName="keyboard_arrow_down" className="text-base -rotate-90 text-on-surface-subtle" />
    </Button>
  );
}
