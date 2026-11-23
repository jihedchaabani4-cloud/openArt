"use client";

import * as React from "react";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/base/dropdown-menu";
import { MenuItemContent } from "@/components/base/menu";
import { Button } from "@/components/base/button";
import { Input } from "@/components/base/input";
import { Checkbox } from "@/components/base/checkbox";
import { Switch } from "@/components/base/switch";
import { Badge } from "@/components/base/badge";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { resolveModelIcon } from "@/features/prompt-bar";

const TYPE_OPTIONS = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
];

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const ACTIVITY_OPTIONS = [
  { value: "all", label: "All", icon: "grid-view" },
  { value: "generated", label: "Generated", icon: "sparkles" },
  { value: "uploaded", label: "Uploaded", icon: "upload-04" },
  { value: "liked", label: "Liked", icon: "favourite" },
];

const EMPTY_LIST = [];
const VIDEO_MODEL_PATTERN = /\b(veo|kling|wan|seedance|ltx|sora|runway|hailuo|minimax|pika|luma|vidu|video)\b|video/i;

function resolveModelDomain(entry, value, label) {
  const explicit = typeof entry === "object" ? entry?.domain || entry?.category : null;
  if (explicit === "video" || explicit === "image") return explicit;
  return VIDEO_MODEL_PATTERN.test(`${value} ${label}`) ? "video" : "image";
}

function renderModelItemIcon(model) {
  const icon = model.icon || resolveModelIcon({ id: model.value, name: model.label });
  const isImgIcon =
    typeof icon === "string" &&
    (icon.startsWith("/") || icon.startsWith("http") || icon.includes("."));
  if (isImgIcon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt=""
        className="size-4 object-contain brightness-0 invert shrink-0"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return icon || (model.domain === "video" ? "film-01" : "image-02");
}

export function NavbarFilterDropdown({ availableModels = EMPTY_LIST }) {
  const filters = useGenerationsStore((s) => s.filters);
  const setFilter = useGenerationsStore((s) => s.setFilter);
  const clearFilters = useGenerationsStore((s) => s.clearFilters);

  const [open, setOpen] = React.useState(false);
  const [modelSearch, setModelSearch] = React.useState("");

  const selectedTypes = filters?.types || EMPTY_LIST;
  const selectedModels = filters?.models || EMPTY_LIST;
  const dateRange = filters?.dateRange || "all";
  const hideFailed = Boolean(filters?.hideFailed);
  const activeActivity = filters?.activity || (filters?.liked ? "liked" : "all");

  const mergedModels = React.useMemo(() => {
    const byValue = new Map();
    const addEntry = (entry) => {
      if (!entry) return;
      const value = typeof entry === "string" ? entry.trim() : String(entry.value || entry.id || entry.label || "").trim();
      const label = typeof entry === "string" ? value : String(entry.label || entry.name || value).trim();
      if (!value) return;
      if (!byValue.has(value)) {
        const icon = typeof entry === "object" ? entry?.icon || null : null;
        byValue.set(value, { value, label, domain: resolveModelDomain(entry, value, label), icon });
      }
    };
    for (const m of availableModels || []) addEntry(m);
    for (const m of selectedModels) addEntry(m);
    return Array.from(byValue.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [availableModels, selectedModels]);

  const filteredModels = React.useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    if (!q) return mergedModels;
    return mergedModels.filter(
      (m) => m.label.toLowerCase().includes(q) || m.value.toLowerCase().includes(q)
    );
  }, [mergedModels, modelSearch]);

  const imageModels = React.useMemo(
    () => filteredModels.filter((m) => m.domain !== "video"),
    [filteredModels]
  );
  const videoModels = React.useMemo(
    () => filteredModels.filter((m) => m.domain === "video"),
    [filteredModels]
  );

  const activeFilterCount =
    (selectedTypes.length > 0 ? 1 : 0) +
    (selectedModels.length > 0 ? 1 : 0) +
    (dateRange !== "all" ? 1 : 0) +
    (hideFailed ? 1 : 0) +
    (activeActivity !== "all" ? 1 : 0);

  const typesSummaryLabel =
    selectedTypes.length === 0
      ? "All types"
      : selectedTypes.length === 1
        ? TYPE_OPTIONS.find((t) => t.value === selectedTypes[0])?.label || "All types"
        : `${selectedTypes.length} types`;

  const modelsSummaryLabel =
    selectedModels.length === 0
      ? "All models"
      : selectedModels.length === 1
        ? mergedModels.find((m) => m.value === selectedModels[0])?.label || selectedModels[0]
        : `${selectedModels.length} models`;

  const dateRangeSummaryLabel =
    dateRange === "all"
      ? "Date range"
      : DATE_RANGE_OPTIONS.find((d) => d.value === dateRange)?.label || "Date range";

  const toggleType = (value) => {
    const next = selectedTypes.includes(value)
      ? selectedTypes.filter((v) => v !== value)
      : [...selectedTypes, value];
    setFilter("types", next);
  };

  const toggleModel = (value) => {
    const next = selectedModels.includes(value)
      ? selectedModels.filter((v) => v !== value)
      : [...selectedModels, value];
    setFilter("models", next);
  };

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) setModelSearch("");
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          title="Filter media"
          aria-label="Filter"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <HugeIcon name="filter-horizontal" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <Badge className="ml-0.5 px-1.5 py-0">{activeFilterCount}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {/* ── Type Section ── */}
        <DropdownMenuLabel>Type</DropdownMenuLabel>

        {/* All types submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MenuItemContent icon="grid-view">{typesSummaryLabel}</MenuItemContent>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>Type</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setFilter("types", []);
              }}
            >
              <MenuItemContent checked={selectedTypes.length === 0}>All</MenuItemContent>
            </DropdownMenuItem>
            {TYPE_OPTIONS.map((opt) => {
              const isChecked = selectedTypes.includes(opt.value);
              return (
                <DropdownMenuItem
                  key={opt.value}
                  role="menuitemcheckbox"
                  aria-checked={isChecked}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleType(opt.value);
                  }}
                >
                  <MenuItemContent
                    trailing={
                      <Checkbox
                        checked={isChecked}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="pointer-events-none"
                      />
                    }
                  >
                    {opt.label}
                  </MenuItemContent>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* All models submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MenuItemContent icon="sparkles">{modelsSummaryLabel}</MenuItemContent>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>Models</DropdownMenuLabel>
            <div className="px-1 pb-1">
              <Input
                variant="search"
                placeholder="Search models"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                onClear={modelSearch ? () => setModelSearch("") : undefined}
                onKeyDown={(e) => e.stopPropagation()}
                aria-label="Search models"
              />
            </div>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setFilter("models", []);
              }}
            >
              <MenuItemContent checked={selectedModels.length === 0}>
                All models
              </MenuItemContent>
            </DropdownMenuItem>
            <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5">
              {filteredModels.length > 0 ? (
                <>
                  {imageModels.length > 0 && (
                    <>
                      <DropdownMenuLabel>Image models</DropdownMenuLabel>
                      {imageModels.map((model) => {
                        const isChecked = selectedModels.includes(model.value);
                        return (
                          <DropdownMenuItem
                            key={model.value}
                            role="menuitemcheckbox"
                            aria-checked={isChecked}
                            onSelect={(e) => {
                              e.preventDefault();
                              toggleModel(model.value);
                            }}
                          >
                            <MenuItemContent
                              icon={renderModelItemIcon(model)}
                              trailing={
                                <Checkbox
                                  checked={isChecked}
                                  tabIndex={-1}
                                  aria-hidden="true"
                                  className="pointer-events-none"
                                />
                              }
                            >
                              {model.label}
                            </MenuItemContent>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}
                  {imageModels.length > 0 && videoModels.length > 0 && <DropdownMenuSeparator />}
                  {videoModels.length > 0 && (
                    <>
                      <DropdownMenuLabel>Video models</DropdownMenuLabel>
                      {videoModels.map((model) => {
                        const isChecked = selectedModels.includes(model.value);
                        return (
                          <DropdownMenuItem
                            key={model.value}
                            role="menuitemcheckbox"
                            aria-checked={isChecked}
                            onSelect={(e) => {
                              e.preventDefault();
                              toggleModel(model.value);
                            }}
                          >
                            <MenuItemContent
                              icon={renderModelItemIcon(model)}
                              trailing={
                                <Checkbox
                                  checked={isChecked}
                                  tabIndex={-1}
                                  aria-hidden="true"
                                  className="pointer-events-none"
                                />
                              }
                            >
                              {model.label}
                            </MenuItemContent>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}
                </>
              ) : (
                <div className="px-2 py-2 ds-text-caption-s text-text-secondary">
                  {mergedModels.length === 0 ? "No models yet" : "No models found"}
                </div>
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Date range submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MenuItemContent icon="calendar-03">{dateRangeSummaryLabel}</MenuItemContent>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>Date range</DropdownMenuLabel>
            {DATE_RANGE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onSelect={(e) => {
                  e.preventDefault();
                  setFilter("dateRange", opt.value);
                }}
              >
                <MenuItemContent checked={dateRange === opt.value}>
                  {opt.label}
                </MenuItemContent>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Hide failed switch */}
        <DropdownMenuItem
          role="menuitemcheckbox"
          aria-checked={hideFailed}
          onSelect={(e) => {
            e.preventDefault();
            setFilter("hideFailed", !hideFailed);
          }}
        >
          <MenuItemContent
            icon="view-off-slash"
            trailing={
              <Switch
                checked={hideFailed}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none"
              />
            }
          >
            Hide failed
          </MenuItemContent>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* ── Activity Section ── */}
        <DropdownMenuLabel>Activity</DropdownMenuLabel>
        {ACTIVITY_OPTIONS.map((opt) => {
          const isActive = activeActivity === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onSelect={(e) => {
                e.preventDefault();
                setFilter("activity", opt.value);
              }}
            >
              <MenuItemContent
                icon={opt.icon}
                checked={isActive}
              >
                {opt.label}
              </MenuItemContent>
            </DropdownMenuItem>
          );
        })}

        {activeFilterCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                clearFilters();
              }}
            >
              <MenuItemContent icon="refresh">Reset filters</MenuItemContent>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
