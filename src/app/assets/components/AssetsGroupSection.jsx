"use client";

import { Check, Minus } from "lucide-react";
import { RowsPhotoAlbum } from "react-photo-album";

import { LibraryMediaGridItem } from "../LibraryMediaGridItem";

export function AssetsGroupSection({
  group,
  selectedIds,
  onToggleGroupSelection,
  onTogglePhotoSelection,
}) {
  const selectedCount = group.photos.filter((photo) => selectedIds.has(photo.key)).length;
  const isAllSelected = group.photos.length > 0 && selectedCount === group.photos.length;
  const isPartiallySelected = selectedCount > 0 && !isAllSelected;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggleGroupSelection(group.photos)}
          className={`
            flex h-6 w-6 items-center justify-center rounded-md border transition
            ${selectedCount > 0
              ? "border-white bg-white text-[#050505]"
              : "border-white/12 bg-white/[0.03] text-white/32 hover:border-white/24 hover:text-white/72"}
          `}
          aria-label={`Select ${group.label}`}
        >
          {isAllSelected ? (
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          ) : isPartiallySelected ? (
            <Minus className="h-3.5 w-3.5" strokeWidth={3} />
          ) : null}
        </button>
        <h2 className="text-[28px] font-semibold tracking-tight text-white">
          {group.label}
        </h2>
      </div>

      <RowsPhotoAlbum
        photos={group.photos}
        targetRowHeight={320}
        spacing={10}
        rowConstraints={{ singleRowMaxHeight: 440 }}
        render={{
          photo: (_, { photo, width, height }) => (
            <LibraryMediaGridItem
              key={photo.key}
              entry={photo.entry}
              isSelected={selectedIds.has(photo.key)}
              onToggleSelect={() => onTogglePhotoSelection(photo.key)}
              className="border border-white/10"
              style={{ width, height }}
            />
          ),
        }}
      />
    </section>
  );
}
