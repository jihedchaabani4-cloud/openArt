"use client"

import React, { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { Image as ImageIcon } from "lucide-react";

export function StrengthSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const options = ["25%", "50%", "75%", "90%"];
  
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          className={cn(
            "flex items-center gap-1.5 h-10 px-3.5 rounded-lg text-white/80 text-[14px] font-medium transition-all cursor-pointer outline-none",
            open && "bg-white/8 text-white"
          )}
        >
          <span className="flex items-center gap-1.5">
            <ImageIcon size={14} className="opacity-60" />
            {value}
          </span>
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="top"
          align="center"
          sideOffset={8}
          className={cn(
            "z-9999 min-w-[120px] rounded-lg overflow-hidden flex flex-col p-1.5",
            "border border-white/10 bg-[rgba(28,30,32,0.95)] backdrop-blur-[32px]",
            "shadow-[0_20px_50px_-8px_rgba(0,0,0,0.8)]",
            "animate-in fade-in zoom-in-95 duration-150"
          )}
        >
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] cursor-pointer transition-colors text-left outline-none",
                  isSelected
                    ? "bg-white/10 text-white font-medium"
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex-1 min-w-0 flex items-center gap-2">
                   <ImageIcon size={14} className="opacity-60" />
                   {opt}
                </div>
                {isSelected && (
                  <span className="text-blue-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M17.7406 7.1827C18.0539 7.45363 18.0882 7.92725 17.8173 8.24057L10.4673 16.7406C10.3305 16.8988 10.1339 16.9926 9.92494 16.9996C9.71594 17.0066 9.51353 16.9259 9.36654 16.7772L6.21654 13.5897C5.92539 13.2951 5.9282 12.8202 6.22282 12.5291C6.51744 12.2379 6.9923 12.2407 7.28346 12.5353L9.86327 15.1458L16.6827 7.25945C16.9536 6.94613 17.4272 6.91177 17.7406 7.1827Z" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
