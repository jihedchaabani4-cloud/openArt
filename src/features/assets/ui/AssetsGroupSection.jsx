"use client";

import { RowsPhotoAlbum } from "react-photo-album";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

import { LibraryMediaGridItem } from "./LibraryMediaGridItem";
import { Button } from "@/shared/ui/button";

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
        <Button
          type="button"
          variant={selectedCount > 0 ? "primary" : "outline"}
          onClick={() => onToggleGroupSelection(group.photos)}
          className="size-6 p-0"
          aria-label={`Select ${group.label}`}
        >
          {isAllSelected ? (
            <GoogleIcon iconName="check" className="text-sm font-bold" />
          ) : isPartiallySelected ? (
            <GoogleIcon iconName="remove" className="text-sm font-bold" />
          ) : null}
        </Button>
        <h2 className="text-2xl font-semibold tracking-tight text-on-surface">
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
            <div
              key={photo.key}
              className="react-photo-album--photo"
              style={{
                width,
                height,
                "--react-photo-album--photo-width": width,
                "--react-photo-album--photo-height": height,
              }}
            >
              <LibraryMediaGridItem
                key={photo.key}
                entry={photo.entry}
                isSelected={selectedIds.has(photo.key)}
                onToggleSelect={() => onTogglePhotoSelection(photo.key)}
                className="border border-white/10 w-full h-full"
              />
            </div>
          ),
        }}
      />
    </section>
  );
}
