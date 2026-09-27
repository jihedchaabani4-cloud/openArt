"use client";

import React, { useRef } from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";

/**
 * ImageControl
 * Dedicated presenter for single image slots (e.g. input_image, last_frame).
 */
export const ImageControl = React.memo(function ImageControl({
  definition,
  value,
  onChange,
  error,
  disabled = false,
}) {
  const fileInputRef = useRef(null);

  const imageUrl = typeof value === "object" && value !== null ? (value.url || value.preview) : value;
  const label = definition?.label || "Image";

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onChange({
        name: file.name,
        url: previewUrl,
        preview: previewUrl,
        type: "image",
      });
    }
  };

  const handleMockSample = (e) => {
    e.stopPropagation();
    onChange({
      name: "sample.jpg",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80",
      preview: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80",
      type: "image",
    });
  };

  return (
    <div className="flex flex-col gap-1 shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative group">
        {imageUrl ? (
          <div
            className={cn(
              "relative size-12 rounded-xl overflow-hidden border border-white/20 bg-black/50 group/slot transition-all",
              error && "border-red-500/80 ring-1 ring-red-500/50"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                onClick={() => onChange(undefined)}
                disabled={disabled}
                className="size-6 rounded-full p-0 flex items-center justify-center"
                title="Remove image"
              >
                <GoogleIcon iconName="close" className="text-[12px]" />
              </Button>
            </div>
            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-medium text-center py-0.5 truncate text-white/90">
              {label}
            </span>
          </div>
        ) : (
          <div
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={cn(
              "h-12 px-2.5 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer select-none",
              error && "border-red-500/50 bg-red-500/5",
              disabled && "opacity-50 pointer-events-none"
            )}
          >
            <GoogleIcon iconName="add_photo_alternate" className="text-[16px] text-white/60" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-medium text-white/90 whitespace-nowrap">
                {label}
              </span>
              <Button
                type="button"
                variant="link"
                size="xs"
                onClick={handleMockSample}
                className="text-[9px] text-white/40 hover:text-white underline text-left p-0 h-auto justify-start"
              >
                Use sample
              </Button>
            </div>
          </div>
        )}
      </div>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
});
