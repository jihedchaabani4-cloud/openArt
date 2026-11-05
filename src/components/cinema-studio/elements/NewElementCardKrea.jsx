"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/button";

export function NewElementCardKrea({ onClick, label = "New element" }) {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col gap-2 rounded-lg p-2.5 transition-[background-color,box-shadow,transform,opacity] duration-250 ease-out cursor-pointer hover:bg-[#ffffff14]"
      style={{ "--card-frame-light": "#ece5de99", "--card-frame-dark": "#ffffff14" }}
    >
      <div className="bg-[oklch(26.9%_0_0)] relative aspect-[370/231] w-full overflow-hidden rounded-lg transition-transform group-active:scale-99 flex items-center justify-center">
        <div className="flex h-full items-center justify-center">
          <Button
            type="button"
            variant="primary"
            className="size-8 p-0 rounded-full"
            aria-label={label}
          >
            <Plus className="size-4 stroke-[2.2]" />
          </Button>
        </div>
      </div>
      <div className="text-white flex h-6 items-center justify-between gap-1 px-0.5">
        <p className="truncate text-sm font-normal text-white/80">{label}</p>
      </div>
    </div>
  );
}

export default NewElementCardKrea;
