"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

/**
 * ModelSelectorV2
 * Purely data-driven model selector.
 * Zero hardcoded model IDs, zero provider concepts.
 */
export const ModelSelectorV2 = React.memo(function ModelSelectorV2({
  models = [],
  selectedModelId,
  onSelectModel,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-2 transition-all select-none text-[13px] font-medium",
          isOpen && "bg-white/15 border-white/20"
        )}
      >
        <GoogleIcon iconName="auto_awesome" className="text-[14px] text-white/70" />
        <span className="truncate max-w-[140px]">
          {selectedModel?.name || "Select Model"}
        </span>
        {selectedModel?.badge && (
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1.5 bg-white/10 border-white/20 text-white font-semibold uppercase"
          >
            {selectedModel.badge}
          </Badge>
        )}
        <GoogleIcon
          iconName="expand_more"
          className={cn("text-[14px] text-white/50 transition-transform", isOpen && "rotate-180")}
        />
      </Button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 max-h-80 overflow-y-auto rounded-2xl bg-[#18191b] border border-white/15 shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-2xl">
          <div className="px-2 py-1 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            Available Models ({models.length})
          </div>

          {models.map((model) => {
            const isSelected = model.id === selectedModelId;

            return (
              <Button
                key={model.id}
                type="button"
                variant={isSelected ? "primary" : "ghost"}
                onClick={() => {
                  onSelectModel(model.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left p-2 h-auto rounded-xl transition-all flex flex-col items-start gap-0.5 justify-start",
                  isSelected
                    ? "bg-white text-black font-medium"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold truncate">
                    {model.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-[10px] uppercase font-mono px-1.5 py-0.5 rounded",
                        isSelected ? "bg-black/10 text-black/70" : "bg-white/5 text-white/50"
                      )}
                    >
                      {model.domain}
                    </span>
                    {model.badge && (
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.2 rounded",
                          isSelected ? "bg-black text-white" : "bg-white/20 text-white"
                        )}
                      >
                        {model.badge}
                      </span>
                    )}
                  </div>
                </div>

                {model.description && (
                  <p
                    className={cn(
                      "text-[11px] line-clamp-1 leading-tight",
                      isSelected ? "text-black/70" : "text-white/50"
                    )}
                  >
                    {model.description}
                  </p>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
});
