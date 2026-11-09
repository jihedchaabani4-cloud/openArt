"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { FileTree, FileTreeFolder, FileTreeItem } from "@/shared/ui/file-tree";
import { cn } from "@/shared/lib/utils";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { useCharacterWorkflows } from "@/features/characters";
import { useElementSheetWorkflows } from "@/features/elements";
import { useProjectFolders } from "@/features/folders";

/**
 * LeftNavigationRail
 * Clean studio sidebar featuring:
 * - Top items: Générations (Generation Space), Éléments, Personnages
 * - Middle: Project Collections hierarchy with FileTree component (when expanded)
 * - Bottom: Prominent toggle button (PanelLeftClose / PanelLeftOpen) to open & close
 * - Borderless, clean animations, no hover-open
 */
export function LeftNavigationRail() {
  const selectedProjectId = useGenerationsStore((s) => s.selectedProjectId);
  const pathname = usePathname();
  const router = useRouter();

  const { workflows: characters = [] } = useCharacterWorkflows(selectedProjectId);
  useElementSheetWorkflows(selectedProjectId);

  const { data: rawFolders = [] } = useProjectFolders(selectedProjectId);

  // Expands / collapses only via explicit button click (Réduire / Développer)
  const [isExpanded, setIsExpanded] = useState(false);
  const [optimisticTab, setOptimisticTab] = useState(null);

  useEffect(() => {
    setOptimisticTab(null);
  }, [pathname]);

  const rawFoldersList = useMemo(() => {
    if (Array.isArray(rawFolders)) return rawFolders;
    if (Array.isArray(rawFolders?.items)) return rawFolders.items;
    return [];
  }, [rawFolders]);

  const folderTree = useMemo(() => {
    const map = new Map();
    const roots = [];

    rawFoldersList.forEach((folder) => {
      map.set(folder.id, { ...folder, children: [] });
    });

    rawFoldersList.forEach((folder) => {
      const parentId = folder.parent_id || folder.parentId;
      if (parentId && map.has(parentId)) {
        map.get(parentId).children.push(map.get(folder.id));
      } else {
        roots.push(map.get(folder.id));
      }
    });

    return roots;
  }, [rawFoldersList]);

  const activeCollectionId = useMemo(() => {
    const match = pathname?.match(/\/collection\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const handleSelectCollection = (collectionId) => {
    if (collectionId) {
      router.push(`/cinema-studio/${selectedProjectId}/collection/${collectionId}`);
    }
  };

  const isCharactersActive = pathname?.includes("/characters");
  const isElementsActive = pathname?.includes("/elements");
  const isTrashActive = pathname?.includes("/trash");
  const currentActiveTab = optimisticTab || (isCharactersActive ? "characters" : isElementsActive ? "elements" : isTrashActive ? "trash" : "assets");

  const handleToggleExpand = (e) => {
    e?.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  if (!selectedProjectId || isTrashActive) return null;

  const elementsHref = `/cinema-studio/${selectedProjectId}/elements`;

  const charactersHref = characters.length > 0
    ? `/cinema-studio/${selectedProjectId}/characters`
    : `/cinema-studio/${selectedProjectId}/characters/new`;

  const mainNavItems = [
    {
      id: "home",
      label: "Accueil",
      icon: "home",
      href: "/cinema-studio",
      isActive: false,
    },
    {
      id: "assets",
      label: "Assets",
      icon: "image",
      href: `/cinema-studio/${selectedProjectId}/assets`,
      isActive: currentActiveTab === "assets",
    },
    {
      id: "elements",
      label: "Éléments",
      icon: "alternate_email",
      href: elementsHref,
      isActive: currentActiveTab === "elements",
    },
    {
      id: "characters",
      label: "Personnages",
      icon: "accessibility_new",
      href: charactersHref,
      isActive: currentActiveTab === "characters",
    },
  ];

  const trashItem = {
    id: "trash",
    label: "Corbeille",
    icon: "delete",
    href: `/cinema-studio/${selectedProjectId}/trash`,
    isActive: currentActiveTab === "trash",
  };

  const renderNavItem = (item) => (
    <Button
      key={item.id}
      asChild
      size="m"
      variant="ghost"
      className={cn(
        "w-full justify-start p-0 gap-0 rounded-lg transition-colors duration-100 select-none outline-none overflow-hidden font-sans font-medium text-sm leading-5 antialiased",
        item.isActive
          ? "bg-surface-elevated text-on-surface shadow-none hover:bg-surface-elevated hover:text-on-surface"
          : "text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06]"
      )}
      title={!isExpanded ? item.label : undefined}
    >
      <Link
        href={item.href}
        prefetch={true}
        onClick={() => setOptimisticTab(item.id)}
      >
        <span className="w-[48px] h-full shrink-0 flex items-center justify-center">
          <GoogleIcon
            iconName={item.icon}
            className={cn(
              "text-xl shrink-0",
              item.isActive ? "text-white" : "text-white/80"
            )}
          />
        </span>
        <span
          className={cn(
            "tracking-normal truncate flex-1 pr-2 whitespace-nowrap rail-label-transition",
            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          {item.label}
        </span>
      </Link>
    </Button>
  );

  const renderFolderNode = (node) => {
    const folderName = node.name || node.folder_name || "Collection";
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const folderColor = node.color || null;

    const labelElement = (
      <span className="flex items-center gap-1.5 truncate">
        {folderColor && (
          <span
            className="size-2 rounded-full shrink-0"
            style={folderColor ? { backgroundColor: folderColor } : undefined}
          />
        )}
        <span className="truncate">{folderName}</span>
      </span>
    );

    if (hasChildren) {
      return (
        <FileTreeFolder
          key={node.id}
          value={node.id}
          element={labelElement}
          isSelectable
        >
          {node.children.map(renderFolderNode)}
        </FileTreeFolder>
      );
    }

    return (
      <FileTreeItem
        key={node.id}
        value={node.id}
        element={labelElement}
        fileIcon="folder"
        isSelectable
      />
    );
  };

  return (
    <aside
      aria-label="Navigation Studio"
      style={{
        width: isExpanded ? "var(--studio-sidebar-width-expanded, 230px)" : "var(--studio-sidebar-width, 52px)",
      }}
      className="h-full shrink-0 relative z-40 bg-black flex flex-col select-none pt-0 pb-3 px-0 overflow-hidden rounded-3xl border border-border rail-smooth-transition"
    >
      {/* ── Fixed Top Spacer (independent of scroll) ── */}
      <div className="w-full shrink-0 h-4" />

      {/* ── Top Navigation Items: Générations, Éléments, Personnages ── */}
      <div className="w-full shrink-0 px-0.5">
        <nav className="flex flex-col gap-1.5 w-full">
          {mainNavItems.map(renderNavItem)}
        </nav>
      </div>

      {/* ── Collections Tree Section (when expanded) ── */}
      {isExpanded ? (
        <div className="flex flex-col flex-1 min-h-0 mt-3 pt-3 border-t border-border/40 px-2 overflow-hidden">
          <div className="flex items-center justify-between px-2 pb-1.5 shrink-0">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Collections
            </span>
            {rawFoldersList.length > 0 && (
              <span className="text-xs text-on-surface-variant/70 font-normal">
                {rawFoldersList.length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-1 rail-smooth-transition">
            {folderTree.length > 0 ? (
              <FileTree
                selectedId={activeCollectionId}
                onSelectChange={handleSelectCollection}
                size="m"
                className="w-full"
              >
                {folderTree.map(renderFolderNode)}
              </FileTree>
            ) : (
              <div className="px-2 py-3 text-xs text-on-surface-variant/60 italic text-left">
                Aucune collection
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Flexible Space (pushes bottom section to bottom) ── */
        <div className="flex-1 min-h-[20px]" />
      )}

      {/* ── Dedicated Bottom Actions: Corbeille (Trash) & Toggle Button ── */}
      <div className="mt-auto flex flex-col gap-1.5 pt-2 pb-2 mb-[30px] w-full shrink-0 px-0.5">
        {renderNavItem(trashItem)}

        <Button
          type="button"
          variant="ghost"
          size="m"
          onClick={handleToggleExpand}
          className="w-full p-0 gap-0 justify-start overflow-hidden font-medium text-sm leading-5 rounded-lg text-on-surface-variant hover:text-on-surface"
          title={isExpanded ? "Réduire la barre" : "Développer la barre"}
          aria-label={isExpanded ? "Réduire la barre" : "Développer la barre"}
        >
          <span className="w-[48px] h-full shrink-0 flex items-center justify-center">
            {isExpanded ? (
              <GoogleIcon iconName="left_panel_close" className="text-xl text-white/80 shrink-0" />
            ) : (
              <GoogleIcon iconName="left_panel_open" className="text-xl text-white/80 shrink-0" />
            )}
          </span>
          <span
            className={cn(
              "tracking-normal truncate flex-1 text-left pr-2 whitespace-nowrap rail-label-transition",
              isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            Réduire
          </span>
        </Button>
      </div>
    </aside>
  );
}
