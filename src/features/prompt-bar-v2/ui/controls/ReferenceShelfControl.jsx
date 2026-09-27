"use client";

import React, { useRef } from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";

/**
 * ReferenceShelfControl
 * Multi-media reference shelf for array types (image[], video[]).
 */
export const ReferenceShelfControl = React.memo(function ReferenceShelfControl({
  definition,
  value = [],
  onChange,
  error,
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const items = Array.isArray(value) ? value : [];
  const maxCount = definition?.maxCount ?? 4;
  const isVideoType = definition?.type === "video[]";
  const label = definition?.label || (isVideoType ? "Video References" : "References");

  const canAddMore = items.length < maxCount;

  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = maxCount - items.length;
    const filesToAdd = files.slice(0, availableSlots);

    const newEntries = filesToAdd.map((file, idx) => {
      const url = URL.createObjectURL(file);
      return {
        id: `ref_${Date.now()}_${idx}`,
        name: file.name,
        url,
        preview: url,
        type: isVideoType ? "video" : "image",
      };
    });

    onChange([...items, ...newEntries]);
  };

  const handleAddMockSample = () => {
    if (!canAddMore) return;
    const sampleUrls = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&q=80",
    ];
    const sample = sampleUrls[items.length % sampleUrls.length];
    const newEntry = {
      id: `sample_${Date.now()}`,
      name: `sample_${items.length + 1}.jpg`,
      url: sample,
      preview: sample,
      type: "image",
    };
    onChange([...items, newEntry]);
  };

  const handleRemove = (indexToRemove) => {
    onChange(items.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={isVideoType ? "video/*" : "image/*"}
        onChange={handleFileAdd}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
          {label} ({items.length}/{maxCount})
        </span>
        {items.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange([])}
            className="text-[10px] text-white/40 hover:text-white/80 p-0 h-auto"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {items.map((item, idx) => {
          const itemUrl = typeof item === "object" ? (item.url || item.preview) : item;

          return (
            <div
              key={item.id || idx}
              className="relative size-12 rounded-xl overflow-hidden border border-white/20 bg-black/40 group/item transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={itemUrl}
                alt={`ref-${idx}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => handleRemove(idx)}
                  disabled={disabled}
                  className="size-5 rounded-full p-0 flex items-center justify-center"
                >
                  <GoogleIcon iconName="close" className="text-[11px]" />
                </Button>
              </div>
              <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[8px] text-white/80 rounded-tl">
                #{idx + 1}
              </span>
            </div>
          );
        })}

        {canAddMore && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => !disabled && fileInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                "size-12 rounded-xl border border-dashed border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-0.5 text-white/60 hover:text-white p-0 h-12 w-12",
                disabled && "opacity-40 cursor-not-allowed"
              )}
              title="Add Reference"
            >
              <GoogleIcon iconName="add" className="text-[16px]" />
              <span className="text-[9px]">Upload</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleAddMockSample}
              disabled={disabled}
              className="px-2 h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] text-white/60 hover:text-white flex flex-col items-center justify-center gap-0.5 transition-all"
              title="Add Mock Sample"
            >
              <GoogleIcon iconName="sparkles" className="text-[14px]" />
              <span>Sample</span>
            </Button>
          </div>
        )}
      </div>

      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
});
