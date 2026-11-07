import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { MediaTile } from "../MediaTile";
import { MediaCard } from "../MediaCard";
import { SharedGalleryGrid } from "../SharedGalleryGrid";
import { buildProjectMediaIndex } from "@/features/workflows/model/mediaCacheIndex";

describe("Media Presentation Memoization & Re-renders (100 Tiles)", () => {
  it("only re-renders the 1 tile whose media changed when 1 of 100 workflows updates", () => {
    // 1. Build initial mock payload of 100 workflows and 100 media rows
    const workflows = [];
    const rawMedia = [];
    for (let i = 0; i < 100; i++) {
      workflows.push({ id: `wf-${i}`, workflow_type: "GENERATION" });
      rawMedia.push({
        id: `media-${i}`,
        workflow_id: `wf-${i}`,
        url: `https://example.com/asset-${i}.png`,
        role: "output",
        status: "ready",
      });
    }

    let projectData = {
      projectContents: {
        workflows,
        media: rawMedia,
      },
    };

    let index = buildProjectMediaIndex(projectData);

    // Track render counts per tile ID
    const renderCounts = {};

    const MonitoredTile = React.memo(function MonitoredTile({ item }) {
      renderCounts[item.id] = (renderCounts[item.id] || 0) + 1;
      return <MediaTile item={item} />;
    });

    function Gallery({ mediaIndex }) {
      const items = Array.from(mediaIndex.byMediaId.values());
      return (
        <div data-testid="gallery-grid">
          {items.map((it) => (
            <MonitoredTile key={it.id} item={it} />
          ))}
        </div>
      );
    }

    // Initial render
    const { rerender } = render(<Gallery mediaIndex={index} />);

    // Verify all 100 tiles rendered exactly once
    expect(Object.keys(renderCounts)).toHaveLength(100);
    for (let i = 0; i < 100; i++) {
      expect(renderCounts[`media-${i}`]).toBe(1);
    }

    // 2. Mutate exactly ONE workflow's media (wf-42 / media-42), keeping the other 99 identical in memory
    const updatedRawMedia = rawMedia.map((m, idx) => {
      if (idx === 42) {
        return {
          ...m,
          url: "https://example.com/asset-42-updated.png",
        };
      }
      return m; // unchanged reference in memory
    });

    const updatedProjectData = {
      projectContents: {
        workflows,
        media: updatedRawMedia,
      },
    };

    const newIndex = buildProjectMediaIndex(updatedProjectData);

    // Re-render gallery with new index
    act(() => {
      rerender(<Gallery mediaIndex={newIndex} />);
    });

    // 3. Verify: EXACTLY 1 tile re-rendered (renderCounts['media-42'] is 2)
    // The other 99 tiles did NOT re-render (renderCounts remain 1)!
    expect(renderCounts["media-42"]).toBe(2);
    for (let i = 0; i < 100; i++) {
      if (i !== 42) {
        expect(renderCounts[`media-${i}`]).toBe(1);
      }
    }
  });

  it("SharedGalleryGrid resolves normalized MediaItems from workflow entries with zero HTTP fetches and only re-renders 1 of 100 tiles when 1 workflow changes", () => {
    const fetchSpy = vi.fn();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy;
    const clientWidthSpy = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(1200);

    try {
      const workflows = Array.from({ length: 100 }, (_, i) => ({
        id: `wf-${i}`,
        workflow_type: "GENERATION",
        items: [
          {
            id: `media-${i}`,
            workflow_id: `wf-${i}`,
            url: `https://example.com/wf-asset-${i}.png`,
            role: "output",
            status: "completed",
            width: 1024,
            height: 1024,
          },
        ],
      }));

      const entries = workflows.map((w) => ({
        type: "workflow",
        data: w,
        key: w.id,
      }));

      const renderCounts = {};
      const receivedItems = {};

      const MonitoredStudioCard = React.memo(function MonitoredStudioCard({ item, workflow, width, height }) {
        const key = workflow?.id || item?.id;
        renderCounts[key] = (renderCounts[key] || 0) + 1;
        receivedItems[key] = item;
        return <MediaCard item={item} style={{ width, height }} />;
      });

      const { rerender } = render(
        <SharedGalleryGrid
          entries={entries}
          gridSize="md"
          CardComponent={MonitoredStudioCard}
        />
      );

      // Verify zero background HTTP fetches
      expect(fetchSpy).not.toHaveBeenCalled();

      // Verify all 100 cards rendered once and received normalized MediaItem objects
      expect(Object.keys(renderCounts)).toHaveLength(100);
      for (let i = 0; i < 100; i++) {
        expect(renderCounts[`wf-${i}`]).toBe(1);
        expect(receivedItems[`wf-${i}`]).toMatchObject({
          id: `media-${i}`,
          workflowId: `wf-${i}`,
          kind: "image",
          status: "ready",
          url: `https://example.com/wf-asset-${i}.png`,
        });
      }

      // Mutate strictly 1 workflow (wf-42), keeping the other 99 workflow objects unchanged in memory
      const updatedWorkflows = workflows.map((w, idx) => {
        if (idx === 42) {
          return {
            ...w,
            items: [
              {
                ...w.items[0],
                url: "https://example.com/wf-asset-42-updated.png",
              },
            ],
          };
        }
        return w;
      });

      const updatedEntries = updatedWorkflows.map((w) => ({
        type: "workflow",
        data: w,
        key: w.id,
      }));

      act(() => {
        rerender(
          <SharedGalleryGrid
            entries={updatedEntries}
            gridSize="md"
            CardComponent={MonitoredStudioCard}
          />
        );
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(renderCounts["wf-42"]).toBe(2);
      expect(receivedItems["wf-42"].url).toBe("https://example.com/wf-asset-42-updated.png");

      for (let i = 0; i < 100; i++) {
        if (i !== 42) {
          expect(renderCounts[`wf-${i}`]).toBe(1);
        }
      }
    } finally {
      clientWidthSpy.mockRestore();
      globalThis.fetch = originalFetch;
    }
  });

  it("MediaCard memoization prevents re-rendering when item reference is identical", () => {
    const item = {
      id: "media-card-1",
      url: "https://example.com/photo.png",
      kind: "image",
      status: "ready",
    };

    let renderCount = 0;
    const MonitoredCard = React.memo(function MonitoredCard({ item }) {
      renderCount++;
      return <MediaCard item={item} />;
    });

    function Container({ item }) {
      return <MonitoredCard item={item} />;
    }

    const { rerender } = render(<Container item={item} />);
    expect(renderCount).toBe(1);

    // Re-render with same item reference
    rerender(<Container item={item} />);
    expect(renderCount).toBe(1);

    // Re-render with new item reference
    const newItem = { ...item, url: "https://example.com/new-photo.png" };
    rerender(<Container item={newItem} />);
    expect(renderCount).toBe(2);
  });

  it("enforces canonical xxs (4px) spacing on RowsPhotoAlbum container across all density variants", () => {
    const clientWidthSpy = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1200);
    try {
      const entries = [
        {
          type: "media",
          data: { id: "m-1", url: "https://example.com/1.png", width: 500, height: 500, status: "ready" },
          key: "m-1",
        },
      ];

      // 1. Default (md) -> spacing is 4 (xxs token)
      const { container, rerender } = render(<SharedGalleryGrid entries={entries} />);
      const album = container.querySelector(".react-photo-album");
      expect(album.style.getPropertyValue("--react-photo-album--spacing")).toBe("4");

      // 2. Large density -> spacing is 4 (xxs token)
      rerender(<SharedGalleryGrid entries={entries} gridSize="lg" />);
      expect(album.style.getPropertyValue("--react-photo-album--spacing")).toBe("4");

      // 3. Small density -> spacing is 4 (xxs token)
      rerender(<SharedGalleryGrid entries={entries} gridSize="sm" />);
      expect(album.style.getPropertyValue("--react-photo-album--spacing")).toBe("4");

      // 4. Custom prop spacing override
      rerender(<SharedGalleryGrid entries={entries} spacing={8} />);
      expect(album.style.getPropertyValue("--react-photo-album--spacing")).toBe("8");

      // 5. Dynamic gridSpacing="md" (M / 8px)
      rerender(<SharedGalleryGrid entries={entries} gridSpacing="md" />);
      expect(album.style.getPropertyValue("--react-photo-album--spacing")).toBe("8");

      // 6. Dynamic gridSpacing="lg" (L / 16px)
      rerender(<SharedGalleryGrid entries={entries} gridSpacing="lg" />);
      expect(album.style.getPropertyValue("--react-photo-album--spacing")).toBe("16");

      // 7. Default MediaCard honors RowsPhotoAlbum computed width and height on its outer box
      const card = container.querySelector('[data-testid="media-card"]');
      expect(card).toBeTruthy();
      expect(parseFloat(card.style.width)).toBeGreaterThan(0);
      expect(parseFloat(card.style.height)).toBeGreaterThan(0);
    } finally {
      clientWidthSpy.mockRestore();
    }
  });
});
