"use client";

import React from "react";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

export function NewElementCardKrea({ onClick, label = "New element" }) {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col gap-2 rounded-lg p-2.5 transition-all duration-200 ease-out cursor-pointer bg-surface-card border border-white/10 hover:border-white/20 hover:bg-surface-elevated shadow-none"
    >
      <div className="bg-surface-elevated border border-white/5 relative aspect-[370/231] w-full overflow-hidden rounded-lg transition-transform group-active:scale-99 flex items-center justify-center shadow-none">
        <div className="flex h-full items-center justify-center">
          <Button
            type="button"
            variant="primary"
            className="size-8 p-0 rounded-full"
            aria-label={label}
          >
            <GoogleIcon iconName="add" className="text-base" />
          </Button>
        </div>
      </div>
      <div className="flex h-6 items-center justify-between gap-1 px-0.5">
        <p className="truncate text-sm font-medium text-cool-slate group-hover:text-white transition-colors">{label}</p>
      </div>
    </div>
  );
}

export default NewElementCardKrea;
