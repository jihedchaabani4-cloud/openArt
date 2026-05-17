"use client";

import { motion } from "framer-motion";
import { FolderOpen, ImageIcon, Search, Video, X } from "lucide-react";

import {
  CATEGORY_FILTERS,
  MEDIA_FILTERS,
  useAssetsFilters,
} from "../AssetsFiltersContext";
import { Input } from "@/shared/ui/input";
import { SidebarDropdownButton, SidebarFilterButton } from "./SidebarFilterButton";

export function AssetsSidebar({ hidden = false }) {
  const {
    searchQuery,
    setSearchQuery,
    mediaFilter,
    setMediaFilter,
    categoryFilter,
    setCategoryFilter,
  } = useAssetsFilters();

  const showMediaTypeFilter = categoryFilter === "all" || categoryFilter === "media";

  return (
    <motion.aside
      variants={{
        visible: { y: 0 },
        hidden: { y: -75 },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-[75px]  h-fit w-[228px] shrink-0  bg-(--background-base-pri)  rounded-[24px] backdrop-blur-[80px] px-3 py-4"
    >
      <div className="flex h-full flex-col">
        <div className="mb-5">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            icon={Search}
            onClear={searchQuery ? () => setSearchQuery("") : undefined}
            clearIcon={X}
            className="h-10 rounded-xl px-3 text-[13px]"
          />
        </div>

        <div className="space-y-7">
          <section>
   
            <div className="space-y-1">
              <SidebarFilterButton
                label="All Assets"
                icon={FolderOpen}
                active={categoryFilter === "all"}
                onClick={() => setCategoryFilter("all")}
              />
              {CATEGORY_FILTERS.filter((item) => item.id !== "all").map((item) => (
                <SidebarDropdownButton
                  key={item.id}
                  label={item.label}
                  active={categoryFilter === item.id}
                  onClick={() => setCategoryFilter(item.id)}
                />
              ))}
            </div>
          </section>

          {showMediaTypeFilter && (
            <section>
              <div className="space-y-1">
                {MEDIA_FILTERS.map((filter) => (
                  <SidebarFilterButton
                    key={filter.id}
                    label={filter.label}
                    icon={
                      filter.id === "image"
                        ? ImageIcon
                        : filter.id === "video"
                          ? Video
                          : FolderOpen
                    }
                    active={mediaFilter === filter.id}
                    onClick={() => setMediaFilter(filter.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
