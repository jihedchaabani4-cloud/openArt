import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  FileTree,
  FileTreeFolder,
  FileTreeItem,
  CollapseButton,
} from "../file-tree";

describe("FileTree Component (shadcn.io/ui/file-tree)", () => {
  it("renders nested folders and files with proper roles and hierarchy", () => {
    const handleSelect = vi.fn();

    render(
      <FileTree onSelectChange={handleSelect} initialExpandedItems={["folder-1"]}>
        <FileTreeFolder value="folder-1" element="Documents">
          <FileTreeItem value="doc-1" element="Report.pdf" />
          <FileTreeFolder value="subfolder-1" element="Images">
            <FileTreeItem value="img-1" element="Photo.png" />
          </FileTreeFolder>
        </FileTreeFolder>
        <FileTreeItem value="file-root" element="README.md" />
      </FileTree>
    );

    expect(screen.getByText("Documents")).toBeDefined();
    expect(screen.getByText("Report.pdf")).toBeDefined();
    expect(screen.getByText("Images")).toBeDefined();
    expect(screen.getByText("README.md")).toBeDefined();
  });

  it("handles selection on click", () => {
    const handleSelect = vi.fn();

    render(
      <FileTree onSelectChange={handleSelect}>
        <FileTreeItem value="item-1" element="First Item" />
      </FileTree>
    );

    fireEvent.click(screen.getByText("First Item"));
    expect(handleSelect).toHaveBeenCalledWith("item-1");
  });

  it("toggles folder expand/collapse when clicking folder row", () => {
    const { container } = render(
      <FileTree initialExpandedItems={[]}>
        <FileTreeFolder value="folder-toggle" element="Toggle Folder">
          <FileTreeItem value="child-1" element="Child Item" />
        </FileTreeFolder>
      </FileTree>
    );

    const folderRow = container.querySelector('[role="treeitem"]');
    expect(folderRow?.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(screen.getByText("Toggle Folder"));
    expect(folderRow?.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(screen.getByText("Toggle Folder"));
    expect(folderRow?.getAttribute("aria-expanded")).toBe("false");
  });

  it("passes size prop down to Folder and File buttons", () => {
    const { container } = render(
      <FileTree size="s" initialExpandedItems={["folder-1"]}>
        <FileTreeFolder value="folder-1" element="Documents">
          <FileTreeItem value="doc-1" element="Report.pdf" />
        </FileTreeFolder>
        <FileTreeItem value="file-custom" size="l" element="Custom Large" />
      </FileTree>
    );

    const buttons = container.querySelectorAll("button");
    // folder-1 should inherit size="s" -> h-7
    expect(buttons[0].className).toContain("h-7");
    // doc-1 should inherit size="s" -> h-7
    expect(buttons[1].className).toContain("h-7");
    // file-custom has explicit size="l" -> h-10
    expect(buttons[2].className).toContain("h-10");
  });

  it("renders custom FolderGlyphIcon with white default or collection color", async () => {
    const { FolderGlyphIcon } = await import("../FolderGlyphIcon");
    const { getFolderColorGradient } = await import("@/features/folders/model/folder-color-tokens");

    // When color is falsy or undefined -> defaults to white
    const defaultGrad = getFolderColorGradient(undefined);
    expect(defaultGrad.id).toBe("white");
    expect(defaultGrad.frontTop).toBe("#ffffff");

    // When collection data has a color (e.g. lime #d1fe17) -> uses that color
    const limeGrad = getFolderColorGradient("#d1fe17");
    expect(limeGrad.id).toBe("lime");
    expect(limeGrad.frontBottom).toBe("#d1fe17");

    // Render inside FileTreeFolder
    const { container } = render(
      <FileTree>
        <FileTreeFolder
          value="f-white"
          element="Default White Folder"
          icon={<FolderGlyphIcon data-testid="white-icon" />}
        />
        <FileTreeItem
          value="f-lime"
          element="Lime Folder"
          icon={<FolderGlyphIcon color="#d1fe17" data-testid="lime-icon" />}
        />
      </FileTree>
    );

    expect(screen.getByText("Default White Folder")).toBeDefined();
    expect(screen.getByText("Lime Folder")).toBeDefined();
    expect(container.querySelector('[data-testid="white-icon"]')).toBeDefined();
    expect(container.querySelector('[data-testid="lime-icon"]')).toBeDefined();
  });
});
